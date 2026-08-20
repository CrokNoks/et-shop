import type { MetadataRoute } from "next";

/**
 * Écran 7a (handoff) : le vrai "écran de lancement" natif n'existe pas pour
 * une PWA — le mécanisme standard est ce manifest (name/background_color/
 * theme_color/icons), à partir duquel Android/Chrome génère lui-même un
 * splash screen. On ne peut pas contrôler le positionnement exact de la
 * marque (design : "au tiers médian") via ce mécanisme, seulement s'en
 * approcher (fond navy plein, icône + nom).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Et SHop!",
    short_name: "Et SHop!",
    description: "Gérez vos listes de courses en toute simplicité.",
    start_url: "/",
    display: "standalone",
    background_color: "#1A365D",
    theme_color: "#1A365D",
    icons: [
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-icon-monochrome",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
  };
}
