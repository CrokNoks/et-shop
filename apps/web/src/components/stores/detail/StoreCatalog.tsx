"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { CatalogSearch } from "@/components/catalog/CatalogSearch";
import { CatalogItemCard } from "@/components/catalog/CatalogItemCard";
import { ProductForm } from "@/components/shopping/ProductForm";
import { ProductPurchaseHistory } from "@/components/purchases/ProductPurchaseHistory";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, CatalogItem } from "@/types";
import { CatalogImportWizard } from "@/components/catalog/CatalogImportWizard";
import { useStores } from "@/hooks/useStores";
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
import { SortableCatalogItem } from "@/components/stores/SortableCatalogItem";

interface StoreCatalogProps {
  storeId: string;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({ storeId }) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Form state (Edit & Create)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Magasin du produit dans le formulaire — distinct de `storeId` (le magasin
  // de LA PAGE) pour permettre de déplacer un produit vers un autre magasin.
  const [formStoreId, setFormStoreId] = useState(storeId);
  const [formCategories, setFormCategories] = useState<Category[]>([]);
  const { data: allStores = [] } = useStores();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Un changement explicite de magasin dans le formulaire réinitialise le
  // rayon : celui déjà sélectionné appartient à l'ancien magasin.
  const handleFormStoreChange = (id: string | null) => {
    setFormStoreId(id || storeId);
    setCategoryId(null);
  };

  useEffect(() => {
    if (!isSheetOpen) return;
    fetchApi(`/shopping-lists/categories?storeId=${formStoreId}`)
      .then((data) => setFormCategories(data || []))
      .catch((error) =>
        console.error("Failed to fetch form categories:", error),
      );
  }, [formStoreId, isSheetOpen]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catalogData, categoriesData] = await Promise.all([
        fetchApi(`/shopping-lists/catalog?storeId=${storeId}`),
        fetchApi(`/shopping-lists/categories?storeId=${storeId}`),
      ]);
      setItems(catalogData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Failed to fetch catalog data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName("");
    setBarcode("");
    setUnit("pcs");
    setCategoryId(null);
    setFormStoreId(storeId);
    setIsSheetOpen(true);
  };

  const openEditSheet = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setBarcode(item.barcode || "");
    setUnit(item.unit || "pcs");
    setCategoryId(item.category_id || null);
    setFormStoreId(item.store_id);
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
        store_id: formStoreId,
      };

