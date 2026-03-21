"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MicrophoneIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { fetchApi } from '@/lib/api';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length > 1) {
        try {
          const data = await fetchApi(`/shopping-lists/suggest/${inputValue}`);
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
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

  const handleAdd = async (name: string) => {
    if (!name || isAdding) return;
    setIsAdding(true);
    try {
      await fetchApi(`/shopping-lists/${listId}/items`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setInputValue('');
      setShowSuggestions(false);
      onItemAdded?.();
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add item:', error);
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
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Scanner">
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
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 group/item"
            >
              <span className="font-medium text-[#1A365D] group-hover/item:text-[#FF6B35] transition-colors">
                {item.name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider">
                {item.categories?.name || 'Inconnu'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
