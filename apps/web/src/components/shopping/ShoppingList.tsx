"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircleIcon, ShoppingCartIcon, TagIcon, ChevronRightIcon, MinusIcon, PlusIcon, QrCodeIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
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
  const [wakeLock, setWakeLock] = useState<any>(null);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${listId}` }, () => fetchItems())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [listId, supabase]);

  // Gestion du Screen Wake Lock pour le mode Shopping
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isShoppingMode) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          setWakeLock(lock);
        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    if (isShoppingMode) {
      requestWakeLock();
    } else {
      if (wakeLock) {
        wakeLock.release();
        setWakeLock(null);
      }
    }

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isShoppingMode]);

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
    if (!currentChecked && 'vibrate' in navigator) {
      navigator.vibrate(50); // Petite vibration lors du cochage
    }
    
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
      await fetchApi(`/shopping-lists/items/${id}`, { method: 'DELETE' });
    } catch (error) {
      fetchItems();
    }
  };

  const handlePriceUpdate = async (id: string, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    try {
      setItems(prev => prev.map(item => item.id === id ? { ...item, price } : item));
      await fetchApi(`/shopping-lists/items/${id}/price`, { method: 'PATCH', body: JSON.stringify({ price }) });
    } catch (error) { fetchItems(); }
  };

  const handleQuantityUpdate = async (id: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    if (newQuantity === currentQuantity) return;
    try {
      setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
      await fetchApi(`/shopping-lists/items/${id}/quantity`, { method: 'PATCH', body: JSON.stringify({ quantity: newQuantity }) });
    } catch (error) { fetchItems(); }
  };

  const handleUnitUpdate = async (id: string, currentUnit: string) => {
    const newUnit = prompt("Modifier l'unité :", currentUnit);
    if (newUnit === null || newUnit === currentUnit) return;
    try {
      setItems(prev => prev.map(item => item.id === id ? { ...item, unit: newUnit } : item));
      await fetchApi(`/shopping-lists/items/${id}/unit`, { method: 'PATCH', body: JSON.stringify({ unit: newUnit }) });
    } catch (error) { fetchItems(); }
  };

  // Groupage intelligent : Sépare les articles restants des articles déjà pris
  const { todoGroups, doneItems } = useMemo(() => {
    const todo: Record<string, { items: ListItem[]; order: number }> = {};
    const done: ListItem[] = [];

    items.forEach(item => {
      if (isShoppingMode && item.is_checked) {
        done.push(item);
      } else {
        const { category } = getCatalogInfo(item);
        const name = category?.name || 'Inconnu';
        const order = category?.sort_order ?? 999;
        if (!todo[name]) todo[name] = { items: [], order };
        todo[name].items.push(item);
      }
    });

    return {
      todoGroups: Object.entries(todo).sort((a, b) => a[1].order - b[1].order),
      doneItems: done
    };
  }, [items, isShoppingMode]);

  const totalBudget = useMemo(() => items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0), [items]);
  const checkedTotal = useMemo(() => items.filter(i => i.is_checked).reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0), [items]);
  const progress = items.length > 0 ? (items.filter(i => i.is_checked).length / items.length) * 100 : 0;

  if (isLoading && items.length === 0) {
    return <div className="p-8 text-center text-[#1A365D] animate-pulse">Chargement...</div>;
  }

  return (
    <div className={`w-full max-w-2xl transition-all duration-300 ${isShoppingMode ? 'fixed inset-0 bg-white z-[100] p-6 pb-32 overflow-y-auto' : 'mt-8'}`}>
      
      {/* Header & Mode Switch */}
      <div className="flex items-center justify-between mb-6 text-[#1A365D]">
        <h2 className={`font-black ${isShoppingMode ? 'text-3xl' : 'text-xl'}`}>
          {isShoppingMode ? '🛒 En magasin' : 'Ma liste active'}
        </h2>
        <button 
          onClick={() => setIsShoppingMode(!isShoppingMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md ${
            isShoppingMode ? 'bg-[#1A365D] text-white' : 'bg-gray-100 text-[#1A365D] hover:bg-gray-200'
          }`}
        >
          {isShoppingMode ? <ChevronRightIcon className="w-5 h-5 rotate-180" /> : <ShoppingCartIcon className="w-5 h-5" />}
          {isShoppingMode ? 'Mode classique' : 'Mode Shopping'}
        </button>
      </div>

      {/* Barre de progression en mode shopping */}
      {isShoppingMode && (
        <div className="w-full h-3 bg-gray-100 rounded-full mb-8 overflow-hidden border border-gray-50">
          <div 
            className="h-full bg-[#FF6B35] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Budget Express */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex items-center justify-between border border-gray-100 text-[#1A365D]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF6B35]/10 rounded-xl">
            <TagIcon className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total estimé</p>
            <p className="text-xl font-black">{totalBudget.toFixed(2)} €</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Dans le panier</p>
          <p className="text-lg font-bold text-[#FF6B35]">{checkedTotal.toFixed(2)} €</p>
        </div>
      </div>

      {/* Liste des articles à acheter (todoGroups) */}
      <div className="space-y-8 text-[#1A365D]">
        {items.length === 0 ? (
          <div className="text-center py-12 opacity-40 italic">Votre liste est vide. Ajoutez un article ! 🚀</div>
        ) : (
          todoGroups.map(([category, { items: categoryItems }]) => (
            <div key={category} className="space-y-3 text-left">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-[#FF6B35]" />
                {category}
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const { name, barcode, unit } = getCatalogInfo(item);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleCheck(item.id, item.is_checked)}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer group/item ${
                        isShoppingMode ? 'p-5 sm:p-6 bg-white border-gray-100 shadow-sm hover:border-[#FF6B35]' : 'bg-white border-gray-100'
                      }`}
                    >
                      <button className="flex-shrink-0">
                        {item.is_checked ? (
                          <CheckCircleSolidIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF6B35]" />
                        ) : (
                          <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-200 group-hover/item:text-[#FF6B35]/30 transition-colors" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                        <p className={`font-bold truncate ${isShoppingMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'} ${item.is_checked ? 'line-through text-gray-400' : 'text-[#1A365D]'}`}>
                          {name}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-100/50 px-1.5 py-0.5 rounded-lg border border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleQuantityUpdate(item.id, item.quantity, -1)}
                              className="p-0.5 sm:p-1 hover:bg-white rounded-md text-gray-400 transition-colors"
                            >
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <span className={`text-xs sm:text-sm font-black min-w-[16px] sm:min-w-[20px] text-center ${isShoppingMode ? 'text-base sm:text-lg' : ''}`}>
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => handleQuantityUpdate(item.id, item.quantity, 1)}
                              className="p-0.5 sm:p-1 hover:bg-white rounded-md text-gray-400 transition-colors"
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-wider truncate max-w-[60px] sm:max-w-none">
                            {unit}
                          </span>
                        </div>
                      </div>

                      {!isShoppingMode && (
                        <div className="flex items-center gap-2 sm:gap-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 px-1.5 sm:px-2 py-1 rounded-lg border border-gray-100">
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
                              className="w-12 sm:w-16 bg-transparent text-right font-bold outline-none text-xs sm:text-sm"
                            />
                            <span className="text-[10px] sm:text-xs font-bold text-gray-400">€</span>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 sm:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 sm:group-hover/item:opacity-100 group-active/item:opacity-100"
                            title="Supprimer de la liste"
                          >
                            <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      )}

                      <div 
                        onClick={(e) => {
                          if (!item.is_checked) {
                            e.stopPropagation();
                            const p = prompt("Prix unitaire :", item.price.toString());
                            if (p !== null) handlePriceUpdate(item.id, p);
                          }
                        }}
                        className={`text-base sm:text-xl font-bold whitespace-nowrap ${item.is_checked ? 'text-gray-300' : 'text-[#FF6B35] bg-[#FF6B35]/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-[#FF6B35]/10'}`}
                      >
                        {(Number(item.price) * (item.quantity || 1)).toFixed(2)} €
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Section "Dans le panier" en mode shopping */}
      {isShoppingMode && doneItems.length > 0 && (
        <div className="mt-12 pt-12 border-t border-dashed border-gray-200">
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest px-2 mb-4 flex items-center gap-2">
            <ArchiveBoxIcon className="w-4 h-4" />
            Déjà dans le panier ({doneItems.length})
          </h3>
          <div className="space-y-2 opacity-50">
            {doneItems.map((item) => {
              const { name } = getCatalogInfo(item);
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id, item.is_checked)}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent cursor-pointer"
                >
                  <CheckCircleSolidIcon className="w-8 h-8 text-[#FF6B35]" />
                  <p className="flex-1 font-bold text-[#1A365D] line-through decoration-2">
                    {name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isShoppingMode && (
        <div className="fixed bottom-6 left-6 right-6 flex gap-4">
          <button 
            onClick={() => setIsShoppingMode(false)}
            className="flex-1 bg-[#1A365D] text-white py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Terminer
          </button>
        </div>
      )}
    </div>
  );
};
