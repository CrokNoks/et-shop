"use client";

// app_build/apps/web/src/components/loyalty/LoyaltyCardItem.tsx

import React from "react";
import Link from "next/link";
import {
  CreditCardIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { LoyaltyCardFrontend } from "../../types/loyalty-card";

interface LoyaltyCardItemProps {
  card: LoyaltyCardFrontend;
  storeName?: string;
}

export function LoyaltyCardItem({ card, storeName }: LoyaltyCardItemProps) {
  const masked = card.cardData.slice(-4).padStart(4, "•");

  return (
    <Link href={`/loyalty-cards/${card.id}`} className="block">
      <div className="flex h-[66px] items-center gap-3 border-b border-[var(--es-hairline)] px-3.5 last:border-b-0">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            backgroundColor: card.customColor
              ? `${card.customColor}1a`
              : "rgba(255,107,53,0.1)",
            color: card.customColor || "#FF6B35",
          }}
        >
          <CreditCardIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[var(--es-ink)]">
            {card.name}
          </p>
          <p className="truncate text-[11.5px] tabular-nums text-[var(--es-tertiary)]">
            {storeName ?? card.storeId} · •••• {masked}
          </p>
        </div>
        <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-[var(--es-disabled)]" />
      </div>
    </Link>
  );
}
