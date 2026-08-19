import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

/** Icône PWA 192x192 (manifest.ts) — design handoff, variante 6b. */
export async function GET() {
  return new ImageResponse(<AppIconMark borderRadius={46} />, {
    width: 192,
    height: 192,
  });
}
