// Wrapper IndexedDB (via `idb`) pour le mode hors ligne : cache de lecture
// (dernier snapshot connu de la liste active / des cartes de fidélité) et
// file d'attente FIFO des mutations effectuées hors ligne.
//
// Clés composées `(householdId, listId)` partout : jamais `listId` seul,
// pour ne pas mélanger le cache/la file entre deux foyers sur le même
// appareil (cf. Technical_Specification.md, "Nouveaux composants
// frontend" > lib/offline/db.ts).

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ShoppingListItem } from "@/types";
import type { LoyaltyCardFrontend } from "@/types/loyalty-card";

export const DB_NAME = "et-shop-offline";

/**
 * Toute évolution de la forme des stores DOIT incrémenter cette constante.
 * `upgrade()` recrée les stores à vide (wipe, jamais de migration) : le
 * cache local n'est jamais une source de vérité serveur, un reset est donc
 * sans risque de perte de données.
 */
export const DB_VERSION = 1;

export type PendingActionType =
  | "toggle_purchase"
  | "set_quantity"
  | "add_item"
  | "delete_item";

export interface AddItemPayload {
  name: string;
  quantity?: number;
  unit?: string;
  barcode?: string;
  category_id?: string;
  store_id?: string;
}

export type PendingAction =
  | {
      id: string;
      type: "toggle_purchase";
      householdId: string;
      listId: string;
      itemId: string;
      checked: boolean;
      price?: number;
      createdAt: number;
      retryCount: number;
    }
  | {
      id: string;
      type: "set_quantity";
      householdId: string;
      listId: string;
      itemId: string;
      quantity: number;
      createdAt: number;
      retryCount: number;
    }
  | {
      id: string;
      type: "add_item";
      householdId: string;
      listId: string;
      payload: AddItemPayload;
      createdAt: number;
      retryCount: number;
    }
  | {
      id: string;
      type: "delete_item";
      householdId: string;
      listId: string;
      itemId: string;
      createdAt: number;
      retryCount: number;
    };

interface CacheEntry {
  key: string;
  householdId: string;
  updatedAt: number;
  shoppingList?: ShoppingListItem[];
  /**
   * Nom de la liste au moment du dernier cache réussi. Nécessaire pour
   * reconstruire l'en-tête à froid (app relancée hors ligne, avant tout
   * fetch réseau) sans dépendre de `/shopping-lists` — cf. repli
   * `loadInitialList` dans `app/page.tsx`.
   */
  shoppingListName?: string;
  loyaltyCards?: LoyaltyCardFrontend[];
}

interface OfflineDBSchema extends DBSchema {
  cache: {
    key: string;
    value: CacheEntry;
  };
  pending_actions: {
    key: string;
    value: PendingAction;
    indexes: {
      householdId: string;
      byHouseholdList: [string, string];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("IndexedDB indisponible dans cet environnement."),
    );
  }
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Montée de version = wipe & recreate, jamais de migration.
        for (const name of Array.from(db.objectStoreNames)) {
          db.deleteObjectStore(name);
        }
        db.createObjectStore("cache", { keyPath: "key" });
        const pendingStore = db.createObjectStore("pending_actions", {
          keyPath: "id",
        });
        pendingStore.createIndex("householdId", "householdId");
        pendingStore.createIndex("byHouseholdList", ["householdId", "listId"]);
      },
    });
  }
  return dbPromise;
}

function listCacheKey(householdId: string, listId: string): string {
  return `list:${householdId}:${listId}`;
}

function loyaltyCacheKey(householdId: string): string {
  return `loyalty:${householdId}`;
}

// ---- cache : liste de courses ----

export async function getCachedList(
  householdId: string,
  listId: string,
): Promise<ShoppingListItem[] | null> {
  try {
    const db = await getDB();
    const entry = await db.get("cache", listCacheKey(householdId, listId));
    return entry?.shoppingList ?? null;
  } catch {
    return null;
  }
}

export async function setCachedList(
  householdId: string,
  listId: string,
  items: ShoppingListItem[],
  name?: string,
): Promise<void> {
  try {
    const db = await getDB();
    const key = listCacheKey(householdId, listId);
    // Les mutations optimistes (toggle/quantité/suppression/ajout) n'ont pas
    // le nom de la liste sous la main : on préserve celui déjà en cache
    // plutôt que de l'effacer à chaque écriture qui ne le fournit pas.
    const existing = await db.get("cache", key);
    await db.put("cache", {
      key,
      householdId,
      updatedAt: Date.now(),
      shoppingList: items,
      shoppingListName: name ?? existing?.shoppingListName,
    });
  } catch {
    // Best-effort : un échec d'écriture cache ne doit jamais faire échouer
    // la mutation optimiste en cours.
  }
}

/**
 * Nom de la liste tel que connu au dernier cache réussi. Permet à
 * `loadInitialList` (app/page.tsx) de reconstruire l'en-tête au démarrage à
 * froid hors ligne, quand `localStorage[ACTIVE_LIST_KEY]` donne un id mais
 * qu'aucun appel réseau n'a encore réussi dans cette session.
 */
export async function getCachedListName(
  householdId: string,
  listId: string,
): Promise<string | null> {
  try {
    const db = await getDB();
    const entry = await db.get("cache", listCacheKey(householdId, listId));
    return entry?.shoppingListName ?? null;
  } catch {
    return null;
  }
}

export async function clearCachedList(
  householdId: string,
  listId: string,
): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("cache", listCacheKey(householdId, listId));
  } catch {
    // ignore
  }
}

// ---- cache : cartes de fidélité (lecture seule) ----

