"use client";

// app_build/apps/web/src/app/loyalty-cards/page.tsx

import React from "react";
import { LoyaltyCardList } from "../../components/loyalty/LoyaltyCardList";
import Link from "next/link";

export default function LoyaltyCardsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-4xl font-black">Mes Cartes de Fidélité</h1>
          <p className="text-gray-500">
            Retrouvez toutes vos cartes de fidélité.
          </p>
        </div>
        <Link
          href="/loyalty-cards/add"
          className="inline-flex items-center px-6 py-3 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl shadow-lg transition-all"
        >
          Ajouter une carte
        </Link>
      </header>
      <LoyaltyCardList />
    </div>
  );
}
