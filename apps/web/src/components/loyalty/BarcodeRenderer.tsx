"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { BarcodeFormat } from "@/types/loyalty-card";

interface BarcodeRendererProps {
  data: string;
  format: BarcodeFormat;
  /** Hauteur des barres 1D en px (JsBarcode). Sans effet sur le QR code. */
  height?: number;
  /** Taille du QR code en px. Sans effet sur les formats 1D. */
  qrSize?: number;
  /** Affiche la donnée en clair sous le symbole (numéro de carte lisible). */
  showValue?: boolean;
  className?: string;
}

/**
 * Un EAN-13 valide est 12 chiffres (jsbarcode calcule lui-même la clé de
 * contrôle) ou 13 chiffres dont le dernier est la clé de contrôle correcte.
 * Beaucoup de numéros de carte de fidélité ne sont pas des EAN-13 valides
 * (ce sont des identifiants arbitraires du commerçant) même quand ce format
 * est sélectionné — d'où le repli sur CODE128, qui accepte quasiment
 * n'importe quelle chaîne.
 */
function isValidEan13(data: string): boolean {
  if (!/^\d{12,13}$/.test(data)) return false;
  if (data.length === 12) return true;
  const digits = data.split("").map(Number);
  const checkDigit = digits.pop() as number;
  const sum = digits.reduce(
    (acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return (10 - (sum % 10)) % 10 === checkDigit;
}

/**
 * Rendu réel (scannable) d'un code-barres/QR code de carte de fidélité, via
 * jsbarcode (CODE_128/EAN_13, rendu dans un <svg>) et qrcode.react (QR_CODE).
 * Remplace les barres décoratives simulées précédentes (ni CODE_128 ni
 * EAN_13 n'étaient réellement encodés) — utilisé à la fois par l'écran
 * plein écran en caisse (LoyaltyCardOverlay) et l'affichage carte
 * (LoyaltyCardDisplay), pour ne garder qu'une seule implémentation.
 */
export function BarcodeRenderer({
  data,
  format,
  height = 100,
  qrSize = 176,
  showValue = true,
  className,
}: BarcodeRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Dérivé pur du format/de la donnée, calculé au rendu — pas un état posé
  // depuis l'effet ci-dessous (qui ne fait que le dessin DOM imperatif) :
  // évite un setState dans l'effet pour une valeur qu'on peut déjà déterminer
  // avant qu'il ne s'exécute.
  const requestsEan13 = format === BarcodeFormat.EAN_13;
  const eanFallsBackToCode128 = requestsEan13 && !isValidEan13(data);
  const jsBarcodeFormat = requestsEan13 && !eanFallsBackToCode128 ? "EAN13" : "CODE128";

  useEffect(() => {
    if (format === BarcodeFormat.QR_CODE || !svgRef.current || !data) return;
    try {
      JsBarcode(svgRef.current, data, {
        format: jsBarcodeFormat,
        displayValue: false,
        margin: 0,
        height,
        background: "transparent",
        lineColor: "#000000",
      });
    } catch (err) {
      // Échec inattendu (ex. caractère non supporté par CODE128) : loggé,
      // non bloquant — l'écran reste utilisable, le numéro en clair
      // (affiché ci-dessous) reste lisible même sans symbole.
      console.error("Failed to render barcode", err);
    }
  }, [data, format, jsBarcodeFormat, height]);

  if (format === BarcodeFormat.QR_CODE) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={data} size={qrSize} />
        </div>
        {showValue && (
          <p className="font-mono text-lg tracking-widest text-black">
            {data}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? "w-full"}`}>
      <svg ref={svgRef} className="w-full" />
      {showValue && (
        <p className="font-mono text-2xl tracking-[0.3em] text-black">
          {data}
        </p>
      )}
      {eanFallsBackToCode128 && (
        <p className="text-center text-xs text-[var(--es-danger)]">
          Numéro non valide pour EAN-13 (12-13 chiffres attendus) — affiché en
          CODE 128.
        </p>
      )}
    </div>
  );
}
