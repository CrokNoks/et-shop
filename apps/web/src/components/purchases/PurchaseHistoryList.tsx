"use client";

import React from "react";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { PurchaseHistoryQuery } from "@/lib/api/purchases";
import { PurchaseHistoryItem } from "./PurchaseHistoryItem";

interface PurchaseHistoryListProps {
  query?: PurchaseHistoryQuery;
  onPageChange?: (page: number) => void;
}

export const PurchaseHistoryList: React.FC<PurchaseHistoryListProps> = ({
  query = {},
  onPageChange,
}) => {
  const { data, isLoading, isError } = usePurchaseHistory(query);

  if (isLoading) {
    return (
      <p className="text-center py-20 text-gray-400 italic animate-pulse">
        Chargement de l&apos;historique...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-center py-20 text-red-400 italic">
        Erreur lors du chargement de l&apos;historique.
      </p>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <p className="text-center py-20 text-gray-400 italic">
        Aucun achat enregistré pour le moment.
      </p>
    );
  }

  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-400">
        {data.total} achat{data.total > 1 ? "s" : ""} au total
      </p>

      <div className="flex flex-col gap-3">
        {data.data.map((record) => (
          <PurchaseHistoryItem key={record.id} record={record} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onPageChange?.((query.page ?? 1) - 1)}
            disabled={(query.page ?? 1) <= 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#1A365D] disabled:opacity-40 hover:bg-gray-50 transition-all"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500">
            Page {query.page ?? 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.((query.page ?? 1) + 1)}
            disabled={(query.page ?? 1) >= totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#1A365D] disabled:opacity-40 hover:bg-gray-50 transition-all"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};
