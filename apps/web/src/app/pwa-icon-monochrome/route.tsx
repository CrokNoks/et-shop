import { ImageResponse } from "next/og";
import { AppIconMonochrome } from "@/lib/app-icon";

/**
 * Icône thémée Android 13+ (manifest.ts, purpose: "monochrome") — écran 7c.
 * Fond transparent : ImageResponse ne pose pas de fond par défaut, seul le
 * contenu de AppIconMonochrome (sans <div style={{background}}>) est rendu.
 */
export async function GET() {
  return new ImageResponse(<AppIconMonochrome />, {
    width: 512,
    height: 512,
  });
}
