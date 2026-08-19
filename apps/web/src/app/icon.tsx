import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

function icon(size: number, simplified: boolean) {
  return new ImageResponse(
    <AppIconMark borderRadius={size * 0.24} simplified={simplified} />,
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
