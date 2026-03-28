"use client";

import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BarcodeFormat, LoyaltyCardFrontend } from "@/types/loyalty-card";

interface LoyaltyCardOverlayProps {
  card: LoyaltyCardFrontend;
  storeName: string;
  onClose: () => void;
}

function BarcodeContent({ data, format }: { data: string; format: BarcodeFormat }) {
  if (format === BarcodeFormat.QR_CODE) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-48 h-48 bg-gray-800 grid grid-cols-8 gap-px">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className={i % 3 === 0 ? "bg-white" : "bg-black"} />
          ))}
        </div>
        <p className="font-mono text-xl tracking-widest text-black">{data}</p>
      </div>
    );
  }

  // CODE_128 / EAN_13 / fallback — barres horizontales larges en paysage
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full h-32 flex items-stretch gap-[2px]">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className={i % 4 === 0 || i % 7 === 0 ? "flex-[2] bg-black" : "flex-1 bg-black opacity-[0.85]"}
            style={{ opacity: i % 3 === 0 ? 1 : i % 2 === 0 ? 0 : 1 }}
          />
        ))}
      </div>
      <p className="font-mono text-2xl tracking-[0.3em] text-black">{data}</p>
    </div>
  );
}

export function LoyaltyCardOverlay({ card, storeName, onClose }: LoyaltyCardOverlayProps) {
  useEffect(() => {
    // Luminosité max : demande le wake lock pour garder l'écran allumé
    let wakeLock: { release: () => void } | null = null;
    if ("wakeLock" in navigator) {
      (navigator as any).wakeLock.request("screen").then((lock: { release: () => void }) => {
        wakeLock = lock;
      }).catch(() => {});
    }

    // Verrouillage orientation paysage
    if (screen.orientation && (screen.orientation as any).lock) {
      (screen.orientation as any).lock("landscape").catch(() => {});
    }

    return () => {
      wakeLock?.release();
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    };
  }, []);

  const accentColor = card.customColor || "#FF6B35";

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8">
      {/* Barre de couleur du magasin en haut */}
      <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: accentColor }} />

      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Fermer"
      >
        <XMarkIcon className="w-6 h-6 text-gray-600" />
      </button>

      {/* Nom de la carte + magasin */}
      <div className="flex flex-col items-center gap-1 mb-8">
        <p className="text-xl font-black text-[#1A365D]">{card.name}</p>
        {card.description && (
          <p className="text-sm text-gray-500">{card.description}</p>
        )}
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">
          {storeName}
        </p>
      </div>

      {/* Code-barres */}
      <div className="w-full max-w-xl">
        <BarcodeContent data={card.cardData} format={card.barcodeFormat} />
      </div>

      <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest">
        Présentez ce code à la caisse
      </p>
    </div>
  );
}
