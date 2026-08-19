"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetFooter } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, Store } from "@/types";

const EMOJI_OPTIONS = [
  "🍎",
  "🥦",
  "🥖",
  "🧀",
  "🥩",
  "🐟",
  "🍝",
  "🧂",
  "🥤",
  "🍷",
  "🍺",
  "🍦",
  "🍩",
  "🍫",
  "☕",
  "🧼",
  "🧻",
  "💊",
  "🔋",
  "🐶",
  "🐱",
  "🧹",
  "🕯️",
  "📦",
  "🛒",
  "🛍️",
  "🍓",
  "🍋",
  "🥚",
  "🥛",
  "❄️",
];

interface ProductFormProps {
  name: string;
  setName: (name: string) => void;
  quantity?: number;
  setQuantity?: (qty: number) => void;
  unit: string;
  setUnit: (unit: string) => void;
  barcode: string;
  setBarcode: (bc: string) => void;
  categoryId: string | null;
  setCategoryId: (id: string | null) => void;
  categories: Category[];
  stores?: Store[];
  storeId?: string | null;
  setStoreId?: (id: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  submitLabel: string;
  showQuantity?: boolean;
  // Category specific fields
  icon?: string;
  setIcon?: (icon: string) => void;
  sortOrder?: number;
  setSortOrder?: (order: number) => void;
  isCategoryForm?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  name,
  setName,
  quantity,
  setQuantity,
  unit,
  setUnit,
  barcode,
  setBarcode,
  categoryId,
  setCategoryId,
  categories,
  stores,
  storeId,
  setStoreId,
  onSubmit,
  isSubmitting,
  submitLabel,
  showQuantity = false,
  icon,
  setIcon,
  sortOrder,
  setSortOrder,
  isCategoryForm = false,
}) => {
  const labelClass =
    "text-[10.5px] font-semibold text-[var(--es-secondary)] uppercase tracking-[0.14em]";
  const fieldClass =
    "text-[15px] font-medium border-[var(--es-hairline)] bg-[var(--es-surface)] text-[var(--es-ink)] focus-visible:ring-[#FF6B35]";

  return (
    <form onSubmit={onSubmit} className="space-y-6 text-[var(--es-ink)]">
      <div className="space-y-2 text-left">
        <Label htmlFor="name" className={labelClass}>
          {isCategoryForm ? "Nom du rayon" : "Nom du produit"}
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            isCategoryForm ? "Ex: Surgelés, Fruits..." : "Nom du produit"
          }
          data-cy="product-form-name"
          className={fieldClass}
          required
        />
      </div>

      {isCategoryForm && setIcon && (
        <div className="space-y-3 text-left">
          <Label className={labelClass}>Icône du rayon</Label>
          <div className="grid max-h-[200px] grid-cols-6 gap-2 overflow-y-auto rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-field)] p-4">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                data-cy={`product-form-icon-${emoji}`}
                className={`rounded-xl p-2 text-2xl transition-all hover:scale-110 active:scale-95 ${
                  icon === emoji
                    ? "scale-110 bg-[#FF6B35] shadow-md"
                    : "hover:bg-[var(--es-surface)]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {isCategoryForm && setSortOrder && (
        <div className="space-y-2 text-left">
          <Label htmlFor="sortOrder" className={labelClass}>
            Ordre de tri
          </Label>
          <Input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            data-cy="product-form-sort-order"
            className={fieldClass}
            required
          />
        </div>
      )}

      {!isCategoryForm && stores && setStoreId && (
        <div className="space-y-2 text-left">
          <Label htmlFor="store" className={labelClass}>
            Magasin
          </Label>
          <Select
            value={storeId || ""}
            onValueChange={(val) => setStoreId(val || null)}
          >
            <SelectTrigger className={`w-full ${fieldClass}`}>
              <SelectValue placeholder="Choisir un magasin...">
                {storeId && stores.find((s) => s.id === storeId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem
                  key={store.id}
                  value={store.id}
                  className="font-medium text-[var(--es-ink)]"
                >
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!isCategoryForm && (
        <div className="space-y-2 text-left">
          <Label htmlFor="category" className={labelClass}>
            Rayon (Catégorie)
          </Label>
          <Select
            value={categoryId || ""}
            onValueChange={(val) => setCategoryId(val || null)}
            disabled={stores && !storeId}
          >
            <SelectTrigger
              className={`w-full ${fieldClass} ${stores && !storeId ? "cursor-not-allowed bg-[var(--es-field)] opacity-50 grayscale" : ""}`}
            >
              <SelectValue
                placeholder={
                  stores && !storeId
                    ? "Sélectionnez d'abord un magasin"
                    : "Choisir un rayon..."
                }
              >
                {categoryId && categories.find((c) => c.id === categoryId) ? (
                  <div className="flex items-center gap-2">
                    <span>
                      {categories.find((c) => c.id === categoryId)?.icon}
                    </span>
                    <span>
                      {categories.find((c) => c.id === categoryId)?.name}
                    </span>
                  </div>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <div className="p-4 text-center text-sm italic text-[var(--es-tertiary)]">
                  Aucun rayon pour ce magasin
                </div>
              ) : (
                categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="font-medium text-[var(--es-ink)]"
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {!isCategoryForm && showQuantity && setQuantity && (
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="quantity" className={labelClass}>
              Quantité
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className={fieldClass}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit" className={labelClass}>
              Unité
            </Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex: brique, pack de 6..."
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {!isCategoryForm && !showQuantity && (
        <div className="space-y-2 text-left">
          <Label htmlFor="unit" className={labelClass}>
            Unité par défaut
          </Label>
          <Input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Ex: brique, pack de 6..."
            className={fieldClass}
          />
        </div>
      )}

      {!isCategoryForm && (
        <div className="space-y-2 text-left">
          <Label htmlFor="barcode" className={labelClass}>
            Code-barres (Optionnel)
          </Label>
          <Input
            id="barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Ex: 3017620422003"
            className={`${fieldClass} font-mono`}
          />
        </div>
      )}

      <SheetFooter className="mt-2 pt-4 sm:justify-start">
        <Button
          type="submit"
          disabled={isSubmitting}
          data-cy="product-form-submit"
          className="w-full rounded-xl bg-[#FF6B35] py-6 text-lg font-semibold text-white hover:bg-[#e55a2b]"
        >
          {isSubmitting ? "Traitement..." : submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
};
