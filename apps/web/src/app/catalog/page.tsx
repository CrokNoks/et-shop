"use client";

import React, { useState, useEffect } from 'react';
import { Logo } from "@/components/Logo";
import { ListSidebar } from "@/components/ListSidebar";
import { fetchApi } from '@/lib/api';
import { MagnifyingGlassIcon, QrCodeIcon, TagIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCatalog = async () => {
    try {
      const data = await fetchApi('/shopping-lists/catalog');
      setItems(data || []);
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
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
        }),
      });

      setItems(items.map(item => item.id === editingItem.id ? { ...item, ...updated } : item));
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
      
      {/* Sidebar */}
      <aside className="w-full sm:w-80 bg-white border-r border-gray-100 p-8 flex flex-col gap-8 sm:h-screen sm:sticky sm:top-0">
        <Logo width={200} height={60} />
        <ListSidebar activeListId="" onListSelect={() => {}} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-[#1A365D]">Catalogue Produits</h1>
            <p className="text-gray-500">Gérez le référentiel global de vos articles.</p>
          </div>

          {/* Barre de recherche */}
          <div className="relative group max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF6B35] transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou code-barres..."
              className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] shadow-sm text-[#1A365D] font-medium transition-all"
            />
          </div>

          {/* Liste des produits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <p className="col-span-full text-center py-20 text-gray-400 italic animate-pulse">Chargement du catalogue...</p>
            ) : filteredItems.length === 0 ? (
              <p className="col-span-full text-center py-20 text-gray-400 italic">Aucun produit trouvé.</p>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded-full w-fit">
                        {item.categories?.name || 'Sans Rayon'}
                      </span>
                      <h3 className="text-xl font-bold text-[#1A365D]">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditSheet(item)}
                        className="p-2 text-gray-300 hover:text-[#1A365D] hover:bg-gray-50 rounded-xl transition-all"
                        title="Modifier"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    {item.barcode ? (
                      <div className="flex items-center gap-2 text-gray-400 font-mono text-sm bg-gray-50 p-2 rounded-xl border border-gray-100 w-fit">
                        <QrCodeIcon className="w-4 h-4" />
                        {item.barcode}
                      </div>
                    ) : <div />}
                    
                    <div className="flex items-center gap-1 text-gray-300">
                      <TagIcon className="w-4 h-4" />
                      <span className="text-xs font-bold">{item.usage_count}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Sheet */}
          <Sheet open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
            <SheetContent side="right" className="w-full sm:max-w-[450px] p-10">
              <SheetHeader className="mb-10 text-left">
                <SheetTitle className="text-3xl font-black text-[#1A365D]">Modifier le produit</SheetTitle>
                <SheetDescription className="text-base text-gray-500 mt-2">
                  Mettez à jour les informations globales de cet article dans le catalogue.
                </SheetDescription>
              </SheetHeader>
              
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs font-black text-gray-400 uppercase tracking-widest">Nom du produit</Label>
                  <Input 
                    id="edit-name" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="text-lg font-bold text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-barcode" className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                    Code-barres
                    <button type="button" className="text-[#FF6B35] hover:underline flex items-center gap-1" onClick={() => {
                      const bc = prompt("Scannez le code (Simulation) :");
                      if(bc) setEditBarcode(bc);
                    }}>
                      <QrCodeIcon className="w-3 h-3" /> Scanner
                    </button>
                  </Label>
                  <Input 
                    id="edit-barcode" 
                    value={editBarcode} 
                    onChange={(e) => setEditBarcode(e.target.value)} 
                    placeholder="Ex: 3017620422003"
                    className="font-mono text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
                  />
                </div>

                <SheetFooter className="mt-8 pt-4 sm:justify-start">
                  <Button type="submit" disabled={isUpdating} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl">
                    {isUpdating ? 'Mise à jour...' : 'Enregistrer les modifications'}
                  </Button>
                </SheetFooter>
              </form>
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
