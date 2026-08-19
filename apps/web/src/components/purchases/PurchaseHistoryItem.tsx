"use client";

import React from "react";
import { PurchaseRecord } from "@/lib/api/purchases";

interface PurchaseHistoryItemProps {
  record: PurchaseRecord;
}

export const PurchaseHistoryItem: React.FC<PurchaseHistoryItemProps> = ({
  record,
}) => {
  const formattedDate = new Date(record.purchasedAt).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const formattedTime = new Date(record.purchasedAt).toLocaleTimeString(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div
      data-cy={`purchase-history-item-${record.id}`}
      className="flex items-center justify-between p-4 bg-[var(--es-surface)] rounded-2xl border border-[var(--es-hairline)] shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-semibold text-[var(--es-ink)] truncate">
          {record.productName}
        </span>
        <span className="text-sm text-[var(--es-tertiary)]">
          {record.quantity} {record.unit} &bull; {formattedDate} à{" "}
          {formattedTime}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
        <span className="font-semibold text-[var(--es-accent-text)]">
          {record.totalAmount.toFixed(2)} €
        </span>
        <span className="text-xs text-[var(--es-tertiary)]">
          {record.price.toFixed(2)} € / {record.unit}
        </span>
      </div>
    </div>
  );
};
