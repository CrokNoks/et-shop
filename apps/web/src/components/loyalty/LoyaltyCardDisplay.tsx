"use client";

import React from "react";
import { BarcodeFormat } from "../../types/loyalty-card";
import { BarcodeRenderer } from "./BarcodeRenderer";

interface LoyaltyCardDisplayProps {
  cardData: string;
  barcodeFormat: BarcodeFormat;
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
        <BarcodeRenderer
          data={cardData}
          format={barcodeFormat}
          height={64}
          qrSize={128}
        />
      </div>
      <p className="mt-4 text-[13px] text-[var(--es-secondary)]">
        Présentez ce code à la caisse.
      </p>
    </div>
  );
}
