# Change Request — Mode hors ligne (liste de courses + cartes de fidélité)

## Contexte

Monorepo Turborepo : `apps/api` (NestJS, guard Supabase, module `shopping-lists` en style service classique, module `loyalty-cards` en Clean Architecture — patron de référence) devant Supabase (Postgres + RLS), `apps/web` (Next.js 16 App Router). Le frontend mute via `fetchApi` (REST) et s'abonne en plus aux `postgres_changes` Supabase pour le temps réel sur `shopping_list_items`.

Aujourd'hui, **aucune persistance offline n'existe** : pas de service worker, pas d'IndexedDB, pas de file d'attente de synchronisation. Seul un manifest PWA (icônes/splash, `app/manifest.ts`) existe, sans logique offline. Fait notable : `ListHeader.tsx` affiche déjà un indicateur **"En direct" / "Hors ligne"** piloté par une prop `isSynced`, mais elle est câblée en dur à `true` dans `app/page.tsx:109` — l'UI cible existe, elle n'est pas branchée.

## Demande

Permettre l'usage de l'application sans connexion réseau pour deux écrans :

1. **Liste de courses active** : consultation, cochage/décochage d'articles, modification de quantité, ajout et suppression d'articles — le tout mis en file et synchronisé au retour du réseau, avec fusion **champ par champ** (une modification de quantité par un membre du foyer ne doit pas écraser un cochage fait par un autre).
2. **Cartes de fidélité** : consultation uniquement (code-barres/QR déjà stockés localement, pas d'ajout/modification hors ligne).

Le précache est **proactif** : au login, la liste active (clé `ACTIVE_LIST_KEY`) et les cartes de fidélité de l'utilisateur sont mises en cache automatiquement, sans attendre que l'utilisateur ouvre ces écrans sur cet appareil.

Doit fonctionner identiquement dans un onglet de navigateur classique et dans la PWA installée (même code, pas de branchement sur `display-mode`).

## Stack détecté

- Backend : NestJS 11, Supabase (Postgres + RLS). Module `shopping-lists` : style service (pas de Clean Architecture) ; endpoints granulaires par opération (`PATCH items/:id/quantity`, `PATCH :listId/items/:itemId/purchase`/`unpurchase`, `POST :id/items`, `DELETE items/:id`).
- Frontend : Next.js 16 App Router, hooks (`useShoppingListItems`, `useLoyaltyCards`), `sonner` pour les toasts, Supabase JS client pour le temps réel.
- Gestionnaire de dépendances : pnpm (workspaces + Turborepo).

## Architecture de la solution

**Principe clé** : la fusion "champ par champ" ne nécessite pas de logique de merge côté serveur. Les endpoints existants sont déjà granulaires (une action = un champ ou une opération atomique). La file d'attente locale stocke donc des **actions**, pas des snapshots d'objets, et les rejoue à l'identique des appels réseau habituels au retour de connexion — deux membres du foyer modifiant des champs différents du même article hors ligne convergent naturellement, sans écrasement.

### Protocole de synchronisation (issu de la revue @spec_checker / @spec_challenger)

Le retour en ligne suit une séquence stricte, jamais l'inverse :

1. **Flush complet de la file, avec retry** : chaque action est rejouée en FIFO. Un `404` (ressource déjà supprimée/modifiée par un autre membre) est un succès silencieux. Une erreur transitoire (5xx, timeout) déclenche 3 tentatives avec backoff exponentiel (2s/4s/8s) ; si elle échoue encore, l'action **reste en file** (jamais droppée silencieusement) et sera retentée au prochain événement `online`.
2. **Un seul refetch d'autorité** de la liste active, exécuté uniquement après la fin du flush (succès ou échecs résiduels conservés en file) — jamais un GET de resynchronisation ne doit s'intercaler pendant le flush, pour éviter qu'un snapshot serveur partiellement à jour écrase le cache local avec un état qui semble "avoir perdu" une modification en cours de propagation ailleurs.
3. Ce refetch d'autorité **remplace** le cache local (pas de merge côté client) : c'est lui qui réconcilie les états orphelins (ex: un `set_quantity` rejoué avec succès sur un item supprimé entre-temps par un autre membre — le refetch d'autorité corrige l'affichage en supprimant l'item, l'état "succès" local de l'action n'a pas le dernier mot).
4. Si le refetch d'autorité renvoie 404 sur la liste elle-même (liste supprimée pendant que l'utilisateur était hors ligne) : purge de toutes les `pending_actions` de cette liste, vidage du cache correspondant, toast `"Cette liste n'existe plus, tes modifications hors ligne n'ont pas pu être appliquées"`, retour à l'écran de sélection de liste.
5. Une fois le refetch d'autorité posé → bandeau "En direct", toast `"Synchronisé"`.

### Nouveaux composants frontend

