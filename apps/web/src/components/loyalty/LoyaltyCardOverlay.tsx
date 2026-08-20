"use client";

import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BarcodeFormat, LoyaltyCardFrontend } from "@/types/loyalty-card";

interface LoyaltyCardOverlayProps {
  card: LoyaltyCardFrontend;
  storeName: string;
  onClose: () => void;
}

function BarcodeContent({
  data,
  format,
}: {
  data: string;
  format: BarcodeFormat;
}) {
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

  if (format === BarcodeFormat.EAN_13) {
    // Barres fines et régulières, beaucoup plus denses que CODE_128 —
    // même parti pris visuel que LoyaltyCardDisplay.tsx (l'autre endroit de
    // l'app qui affiche une carte de fidélité) pour rester cohérent : c'est
    // la densité/régularité qui distingue un EAN-13 d'un CODE_128 ici, pas
    // un vrai encodage (aucun des deux formats n'est réellement décodable,
    // ce composant est un simulateur décoratif).
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="w-full h-32 flex items-stretch gap-px">
          {Array.from({ length: 90 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i % 2 === 0 ? "bg-black" : "bg-white"}`}
            />
          ))}
        </div>
        <p className="font-mono text-2xl tracking-[0.3em] text-black">{data}</p>
      </div>
    );
  }

  // CODE_128 / fallback — barres pleine hauteur, largeurs irrégulières, pas de
  // barres de garde ni de découpe en blocs (à l'inverse de l'EAN-13 ci-dessus).
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full h-32 flex items-stretch gap-[2px]">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className={
              i % 4 === 0 || i % 7 === 0
                ? "flex-[2] bg-black"
                : "flex-1 bg-black opacity-[0.85]"
            }
            style={{ opacity: i % 3 === 0 ? 1 : i % 2 === 0 ? 0 : 1 }}
          />
        ))}
      </div>
      <p className="font-mono text-2xl tracking-[0.3em] text-black">{data}</p>
    </div>
  );
}

export function LoyaltyCardOverlay({
  card,
  storeName,
  onClose,
}: LoyaltyCardOverlayProps) {
  useEffect(() => {
    // Luminosité max : demande le wake lock pour garder l'écran allumé
    let wakeLock: { release: () => void } | null = null;
    if ("wakeLock" in navigator) {
      (
        navigator as Navigator & {
          wakeLock: {
            request: (type: string) => Promise<{ release: () => void }>;
          };
        }
      ).wakeLock
        .request("screen")
        .then((lock) => {
          wakeLock = lock;
        })
        .catch(() => {});
    }

    // Verrouillage orientation paysage
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
      unlock?: () => void;
    };
    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {});
    }

    return () => {
      wakeLock?.release();
      if (orientation?.unlock) {
        orientation.unlock();
      }
    };
  }, []);

  const accentColor = card.customColor || "#FF6B35";

  return (
    // Fond forcé en blanc (pas de token dark) : cet écran doit rester lisible
    // et lumineux en caisse quel que soit le thème système (écran 4h).
    <div className="fixed inset-0 z-[200] overflow-hidden bg-white">
      <div className="flex h-full w-full flex-col items-center justify-center gap-8 p-8 portrait:h-[100vw] portrait:w-[100vh] portrait:rotate-90">
        {/* Barre de couleur du magasin en haut */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: accentColor }}
        />

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--es-field)] text-[var(--es-secondary)] transition-colors hover:bg-[var(--es-hairline)]"
          aria-label="Fermer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Nom de la carte + magasin */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[20px] font-semibold text-[#12243f]">
            {card.name}
          </p>
          {card.description && (
            <p className="text-[13px] text-[#75798c]">{card.description}</p>
          )}
          <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9397ab]">
            {storeName}
          </p>
        </div>

        {/* Code-barres */}
        <div className="w-full max-w-xl">
          <BarcodeContent data={card.cardData} format={card.barcodeFormat} />
        </div>

        <p className="text-[11.5px] uppercase tracking-[0.14em] text-[#9397ab]">
          Présentez ce code à la caisse
        </p>
      </div>
    </div>
  );
}
