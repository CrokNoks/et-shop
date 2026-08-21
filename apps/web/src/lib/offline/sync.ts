"use client";

// Protocole de synchronisation (cf. Technical_Specification.md, section
// "Protocole de synchronisation") :
//   1. Flush FIFO de la file, avec retry/backoff exponentiel (2s/4s/8s, 3
//      tentatives) sur erreurs transitoires. Un 404 est un succès
//      silencieux. Un échec persistant laisse l'action en file (jamais
//      droppée) pour la prochaine reconnexion.
//   2. UN SEUL refetch d'autorité de la liste, exécuté uniquement après la
//      fin du flush — jamais un GET ne s'intercale pendant le flush.
//   3. Ce refetch remplace le cache local (pas de merge côté client).
//   4. Si ce refetch renvoie 404 sur la liste elle-même : purge de la file
//      de cette liste, toast explicite, retour à l'écran de sélection.
//   5. Une fois le refetch posé → bandeau "En direct", toast "Synchronisé".

import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { getActiveHouseholdId } from "@/hooks/useHousehold";
import type { ShoppingListItem } from "@/types";
import {
  clearCachedList,
  getPendingActions,
  purgeListPendingActions,
  purgeOrphanPendingActions,
  removePendingAction,
  setCachedList,
  type PendingAction,
} from "@/lib/offline/db";
import { setSyncing } from "@/lib/offline/network";

const RETRY_DELAYS_MS = [2000, 4000, 8000];

function statusOf(error: unknown): number | undefined {
  return (error as { status?: number } | undefined)?.status;
}

function isNotFoundError(error: unknown): boolean {
  return statusOf(error) === 404;
}

/** Absence de statut = erreur réseau/timeout avant réponse : transitoire. */
function isTransientError(error: unknown): boolean {
  const status = statusOf(error);
  return status === undefined || status >= 500;
}

async function replayAction(action: PendingAction): Promise<void> {
  switch (action.type) {
    case "toggle_purchase":
      if (action.checked) {
        await fetchApi(
          `/shopping-lists/${action.listId}/items/${action.itemId}/purchase`,
          {
            method: "PATCH",
            body: JSON.stringify({ price: action.price ?? 0 }),
          },
        );
      } else {
        await fetchApi(
          `/shopping-lists/${action.listId}/items/${action.itemId}/unpurchase`,
          { method: "PATCH" },
        );
      }
      return;
    case "set_quantity":
      await fetchApi(`/shopping-lists/items/${action.itemId}/quantity`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: action.quantity }),
      });
      return;
    case "add_item":
      await fetchApi(`/shopping-lists/${action.listId}/items`, {
        method: "POST",
        body: JSON.stringify(action.payload),
      });
      return;
    case "delete_item":
      await fetchApi(`/shopping-lists/items/${action.itemId}`, {
        method: "DELETE",
      });
      return;
  }
}

/** Rejoue une action avec retry/backoff. Ne lève jamais. */
async function replayWithRetry(
  action: PendingAction,
): Promise<"done" | "kept"> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await replayAction(action);
      return "done";
    } catch (error) {
      if (isNotFoundError(error)) return "done"; // succès silencieux
      if (!isTransientError(error)) return "kept"; // 401/400/403… : pas de retry, on garde
      if (attempt === RETRY_DELAYS_MS.length) return "kept"; // tentatives épuisées
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAYS_MS[attempt]),
      );
    }
  }
  return "kept";
}

export interface FlushResult {
  /** Snapshot d'autorité si le refetch a réussi, `null` sinon. */
  items: ShoppingListItem[] | null;
  /** La liste elle-même a été supprimée pendant que l'utilisateur était hors ligne. */
  listGone: boolean;
}

// Verrou de concurrence, clé par `(householdId, listId)` : `flushPendingActions`
// peut être réentrée (deux événements `online` rapprochés, remontage du
// composant pendant un backoff), y compris pour DEUX listes différentes en
// parallèle (ex. deux onglets/composants sur des listes distinctes du même
// foyer). Une `Map` évite qu'un flush sur la liste A ne renvoie/affecte
// l'état d'un flush concurrent sur la liste B — cf. revue Code Reviewer,
// correction bloquante #3. Un appel concurrent sur la MÊME clé reçoit la
// promesse du flush déjà en cours plutôt que de déclencher un second flush
// qui rejouerait les mêmes actions en parallèle.
const flushInFlightByKey = new Map<string, Promise<FlushResult>>();

function flushKey(householdId: string, listId: string): string {
  return `${householdId}:${listId}`;
}

/**
 * `true` si un flush est actuellement en cours pour `(householdId, listId)`.
 * Utilisé par `useShoppingListItems.ts` pour ne pas laisser un `fetchItems()`
 * déclenché par le temps réel Supabase ou par l'effet de montage s'intercaler
 * pendant le flush (cf. protocole de synchronisation, point 2, et revue Code
 * Reviewer, correction bloquante #3) : le refetch d'autorité propre au flush
 * en cours réconciliera l'état à la fin.
 */
export function isFlushInFlight(householdId: string, listId: string): boolean {
  return flushInFlightByKey.has(flushKey(householdId, listId));
}

/**
 * Vide la file d'attente hors ligne de `(householdId, listId)` puis exécute
 * le refetch d'autorité. Ne doit être appelée qu'au retour réseau.
 */
export function flushPendingActions(
  householdId: string,
  listId: string,
): Promise<FlushResult> {
  const key = flushKey(householdId, listId);
  const existing = flushInFlightByKey.get(key);
  if (existing) return existing;

  const promise = runFlush(householdId, listId).finally(() => {
    flushInFlightByKey.delete(key);
  });
  flushInFlightByKey.set(key, promise);
  return promise;
}

async function runFlush(
  householdId: string,
  listId: string,
): Promise<FlushResult> {
  setSyncing(true);
  try {
    await purgeOrphanPendingActions(getActiveHouseholdId());

    const actions = await getPendingActions(householdId, listId);
    // Capturé AVANT le rejeu : le toast "Synchronisé" ne doit s'afficher
    // que si la file contenait réellement quelque chose à synchroniser au
    // départ, jamais sur un flush qui n'avait rien à faire (montage en
    // ligne sans file en attente) — cf. revue Code Reviewer, correction #4.
    const hadPendingActions = actions.length > 0;
    for (const action of actions) {
      const outcome = await replayWithRetry(action);
      if (outcome === "done") {
        await removePendingAction(action.id);
      }
      // "kept" : reste en file, retentée à la prochaine reconnexion.
    }

    let items: ShoppingListItem[] | null = null;
    let listGone = false;
    try {
      const data = await fetchApi(`/shopping-lists/${listId}`);
      items = data.shopping_list_items || [];
      await setCachedList(householdId, listId, items ?? []);
    } catch (error) {
      if (isNotFoundError(error)) {
        listGone = true;
        await purgeListPendingActions(householdId, listId);
        await clearCachedList(householdId, listId);
        toast.error(
          "Cette liste n'existe plus, tes modifications hors ligne n'ont pas pu être appliquées",
        );
      } else {
        // Refetch d'autorité indisponible (réseau encore instable) : on ne
        // touche pas au cache existant, pas de "Synchronisé" trompeur.
        return { items: null, listGone: false };
      }
    }

    if (!listGone && hadPendingActions) {
      const remaining = await getPendingActions(householdId, listId);
      if (remaining.length === 0) {
        toast.success("Synchronisé");
      }
    }

    return { items, listGone };
  } finally {
    setSyncing(false);
  }
}
