"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MicrophoneIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { fetchApi } from '@/lib/api';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Suggestion {
  name: string;
  categories?: { name: string };
}

interface HopInputProps {
  listId: string;
  onItemAdded?: () => void;
}

export const HopInput: React.FC<HopInputProps> = ({ listId, onItemAdded }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Sheet state for new product creation
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [newProductBarcode, setNewProductBarcode] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length > 1) {
        try {
          const data = await fetchApi(`/shopping-lists/suggest/${inputValue}`);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      } else {
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleAdd = async (name: string, quantity = 1, barcode?: string) => {
    if (!name || isAdding) return;
    setIsAdding(true);
    try {
      await fetchApi(`/shopping-lists/${listId}/items`, {
        method: 'POST',
        body: JSON.stringify({ name, quantity, barcode }),
      });
      
      // Reset main input
      setInputValue('');
      setShowSuggestions(false);
      
      // Reset sheet form if open
      if (isSheetOpen) {
        setIsSheetOpen(false);
        setNewProductName('');
        setNewProductQuantity(1);
        setNewProductBarcode('');
      }

      onItemAdded?.();
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBarcodeScan = async () => {
    const barcode = prompt("Entrez un code-barres (Simulation de scan) :");
    if (!barcode) return;

    setIsAdding(true);
    try {
      await fetchApi(`/shopping-lists/${listId}/barcode`, {
        method: 'POST',
        body: JSON.stringify({ barcode }),
      });
      alert("Produit ajouté via code-barres !");
      onItemAdded?.();
    } catch (error: any) {
      alert(error.message || "Code-barres inconnu dans le catalogue.");
    } finally {
      setIsAdding(false);
    }
  };

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Votre navigateur ne supporte pas la dictée vocale.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setInputValue(result);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const openCreateSheet = () => {
    setNewProductName(inputValue);
    setNewProductQuantity(1);
    setNewProductBarcode('');
    setShowSuggestions(false);
    setIsSheetOpen(true);
  };

  const handleSheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd(newProductName, newProductQuantity, newProductBarcode || undefined);
  };

  return (
    <div className="w-full max-w-lg relative group">
      <div className={`flex items-center gap-2 p-2 bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 ${
        isListening ? 'border-[#FF6B35] animate-pulse' : 'border-transparent focus-within:border-[#FF6B35]'
      }`}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isListening ? "Écoute en cours..." : "Ajouter un article... (ex: Lait)"}
          className="flex-1 px-3 py-2 text-lg outline-none text-[#1A365D]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) handleAdd(inputValue);
          }}
          disabled={isAdding}
        />
        
        <div className="flex items-center gap-1 pr-1">
          <button 
            onClick={startVoiceDictation}
            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-[#FF6B35] text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            title="Dictée Vocale"
          >
            <MicrophoneIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={handleBarcodeScan}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" 
            title="Scanner un code-barres"
          >
            <QrCodeIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={() => handleAdd(inputValue)}
            disabled={!inputValue || isAdding}
            className="p-2 bg-[#FF6B35] text-white rounded-xl hover:bg-[#e55a2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
          >
            <PlusIcon className={`w-6 h-6 ${isAdding ? 'animate-spin' : ''}`} strokeWidth={3} />
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {suggestions.map((item, index) => (
            <button
              key={index}
              onClick={() => handleAdd(item.name)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 group/item"
            >
              <span className="font-medium text-[#1A365D] group-hover/item:text-[#FF6B35] transition-colors">
                {item.name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider">
                {item.categories?.name || 'Inconnu'}
              </span>
            </button>
          ))}
          
          {/* Ligne "+ Créer le produit" toujours visible à la fin */}
          <button
            onClick={openCreateSheet}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-[#FF6B35]/10 text-[#FF6B35] text-left transition-colors font-bold"
          >
            <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
            <span>Créer le produit "{inputValue}"</span>
          </button>
        </div>
      )}

      {/* Sheet Shadcn pour la création avancée */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[450px] p-10">
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black text-[#1A365D]">Créer un produit</SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              Ajoutez les détails du produit pour l'enregistrer dans votre catalogue de manière permanente.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSheetSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black text-gray-400 uppercase tracking-widest">Nom du produit</Label>
              <Input 
                id="name" 
                value={newProductName} 
                onChange={(e) => setNewProductName(e.target.value)} 
                className="text-lg font-bold text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantité par défaut</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1" 
                value={newProductQuantity} 
                onChange={(e) => setNewProductQuantity(parseInt(e.target.value) || 1)} 
                className="text-lg font-bold text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                Code-barres (Optionnel)
                <button type="button" className="text-[#FF6B35] hover:underline flex items-center gap-1" onClick={() => {
                  const bc = prompt("Scannez le code (Simulation) :");
                  if(bc) setNewProductBarcode(bc);
                }}>
                  <QrCodeIcon className="w-3 h-3" /> Scanner
                </button>
              </Label>
              <Input 
                id="barcode" 
                value={newProductBarcode} 
                onChange={(e) => setNewProductBarcode(e.target.value)} 
                placeholder="Ex: 3017620422003"
                className="font-mono text-[#1A365D] border-gray-200 focus-visible:ring-[#FF6B35]"
              />
            </div>

            <SheetFooter className="mt-8 pt-4 sm:justify-start">
              <Button type="submit" disabled={isAdding} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl">
                {isAdding ? 'Ajout...' : 'Créer et ajouter'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
