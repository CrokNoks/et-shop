"use client";

import React from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';
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

const EMOJI_OPTIONS = [
  '🍎', '🥦', '🥖', '🧀', '🥩', '🐟', '🍝', '🧂', '🥤', '🍷', 
  '🍺', '🍦', '🍩', '🍫', '☕', '🧼', '🧻', '💊', '🔋', '🐶', 
  '🐱', '🧹', '🕯️', '📦', '🛒', '🛍️', '🍓', '🍋', '🥚', '🥛'
];

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  name: string;
  setName: (name: string) => void;
  quantity?: number;
  setQuantity?: (qty: number) => void;
  barcode: string;
  setBarcode: (bc: string) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  categories: Category[];
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
  name, setName,
  quantity, setQuantity,
  barcode, setBarcode,
  categoryId, setCategoryId,
  categories,
  onSubmit,
  isSubmitting,
  submitLabel,
  showQuantity = false,
  icon, setIcon,
  sortOrder, setSortOrder,
  isCategoryForm = false
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-black text-gray-400 uppercase tracking-widest">
          {isCategoryForm ? 'Nom du rayon' : 'Nom du produit'}
        </Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder={isCategoryForm ? "Ex: Surgelés, Fruits..." : "Nom du produit"}
          className="text-lg font-bold text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
          required
        />
      </div>

      {isCategoryForm && setIcon && (
        <div className="space-y-3">
          <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">Icône du rayon</Label>
          <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 max-h-[200px] overflow-y-auto">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`text-2xl p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                  icon === emoji 
                    ? 'bg-[#FF6B35] shadow-md scale-110' 
                    : 'hover:bg-white'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {isCategoryForm && setSortOrder && (
        <div className="space-y-2">
          <Label htmlFor="sortOrder" className="text-xs font-black text-gray-400 uppercase tracking-widest">Ordre de tri</Label>
          <Input 
            id="sortOrder" 
            type="number"
            value={sortOrder} 
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} 
            className="text-lg font-bold text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
            required
          />
        </div>
      )}

      {!isCategoryForm && (
        <div className="space-y-2">
          <Label htmlFor="category" className="text-xs font-black text-gray-400 uppercase tracking-widest">Rayon (Catégorie)</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full text-lg font-bold text-[#1A365D] border-gray-200 focus:ring-[#FF6B35]">
              <SelectValue placeholder="Choisir un rayon..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="font-bold text-[#1A365D]">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {!isCategoryForm && showQuantity && setQuantity && (
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantité par défaut</Label>
          <Input 
            id="quantity" 
            type="number" 
            min="1" 
            value={quantity} 
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
            className="text-lg font-bold text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
            required
          />
        </div>
      )}

      {!isCategoryForm && (
        <div className="space-y-2">
          <Label htmlFor="barcode" className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
            Code-barres (Optionnel)
            <button type="button" className="text-[#FF6B35] hover:underline flex items-center gap-1" onClick={() => {
              const bc = prompt("Scannez le code (Simulation) :");
              if(bc) setBarcode(bc);
            }}>
              <QrCodeIcon className="w-3 h-3" /> Scanner
            </button>
          </Label>
          <Input 
            id="barcode" 
            value={barcode} 
            onChange={(e) => setBarcode(e.target.value)} 
            placeholder="Ex: 3017620422003"
            className="font-mono text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
          />
        </div>
      )}

      <SheetFooter className="mt-8 pt-4 sm:justify-start">
        <Button type="submit" disabled={isSubmitting} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl">
          {isSubmitting ? 'Traitement...' : submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
};
