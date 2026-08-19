import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

/** Icône PWA 512x512 (manifest.ts) — design handoff, variante 6b. */
export async function GET() {
  return new ImageResponse(<AppIconMark borderRadius={123} />, {
    width: 512,
    height: 512,
  });
}
