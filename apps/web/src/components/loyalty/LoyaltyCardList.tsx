"use client";

// app_build/apps/web/src/components/loyalty/LoyaltyCardList.tsx

import React from "react";
import Link from "next/link";
import { useLoyaltyCards } from "../../hooks/useLoyaltyCards";
import { LoyaltyCardItem } from "./LoyaltyCardItem";
import { LoyaltyCardFrontend } from "../../types/loyalty-card";

export function LoyaltyCardList() {
  const { data: loyaltyCards, isLoading, isError, error } = useLoyaltyCards();

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        Chargement des cartes de fidélité...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500 text-center">
        Erreur : {error?.message}
      </div>
    );
  }

  if (!loyaltyCards || loyaltyCards.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>Aucune carte de fidélité enregistrée pour le moment.</p>
        <Link
          href="/loyalty-cards/add"
          className="text-blue-600 hover:underline"
        >
          Ajouter une nouvelle carte
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loyaltyCards.map((card: LoyaltyCardFrontend) => (
        <LoyaltyCardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
