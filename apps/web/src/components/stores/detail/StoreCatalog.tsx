"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '@/lib/api';
import { CatalogSearch } from '@/components/catalog/CatalogSearch';
import { CatalogItemCard } from '@/components/catalog/CatalogItemCard';
import { ProductForm } from '@/components/shopping/ProductForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, CatalogItem } from '@/types';
import { CatalogImportWizard } from '@/components/catalog/CatalogImportWizard';

interface StoreCatalogProps {
  storeId: string;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({ storeId }) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Form state (Edit & Create)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catalogData, categoriesData] = await Promise.all([
        fetchApi(`/shopping-lists/catalog?storeId=${storeId}`),
        fetchApi(`/shopping-lists/categories?storeId=${storeId}`)
      ]);
      setItems(catalogData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to fetch catalog data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setBarcode('');
    setUnit('pcs');
    setCategoryId(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setBarcode(item.barcode || '');
    setUnit(item.unit || 'pcs');
    setCategoryId(item.category_id || null);
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        barcode: barcode || null,
        unit,
        category_id: categoryId || null,
        store_id: storeId
      };

      if (editingItem) {
        await fetchApi(`/shopping-lists/catalog/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success("Produit mis à jour !");
      } else {
        await fetchApi('/shopping-lists/catalog', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success("Produit ajouté au catalogue !");
      }
      fetchData();
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit du catalogue ?")) return;
    try {
      await fetchApi(`/shopping-lists/catalog/${id}`, { method: 'DELETE' });
      setItems(items.filter(item => item.id !== id));
      toast.success("Produit supprimé.");
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleBulkUpdateCategory = async () => {
    if (!bulkCategoryId || selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await fetchApi('/shopping-lists/catalog/bulk-category', {
        method: 'PATCH',
        body: JSON.stringify({ ids: selectedIds, category_id: bulkCategoryId }),
      });
      toast.success(`${selectedIds.length} produits mis à jour !`);
      setSelectedIds([]);
      setBulkCategoryId(null);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour groupée.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.includes(searchQuery)
    );
  }, [items, searchQuery]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black">Catalogue du magasin</h2>
          <p className="text-gray-500">Gérez vos articles habituels pour ce magasin.</p>
        </div>
        <div className="flex gap-3">
          <CatalogImportWizard onImported={fetchData} storeId={storeId} />
          <Button 
            onClick={handleOpenCreate}
            className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl px-6 py-6 shadow-lg transition-all border-none"
          >
            <PlusIcon className="w-5 h-5 mr-2" strokeWidth={3} />
            Nouveau Produit
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <CatalogSearch value={searchQuery} onChange={setSearchQuery} />

        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <p className="text-indigo-900 font-bold">
              {selectedIds.length} article(s) sélectionné(s)
            </p>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={bulkCategoryId || ''} onValueChange={setBulkCategoryId}>
                <SelectTrigger className="bg-white border-indigo-200 text-indigo-900 font-bold rounded-xl min-w-[200px]">
                  <SelectValue placeholder="Assigner à un rayon..." />
                </SelectTrigger>
                <SelectContent className="text-[#1A365D]">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="font-bold">
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkUpdateCategory} 
                disabled={!bulkCategoryId || isBulkUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl"
              >
                {isBulkUpdating ? "..." : "Appliquer"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedIds([])}
                className="text-indigo-400 hover:text-indigo-600 font-bold"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <p className="col-span-full text-center py-20 text-gray-400 italic animate-pulse">Chargement...</p>
          ) : filteredItems.length === 0 ? (
            <p className="col-span-full text-center py-20 text-gray-400 italic">Aucun produit trouvé.</p>
          ) : (
            filteredItems.map((item) => (
              <CatalogItemCard 
                key={item.id} 
                item={item} 
                onEdit={() => openEditSheet(item)}
                onDelete={() => handleDelete(item.id)}
                isSelected={selectedIds.includes(item.id)}
                onSelect={(selected) => {
                  setSelectedIds(prev => 
                    selected ? [...prev, item.id] : prev.filter(id => id !== item.id)
                  );
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]">
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">
              {editingItem ? 'Modifier le produit' : 'Nouveau produit'}
            </SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              Détails du produit pour votre catalogue.
            </SheetDescription>
          </SheetHeader>
          
          <ProductForm 
            name={name}
            setName={setName}
            barcode={barcode}
            setBarcode={setBarcode}
            unit={unit}
            setUnit={setUnit}
            categoryId={categoryId || ""}
            setCategoryId={setCategoryId}
            categories={categories}
            isSubmitting={isSubmitting}
            submitLabel={editingItem ? "Mettre à jour" : "Ajouter au catalogue"}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};
