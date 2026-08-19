"use client";

import React, { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { RecipeItem } from "@/types";

interface RecipeItemRowProps {
  item: RecipeItem;
  onUpdate: (
    itemId: string,
    data: { quantity?: number; unit?: string },
  ) => void;
  onDelete: (itemId: string) => void;
}

export const RecipeItemRow: React.FC<RecipeItemRowProps> = ({
  item,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [unit, setUnit] = useState(item.unit || "");

  const catalogItem = item.items_catalog as
    | { name?: string; unit?: string }
    | undefined;
  const itemName = catalogItem?.name || "Produit inconnu";

  const handleSave = () => {
    onUpdate(item.id, {
      quantity: parseFloat(quantity) || item.quantity,
      unit: unit || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setQuantity(item.quantity.toString());
    setUnit(item.unit || "");
    setIsEditing(false);
  };

  return (
    <div className="group flex h-14 items-center justify-between gap-3 border-b border-[var(--es-hairline)] px-1 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-medium text-[var(--es-ink)]">
            {itemName}
          </span>
          {isEditing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                aria-label="Quantité"
                className="h-7 w-16 rounded-[8px] border border-[#FF6B35] px-1.5 text-[13px] tabular-nums outline-none"
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="unité"
                aria-label="Unité"
                className="h-7 w-16 rounded-[8px] border border-[var(--es-hairline)] px-1.5 text-[13px] uppercase outline-none"
              />
            </div>
          ) : (
            <span className="text-[11.5px] text-[var(--es-tertiary)]">
              <span className="tabular-nums">{item.quantity}</span>{" "}
              <span className="uppercase">
                {item.unit || catalogItem?.unit || "pcs"}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              data-cy={`recipe-item-${item.id}-save`}
              aria-label="Enregistrer"
              title="Enregistrer"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#2e7d32] hover:bg-[rgba(46,125,50,0.08)]"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              data-cy={`recipe-item-${item.id}-cancel`}
              aria-label="Annuler"
              title="Annuler"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-tertiary)] hover:bg-[var(--es-field)]"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              data-cy={`recipe-item-${item.id}-edit`}
              aria-label="Modifier"
              title="Modifier"
              className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[var(--es-tertiary)] transition-colors hover:bg-[var(--es-field)] hover:text-[var(--es-ink)]"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              data-cy={`recipe-item-${item.id}-delete`}
              aria-label="Supprimer"
              title="Supprimer"
              className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[var(--es-tertiary)] transition-colors hover:bg-[rgba(179,38,30,0.08)] hover:text-[var(--es-danger)]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
