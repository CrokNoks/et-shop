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
}

export const HopInput: React.FC<HopInputProps> = ({ listId, onItemAdded }) => {
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
      await fetchApi(`/shopping-lists/${listId}/items`, {
        method: "POST",
        body: JSON.stringify({
          name,
          quantity,
          unit,
          barcode,
          category_id,
          store_id,
        }),
      });
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
    const SpeechRecognition =
      (
        window as {
          SpeechRecognition?: new () => SpeechRecognition;
          webkitSpeechRecognition?: new () => SpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as {
          SpeechRecognition?: new () => SpeechRecognition;
          webkitSpeechRecognition?: new () => SpeechRecognition;
        }
      ).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Navigateur non supporté.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setInputValue(event.results[0][0].transcript);
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
    <div className="w-full max-w-lg relative group">
      <div
        className={`flex items-center flex-nowrap gap-1 p-1.5 sm:p-2 bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 ${isListening ? "border-[#FF6B35] animate-pulse" : "border-transparent focus-within:border-[#FF6B35]"}`}
      >
        <input
          ref={inputRef}
          data-cy="hop-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isListening ? "Écoute..." : "Ajouter un article..."}
          className="flex-1 min-w-0 px-2 sm:px-3 py-2 text-base sm:text-lg outline-none text-[#1A365D] bg-transparent"
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
            className={`p-1.5 sm:p-2 rounded-full transition-colors ${isListening ? "bg-[#FF6B35] text-white" : "hover:bg-gray-100 text-gray-500"}`}
            title="Dictée Vocale"
          >
            <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => setIsBarcodeSheetOpen(true)}
            data-cy="hop-barcode"
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            title="Scanner un code-barres"
          >
            <QrCodeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
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
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 group/item"
            >
              <div className="flex flex-col">
                <span className="font-medium text-[#1A365D] group-hover/item:text-[#FF6B35] transition-colors">
                  {item.name}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  {item.stores?.name || "Sans magasin"}
                </span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider">
                {item.categories?.name || "Inconnu"}
              </span>
            </button>
          ))}
          <button
            onClick={openCreateSheet}
            data-cy="hop-create-product"
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-[#FF6B35]/10 text-[#FF6B35] text-left transition-colors font-bold"
          >
            <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
            <span>
              Créer le produit {'"'}
              {inputValue}
              {'"'}
            </span>
          </button>
        </div>
      )}

      {/* Create Product Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]"
        >
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">
              Créer un produit
            </SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
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
          side="right"
          className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]"
        >
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">
              Scanner un produit
            </SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              Saisissez le code-barres pour ajouter instantanément
              l&apos;article.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleBarcodeSubmit}
            className="space-y-8 text-[#1A365D]"
          >
            <div className="space-y-2 text-left">
              <Label
                htmlFor="scan-barcode"
                className="text-xs font-black text-gray-400 uppercase tracking-widest"
              >
                Code-barres
              </Label>
              <Input
                id="scan-barcode"
                data-cy="barcode-input"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                placeholder="Ex: 3017620422003"
                className="text-lg font-bold border-gray-200 focus-visible:ring-[#FF6B35] font-mono"
                required
                autoFocus
              />
            </div>
            <SheetFooter className="mt-8 pt-4 sm:justify-start">
              <Button
                type="submit"
                data-cy="barcode-submit"
                disabled={isAdding}
                className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl"
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
