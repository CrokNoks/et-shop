"use client";

import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { LoyaltyCardFrontend } from "@/types/loyalty-card";
import { BarcodeRenderer } from "./BarcodeRenderer";

interface LoyaltyCardOverlayProps {
  card: LoyaltyCardFrontend;
  storeName: string;
  onClose: () => void;
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-white">
      {/* Repli portrait (screen.orientation.lock indisponible/refusé) : pivote
          le contenu à 90°. `rotate-90` tourne autour du centre de CET élément
          — sans le centrage flex du parent ci-dessus, l'élément (positionné
          par défaut en haut à gauche, avec des dimensions permutées 100vh ×
          100vw) tournait autour d'un centre décalé du centre réel de l'écran,
          débordant visuellement (coupé à droite/en haut, vide à gauche/en
          bas). Centré ici, la rotation retombe exactement sur l'écran. */}
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 p-8 portrait:h-[100vw] portrait:w-[100vh] portrait:rotate-90">
        {/* `relative` ci-dessus : la barre de couleur et le bouton fermer sont
            en `absolute` et doivent pivoter avec le reste de la carte, pas
            rester ancrés au coin physique de l'écran une fois le contenu
            tourné à 90°. */}
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
          <BarcodeRenderer
            data={card.cardData}
            format={card.barcodeFormat}
            height={110}
            qrSize={200}
          />
        </div>

        <p className="text-[11.5px] uppercase tracking-[0.14em] text-[#9397ab]">
          Présentez ce code à la caisse
        </p>
      </div>
    </div>
  );
}
