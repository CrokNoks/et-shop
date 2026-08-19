"use client";

// app_build/apps/web/src/components/loyalty/LoyaltyCardDisplay.tsx

import React from "react";
import { BarcodeFormat } from "../../types/loyalty-card";

// Pre-computed outside component to avoid impure call during render
const QR_CELLS: boolean[] = Array.from({ length: 64 }).map(
  () => Math.random() > 0.5,
);

interface LoyaltyCardDisplayProps {
  cardData: string;
  barcodeFormat: BarcodeFormat;
}

// Placeholder for a barcode rendering library
// In a real application, you would use a library like 'react-barcode' or 'jsbarcode'
function BarcodeRenderer({
  data,
  format,
}: {
  data: string;
  format: BarcodeFormat;
}) {
  // This is a dummy component. A real implementation would render an SVG or Canvas barcode.
  // Example for Code 128 (often used for loyalty cards)
  const qrCells = QR_CELLS;

  if (format === BarcodeFormat.CODE_128) {
    return (
      <div className="bg-white p-4 rounded-lg flex flex-col items-center">
        <div className="w-full bg-black h-16 flex justify-between">
          {/* Simulate barcode bars */}
          <div className="w-1/12 bg-white h-full"></div>
          <div className="w-1/12 bg-black h-full"></div>
          <div className="w-1/12 bg-white h-full"></div>
          <div className="w-1/12 bg-black h-full"></div>
          <div className="w-1/12 bg-white h-full"></div>
          <div className="w-1/12 bg-black h-full"></div>
          <div className="w-1/12 bg-white h-full"></div>
          <div className="w-1/12 bg-black h-full"></div>
          <div className="w-1/12 bg-white h-full"></div>
          <div className="w-1/12 bg-black h-full"></div>
          <div className="w-1/12 bg-white h-full"></div>
        </div>
        <p className="mt-2 text-sm font-mono text-black">{data}</p>
      </div>
    );
  }
  if (format === BarcodeFormat.EAN_13) {
    return (
      <div className="bg-white p-4 rounded-lg flex flex-col items-center">
        <div className="w-full bg-black h-16 flex justify-between">
          {Array.from({ length: 13 }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="w-px bg-black h-full"></div>
              <div className="w-px bg-white h-full"></div>
            </React.Fragment>
          ))}
        </div>
        <p className="mt-2 text-sm font-mono tracking-widest text-black">
          {data}
        </p>
      </div>
    );
  }

  // Example for QR Code
  if (format === BarcodeFormat.QR_CODE) {
    return (
      <div className="bg-white p-4 rounded-lg flex flex-col items-center">
        {/* Simulate QR Code */}
        <div className="w-32 h-32 bg-gray-800 grid grid-cols-8 gap-px">
          {qrCells.map((isWhite, i) => (
            <div key={i} className={isWhite ? "bg-white" : "bg-black"}></div>
          ))}
        </div>
        <p className="mt-2 text-sm font-mono text-black">{data}</p>
      </div>
    );
  }

  return (
    <div className="p-4 text-center">
      <p className="text-[var(--es-danger)]">
        Format de code-barres non pris en charge pour l&apos;affichage :{" "}
        {format}
      </p>
      <p className="mt-2 font-mono text-lg">{data}</p>
    </div>
  );
}

export function LoyaltyCardDisplay({
  cardData,
  barcodeFormat,
}: LoyaltyCardDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-[var(--es-ink)]">
      <h3 className="mb-4 text-[17px] font-semibold">
        Code-barres de la carte
      </h3>
      {/* Fond forcé en blanc même en thème sombre : c'est un aperçu de code
          scannable, pas un élément décoratif (cf. LoyaltyCardOverlay). */}
      <div className="rounded-[14px] bg-[#f2f4f7] p-4 shadow-inner">
        <BarcodeRenderer data={cardData} format={barcodeFormat} />
      </div>
      <p className="mt-4 text-[13px] text-[var(--es-secondary)]">
        Présentez ce code à la caisse.
      </p>
    </div>
  );
}
