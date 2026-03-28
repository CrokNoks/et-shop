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
        <p className="mt-2 text-sm font-mono">{data}</p>
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
        <p className="mt-2 text-sm font-mono">{data}</p>
      </div>
    );
  }

  return (
    <div className="text-center p-4">
      <p className="text-red-500">
        Format de code-barres non pris en charge pour l&apos;affichage :{" "}
        {format}
      </p>
      <p className="font-mono text-lg mt-2">{data}</p>
    </div>
  );
}

export function LoyaltyCardDisplay({
  cardData,
  barcodeFormat,
}: LoyaltyCardDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h3 className="text-xl font-semibold mb-4">Code-barres de la carte</h3>
      <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
        <BarcodeRenderer data={cardData} format={barcodeFormat} />
      </div>
      <p className="mt-4 text-gray-600">Présentez ce code à la caisse.</p>
    </div>
  );
}
