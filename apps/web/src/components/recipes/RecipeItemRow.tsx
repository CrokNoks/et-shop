"use client";

import React, { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { RecipeItem } from "@/types";

interface RecipeItemRowProps {
  item: RecipeItem;
  onUpdate: (itemId: string, data: { quantity?: number; unit?: string }) => void;
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
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold truncate">{itemName}</span>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 p-1 text-sm border border-[#FF6B35] rounded-lg outline-none"
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="unité"
                className="w-16 p-1 text-sm border border-gray-200 rounded-lg outline-none"
              />
            </div>
          ) : (
            <span className="text-sm text-gray-400">
              {item.quantity} {item.unit || catalogItem?.unit || "pcs"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-all"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-300 hover:text-[#1A365D] hover:bg-gray-100 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
