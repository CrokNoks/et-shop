"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircleIcon, ShoppingCartIcon, TagIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { fetchApi } from '@/lib/api';

interface ListItem {
  id: string;
  name: string;
  categories?: { name: string };
  price: number;
  is_checked: boolean;
  quantity: number;
}

interface ShoppingListProps {
  listId: string;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ listId }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const data = await fetchApi(`/shopping-lists/${listId}`);
      setItems(data.shopping_list_items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
  }, [listId]);

  const toggleCheck = async (id: string, currentChecked: boolean) => {
    try {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_checked: !currentChecked } : item
      ));
      await fetchApi(`/shopping-lists/items/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isChecked: !currentChecked }),
      });
    } catch (error) {
      console.error('Failed to toggle item:', error);
      fetchItems();
    }
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    items.forEach(item => {
      const category = item.categories?.name || 'Inconnu';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [items]);

  const totalBudget = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
  }, [items]);

  const checkedTotal = useMemo(() => {
    return items.filter(i => i.is_checked).reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
  }, [items]);

  if (isLoading && items.length === 0) {
    return <div className="p-8 text-center text-[#1A365D] animate-pulse">Chargement de votre liste...</div>;
  }

  return (
    <div className={`w-full max-w-2xl transition-all duration-300 ${isShoppingMode ? 'fixed inset-0 bg-white z-[100] p-6 overflow-y-auto' : 'mt-8'}`}>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className={`font-bold text-[#1A365D] ${isShoppingMode ? 'text-3xl' : 'text-xl'}`}>
          Ma liste active
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

      <div className="space-y-8">
        {items.length === 0 ? (
          <div className="text-center py-12 opacity-40 italic">Votre liste est vide. Ajoutez un article ci-dessus ! 🚀</div>
        ) : (
          Object.entries(groupedItems).sort().map(([category, categoryItems]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-[#FF6B35]" />
                Rayon : {category}
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => toggleCheck(item.id, item.is_checked)}
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
                        {(item.quantity > 1) && <span className="ml-2 text-sm opacity-60">x{item.quantity}</span>}
                      </p>
                    </div>

                    <div className="text-sm font-bold text-gray-400">
                      {Number(item.price).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

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
