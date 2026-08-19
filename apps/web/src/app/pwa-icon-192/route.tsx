import { ImageResponse } from "next/og";

/** Icône PWA 192x192 (manifest.ts) — design handoff, variante 6b. */
export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#1A365D",
        borderRadius: 46,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 48 48">
        <path d="M8 20h30l-4 14H16L8 20z" fill="#f3f5fe" />
        <circle cx="18" cy="41" r="2.8" fill="#f3f5fe" />
        <circle cx="32" cy="41" r="2.8" fill="#f3f5fe" />
        <path
          d="M14 21.5l6.5 6.5L28.5 20"
          stroke="#1A365D"
          strokeWidth={4.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M27.5 21L40 8"
          stroke="#FF6B35"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>,
    { width: 192, height: 192 },
  );
}
