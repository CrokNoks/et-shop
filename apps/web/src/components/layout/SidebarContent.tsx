"use client";

import React, { useState, useEffect } from 'react';
import { PlusIcon, UsersIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { UserBadge } from './UserBadge';
import { useSupabase } from '@/hooks/useSupabase';
import { ShoppingList } from '@/types';

interface SidebarContentProps {
  activeListId: string;
  onListSelect: (id: string) => void;
  onClose?: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ activeListId, onListSelect, onClose }) => {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');

  const loadLists = async () => {
    const householdId = typeof window !== 'undefined' ? localStorage.getItem('active_household_id') : null;
    if (!householdId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchApi('/shopping-lists');
      setLists(data || []);
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLists();

    const householdId = typeof window !== 'undefined' ? localStorage.getItem('active_household_id') : null;
    if (!householdId) return;

    const channel = supabase
      .channel('sidebar_lists')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          loadLists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    try {
      const newList = await fetchApi('/shopping-lists', {
        method: 'POST',
        body: JSON.stringify({ name: newListName }),
      });
      setNewListName('');
      setShowCreateForm(false);
      loadLists();
      onListSelect(newList.id);
      onClose?.();
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleListClick = (id: string) => {
    onListSelect(id);
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <Logo width={200} height={60} />
      
      <div className="w-full flex flex-col gap-6 text-[#1A365D]">
        {/* Magasins Link - Hidden on mobile */}
        <div className="px-2 hidden sm:flex flex-col gap-2">
          <Link 
            href="/stores" 
            onClick={() => onClose?.()}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              pathname === '/stores' 
                ? 'bg-white shadow-md border-l-4 border-[#FF6B35]' 
                : 'hover:bg-gray-50 border-l-4 border-transparent text-gray-500'
            }`}
          >
            <BuildingStorefrontIcon className={`w-5 h-5 ${pathname === '/stores' ? 'text-[#FF6B35]' : 'text-gray-400'}`} strokeWidth={2} />
            <span className={`font-bold ${pathname === '/stores' ? 'text-[#1A365D]' : ''}`}>
              Mes Magasins
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Mes Listes</h3>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`p-1 hover:bg-gray-100 rounded-lg transition-colors ${showCreateForm ? 'text-gray-400' : 'text-[#FF6B35]'}`}
          >
            <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateList} className="px-2 mb-2 animate-in fade-in slide-in-from-top-2">
            <input
              autoFocus
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nom de la liste..."
              className="w-full p-3 bg-gray-50 border border-[#FF6B35]/30 rounded-xl outline-none focus:border-[#FF6B35] text-sm font-bold text-[#1A365D]"
            />
          </form>
        )}

        <div className="flex flex-col gap-1 overflow-y-auto max-h-[40vh]">
          {isLoading && lists.length === 0 ? (
            <p className="text-xs text-center text-gray-400 italic py-4">Chargement...</p>
          ) : lists.length === 0 ? (
            <p className="text-xs text-center text-gray-400 italic py-4 px-2">Aucune liste. Cliquez sur + pour en créer une !</p>
          ) : (
            lists.map((list) => (
              <Link
                key={list.id}
                href={`/`}
                onClick={() => handleListClick(list.id)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                  activeListId === list.id 
                    ? 'bg-white shadow-md border-l-4 border-[#FF6B35]' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent text-gray-500'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: list.color || '#1A365D' }} 
                  />
                  <span className={`font-bold truncate ${activeListId === list.id ? 'text-[#1A365D]' : ''}`}>
                    {list.name}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="mt-4 p-4 bg-[#1A365D]/5 rounded-2xl border border-[#1A365D]/10">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="w-4 h-4 text-[#1A365D]" />
            <span className="text-xs font-bold text-[#1A365D] uppercase tracking-wider">Foyer</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight">
            Partagez vos listes avec vos proches pour une synchronisation en temps réel.
          </p>
          <button className="mt-3 w-full py-2 bg-white text-[#1A365D] text-xs font-bold rounded-lg border border-[#1A365D]/10 hover:shadow-sm transition-all">
            Inviter un membre
          </button>
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-gray-100">
        <UserBadge initials="LG" name="Lucas Guerrier" plan="Compte Gratuit" />
      </div>
    </div>
  );
};
