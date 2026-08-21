"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type NetworkStatus = "online" | "offline" | "syncing";

type SyncListener = (isSyncing: boolean) => void;

const syncListeners = new Set<SyncListener>();
let isSyncingGlobal = false;

/**
 * Appelé par `lib/offline/sync.ts` autour de `flushPendingActions()` pour
 * faire transiter les consommateurs de `useOnlineStatus()` par l'état
 * `"syncing"` pendant le flush.
 */
export function setSyncing(isSyncing: boolean): void {
  isSyncingGlobal = isSyncing;
  syncListeners.forEach((listener) => listener(isSyncing));
}

function subscribeToOnlineEvents(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

// SSR *et* premier rendu client (avant hydratation) doivent renvoyer la même
// valeur, sans quoi React signale un mismatch d'hydratation — `useSyncExternalStore`
// est le mécanisme prévu pour ça : `getServerSnapshot` fige la valeur tant que
// le composant n'est pas hydraté, la vraie valeur (`getOnlineSnapshot`) ne
// prenant effet qu'ensuite, côté client — cf. revue Code Reviewer (avertissement).
function getServerOnlineSnapshot(): boolean {
  return true;
}

/**
 * `"online" | "offline" | "syncing"` basé sur `navigator.onLine` et les
 * événements `online`/`offline`, avec un état transitoire `"syncing"`
 * pendant le flush de la file d'attente hors ligne.
 */
export function useOnlineStatus(): NetworkStatus {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineEvents,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
  const [isSyncing, setIsSyncing] = useState(isSyncingGlobal);

  useEffect(() => {
    const listener: SyncListener = (syncing) => setIsSyncing(syncing);
    syncListeners.add(listener);
    return () => {
      syncListeners.delete(listener);
    };
  }, []);

  if (!isOnline) return "offline";
  return isSyncing ? "syncing" : "online";
}