export async function getCachedLoyaltyCards(
  householdId: string,
): Promise<LoyaltyCardFrontend[] | null> {
  try {
    const db = await getDB();
    const entry = await db.get("cache", loyaltyCacheKey(householdId));
    return entry?.loyaltyCards ?? null;
  } catch {
    return null;
  }
}

export async function setCachedLoyaltyCards(
  householdId: string,
  cards: LoyaltyCardFrontend[],
): Promise<void> {
  try {
    const db = await getDB();
    await db.put("cache", {
      key: loyaltyCacheKey(householdId),
      householdId,
      updatedAt: Date.now(),
      loyaltyCards: cards,
    });
  } catch {
    // ignore
  }
}

// ---- pending_actions ----

/**
 * Enfile une action hors ligne. Les actions consécutives de même type sur
 * le même item (même liste) sont coalescées : la nouvelle action remplace
 * la précédente en place plutôt que de s'y ajouter, ce qui borne la taille
 * de la file sans plafond arbitraire. `add_item` n'est jamais coalescée
 * (chaque ajout est un article distinct, sans identifiant serveur encore
 * connu pour les regrouper).
 */
export async function enqueueAction(action: PendingAction): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("pending_actions", "readwrite");
  const store = tx.objectStore("pending_actions");
  const siblings = await store
    .index("byHouseholdList")
    .getAll([action.householdId, action.listId]);

  const itemId = action.type === "add_item" ? undefined : action.itemId;
  const coalesceTarget =
    action.type !== "add_item"
      ? siblings.find(
          (s) => s.type === action.type && "itemId" in s && s.itemId === itemId,
        )
      : undefined;

  await store.put(
    coalesceTarget ? { ...action, id: coalesceTarget.id } : action,
  );
  await tx.done;
}

export async function getPendingActions(
  householdId: string,
  listId: string,
): Promise<PendingAction[]> {
  const db = await getDB();
  const actions = await db.getAllFromIndex(
    "pending_actions",
    "byHouseholdList",
    [householdId, listId],
  );
  return actions.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removePendingAction(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("pending_actions", id);
  } catch {
    // ignore
  }
}

/**
 * Un changement de foyer actif purge les `pending_actions` dont le
 * `householdId` ne correspond plus, avant tout flush.
 */
export async function purgeOrphanPendingActions(
  activeHouseholdId: string | null,
): Promise<void> {
  // Sans foyer actif connu, tout serait considéré "orphelin" et la file
  // entière serait purgée — garde défensive (cf. revue Code Reviewer,
  // avertissement I). Les appelants doivent normalement déjà éviter ce cas.
  if (!activeHouseholdId) return;
  try {
    const db = await getDB();
    const all = await db.getAll("pending_actions");
    const stale = all.filter((a) => a.householdId !== activeHouseholdId);
    if (stale.length === 0) return;
    const tx = db.transaction("pending_actions", "readwrite");
    await Promise.all(stale.map((a) => tx.store.delete(a.id)));
    await tx.done;
  } catch {
    // ignore
  }
}

/**
 * Met à jour la quantité stockée dans le `payload` d'une `pending_action`
 * `add_item` déjà en file, identifiée par son `id` (qui est aussi l'id
 * optimiste `offline-<uuid>` de l'article côté UI, cf.
 * `useShoppingListItems.addItem`). Utilisé quand l'utilisateur modifie la
 * quantité d'un article ajouté hors ligne avant tout retour réseau : on
 * mute l'action `add_item` en attente plutôt que d'enfiler un `set_quantity`
 * séparé qui référencerait un id non-UUID inconnu du serveur (cf. revue
 * Code Reviewer, correction #3). Best-effort, silencieux en cas d'échec.
 */
export async function updatePendingAddItemPayload(
  actionId: string,
  quantity: number,
): Promise<void> {
  try {
    const db = await getDB();
    const action = await db.get("pending_actions", actionId);
    if (!action || action.type !== "add_item") return;
    await db.put("pending_actions", {
      ...action,
      payload: { ...action.payload, quantity },
    });
  } catch {
    // ignore
  }
}

/**
 * Supprime purement et simplement une `pending_action` `add_item` encore en
 * attente, identifiée par son `id` (= id optimiste `offline-<uuid>` de
 * l'article). Utilisé quand l'utilisateur supprime hors ligne un article
 * qu'il vient lui-même d'ajouter hors ligne : l'article n'a jamais existé
 * côté serveur, il n'y a rien à annuler, juste à retirer la file avant
 * qu'elle ne soit rejouée (cf. revue Code Reviewer, correction #3).
 * Best-effort, silencieux en cas d'échec.
 */
export async function removePendingAddItemAction(
  actionId: string,
): Promise<void> {
  try {
    const db = await getDB();
    const action = await db.get("pending_actions", actionId);
    if (!action || action.type !== "add_item") return;
    await db.delete("pending_actions", actionId);
  } catch {
    // ignore
  }
}

/**
 * La liste elle-même n'existe plus (404 sur le refetch d'autorité) :
 * purge de toutes les actions en attente pour cette liste.
 */
export async function purgeListPendingActions(
  householdId: string,
  listId: string,
): Promise<void> {
  try {
    const db = await getDB();
    const actions = await db.getAllFromIndex(
      "pending_actions",
      "byHouseholdList",
      [householdId, listId],
    );
    if (actions.length === 0) return;
    const tx = db.transaction("pending_actions", "readwrite");
    await Promise.all(actions.map((a) => tx.store.delete(a.id)));
    await tx.done;
  } catch {
    // ignore
  }
}
