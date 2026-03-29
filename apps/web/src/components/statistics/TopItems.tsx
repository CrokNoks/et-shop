"use client";

import React from "react";
import { TopItem } from "@/lib/api/purchases";

interface TopItemsProps {
  items: TopItem[];
}

export const TopItems: React.FC<TopItemsProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <p className="text-gray-400 italic text-center py-8">
        Aucune donnée disponible.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={item.catalogItemId}
          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
            <span className="font-black text-[#FF6B35] text-sm">
              {index + 1}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1A365D] truncate">
              {item.productName}
            </p>
            <p className="text-sm text-gray-400">
              {item.purchaseCount} achat{item.purchaseCount > 1 ? "s" : ""}
            </p>
          </div>
          <span className="font-black text-[#FF6B35] shrink-0">
            {item.totalSpent.toFixed(2)} €
          </span>
        </div>
      ))}
    </div>
  );
};
