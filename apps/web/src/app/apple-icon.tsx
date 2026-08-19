import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icône iOS "add to home screen" (design handoff, variante 6b). */
export default function AppleIcon() {
  return new ImageResponse(<AppIconMark />, { ...size });
}
