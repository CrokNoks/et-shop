"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Lit une clé localStorage de façon sûre pour l'hydratation Next.js :
 * `useSyncExternalStore` renvoie `null` (getServerSnapshot) tant que le
 * composant n'est pas monté côté client, puis la valeur réelle une fois
 * monté — sans jamais désynchroniser le HTML serveur du premier rendu
 * client, et sans setState manuel dans un effet.
 */
export function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => localStorage.getItem(key),
    () => null,
  );
}
