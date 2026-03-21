"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { fetchApi } from '@/lib/api';
import { CatalogSearch } from '@/components/catalog/CatalogSearch';
import { CatalogItemCard } from '@/components/catalog/CatalogItemCard';
import { ProductForm } from '@/components/shopping/ProductForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CatalogImportWizard } from '@/components/catalog/CatalogImportWizard';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

interface CatalogItem {
  id: string;
  name: string;
  barcode?: string;
  unit?: string;
  category_id?: string;
  categories?: { name: string };
  usage_count: number;
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (error) {
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" du catalogue ?`)) return;

    try {
      await fetchApi(`/shopping-lists/catalog/${id}`, { method: 'DELETE' });
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.barcode && item.barcode.includes(searchQuery))
  );

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
              <CatalogImportWizard onSuccess={fetchData} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <p className="col-span-full text-center py-20 text-gray-400 italic animate-pulse">Chargement du catalogue...</p>
            ) : filteredItems.length === 0 ? (
              <p className="col-span-full text-center py-20 text-gray-400 italic">Aucun produit trouvé.</p>
            ) : (
              filteredItems.map((item) => (
                <CatalogItemCard 
                  key={item.id} 
                  item={item} 
                  onEdit={openEditSheet} 
                  onDelete={handleDelete} 
                />
              ))
            )}
          </div>

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
