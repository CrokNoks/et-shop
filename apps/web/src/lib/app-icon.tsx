/**
 * Icône d'app (design handoff, variante 6b) : carré navy, panier en aplat,
 * coche "découpée" (stroke navy sur le panier clair), prolongement orange.
 * viewBox 48x48 — le contenu (x:8-40) respecte la zone de sécurité de 66%.
 * En dessous de 32px la coche devient illisible : on simplifie (7b) au
 * panier + une seule barre orange, sans la coche.
 *
 * Partagé entre `app/icon.tsx`, `app/apple-icon.tsx`,
 * `app/pwa-icon-192/route.tsx` et `app/pwa-icon-512/route.tsx` — même
 * dessin, seules la taille et le radius du carré changent d'un usage à
 * l'autre. Compatible `next/og` `ImageResponse` (satori) : un composant
 * fonction resitué dans l'arbre JSX avant résolution, comme le fait déjà
 * `icon.tsx` avant cette factorisation.
 */
export function AppIconMark({
  borderRadius = 0,
  simplified = false,
}: {
  borderRadius?: number;
  simplified?: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#1A365D",
        borderRadius,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 48 48">
        <path d="M8 20h30l-4 14H16L8 20z" fill="#f3f5fe" />
        <circle cx="18" cy="41" r="2.8" fill="#f3f5fe" />
        <circle cx="32" cy="41" r="2.8" fill="#f3f5fe" />
        {!simplified && (
          <path
            d="M14 21.5l6.5 6.5L28.5 20"
            stroke="#1A365D"
            strokeWidth={4.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
        <path
          d="M27.5 21L40 8"
          stroke="#FF6B35"
          strokeWidth={simplified ? 6 : 5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * Variante monochrome (écran 7c, icône thémée Android 13+). Contrairement à
 * ce qui a été documenté par erreur dans un cycle précédent ("hors périmètre
 * PWA web, nécessite un empaquetage natif"), le Web App Manifest standard
 * supporte bien `purpose: "monochrome"` : Chrome/Android le recolorent avec
 * la couleur d'accent système si l'utilisateur a activé les "icônes
 * thématisées" du launcher — aucun empaquetage natif requis.
 *
 * Fond transparent (l'OS gère lui-même la forme et la teinte de fond) et une
 * seule couleur pleine pour tout le contenu — un canal monochrome ne peut
 * pas distinguer le panier du trait de la coche par la couleur. La coche est
 * donc un VIDE réservé dans le remplissage du panier (un seul <path>, deux
 * sous-tracés, `fillRule="evenodd"` — le second sous-tracé, un ruban
 * approximant le trait `M14 21.5l6.5 6.5L28.5 20` élargi de sa largeur de
 * trait d'origine (4.6) par décalage perpendiculaire à chaque segment, avec
 * jointure en onglet au sommet), conforme à la description du handoff : "la
 * coche lisible par son vide réservé".
 *
 * Le sommet du trait d'origine (28.5, 20) touche exactement le bord haut du
 * panier (y=20) : un décalage perpendiculaire symétrique y place donc
 * nécessairement un des deux côtés du ruban au-delà de ce bord (jusqu'à
 * (26.87, 18.37) sans correction), ce qui perçait un cran visible hors de la
 * silhouette une fois recoloré par le thème (bug initial). Le ruban est donc
 * découpé au demi-plan y>=20 (intersection de Sutherland-Hodgman avec le
 * bord haut du panier) pour rester entièrement contenu dans le panier.
 */
export function AppIconMonochrome() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <svg width="100%" height="100%" viewBox="0 0 48 48">
        <path
          fillRule="evenodd"
          fill="#000000"
          d="M8 20h30l-4 14H16L8 20z M12.37 23.13L20.50 31.25L30.13 21.63L28.50 20L25.24 20L20.50 24.75L15.76 20L15.50 20Z"
        />
        <circle cx="18" cy="41" r="2.8" fill="#000000" />
        <circle cx="32" cy="41" r="2.8" fill="#000000" />
        <path
          d="M27.5 21L40 8"
          stroke="#000000"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
