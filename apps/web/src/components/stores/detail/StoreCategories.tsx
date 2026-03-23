"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { Category, StoreCategoryOrder } from '@/types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableCategoryItem } from '@/components/stores/SortableCategoryItem';

interface StoreCategoriesProps {
  storeId: string;
}

export const StoreCategories: React.FC<StoreCategoriesProps> = ({ storeId }) => {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi(`/shopping-lists/categories?storeId=${storeId}`);
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [storeId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(categories, oldIndex, newIndex);
      const updatedItems = newItems.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
      setCategories(updatedItems);

      // Save to backend
      try {
        await fetchApi(`/stores/${storeId}/categories`, {
          method: 'PUT',
          body: JSON.stringify({
            orders: updatedItems.map(o => ({ categoryId: o.id, sortOrder: o.sort_order }))
          }),
        });
      } catch (error) {
        toast.error("Erreur lors de l'enregistrement de l'ordre.");
        fetchCategories(); // Revert on error
      }
    }
  };

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
      const payload = { name, icon: icon || '📦', sort_order: sortOrder, store_id: storeId };
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
          toast.error("Aucune donnée valide trouvée.");
          return;
        }

        try {
          setIsLoading(true);
          await fetchApi('/shopping-lists/categories/import', {
            method: 'POST',
            body: JSON.stringify({ categories: importedData, store_id: storeId }),
          });
          fetchCategories();
          toast.success(`${importedData.length} rayons importés !`);
        } catch (error) {
          toast.error("Erreur lors de l'importation.");
        } finally {
          setIsLoading(false);
        }
      }
    });
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black">Rayons du magasin</h2>
          <p className="text-gray-500">Définissez l&apos;ordre de passage dans ce magasin.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <Button 
            onClick={() => fileInputRef.current?.click()}
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
          <p className="text-center py-20 text-gray-400 italic animate-pulse">Chargement...</p>
        ) : categories.length === 0 ? (
          <p className="text-center py-20 text-gray-400 italic">Aucun rayon configuré.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="relative group">
                    <SortableCategoryItem 
                      order={{
                        category_id: category.id,
                        store_id: storeId,
                        sort_order: category.sort_order,
                        category: category
                      }} 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(category)} className="p-2 text-gray-400 hover:text-[#1A365D] transition-colors"><PencilIcon className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(category.id, category.name)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]">
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">
              {editingCategory ? 'Modifier le rayon' : 'Nouveau rayon'}
            </SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              Configurez le nom et l&apos;ordre d&apos;affichage de ce rayon.
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
    </div>
  );
};
