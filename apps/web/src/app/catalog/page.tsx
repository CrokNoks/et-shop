"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
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

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface CatalogItem {
  id: string;
  name: string;
  barcode?: string;
  unit?: string;
  category_id?: string;
  categories?: { name: string; sort_order: number };
  usage_count: number;
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Form state (Edit & Create)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [catalogData, categoriesData] = await Promise.all([
        fetchApi('/shopping-lists/catalog'),
        fetchApi('/shopping-lists/categories')
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
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setBarcode('');
    setUnit('pcs');
    setCategoryId('');
    setIsSheetOpen(true);
  };

  const openEditSheet = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setBarcode(item.barcode || '');
    setUnit(item.unit || 'pcs');
    setCategoryId(item.category_id || '');
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
      };

      if (editingItem) {
        await fetchApi(`/shopping-lists/catalog/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/shopping-lists/catalog', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      fetchData();
      setIsSheetOpen(false);
      toast.success(editingItem ? "Produit mis à jour !" : "Produit créé !");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" du catalogue ?`)) return;

    try {
      await fetchApi(`/shopping-lists/catalog/${id}`, { method: 'DELETE' });
      setItems(items.filter(item => item.id !== id));
      setSelectedIds(selectedIds.filter(sid => sid !== id));
      toast.success("Produit supprimé !");
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkCategoryId || isBulkUpdating) return;
    setIsBulkUpdating(true);
    try {
      await fetchApi('/shopping-lists/catalog/bulk-category', {
        method: 'PATCH',
        body: JSON.stringify({
          ids: selectedIds,
          category_id: bulkCategoryId,
        }),
      });
      fetchData();
      setSelectedIds([]);
      setBulkCategoryId('');
      toast.success(`${selectedIds.length} produits mis à jour !`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour groupée.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery))
    );
  }, [items, searchQuery]);

  // Grouping logic: Sans Rayon first, then by sort_order
  const groupedItems = useMemo(() => {
    const groups: Record<string, { name: string; items: CatalogItem[]; order: number }> = {};
    
    filteredItems.forEach(item => {
      const categoryName = item.categories?.name || 'Sans Rayon';
      const categoryOrder = item.categories?.sort_order ?? -1; // -1 to put them first
      
      if (!groups[categoryName]) {
        groups[categoryName] = { name: categoryName, items: [], order: categoryOrder };
      }
      groups[categoryName].items.push(item);
    });
    
    return Object.values(groups).sort((a, b) => a.order - b.order);
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 sm:p-12 flex justify-center text-left">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black">Catalogue Produits</h1>
              <p className="text-gray-500">Gérez le référentiel global de vos articles.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleOpenCreate}
                className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl px-6 py-6 shadow-lg transition-all border-none"
              >
                <PlusIcon className="w-5 h-5 mr-2" strokeWidth={3} />
                Nouveau Produit
              </Button>
            </div>
          </div>

          <CatalogSearch value={searchQuery} onChange={setSearchQuery} />

          <div className="flex flex-col gap-12 pb-32">
            {isLoading ? (
              <p className="text-center py-20 text-gray-400 italic animate-pulse">Chargement du catalogue...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-center py-20 text-gray-400 italic">Aucun produit trouvé.</p>
            ) : (
              groupedItems.map((group) => (
                <div key={group.name} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-[2px] bg-[#FF6B35]" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
                      {group.name} ({group.items.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.items.map((item) => (
                      <CatalogItemCard 
                        key={item.id} 
                        item={item} 
                        onEdit={openEditSheet} 
                        onDelete={handleDelete}
                        isSelected={selectedIds.includes(item.id)}
                        onSelect={(checked) => handleSelect(item.id, checked)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 animate-in slide-in-from-bottom-8 duration-300">
              <div className="bg-[#1A365D] text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4 pl-2">
                  <div className="bg-[#FF6B35] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                    {selectedIds.length}
                  </div>
                  <p className="font-bold text-sm">produits sélectionnés</p>
                </div>

                <div className="flex items-center gap-3 flex-1 max-w-sm">
                  <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white font-bold rounded-xl h-12 focus:ring-[#FF6B35]">
                      <SelectValue placeholder="Choisir un rayon...">
                        {categories.find(c => c.id === bulkCategoryId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="font-bold text-[#1A365D]">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleBulkUpdate}
                    disabled={!bulkCategoryId || isBulkUpdating}
                    className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold h-12 rounded-xl px-6 disabled:opacity-50 transition-all border-none"
                  >
                    {isBulkUpdating ? '...' : 'Appliquer'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedIds([])}
                    className="text-white/60 hover:text-white hover:bg-white/10 h-12 rounded-xl"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side="right" className="w-full sm:max-w-[450px] p-10 text-[#1A365D]">
              <SheetHeader className="mb-10 text-left">
                <SheetTitle className="text-3xl font-black">
                  {editingItem ? 'Modifier le produit' : 'Nouveau produit'}
                </SheetTitle>
                <SheetDescription className="text-base text-gray-500 mt-2">
                  {editingItem 
                    ? 'Mettez à jour les informations globales de cet article.' 
                    : 'Créez un nouvel article dans le catalogue de votre foyer.'}
                </SheetDescription>
              </SheetHeader>
              
              <ProductForm 
                name={name}
                setName={setName}
                unit={unit}
                setUnit={setUnit}
                barcode={barcode}
                setBarcode={setBarcode}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                categories={categories}
                isSubmitting={isSubmitting}
                submitLabel={editingItem ? "Enregistrer les modifications" : "Créer le produit"}
                onSubmit={handleSubmit}
              />
            </SheetContent>
          </Sheet>

          <footer className="mt-auto py-12 flex gap-6 flex-wrap items-center justify-center opacity-40 text-xs text-center">
            <p>© 2026 Et SHop! - Votre catalogue intelligent propulsionné 🚀</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