      if (editingItem) {
        await fetchApi(`/shopping-lists/catalog/${editingItem.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Produit mis à jour !");
      } else {
        await fetchApi("/shopping-lists/catalog", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Produit ajouté au catalogue !");
      }
      fetchData();
      setIsSheetOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit du catalogue ?")) return;
    try {
      await fetchApi(`/shopping-lists/catalog/${id}`, { method: "DELETE" });
      setItems(items.filter((item) => item.id !== id));
      toast.success("Produit supprimé.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleBulkUpdateCategory = async () => {
    if (!bulkCategoryId || selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await fetchApi("/shopping-lists/catalog/bulk-category", {
        method: "PATCH",
        body: JSON.stringify({ ids: selectedIds, category_id: bulkCategoryId }),
      });
      toast.success(`${selectedIds.length} produits mis à jour !`);
      setSelectedIds([]);
      setBulkCategoryId(null);
      fetchData();
    } catch {
      toast.error("Erreur lors de la mise à jour groupée.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.includes(searchQuery),
    );
  }, [items, searchQuery]);

  // Une recherche active désactive le drag-and-drop : l'ordre visible d'un
  // sous-ensemble filtré ne représente plus l'ordre réel et complet du rayon.
  const isDragDisabled = searchQuery.trim().length > 0;

  // Groupe les produits par rayon, dans l'ordre déjà défini par
  // `categories` (trié par `sort_order` côté backend, cf. `findAllCategories`).
  // Un produit dont le `category_id` ne correspond à aucun rayon connu
  // (rayon supprimé) retombe dans "Sans rayon", comme le fait déjà
  // `CatalogItemCard` pour son badge.
  const groupedByCategory = useMemo(() => {
    const knownCategoryIds = new Set(categories.map((c) => c.id));
    const byCategoryId = new Map<string, CatalogItem[]>();
    const orphanItems: CatalogItem[] = [];

    filteredItems.forEach((item) => {
      if (item.category_id && knownCategoryIds.has(item.category_id)) {
        if (!byCategoryId.has(item.category_id)) {
          byCategoryId.set(item.category_id, []);
        }
        byCategoryId.get(item.category_id)!.push(item);
      } else {
        orphanItems.push(item);
      }
    });

    const groups = categories
      .map((category) => ({
        category,
        items: (byCategoryId.get(category.id) || [])
          .slice()
          .sort((a, b) => {
            const diff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
            return diff !== 0 ? diff : a.name.localeCompare(b.name);
          }),
      }))
      .filter((group) => group.items.length > 0);

    const withoutCategory = orphanItems
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    return { groups, withoutCategory };
  }, [filteredItems, categories]);

  const handleCategoryDragEnd =
    (groupCategoryId: string, categoryItems: CatalogItem[]) =>
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = categoryItems.findIndex((item) => item.id === active.id);
      const newIndex = categoryItems.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(categoryItems, oldIndex, newIndex).map(
        (item, idx) => ({ ...item, sort_order: idx + 1 }),
      );
      const reorderedById = new Map(reordered.map((item) => [item.id, item]));
      setItems((prev) =>
        prev.map((item) => reorderedById.get(item.id) || item),
      );

      try {
        await fetchApi("/shopping-lists/catalog/order", {
          method: "PUT",
          body: JSON.stringify({
            categoryId: groupCategoryId,
            orders: reordered.map((o) => ({
              itemId: o.id,
              sortOrder: o.sort_order,
            })),
          }),
        });
      } catch {
        toast.error("Erreur lors de l'enregistrement de l'ordre.");
        fetchData(); // Revert on error
      }
    };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-[var(--es-secondary)]">
          Catalogue · {items.length} produit{items.length > 1 ? "s" : ""}
        </p>
        <div className="flex shrink-0 gap-2">
          <CatalogImportWizard onImported={fetchData} storeId={storeId} />
          <button
            onClick={handleOpenCreate}
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#FF6B35] px-3 text-[13px] font-semibold text-[var(--es-accent-text)]"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
            Nouveau
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <CatalogSearch value={searchQuery} onChange={setSearchQuery} />

        {selectedIds.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[rgba(255,107,53,0.35)] bg-[rgba(255,107,53,0.06)] p-4 animate-in fade-in slide-in-from-top-4 md:flex-row">
            <p className="font-semibold text-[var(--es-accent-text)]">
              {selectedIds.length} article(s) sélectionné(s)
            </p>
            <div className="flex w-full items-center gap-3 md:w-auto">
              <Select
                value={bulkCategoryId || ""}
                onValueChange={(val) => setBulkCategoryId(val || null)}
              >
                <SelectTrigger className="min-w-[200px] rounded-xl border-[rgba(255,107,53,0.35)] bg-[var(--es-surface)] font-medium text-[var(--es-ink)]">
                  <SelectValue placeholder="Assigner à un rayon...">
                    {bulkCategoryId &&
                    categories.find((c) => c.id === bulkCategoryId) ? (
                      <div className="flex items-center gap-2">
                        <span>
                          {
                            categories.find((c) => c.id === bulkCategoryId)
                              ?.icon
                          }
                        </span>
                        <span>
                          {
                            categories.find((c) => c.id === bulkCategoryId)
                              ?.name
                          }
                        </span>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="text-[var(--es-ink)]">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="font-medium"
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkUpdateCategory}
                disabled={!bulkCategoryId || isBulkUpdating}
                className="rounded-xl bg-[#FF6B35] font-semibold text-white hover:bg-[#e55a2b]"
              >
                {isBulkUpdating ? "..." : "Appliquer"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="font-semibold text-[var(--es-secondary)] hover:text-[var(--es-ink)]"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {isLoading ? (
            <p className="animate-pulse py-20 text-center italic text-[var(--es-tertiary)]">
              Chargement...
            </p>
          ) : filteredItems.length === 0 ? (
            <p className="py-20 text-center italic text-[var(--es-tertiary)]">
              Aucun produit trouvé.
            </p>
          ) : (
            <>
              {groupedByCategory.groups.map(({ category, items: categoryItems }) => (
                <div key={category.id} className="flex flex-col gap-2">
                  <h4 className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[var(--es-secondary)]">
                    <span>{category.icon || "📦"}</span>
                    {category.name}
                  </h4>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleCategoryDragEnd(category.id, categoryItems)}
                  >
                    <SortableContext
                      items={categoryItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2">
                        {categoryItems.map((item) => (
                          <SortableCatalogItem
                            key={item.id}
                            item={item}
                            dragDisabled={isDragDisabled}
                            isSelected={selectedIds.includes(item.id)}
                            onSelect={(selected) => {
                              setSelectedIds((prev) =>
                                selected
                                  ? [...prev, item.id]
                                  : prev.filter((id) => id !== item.id),
                              );
                            }}
                            onEdit={() => openEditSheet(item)}
                            onDelete={() => handleDelete(item.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ))}

              {groupedByCategory.withoutCategory.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="px-1 text-[13px] font-semibold text-[var(--es-secondary)]">
                    Sans rayon
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {groupedByCategory.withoutCategory.map((item) => (
                      <CatalogItemCard
                        key={item.id}
                        item={item}
                        onEdit={() => openEditSheet(item)}
                        onDelete={() => handleDelete(item.id)}
                        isSelected={selectedIds.includes(item.id)}
                        onSelect={(selected) => {
                          setSelectedIds((prev) =>
                            selected
                              ? [...prev, item.id]
                              : prev.filter((id) => id !== item.id),
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] bg-[var(--es-surface)] p-6 pt-3 text-[var(--es-ink)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="mb-6 p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              {editingItem ? "Modifier le produit" : "Nouveau produit"}
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
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
            categories={formCategories}
            stores={allStores}
            storeId={formStoreId}
            setStoreId={handleFormStoreChange}
            isSubmitting={isSubmitting}
            submitLabel={editingItem ? "Mettre à jour" : "Ajouter au catalogue"}
            onSubmit={handleSubmit}
          />

          {editingItem && (
            <div className="mt-10">
              <ProductPurchaseHistory
                catalogItemId={editingItem.id}
                productName={editingItem.name}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
