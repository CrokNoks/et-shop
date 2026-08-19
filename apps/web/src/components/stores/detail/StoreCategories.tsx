"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductForm } from "@/components/shopping/ProductForm";
import Papa from "papaparse";
import { toast } from "sonner";
import { Category } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCategoryItem } from "@/components/stores/SortableCategoryItem";

interface StoreCategoriesProps {
  storeId: string;
}

export const StoreCategories: React.FC<StoreCategoriesProps> = ({
  storeId,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi(
        `/shopping-lists/categories?storeId=${storeId}`,
      );
      setCategories(data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(categories, oldIndex, newIndex);
      const updatedItems = newItems.map((item, idx) => ({
        ...item,
        sort_order: idx + 1,
      }));
      setCategories(updatedItems);

      // Save to backend
      try {
        await fetchApi(`/stores/${storeId}/categories`, {
          method: "PUT",
          body: JSON.stringify({
            orders: updatedItems.map((o) => ({
              categoryId: o.id,
              sortOrder: o.sort_order,
            })),
          }),
        });
      } catch {
        toast.error("Erreur lors de l'enregistrement de l'ordre.");
        fetchCategories(); // Revert on error
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setIcon("📦");
    setSortOrder(
      categories.length > 0
        ? Math.max(...categories.map((c) => c.sort_order)) + 1
        : 1,
    );
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon || "📦");
    setSortOrder(category.sort_order);
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        icon: icon || "📦",
        sort_order: sortOrder,
        store_id: storeId,
      };
      if (editingCategory) {
        await fetchApi(`/shopping-lists/categories/${editingCategory.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/shopping-lists/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      fetchCategories();
      setIsSheetOpen(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Supprimer le rayon "${name}" ? Cela pourrait affecter le tri des produits associés.`,
      )
    )
      return;
    try {
      await fetchApi(`/shopping-lists/categories/${id}`, { method: "DELETE" });
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Rayon supprimé !");
    } catch {
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
        const importedData = results.data
          .map((rawRow: unknown) => {
            const row = rawRow as Record<string, string>;
            return {
              name: row.nom || row.name || row.Nom,
              sort_order:
                parseInt(row.ordre || row.sort_order || row.Ordre) || 0,
              icon: row.icone || row.icon || row.Icone || "📦",
            };
          })
          .filter((cat) => cat.name);

        if (importedData.length === 0) {
          toast.error("Aucune donnée valide trouvée.");
          return;
        }

        try {
          setIsLoading(true);
          await fetchApi("/shopping-lists/categories/import", {
            method: "POST",
            body: JSON.stringify({
              categories: importedData,
              store_id: storeId,
            }),
          });
          fetchCategories();
          toast.success(`${importedData.length} rayons importés !`);
        } catch {
          toast.error("Erreur lors de l'importation.");
        } finally {
          setIsLoading(false);
        }
      },
    });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-[var(--es-secondary)]">
        L&apos;ordre est celui du parcours en magasin et trie automatiquement la
        liste en mode magasin.
      </p>

      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[var(--es-hairline)] px-3 text-[13px] font-semibold text-[var(--es-secondary)]"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          Importer CSV
        </button>
        <button
          onClick={handleOpenCreate}
          data-cy="store-category-new"
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#FF6B35] px-3 text-[13px] font-semibold text-[#c8471c]"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          Nouveau rayon
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <p className="py-16 text-center text-[13px] italic text-[var(--es-tertiary)]">
            Chargement...
          </p>
        ) : categories.length === 0 ? (
          <p className="py-16 text-center text-[13px] italic text-[var(--es-tertiary)]">
            Aucun rayon configuré.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="group flex items-center gap-1"
                  >
                    <div className="min-w-0 flex-1">
                      <SortableCategoryItem
                        order={{
                          category_id: category.id,
                          store_id: storeId,
                          sort_order: category.sort_order,
                          category: category,
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleOpenEdit(category)}
                      data-cy="store-category-edit"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
                    >
                      <PencilIcon className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      data-cy="store-category-delete"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
                    >
                      <TrashIcon className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <button
          onClick={handleOpenCreate}
          className="mt-1 flex h-11 items-center justify-center rounded-[10px] border border-dashed border-[var(--es-hairline)] text-[13px] font-medium text-[var(--es-secondary)]"
        >
          + Ajouter un rayon
        </button>
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              {editingCategory ? "Modifier le rayon" : "Nouveau rayon"}
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
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
