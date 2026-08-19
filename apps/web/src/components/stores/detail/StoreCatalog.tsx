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
    setIsSheetOpen(true);
  };

  const openEditSheet = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setBarcode(item.barcode || "");
    setUnit(item.unit || "pcs");
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
        store_id: storeId,
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
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <p className="col-span-full animate-pulse py-20 text-center italic text-[var(--es-tertiary)]">
              Chargement...
            </p>
          ) : filteredItems.length === 0 ? (
            <p className="col-span-full py-20 text-center italic text-[var(--es-tertiary)]">
              Aucun produit trouvé.
            </p>
          ) : (
            filteredItems.map((item) => (
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
            ))
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
            categories={categories}
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