- `lib/offline/db.ts` — wrapper IndexedDB (via `idb`), base versionnée par une constante `DB_VERSION` explicite. Deux stores, **clés composées `(householdId, listId)`** (jamais `listId` seul, pour ne pas mélanger le cache entre foyers) :
  - `cache` : dernier snapshot connu de la liste active et des cartes de fidélité.
  - `pending_actions` : file FIFO `{ id, type, householdId, listId, itemId?, payload, createdAt, retryCount }` avec `type ∈ { toggle_purchase, set_quantity, add_item, delete_item }`. Les actions consécutives de même type sur le même item sont **coalescées** (ex: 3 changements de quantité hors ligne sur le même article → une seule action nette), ce qui borne naturellement la taille de la file sans plafond arbitraire. Un changement de foyer actif (`useActiveHousehold`) purge les `pending_actions` dont le `householdId` ne correspond plus, avant tout flush. Une montée de `DB_VERSION` recrée les stores à vide (`onupgradeneeded` : wipe, pas de migration) — le cache local n'est jamais une source de vérité, ce reset est sans risque de perte de données serveur.
- `lib/offline/network.ts` — `useOnlineStatus()` : hook basé sur `navigator.onLine` + listeners `online`/`offline`, exposant `"online" | "offline" | "syncing"`.
- `lib/offline/sync.ts` — `flushPendingActions()` : implémente le protocole de synchronisation ci-dessus.
- `public/sw.js` + enregistrement dans le layout racine — cache-first sur les assets statiques Next.js (`_next/static/**`, icônes du manifest) référencés par `/` et `/loyalty-cards` ; network-first-avec-repli-cache pour les GET `/shopping-lists/:id` et `/loyalty-cards`. **Exclusion explicite et totale** de `/login`, des callbacks Supabase et de toute route d'auth — jamais mis en cache, sous aucune stratégie.
- Précache proactif : une fois le foyer actif résolu après le login, fetch en tâche de fond (fire-and-forget, non bloquant pour le rendu) de la liste active et des cartes de fidélité, écrites en cache IndexedDB. Si ce fetch échoue (réseau dégradé au moment du login), échec silencieux : l'app ne prétend pas à une capacité offline qu'elle n'a pas — le cache se remplira au premier fetch réussi en navigation normale (chaque lecture/mutation en ligne réussie met déjà à jour le cache, cf. section suivante).

### Modifications frontend

- `useShoppingListItems.ts` : les mutations (`toggleCheck`, `handleQuantityUpdate`, ajout, suppression) restent optimistes sur `items`, mais écrivent aussi dans le cache IndexedDB ; si `navigator.onLine` est `false`, l'action est enfilée dans `pending_actions` au lieu d'appeler `fetchApi` directement. `fetchItems` lit le cache IndexedDB en repli si le réseau échoue.
- `app/page.tsx` : `isSynced={true}` (ligne 109) remplacé par l'état réel de `useOnlineStatus()` (`online`/`syncing` → `true`, `offline` → `false`), branché sur `ListHeader`.
- `ListHeader.tsx` : aucun changement structurel, seule la prop devient dynamique. État transitoire "syncing" possible sans nouveau libellé requis (garde "En direct" pendant la synchro, bascule seulement sur `offline` réel).
- Toast `sonner` au passage `offline → online` une fois `flushPendingActions()` terminé : `"Synchronisé"`.
- `useLoyaltyCards.ts` : lecture depuis IndexedDB en repli réseau ; pas de file d'action (lecture seule hors ligne).

### Backend

Aucun nouvel endpoint requis — les endpoints granulaires existants suffisent à la stratégie de rejeu. Seul ajustement : les handlers de suppression/dé-cochage doivent rester idempotents s'ils ne le sont pas déjà (vérifier `unpurchaseItem`/`DELETE items/:id` : renvoyer un succès si l'item est déjà dans l'état cible plutôt qu'une exception, pour que le rejeu offline ne fasse pas échouer toute la file sur un conflit inoffensif).

## Périmètre des modifications

### Backend

#### Fichiers à créer
| Fichier | Description |
|---|---|
| — | Aucun |

