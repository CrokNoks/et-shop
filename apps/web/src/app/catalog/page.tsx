"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { fetchApi } from '@/lib/api';
import { CatalogSearch } from '@/components/catalog/CatalogSearch';
import { CatalogItemCard } from '@/components/catalog/CatalogItemCard';
import { ProductForm } from '@/components/shopping/ProductForm';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
}

interface CatalogItem {
  id: string;
  name: string;
  barcode?: string;
  category_id?: string;
  categories?: { name: string };
  usage_count: number;
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" du catalogue ?`)) return;

    try {
      await fetchApi(`/shopping-lists/catalog/${id}`, { method: 'DELETE' });
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  const openEditSheet = (item: CatalogItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditBarcode(item.barcode || '');
    setEditCategoryId(item.category_id || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || isUpdating) return;

    setIsUpdating(true);
    try {
      const updated = await fetchApi(`/shopping-lists/catalog/${editingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          barcode: editBarcode || null,
          category_id: editCategoryId || null,
        }),
      });

      // Refetch data to get updated category names correctly
      fetchData();
      setEditingItem(null);
    } catch (error) {
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.barcode && item.barcode.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          
          <div className="flex flex-col gap-2 text-left">
            <h1 className="text-4xl font-black text-[#1A365D]">Catalogue Produits</h1>
            <p className="text-gray-500">Gérez le référentiel global de vos articles.</p>
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

          <Sheet open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
            <SheetContent side="right" className="w-full sm:max-w-[450px] p-10">
              <SheetHeader className="mb-10 text-left">
                <SheetTitle className="text-3xl font-black text-[#1A365D]">Modifier le produit</SheetTitle>
                <SheetDescription className="text-base text-gray-500 mt-2">
                  Mettez à jour les informations globales de cet article dans le catalogue.
                </SheetDescription>
              </SheetHeader>
              
              <ProductForm 
                name={editName}
                setName={setEditName}
                barcode={editBarcode}
                setBarcode={setEditBarcode}
                categoryId={editCategoryId}
                setCategoryId={setEditCategoryId}
                categories={categories}
                isSubmitting={isUpdating}
                submitLabel="Enregistrer les modifications"
                onSubmit={handleUpdate}
              />
            </SheetContent>
          </Sheet>

          <footer className="mt-auto py-12 flex gap-6 flex-wrap items-center justify-center text-[#1A365D] opacity-40 text-xs text-center">
            <p>© 2026 Et SHop! - Votre catalogue intelligent propulsionné 🚀</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
