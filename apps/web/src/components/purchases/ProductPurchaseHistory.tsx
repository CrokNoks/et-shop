"use client";

import React from "react";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { PurchaseHistoryItem } from "./PurchaseHistoryItem";

interface ProductPurchaseHistoryProps {
  catalogItemId: string;
  productName: string;
}

export const ProductPurchaseHistory: React.FC<ProductPurchaseHistoryProps> = ({
  catalogItemId,
  productName,
}) => {
  const { data, isLoading } = usePurchaseHistory({ catalogItemId, limit: 5 });

  if (isLoading) {
    return (
      <p className="text-sm text-[var(--es-tertiary)] italic animate-pulse">
        Chargement...
      </p>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <p
        data-cy="product-purchase-history"
        className="text-sm text-[var(--es-tertiary)] italic"
      >
        Aucun historique pour {productName}.
      </p>
    );
  }

  return (
    <div data-cy="product-purchase-history" className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--es-tertiary)] uppercase tracking-widest">
        Historique — {productName}
      </h3>
      {data.data.map((record) => (
        <PurchaseHistoryItem key={record.id} record={record} />
      ))}
    </div>
  );
};
