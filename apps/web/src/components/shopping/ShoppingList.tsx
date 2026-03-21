"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircleIcon, ShoppingCartIcon, TagIcon, ChevronRightIcon, MinusIcon, PlusIcon, QrCodeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon, QrCodeIcon as QrCodeSolidIcon } from '@heroicons/react/24/solid';
import { fetchApi } from '@/lib/api';
import { useSupabase } from '@/hooks/useSupabase';

interface ListItem {
  id: string;
  is_checked: boolean;
  quantity: number;
  price: number;
  unit?: string;
  name?: string;
  items_catalog: any;
}

interface ShoppingListProps {
  listId: string;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ listId }) => {
  const supabase = useSupabase();
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

    const channel = supabase
      .channel(`shopping_list_${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `list_id=eq.${listId}`,
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, supabase]);

  const getCatalogInfo = (item: ListItem) => {
    const catalog = Array.isArray(item.items_catalog) ? item.items_catalog[0] : item.items_catalog;
    return {
      name: catalog?.name || item.name || 'Inconnu',
      barcode: catalog?.barcode,
      category: catalog?.categories,
      unit: item.unit || catalog?.unit || 'pcs'
    };
  };

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

  const handleDeleteItem = async (id: string) => {
    try {
      setItems(prev => prev.filter(item => item.id !== id));
      await fetchApi(`/shopping-lists/items/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
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

  const handleUnitUpdate = async (id: string, currentUnit: string) => {
    const newUnit = prompt("Modifier l'unité (ex: brique, pack de 6, kg) :", currentUnit);
    if (newUnit === null || newUnit === currentUnit) return;

    try {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, unit: newUnit } : item
      ));
      await fetchApi(`/shopping-lists/items/${id}/unit`, {
        method: 'PATCH',
        body: JSON.stringify({ unit: newUnit }),
      });
    } catch (error) {
      console.error('Failed to update unit:', error);
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
      fetchItems();
    } catch (error) {
      console.error('Failed to update barcode:', error);
      fetchItems();
    }
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, { items: ListItem[]; order: number }> = {};
    items.forEach(item => {
      const { category } = getCatalogInfo(item);
      const categoryName = category?.name || 'Inconnu';
      const categoryOrder = category?.sort_order ?? 999;
      
      if (!groups[categoryName]) {
        groups[categoryName] = { items: [], order: categoryOrder };
      }
      groups[categoryName].items.push(item);
    });
    
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
      
      <div className="flex items-center justify-between mb-6 text-[#1A365D]">
        <h2 className={`font-bold ${isShoppingMode ? 'text-3xl' : 'text-xl'}`}>
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

      <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-center justify-between border border-gray-100 text-[#1A365D]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF6B35]/10 rounded-xl">
            <TagIcon className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Budget estimé</p>
            <p className="text-xl font-black">{totalBudget.toFixed(2)} €</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Déjà coché</p>
          <p className="text-lg font-bold text-[#FF6B35]">{checkedTotal.toFixed(2)} €</p>
        </div>
      </div>

      <div className="space-y-8 text-[#1A365D]">
        {items.length === 0 ? (
          <div className="text-center py-12 opacity-40 italic">Votre liste est vide. Ajoutez un article ci-dessus ! 🚀</div>
        ) : (
          groupedItems.map(([category, { items: categoryItems }]) => (
            <div key={category} className="space-y-3 text-left">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-[#FF6B35]" />
                Rayon : {category}
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const { name, barcode, unit } = getCatalogInfo(item);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleCheck(item.id, item.is_checked)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group/item ${
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
                      
                      <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold truncate ${isShoppingMode ? 'text-xl' : 'text-base'} ${item.is_checked ? 'line-through text-gray-400' : 'text-[#1A365D]'}`}>
                            {name}
                          </p>
                          {!isShoppingMode && barcode && (
                            <div className="p-1 rounded-md text-[#FF6B35] bg-[#FF6B35]/10">
                              <QrCodeSolidIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 bg-gray-100/50 px-2 py-0.5 rounded-lg border border-gray-100">
                            <button 
                              onClick={() => handleQuantityUpdate(item.id, item.quantity, -1)}
                              className="p-1 hover:bg-white rounded-md text-gray-400 transition-colors"
                            >
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-black min-w-[20px] text-center">
                              {item.quantity || 1}
                            </span>
                            <button 
                              onClick={() => handleQuantityUpdate(item.id, item.quantity, 1)}
                              className="p-1 hover:bg-white rounded-md text-gray-400 transition-colors"
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => handleUnitUpdate(item.id, unit)}
                            className="text-[10px] font-black uppercase text-gray-400 tracking-wider hover:text-[#FF6B35] transition-colors"
                          >
                            {unit}
                          </button>
                        </div>
                      </div>

                      {!isShoppingMode && (
                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
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
                              className="w-16 bg-transparent text-right font-bold outline-none text-sm"
                            />
                            <span className="text-xs font-bold text-gray-400">€</span>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/item:opacity-100"
                            title="Supprimer de la liste"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {isShoppingMode && (
                        <div className={`text-xl font-bold ${item.is_checked ? 'text-gray-300' : ''}`}>
                          {(Number(item.price) * (item.quantity || 1)).toFixed(2)} €
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {isShoppingMode && (
        <div className="fixed bottom-6 left-6 right-6 text-[#1A365D]">
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
