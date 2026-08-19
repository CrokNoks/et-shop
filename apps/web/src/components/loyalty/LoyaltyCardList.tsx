"use client";

// app_build/apps/web/src/components/loyalty/LoyaltyCardList.tsx

import React from "react";
import Link from "next/link";
import { useLoyaltyCards } from "../../hooks/useLoyaltyCards";
import { useStoreMap } from "../../hooks/useStores";
import { LoyaltyCardItem } from "./LoyaltyCardItem";
import { LoyaltyCardFrontend } from "../../types/loyalty-card";

export function LoyaltyCardList() {
  const { data: loyaltyCards, isLoading, isError, error } = useLoyaltyCards();
  const storeMap = useStoreMap();

  if (isLoading) {
    return (
      <p className="py-16 text-center text-[13px] italic text-[var(--es-tertiary)]">
        Chargement des cartes de fidélité...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-16 text-center text-[13px] text-[var(--es-danger)]">
        Erreur : {error?.message}
      </p>
    );
  }

  if (!loyaltyCards || loyaltyCards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-[13px] italic text-[var(--es-tertiary)]">
          Aucune carte de fidélité enregistrée pour le moment.
        </p>
        <Link
          href="/loyalty-cards/add"
          className="text-[14px] font-semibold text-[var(--es-accent-text)]"
        >
          Ajouter une nouvelle carte
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-[var(--es-hairline)]">
      {loyaltyCards.map((card: LoyaltyCardFrontend) => (
        <LoyaltyCardItem
          key={card.id}
          card={card}
          storeName={storeMap[card.storeId]}
        />
      ))}
    </div>
  );
}
