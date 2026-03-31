"use client";

import React from "react";
import { CategoryStat } from "@/lib/api/purchases";

interface SpendingByCategoryProps {
  categories: CategoryStat[];
}

export const SpendingByCategory: React.FC<SpendingByCategoryProps> = ({
  categories,
}) => {
  if (categories.length === 0) {
    return (
      <p className="text-gray-400 italic text-center py-8">
        Aucune donnée disponible.
      </p>
    );
  }

  const maxSpent = Math.max(...categories.map((c) => c.totalSpent));

  const sorted = [...categories].sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((cat) => {
        const percent = maxSpent > 0 ? (cat.totalSpent / maxSpent) * 100 : 0;
        return (
          <div key={cat.categoryId} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#1A365D]">
                {cat.categoryName}
              </span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">
                  {cat.itemCount} achat{cat.itemCount > 1 ? "s" : ""}
                </span>
                <span className="font-black text-[#FF6B35]">
                  {cat.totalSpent.toFixed(2)} €
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B35] rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
