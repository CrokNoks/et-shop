"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/offline/registerServiceWorker";

/**
 * Monté depuis le layout racine (`app/layout.tsx`), pas depuis
 * `app/page.tsx` : le layout racine est rendu pour TOUTE page de l'app, ce
 * qui garantit l'enregistrement du service worker quelle que soit la page
 * d'atterrissage (ex: navigation directe vers `/loyalty-cards` ou `/lists`
 * sans jamais rendre `page.tsx`) — cf. revue Code Reviewer, correction #6.
 * Ne rend rien : simple point de montage pour l'effet.
 */
export function ServiceWorkerRegistration(): null {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
