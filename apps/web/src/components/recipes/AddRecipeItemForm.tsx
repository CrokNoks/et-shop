"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { CatalogItem } from "@/types";
import { PlusIcon } from "@heroicons/react/24/outline";

interface AddRecipeItemFormProps {
  onAdd: (data: {
    catalog_item_id: string;
    quantity: number;
    unit?: string;
  }) => void;
  isSubmitting?: boolean;
}

export const AddRecipeItemForm: React.FC<AddRecipeItemFormProps> = ({
  onAdd,
  isSubmitting = false,
}) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.length < 2) {
      const t = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(t);
    }
    const timeout = setTimeout(async () => {
      try {
        const data = await fetchApi(
          `/shopping-lists/suggest/${encodeURIComponent(search)}`,
        );
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleSelect = (item: CatalogItem) => {
    setSelectedItem(item);
    setSearch(item.name);
    setUnit(item.unit || "pcs");
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const payload = {
      catalog_item_id: selectedItem.id,
      quantity: Number(quantity) || 1,
      unit: unit || selectedItem.unit || "pcs",
    };
    onAdd(payload);
    setSearch("");
    setSelectedItem(null);
    setQuantity("1");
    setUnit("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative" ref={wrapperRef}>
        <input
          type="text"
          data-cy="recipe-item-search"
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (selectedItem && val !== selectedItem.name) {
              setSelectedItem(null);
            }
          }}
          placeholder="Rechercher un produit du catalogue..."
          className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium text-[var(--es-ink)] outline-none focus:border-[#FF6B35] focus:bg-[rgba(255,107,53,0.04)]"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] shadow-lg">
            {suggestions.map((item) => (
              <li
                key={item.id}
                data-cy={`recipe-item-suggestion-${item.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="flex h-14 cursor-pointer items-center justify-between border-b border-[var(--es-hairline)] px-3.5 last:border-b-0 hover:bg-[var(--es-field)]"
              >
                <span className="text-[15px] font-medium text-[var(--es-ink)]">
                  {item.name}
                </span>
                {item.unit && (
                  <span className="text-[11.5px] uppercase text-[var(--es-tertiary)]">
                    {item.unit}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          data-cy="recipe-item-quantity"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qté"
          className="h-[50px] w-20 rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3 text-[15px] font-semibold tabular-nums outline-none focus:border-[#FF6B35]"
        />
        <input
          type="text"
          data-cy="recipe-item-unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="UNITÉ"
          className="h-[50px] w-24 rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3 text-[13px] font-semibold uppercase tracking-wide outline-none focus:border-[#FF6B35]"
        />
        <button
          type="submit"
          data-cy="recipe-item-submit"
          disabled={!selectedItem || isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#1A365D] text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          Ajouter
        </button>
      </div>
    </form>
  );
};
