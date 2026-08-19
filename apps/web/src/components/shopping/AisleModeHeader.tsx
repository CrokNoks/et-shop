"use client";

import React from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";

interface AisleModeHeaderProps {
  storeName: string;
  aisleName: string;
  checkedCount: number;
  totalCount: number;
  checkedTotal: number;
  hasLoyaltyCard: boolean;
  onShowLoyaltyCard: () => void;
}

export const AisleModeHeader: React.FC<AisleModeHeaderProps> = ({
  storeName,
  aisleName,
  checkedCount,
  totalCount,
  checkedTotal,
  hasLoyaltyCard,
  onShowLoyaltyCard,
}) => {
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <div className="px-3.5 pt-3 pb-2 flex flex-col gap-2 text-[var(--es-ink)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#c8471c] dark:text-[#ffb694]">
            En magasin · {storeName}
          </span>
          <h1 className="text-xl font-semibold truncate">Rayon {aisleName}</h1>
        </div>
        {hasLoyaltyCard && (
          <button
            onClick={onShowLoyaltyCard}
            title="Carte de fidélité"
            className="shrink-0 w-[34px] h-[34px] rounded-2xl border border-[var(--es-hairline)] flex items-center justify-center text-[#c8471c] dark:text-[#ffb694]"
          >
            <CreditCardIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="h-1 rounded-full bg-[var(--es-hairline)] overflow-hidden">
        <div
          data-cy="shopping-progress-bar"
          className="h-full bg-[#FF6B35] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-[var(--es-secondary)]">
          {checkedCount} / {totalCount} cochés
        </span>
        <span className="font-semibold">
          {checkedTotal.toFixed(2)} € dans le panier
        </span>
      </div>
    </div>
  );
};
