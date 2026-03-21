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
  showQuantity = false
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-black text-gray-400 uppercase tracking-widest">Nom du produit</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="text-lg font-bold text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
          required
        />
      </div>

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
      
      {showQuantity && setQuantity && (
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

      <SheetFooter className="mt-8 pt-4 sm:justify-start">
        <Button type="submit" disabled={isSubmitting} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl">
          {isSubmitting ? 'Traitement...' : submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
};
