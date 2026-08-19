import { ImageResponse } from "next/og";

/**
 * Icône d'app (design handoff, variante 6b) : carré navy, panier en aplat,
 * coche "découpée" (stroke navy sur le panier clair), prolongement orange.
 * viewBox 48x48 — le contenu (x:8-40) respecte la zone de sécurité de 66%.
 * En dessous de 32px la coche devient illisible : on simplifie (7b) au
 * panier + une seule barre orange, sans la coche.
 */
function BasketMark({ simplified }: { simplified: boolean }) {
  return (
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
  );
}

function icon(size: number, simplified: boolean) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#1A365D",
        borderRadius: size * 0.24,
      }}
    >
      <BasketMark simplified={simplified} />
    </div>,
    { width: size, height: size },
  );
}

export function generateImageMetadata() {
  return [
    { id: "16", size: { width: 16, height: 16 }, contentType: "image/png" },
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "64", size: { width: 64, height: 64 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = String(await id);
  const size = Number(iconId);
  // 7b : à 16px, panier + une seule barre orange, pas la coche complète.
  return icon(size, size <= 16);
}
