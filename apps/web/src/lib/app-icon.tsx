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
