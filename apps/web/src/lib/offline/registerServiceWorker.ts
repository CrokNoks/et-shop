"use client";

/**
 * Enregistre `public/sw.js`. Fonctionne identiquement dans un onglet de
 * navigateur classique et dans la PWA installée (pas de branchement sur
 * `display-mode`).
 */
function register(): void {
  navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.error("Échec de l'enregistrement du service worker :", error);
  });
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // `load` peut déjà avoir été émis avant que cet effet ne s'exécute
  // (bundles en cache, hydratation tardive) — dans ce cas l'événement ne se
  // reproduira jamais et le SW ne serait jamais enregistré silencieusement.
  // Cf. revue Code Reviewer, avertissement G.
  if (document.readyState === "complete") {
    register();
    return;
  }
  window.addEventListener("load", register);
}
