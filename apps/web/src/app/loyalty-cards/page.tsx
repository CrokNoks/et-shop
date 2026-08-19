"use client";

// app_build/apps/web/src/app/loyalty-cards/page.tsx

import React from "react";
import { LoyaltyCardList } from "../../components/loyalty/LoyaltyCardList";
import Link from "next/link";

export default function LoyaltyCardsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-[24px] font-semibold text-[var(--es-ink)]">
            Mes cartes de fidélité
          </h1>
          <p className="text-[13px] text-[var(--es-secondary)]">
            Retrouvez toutes vos cartes de fidélité.
          </p>
        </div>
        <Link
          href="/loyalty-cards/add"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#FF6B35] px-3 text-[13px] font-semibold text-[#c8471c]"
        >
          + Ajouter
        </Link>
      </header>
      <LoyaltyCardList />
    </div>
  );
}
