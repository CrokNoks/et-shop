# Fonctionnalités — Listes de courses

## Vue d'ensemble

Module central de l'application. Une liste de courses regroupe des articles à acheter, liés à un magasin. Le catalogue produits est partagé au niveau du foyer et s'enrichit automatiquement à chaque nouvel article ajouté.

---

## Gestion des listes

L'utilisateur peut créer plusieurs listes de courses nommées. Chaque liste peut être associée à un magasin. La liste est persistante et réutilisable — elle n'est jamais vidée automatiquement.

Depuis la sidebar, l'utilisateur navigue entre ses listes. La dernière liste active est rechargée au retour sur la page principale.

## Ajouter un article — saisie rapide ("Hop!")

Un champ de saisie en haut de la liste permet d'ajouter un article en tapant son nom. L'autocomplétion propose les articles du catalogue du foyer correspondant à la saisie (recherche insensible à la casse, limit 5).

**Comportement intelligent d'ajout** :
- Si l'article existe déjà dans la liste : la quantité est incrémentée, `is_purchased` repasse à `false`
- Si l'article n'existe pas dans le catalogue du magasin : il est **créé automatiquement** dans le catalogue
- Si aucun magasin n'est lié à la liste : erreur explicite

## Ajouter par code-barres

L'utilisateur peut scanner un code-barres pour ajouter directement l'article correspondant du catalogue. Le magasin de la liste doit être défini. Si le produit n'est pas dans le catalogue, une erreur est retournée (pas de création automatique par code-barres).

## Modifier un article de la liste

Chaque article de la liste supporte les modifications suivantes :
- **Quantité** — modifiable inline
- **Prix unitaire** — saisi manuellement, utilisé pour les statistiques
- **Unité** — (pcs, kg, L, etc.)
- **Code-barres** — associable après ajout

## Marquer acheté / Annuler

Voir la documentation de la feature [historique_stats](../historique_stats/fonctionnalites.md) — le marquage "Acheté" est atomique et génère un enregistrement dans l'historique des achats.

Un bouton `PATCH /shopping-lists/:listId/items/:itemId/purchase` et `/unpurchase` est disponible directement sur le controller shopping-lists (en plus du module `purchases`).

## Supprimer un article

Un article peut être retiré de la liste à tout moment. Cette action ne supprime pas l'entrée dans le catalogue.

## Gestion du catalogue produits

Le catalogue est partagé entre toutes les listes du foyer. Il est lié à un magasin spécifique.

- **Créer un article de catalogue** manuellement
- **Modifier** : nom, catégorie, unité, code-barres
- **Supprimer** du catalogue
- **Import CSV** : import en masse d'articles avec résolution des catégories par nom
- **Réassignation en masse** : changer la catégorie de plusieurs articles à la fois

## Gestion des catégories (rayons)

Les catégories organisent le catalogue par rayon. Elles sont liées à un magasin.

- Créer / modifier (nom, icône, ordre de tri) / supprimer
- Import en masse depuis un tableau JSON
- L'ordre de tri conditionne l'affichage dans la liste de courses (articles triés par rayon)

---

## Ce qui n'est pas inclus

- Partage d'une liste avec un autre utilisateur (le partage est au niveau du foyer, pas de la liste)
- Historique des versions d'une liste
- Notifications en temps réel sur les changements d'une liste partagée (Supabase Realtime est en place mais non branché sur les listes)
