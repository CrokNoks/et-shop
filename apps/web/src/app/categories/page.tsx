"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { fetchApi } from '@/lib/api';
import { PencilIcon, TrashIcon, PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProductForm } from '@/components/shopping/ProductForm';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await fetchApi('/shopping-lists/categories');
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setIcon('📦');
    setSortOrder(categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon || '📦');
    setSortOrder(category.sort_order);
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { name, icon: icon || '📦', sort_order: sortOrder };
      if (editingCategory) {
        await fetchApi(`/shopping-lists/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/shopping-lists/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      fetchCategories();
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le rayon "${name}" ? Cela pourrait affecter le tri des produits associés.`)) return;
    try {
      await fetchApi(`/shopping-lists/categories/${id}`, { method: 'DELETE' });
      setCategories(categories.filter(c => c.id !== id));
      toast.success("Rayon supprimé !");
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importedData = results.data.map((row: any) => ({
          name: row.nom || row.name || row.Nom,
          sort_order: parseInt(row.ordre || row.sort_order || row.Ordre) || 0,
          icon: row.icone || row.icon || row.Icone || '📦'
        })).filter(cat => cat.name);

        if (importedData.length === 0) {
          toast.error("Aucune donnée valide trouvée dans le CSV. Format attendu : nom;ordre;icone");
          return;
        }

        try {
          setIsLoading(true);
          await fetchApi('/shopping-lists/categories/import', {
            method: 'POST',
            body: JSON.stringify({ categories: importedData }),
          });
          fetchCategories();
          toast.success(`${importedData.length} rayons importés avec succès !`);
        } catch (error) {
          toast.error("Erreur lors de l'importation.");
        } finally {
          setIsLoading(false);
        }
      }
    });
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center text-[#1A365D]">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black">Gestion des Rayons</h1>
              <p className="text-gray-500">Personnalisez l'ordre de passage en magasin.</p>
            </div>
            <div className="flex gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
              <Button 
                onClick={handleImportClick}
                variant="outline"
                className="border-gray-200 text-gray-500 font-bold rounded-2xl px-6 py-6 shadow-sm hover:bg-gray-50 transition-all"
              >
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" strokeWidth={2} />
                Importer CSV
              </Button>
              <Button 
                onClick={handleOpenCreate}
                className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl px-6 py-6 shadow-lg transition-all border-none"
              >
                <PlusIcon className="w-5 h-5 mr-2" strokeWidth={3} />
                Nouveau Rayon
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <p className="text-center py-20 text-gray-400 italic animate-pulse">Chargement des rayons...</p>
            ) : categories.length === 0 ? (
              <p className="text-center py-20 text-gray-400 italic">Aucun rayon configuré.</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl">
                      {category.icon || '📦'}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Ordre : {category.sort_order}
                      </span>
                      <h3 className="text-xl font-bold">{category.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEdit(category)}
                      className="p-3 text-gray-300 hover:text-[#1A365D] hover:bg-gray-50 rounded-2xl transition-all"
                      title="Modifier"
                    >
                      <PencilIcon className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id, category.name)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create/Edit Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side="right" className="w-full sm:max-w-[450px] p-10 text-[#1A365D]">
              <SheetHeader className="mb-10 text-left">
                <SheetTitle className="text-3xl font-black">
                  {editingCategory ? 'Modifier le rayon' : 'Nouveau rayon'}
                </SheetTitle>
                <SheetDescription className="text-base text-gray-500 mt-2">
                  Configurez le nom et l'ordre d'affichage de ce rayon en magasin.
                </SheetDescription>
              </SheetHeader>
              
              <ProductForm 
                isCategoryForm={true}
                name={name}
                setName={setName}
                icon={icon}
                setIcon={setIcon}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                isSubmitting={isSubmitting}
                submitLabel={editingCategory ? "Mettre à jour" : "Créer le rayon"}
                onSubmit={handleSubmit}
                barcode=""
                setBarcode={() => {}}
                unit="pcs"
                setUnit={() => {}}
                categoryId=""
                setCategoryId={() => {}}
                categories={[]}
              />
            </SheetContent>
          </Sheet>

          <footer className="mt-auto py-12 flex gap-6 flex-wrap items-center justify-center text-[#1A365D] opacity-40 text-xs text-center">
            <p>© 2026 Et SHop! - Organisez vos rayons intelligemment 🚀</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
