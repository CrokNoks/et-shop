"use client";

// app_build/apps/web/src/components/loyalty/LoyaltyCardItem.tsx

import React from "react";
import Link from "next/link";
import { LoyaltyCardFrontend } from "../../types/loyalty-card";
import { getStoreName } from "../../lib/utils"; // Assuming a utility to get store name from ID

interface LoyaltyCardItemProps {
  card: LoyaltyCardFrontend;
}

export function LoyaltyCardItem({ card }: LoyaltyCardItemProps) {
  // In a real app, you'd fetch store details based on card.storeId
  // For now, let's just display the storeId as a placeholder or use a mock function.
  const storeName = getStoreName(card.storeId); // Placeholder for actual store data fetching

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
            {storeName || `Magasin ID: ${card.storeId}`}
          </h3>
          <p className="text-sm text-gray-600">Numéro: {card.cardData}</p>
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
