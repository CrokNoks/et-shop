"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MicrophoneIcon,
  QrCodeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
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
import { ProductForm } from "./ProductForm";
import { toast } from "sonner";
import { Category, Store } from "@/types";
import type { AddItemPayload } from "@/lib/offline/db";

interface Suggestion {
  name: string;
  category_id?: string;
  store_id?: string;
  categories?: { name: string };
  stores?: { name: string };
}

interface HopInputProps {
  listId: string;
  onItemAdded?: () => void;
  /**
   * Passe par `useShoppingListItems.addItem` quand fourni : ajout optimiste
   * + mise en file offline si le réseau est indisponible. Repli sur un
   * appel direct à `fetchApi` sinon (compatibilité si le composant est
   * utilisé sans le hook).
   */
  addItem?: (payload: AddItemPayload) => Promise<void>;
}

export const HopInput: React.FC<HopInputProps> = ({
  listId,
  onItemAdded,
  addItem,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Stores and Categories state
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProductStoreId, setNewProductStoreId] = useState<string | null>(
    null,
  );

  // Sheet state for new product creation
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [newProductUnit, setNewProductUnit] = useState("pcs");
  const [newProductBarcode, setNewProductBarcode] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState<
    string | null
  >(null);

  // Barcode Scan Sheet State
  const [isBarcodeSheetOpen, setIsBarcodeSheetOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme les suggestions au clic en dehors du composant (le champ n'est plus
  // dans une feuille modale : rien ne le fait plus automatiquement).
  useEffect(() => {
    if (!showSuggestions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await fetchApi("/stores");
        setStores(data || []);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      }
    };
    fetchStores();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!newProductStoreId) {
        setCategories([]);
        return;
      }
      try {
        const data = await fetchApi(
          `/shopping-lists/categories?storeId=${newProductStoreId}`,
        );
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, [newProductStoreId]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length > 1) {
        try {
          const data = await fetchApi(`/shopping-lists/suggest/${inputValue}`);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Failed to fetch suggestions:", error);
        }
      } else {
        setShowSuggestions(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleAdd = async (
    name: string,
    quantity = 1,
    unit = "pcs",
    barcode?: string,
    category_id?: string,
    store_id?: string,
  ) => {
    if (!name || isAdding) return;
    setIsAdding(true);
    try {
      const payload = { name, quantity, unit, barcode, category_id, store_id };
      if (addItem) {
        await addItem(payload);
      } else {
        await fetchApi(`/shopping-lists/${listId}/items`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setInputValue("");
      setShowSuggestions(false);
      if (isSheetOpen) setIsSheetOpen(false);
      onItemAdded?.();
      inputRef.current?.focus();
    } catch (error: unknown) {
      console.error("Failed to add item:", error);
      const err = error as { message?: string };
      toast.error(err.message || "Erreur lors de l'ajout de l'article");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBarcode || isAdding) return;

    setIsAdding(true);
    try {
      await fetchApi(`/shopping-lists/${listId}/barcode`, {
        method: "POST",
        body: JSON.stringify({ barcode: scannedBarcode }),
      });
      toast.success("Produit ajouté !");
      onItemAdded?.();
      setIsBarcodeSheetOpen(false);
      setScannedBarcode("");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Code-barres inconnu.");
    } finally {
      setIsAdding(false);
    }
  };

  const startVoiceDictation = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor: (new () => any) | undefined =
      w["SpeechRecognition"] ?? w["webkitSpeechRecognition"];
    if (!SpeechRecognitionCtor) {
      toast.error("Navigateur non supporté.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "fr-FR";
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event: {
      results: { [key: number]: { [key: number]: { transcript: string } } };
    }) => {
      setInputValue(String(event.results[0][0].transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const openCreateSheet = () => {
    setNewProductName(inputValue);
    setNewProductQuantity(1);
    setNewProductUnit("pcs");
    setNewProductBarcode("");
    setNewProductCategoryId(null);
    setNewProductStoreId(null);
    setShowSuggestions(false);
    setIsSheetOpen(true);
  };

  return (
    <div ref={containerRef} className="w-full max-w-lg relative group">
      <div
        className={`flex h-12 items-center flex-nowrap gap-1 rounded-[14px] border bg-[var(--es-surface)] px-1.5 transition-all duration-200 ${isListening ? "border-[#FF6B35] bg-[rgba(255,107,53,0.04)] animate-pulse" : "border-[var(--es-hairline)] focus-within:border-[#FF6B35] focus-within:bg-[rgba(255,107,53,0.04)]"}`}
      >
        <input
          ref={inputRef}
          data-cy="hop-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isListening ? "Écoute..." : "Ajouter un article..."}
          className="flex-1 min-w-0 px-2 sm:px-3 py-2 text-[14.5px] font-medium outline-none text-[var(--es-ink)] bg-transparent placeholder:text-[var(--es-tertiary)]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (suggestions.length > 0)
                handleAdd(
                  suggestions[0].name,
                  1,
                  "pcs",
                  undefined,
                  suggestions[0].category_id,
                  suggestions[0].store_id,
                );
              else if (inputValue.trim()) openCreateSheet();
            }
          }}
          disabled={isAdding}
        />
        <div className="flex items-center gap-0.5 sm:gap-1 pr-1">
          <button
            onClick={startVoiceDictation}
            data-cy="hop-voice"
            title="Dictée Vocale"
            className={`flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors ${isListening ? "bg-[#FF6B35] text-white" : "bg-[rgba(255,107,53,0.12)] text-[var(--es-accent-text)]"}`}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsBarcodeSheetOpen(true)}
            data-cy="hop-barcode"
            title="Scanner un code-barres"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
          >
            <QrCodeIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panneau de suggestions (écran 2e/3c) ancré juste au-dessus de la
          barre de saisie plutôt que dans une feuille plein écran séparée :
          le champ `hop-input` reste visible et modifiable en permanence,
          pas besoin de fermer les suggestions pour le retrouver. */}
      {showSuggestions && (
        <div
          role="listbox"
          aria-label="Suggestions"
          className="absolute bottom-full left-0 right-0 z-10 mb-2 max-h-[60vh] overflow-y-auto rounded-[18px] border border-[var(--es-hairline)] bg-[var(--es-surface)] p-2 shadow-[0_-8px_24px_rgba(18,36,63,0.14)]"
        >
          <div className="overflow-hidden rounded-[14px] border border-[var(--es-hairline)]">
            {suggestions.map((item, index) => (
              <button
                key={index}
                data-cy={`hop-suggestion-${index}`}
                onClick={() =>
                  handleAdd(
                    item.name,
                    1,
                    "pcs",
                    undefined,
                    item.category_id,
                    item.store_id,
                  )
                }
                className="flex h-14 w-full items-center justify-between border-b border-[var(--es-hairline)] px-3.5 text-left last:border-b-0 hover:bg-[var(--es-field)]"
              >
                <div className="flex flex-col">
                  <span className="text-[15px] font-medium text-[var(--es-ink)]">
                    {item.name}
                  </span>
                  <span className="text-[11.5px] text-[var(--es-tertiary)]">
                    {[item.categories?.name, item.stores?.name]
                      .filter(Boolean)
                      .join(" · ") || "Sans magasin"}
                  </span>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(255,107,53,0.12)] text-[var(--es-accent-text)]">
                  <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </button>
            ))}
            <button
              onClick={openCreateSheet}
              data-cy="hop-create-product"
              className="flex h-[52px] w-full items-center gap-2 bg-[rgba(255,107,53,0.06)] px-3.5 text-left text-[14px] font-semibold text-[var(--es-accent-text)]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(255,107,53,0.12)]">
                <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span>Créer « {inputValue} » dans mon catalogue</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Product Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="mb-6 p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              Créer un produit
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
              Ajoutez les détails du produit pour l&apos;enregistrer dans votre
              catalogue.
            </SheetDescription>
          </SheetHeader>
          <ProductForm
            name={newProductName}
            setName={setNewProductName}
            quantity={newProductQuantity}
            setQuantity={setNewProductQuantity}
            unit={newProductUnit}
            setUnit={setNewProductUnit}
            barcode={newProductBarcode}
            setBarcode={setNewProductBarcode}
            categoryId={newProductCategoryId}
            setCategoryId={setNewProductCategoryId}
            categories={categories}
            stores={stores}
            storeId={newProductStoreId}
            setStoreId={setNewProductStoreId}
            isSubmitting={isAdding}
            submitLabel="Créer et ajouter"
            showQuantity={true}
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd(
                newProductName,
                newProductQuantity,
                newProductUnit,
                newProductBarcode || undefined,
                newProductCategoryId || undefined,
                newProductStoreId || undefined,
              );
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Barcode Scan Simulation Sheet */}
      <Sheet open={isBarcodeSheetOpen} onOpenChange={setIsBarcodeSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="mb-6 p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              Scanner un produit
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
              Saisissez le code-barres pour ajouter instantanément
              l&apos;article.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleBarcodeSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label
                htmlFor="scan-barcode"
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]"
              >
                Code-barres
              </Label>
              <Input
                id="scan-barcode"
                data-cy="barcode-input"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                placeholder="Ex: 3017620422003"
                className="h-[50px] rounded-[14px] font-mono focus-visible:ring-[#FF6B35]"
                required
                autoFocus
              />
            </div>
            <SheetFooter className="mt-2 p-0 sm:justify-start">
              <Button
                type="submit"
                data-cy="barcode-submit"
                disabled={isAdding}
                className="h-[50px] w-full rounded-[14px] bg-[#FF6B35] text-[15px] font-semibold text-white hover:bg-[#e55a2b]"
              >
                {isAdding ? "Recherche..." : "Ajouter le produit"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
