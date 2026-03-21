"use client";

import React, { useState, useMemo } from 'react';
import { CheckCircleIcon, ShoppingCartIcon, TagIcon, ChevronRightIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface ListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  is_checked: boolean;
  quantity: number;
}

const MOCK_ITEMS: ListItem[] = [
  { id: '1', name: 'Lait demi-écrémé', category: 'Produits Laitiers', price: 1.2, is_checked: false, quantity: 2 },
  { id: '2', name: 'Beurre doux', category: 'Produits Laitiers', price: 2.5, is_checked: true, quantity: 1 },
  { id: '3', name: 'Pommes Gala', category: 'Fruits & Légumes', price: 3.5, is_checked: false, quantity: 1 },
  { id: '4', name: 'Laitue', category: 'Fruits & Légumes', price: 1.1, is_checked: false, quantity: 1 },
  { id: '5', name: 'Eau minérale 6x1.5L', category: 'Boissons', price: 4.8, is_checked: false, quantity: 2 },
  { id: '6', name: 'Pâtes Penne', category: 'Épicerie', price: 0.9, is_checked: false, quantity: 3 },
];

export const ShoppingList: React.FC = () => {
  const [items, setItems] = useState<ListItem[]>(MOCK_ITEMS);
  const [isShoppingMode, setIsShoppingMode] = useState(false);

  const toggleCheck = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, is_checked: !item.is_checked } : item
    ));
  };

  const updatePrice = (id: string, price: string) => {
    const newPrice = parseFloat(price) || 0;
    setItems(items.map(item => 
      item.id === id ? { ...item, price: newPrice } : item
    ));
  };

  // Tri intelligent par rayon
  const groupedItems = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const totalBudget = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  const checkedTotal = useMemo(() => {
    return items.filter(i => i.is_checked).reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  return (
    <div className={`w-full max-w-2xl transition-all duration-300 ${isShoppingMode ? 'fixed inset-0 bg-white z-[100] p-6 overflow-y-auto' : 'mt-8'}`}>
      
      {/* Header Mode Shopping */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`font-bold text-[#1A365D] ${isShoppingMode ? 'text-3xl' : 'text-xl'}`}>
          Ma liste "Hop!"
        </h2>
        <button 
          onClick={() => setIsShoppingMode(!isShoppingMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md ${
            isShoppingMode ? 'bg-[#1A365D] text-white' : 'bg-gray-100 text-[#1A365D] hover:bg-gray-200'
          }`}
        >
          {isShoppingMode ? <ChevronRightIcon className="w-5 h-5 rotate-180" /> : <ShoppingCartIcon className="w-5 h-5" />}
          {isShoppingMode ? 'Quitter' : 'Mode Shopping'}
        </button>
      </div>

      {/* Budget Express */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-center justify-between border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF6B35]/10 rounded-xl">
            <TagIcon className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Budget estimé</p>
            <p className="text-xl font-black text-[#1A365D]">{totalBudget.toFixed(2)} €</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Déjà coché</p>
          <p className="text-lg font-bold text-[#FF6B35]">{checkedTotal.toFixed(2)} €</p>
        </div>
      </div>

      {/* Rendu des articles par rayon */}
      <div className="space-y-8">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-gray-200" />
              {category}
            </h3>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    item.is_checked 
                      ? 'bg-gray-50 border-transparent opacity-60' 
                      : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                  } ${isShoppingMode ? 'p-6' : ''}`}
                >
                  <button className="flex-shrink-0">
                    {item.is_checked ? (
                      <CheckCircleSolidIcon className="w-8 h-8 text-[#FF6B35]" />
                    ) : (
                      <CheckCircleIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isShoppingMode ? 'text-xl' : 'text-base'} ${item.is_checked ? 'line-through' : 'text-[#1A365D]'}`}>
                      {item.name}
                      {item.quantity > 1 && <span className="ml-2 text-sm opacity-60">x{item.quantity}</span>}
                    </p>
                  </div>

                  {!isShoppingMode && (
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="number"
                        step="0.01"
                        value={item.price || ''}
                        onChange={(e) => updatePrice(item.id, e.target.value)}
                        placeholder="0.00"
                        className="w-16 bg-transparent text-right font-bold text-[#1A365D] outline-none text-sm"
                      />
                      <span className="text-xs font-bold text-gray-400">€</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mode Shopping : Bouton de fin */}
      {isShoppingMode && (
        <div className="fixed bottom-6 left-6 right-6">
          <button 
            onClick={() => setIsShoppingMode(false)}
            className="w-full bg-[#FF6B35] text-white py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Terminer les courses
          </button>
        </div>
      )}
    </div>
  );
};
