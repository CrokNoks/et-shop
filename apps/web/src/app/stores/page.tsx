"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { fetchApi } from '@/lib/api';
import { PencilIcon, TrashIcon, PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Store } from '@/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Store Form state
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isStoreSheetOpen, setIsStoreSheetOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const storesData = await fetchApi('/stores');
      setStores(storesData || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      toast.error("Erreur lors du chargement des magasins.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateStore = () => {
    setEditingStore(null);
    setStoreName('');
    setIsStoreSheetOpen(true);
  };

  const handleOpenEditStore = (e: React.MouseEvent, store: Store) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingStore(store);
    setStoreName(store.name);
    setIsStoreSheetOpen(true);
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingStore) {
        await fetchApi(`/stores/${editingStore.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: storeName }),
        });
        toast.success("Magasin mis à jour !");
      } else {
        await fetchApi('/stores', {
          method: 'POST',
          body: JSON.stringify({ name: storeName }),
        });
        toast.success("Magasin créé !");
      }
      fetchData();
      setIsStoreSheetOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Supprimer le magasin "${name}" ?`)) return;
    try {
      await fetchApi(`/stores/${id}`, { method: 'DELETE' });
      setStores(stores.filter(s => s.id !== id));
      toast.success("Magasin supprimé !");
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 text-left">
              <h1 className="text-4xl font-black">Mes Magasins</h1>
              <p className="text-gray-500">Configurez vos lieux de courses habituels.</p>
            </div>
            <Button 
              onClick={handleOpenCreateStore} 
              className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl px-6 py-6 shadow-lg transition-all border-none"
            >
              <PlusIcon className="w-5 h-5 mr-2" strokeWidth={3} />
              Nouveau Magasin
            </Button>
          </header>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <p className="text-center py-20 text-gray-400 italic animate-pulse">Chargement des magasins...</p>
            ) : stores.length === 0 ? (
              <p className="text-center py-20 text-gray-400 italic">Aucun magasin trouvé.</p>
            ) : (
              stores.map((store) => (
                <Link 
                  key={store.id} 
                  href={`/stores/${store.id}`}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#FF6B35]">
                      <PlusIcon className="w-6 h-6 rotate-45" />
                    </div>
                    <div className="flex flex-col text-left">
                      <h3 className="text-xl font-bold">{store.name}</h3>
                      <p className="text-sm text-gray-400">Gérer les rayons et produits</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleOpenEditStore(e, store)}
                      className="p-3 text-gray-300 hover:text-[#1A365D] hover:bg-gray-50 rounded-2xl transition-all"
                      title="Modifier le nom"
                    >
                      <PencilIcon className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => handleStoreDelete(e, store.id, store.name)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-6 h-6" />
                    </button>
                    <div className="p-3 text-gray-300 group-hover:text-[#FF6B35] transition-all">
                      <ChevronRightIcon className="w-6 h-6" strokeWidth={3} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Store Form Sheet */}
        <Sheet open={isStoreSheetOpen} onOpenChange={setIsStoreSheetOpen}>
          <SheetContent side="right" className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]">
            <SheetHeader className="mb-10 text-left">
              <SheetTitle className="text-3xl font-black">{editingStore ? 'Modifier le magasin' : 'Nouveau magasin'}</SheetTitle>
              <SheetDescription className="text-base text-gray-500 mt-2">
                Entrez le nom de votre magasin habituel.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleStoreSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nom du magasin</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Carrefour Market, Bio c' Bon..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl shadow-lg">
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
