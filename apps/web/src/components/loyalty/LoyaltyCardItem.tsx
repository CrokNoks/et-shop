"use client";

// app_build/apps/web/src/components/loyalty/LoyaltyCardItem.tsx

import React from "react";
import Link from "next/link";
import { LoyaltyCardFrontend } from "../../types/loyalty-card";

interface LoyaltyCardItemProps {
  card: LoyaltyCardFrontend;
  storeName?: string;
}

export function LoyaltyCardItem({ card, storeName }: LoyaltyCardItemProps) {

  const cardStyle = card.customColor
    ? { borderColor: card.customColor, borderWidth: "2px" }
    : {};

  return (
    <Link href={`/loyalty-cards/${card.id}`} className="block">
      <div
        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        style={cardStyle}
      >
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-800">
            {card.name}
          </h3>
          {card.description && (
            <p className="text-sm text-gray-500">{card.description}</p>
          )}
          <p className="text-sm text-gray-600">{storeName ?? card.storeId}</p>
        </div>
        <div className="text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
