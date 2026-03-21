"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MicrophoneIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface Suggestion {
  id: string;
  name: string;
  category?: string;
}

export const HopInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulation d'autocomplétion (à lier à Supabase plus tard)
  const allItems: Suggestion[] = [
    { id: '1', name: 'Lait demi-écrémé', category: 'Produits Laitiers' },
    { id: '2', name: 'Lait d\'amande', category: 'Boissons' },
    { id: '3', name: 'Laitue', category: 'Fruits & Légumes' },
    { id: '4', name: 'Pain de mie', category: 'Boulangerie' },
    { id: '5', name: 'Beurre doux', category: 'Produits Laitiers' },
    { id: '6', name: 'Pommes', category: 'Fruits & Légumes' },
  ];

  useEffect(() => {
    if (inputValue.length > 1) {
      const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue]);

  const handleAdd = (name: string) => {
    console.log('Ajout de l\'article :', name);
    // Logique d'ajout ici
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-lg relative group">
      <div className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-lg border-2 border-transparent focus-within:border-[#FF6B35] transition-all duration-200">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ajouter un article... (ex: Lait)"
          className="flex-1 px-3 py-2 text-lg outline-none text-[#1A365D]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) handleAdd(inputValue);
          }}
        />
        
        <div className="flex items-center gap-1 pr-1">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Dictée Vocale">
            <MicrophoneIcon className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Scanner">
            <QrCodeIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={() => handleAdd(inputValue)}
            disabled={!inputValue}
            className="p-2 bg-[#FF6B35] text-white rounded-xl hover:bg-[#e55a2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
          >
            <PlusIcon className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Liste d'autocomplétion "Hop!" */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleAdd(item.name)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 group/item"
            >
              <span className="font-medium text-[#1A365D] group-hover/item:text-[#FF6B35] transition-colors">
                {item.name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider">
                {item.category}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm text-[#1A365D] opacity-60 flex items-center gap-2 px-2 italic">
        <span className="inline-block w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse" />
        Saisie ultra-rapide activée. Tapez, c'est ajouté !
      </p>
    </div>
  );
};
