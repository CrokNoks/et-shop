"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircleIcon, ShoppingCartIcon, TagIcon, ChevronRightIcon, MinusIcon, PlusIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon, QrCodeIcon as QrCodeSolidIcon } from '@heroicons/react/24/solid';
import { fetchApi } from '@/lib/api';

interface ListItem {
  id: string;
  name: string;
  categories?: { name: string; sort_order: number };
  price: number;
  is_checked: boolean;
  quantity: number;
  barcode?: string;
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

  const handlePriceUpdate = async (id: string, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    try {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, price } : item
      ));
      await fetchApi(`/shopping-lists/items/${id}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ price }),
      });
    } catch (error) {
      console.error('Failed to update price:', error);
      fetchItems();
    }
  };

  const handleQuantityUpdate = async (id: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    if (newQuantity === currentQuantity) return;
    try {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
      await fetchApi(`/shopping-lists/items/${id}/quantity`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch (error) {
      console.error('Failed to update quantity:', error);
      fetchItems();
    }
  };

  const handleBarcodeUpdate = async (id: string) => {
    const barcode = prompt("Scannez ou entrez le code-barres pour cet article :");
    if (barcode === null) return;

    try {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, barcode } : item
      ));
      await fetchApi(`/shopping-lists/items/${id}/barcode`, {
        method: 'PATCH',
        body: JSON.stringify({ barcode }),
      });
    } catch (error) {
      console.error('Failed to update barcode:', error);
      fetchItems();
    }
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, { items: ListItem[]; order: number }> = {};
    items.forEach(item => {
      const categoryName = item.categories?.name || 'Inconnu';
      const categoryOrder = item.categories?.sort_order ?? 999;
      
      if (!groups[categoryName]) {
        groups[categoryName] = { items: [], order: categoryOrder };
      }
      groups[categoryName].items.push(item);
    });
    
    // Sort groups by order
    return Object.entries(groups).sort((a, b) => a[1].order - b[1].order);
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
          groupedItems.map(([category, { items: categoryItems }]) => (
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
                        ? 'bg-gray-50/50 border-transparent' 
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
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold truncate ${isShoppingMode ? 'text-xl' : 'text-base'} ${item.is_checked ? 'line-through text-gray-400' : 'text-[#1A365D]'}`}>
                          {item.name}
                        </p>
                        {!isShoppingMode && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleBarcodeUpdate(item.id); }}
                            className={`p-1 rounded-md transition-colors ${item.barcode ? 'text-[#FF6B35] bg-[#FF6B35]/10' : 'text-gray-300 hover:bg-gray-100'}`}
                            title={item.barcode ? `Code-barres : ${item.barcode}` : "Associer un code-barres"}
                          >
                            {item.barcode ? <QrCodeSolidIcon className="w-4 h-4" /> : <QrCodeIcon className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleQuantityUpdate(item.id, item.quantity, -1)}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400"
                        >
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-black text-[#1A365D] min-w-[20px] text-center">
                          {item.quantity || 1}
                        </span>
                        <button 
                          onClick={() => handleQuantityUpdate(item.id, item.quantity, 1)}
                          className="p-1 hover:bg-gray-100 rounded-md text-gray-400"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {!isShoppingMode && (
                      <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="number"
                          step="0.01"
                          defaultValue={item.price || ''}
                          onBlur={(e) => handlePriceUpdate(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handlePriceUpdate(item.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="0.00"
                          className="w-16 bg-transparent text-right font-bold text-[#1A365D] outline-none text-sm"
                        />
                        <span className="text-xs font-bold text-gray-400">€</span>
                      </div>
                    )}

                    {isShoppingMode && (
                      <div className={`text-xl font-bold ${item.is_checked ? 'text-gray-300' : 'text-[#1A365D]'}`}>
                        {(Number(item.price) * (item.quantity || 1)).toFixed(2)} €
                      </div>
                    )}
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
