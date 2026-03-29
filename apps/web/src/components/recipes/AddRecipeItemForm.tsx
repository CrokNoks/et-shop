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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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
        const data = await fetchApi(`/shopping-lists/suggest/${encodeURIComponent(search)}`);
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
          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
            {suggestions.map((item) => (
              <li
                key={item.id}
                data-cy={`recipe-item-suggestion-${item.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors"
              >
                <span className="font-medium">{item.name}</span>
                {item.unit && (
                  <span className="ml-2 text-sm text-gray-400">({item.unit})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <input
          type="number"
          data-cy="recipe-item-quantity"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantité"
          className="w-28 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
        />
        <input
          type="text"
          data-cy="recipe-item-unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unité (pcs, kg...)"
          className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
        />
        <button
          type="submit"
          data-cy="recipe-item-submit"
          disabled={!selectedItem || isSubmitting}
          className="px-6 py-4 bg-[#FF6B35] text-white font-bold rounded-2xl shadow hover:bg-[#e55a2b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
          Ajouter
        </button>
      </div>
    </form>
  );
};