#### Fichiers à modifier
| Fichier | Modification |
|---|---|
| `apps/api/src/shopping-lists/shopping-lists.service.ts` | Rendre `unpurchase`/`delete` idempotents (no-op réussi si déjà dans l'état cible) pour supporter le rejeu de file offline |

### Frontend

#### Fichiers à créer
| Fichier | Description |
|---|---|
| `apps/web/src/lib/offline/db.ts` | Wrapper IndexedDB (`idb`), versionné, clés `(householdId, listId)` : stores `cache` et `pending_actions` avec coalescing |
| `apps/web/src/lib/offline/network.ts` | Hook `useOnlineStatus()` |
| `apps/web/src/lib/offline/sync.ts` | `flushPendingActions()` — protocole : flush FIFO avec retry/backoff puis refetch d'autorité |
| `apps/web/public/sw.js` | Service worker : cache-first app shell, network-first+repli pour GET liste active / cartes |
| `apps/web/src/lib/offline/registerServiceWorker.ts` | Enregistrement du SW au chargement |

#### Fichiers à modifier
| Fichier | Modification |
|---|---|
| `apps/web/src/hooks/useShoppingListItems.ts` | Cache IndexedDB + mise en file offline des mutations + repli cache sur `fetchItems` |
| `apps/web/src/hooks/useLoyaltyCards.ts` | Repli cache IndexedDB en lecture |
| `apps/web/src/app/page.tsx` | `isSynced` branché sur `useOnlineStatus()` au lieu de `true` en dur ; précache proactif post-login |
| `apps/web/src/components/shopping/ListHeader.tsx` | Aucun changement structurel (prop déjà existante) |

### Fichiers à NE PAS toucher
| Fichier | Raison |
|---|---|
| `apps/api/src/loyalty-cards/**` | Lecture seule hors ligne, aucune mutation backend nécessaire |
| Abonnement `postgres_changes` (`useShoppingListItems.ts`) | Le client Supabase gère déjà la reconnexion WS ; ne pas dupliquer cette logique dans la couche offline |

## Interfaces et contrats

Aucune nouvelle route API. Contrat interne frontend (`pending_actions`) :

```ts
type PendingAction =
  | { id: string; type: "toggle_purchase"; listId: string; itemId: string; checked: boolean; price?: number; createdAt: number }
  | { id: string; type: "set_quantity"; listId: string; itemId: string; quantity: number; createdAt: number }
  | { id: string; type: "add_item"; listId: string; payload: AddItemPayload; createdAt: number }
  | { id: string; type: "delete_item"; listId: string; itemId: string; createdAt: number };
```

## Critères d'acceptance

### Backend
- `PATCH :listId/items/:itemId/unpurchase` sur un item déjà non-acheté renvoie un succès (pas d'exception).
- `DELETE items/:id` sur un item déjà supprimé renvoie un succès (pas d'exception 404 propagée en échec de file).

### Frontend
- Réseau coupé sur l'écran liste active déjà ouverte au moins une fois (ou précachée au login) → la liste s'affiche depuis le cache, cocher/décocher/quantité/ajout/suppression fonctionnent et persistent visuellement.
- Deux appareils modifient hors ligne deux champs différents du même article (l'un coche, l'autre change la quantité) → au retour réseau des deux, l'état final reflète les deux changements (aucun n'écrase l'autre).
- Retour réseau → la file se vide automatiquement, le bandeau passe de "Hors ligne" à "En direct", un toast "Synchronisé" s'affiche une fois la file vidée.
- Cartes de fidélité consultables (visuel code-barres/QR) sans réseau si précachées au login.
- Comportement identique dans un onglet Chrome/Safari non installé et dans la PWA installée.
- Une suppression d'article par un autre membre pendant que l'utilisateur est hors ligne avec une action en attente sur ce même article (ex: changement de quantité) ne bloque pas la file : l'action échoue silencieusement (item introuvable), et le refetch d'autorité qui suit le flush reflète l'absence de l'item (pas d'affichage "modifié avec succès" sur un item supprimé).
- La liste active elle-même est supprimée par un autre membre pendant que l'utilisateur est hors ligne avec des actions en attente → au retour réseau, la file est purgée, un toast explicite informe l'utilisateur, retour à l'écran de sélection de liste (pas de crash, pas d'échec silencieux muet).
- Une erreur serveur transitoire (5xx/timeout) pendant le flush est retentée avec backoff ; si elle échoue encore, l'action reste en file et est retentée automatiquement à la prochaine reconnexion (jamais perdue silencieusement).
- Échec du précache proactif au login (réseau dégradé) → l'app ne revendique pas de capacité offline non disponible ; le cache se remplit normalement au premier fetch réussi.

## Risques de régression

- `useShoppingListItems.ts` est un hook central (bandeau budget, mode magasin) — le repli cache doit rester transparent pour les composants consommateurs (même forme de données en sortie, en ligne ou hors ligne).
- Le SW doit exclure explicitement les routes d'auth (`/login`, callbacks Supabase) du cache pour ne jamais servir une page d'authentification périmée.
- Divergence possible entre le cache précaché au login et une liste renommée/supprimée entre-temps par un autre membre — à gérer en repli propre (pas de crash), voir points ouverts ci-dessous.

## Points ouverts (à trancher ou accepter comme limite du MVP)

- Expiration de session pendant une période hors ligne prolongée : le rejeu échouera en 401 au retour réseau. MVP : la file est conservée et un nouveau rejeu est tenté après réauthentification (pas de perte de données), sans automatisation du refresh de token hors ligne.
- Éviction du stockage IndexedDB par le navigateur sous pression mémoire (rare, hors contrôle applicatif) : la liste précachée pourrait être vidée silencieusement par le navigateur — dégradation propre attendue (retour à un état "non disponible hors ligne") plutôt qu'une garantie absolue.
- Plusieurs onglets ouverts hors ligne simultanément sur le même appareil : risque de double-rejeu de la même action au retour réseau. MVP : chaque action a un `id` généré côté client, day-1 non dédupliqué côté serveur — accepté comme limite (impact : au pire une opération idempotente rejouée deux fois, sans effet).
