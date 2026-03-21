"use client";

import React, { useState, useEffect } from 'react';
import { Logo } from "@/components/Logo";
import { HopInput } from "@/components/HopInput";
import { ShoppingList } from "@/components/ShoppingList";
import { ListSidebar } from "@/components/ListSidebar";
import { ShareIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { fetchApi } from '@/lib/api';

export default function Home() {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeListName, setActiveListName] = useState('Chargement...');

  useEffect(() => {
    async function loadInitialList() {
      try {
        const lists = await fetchApi('/shopping-lists');
        if (lists && lists.length > 0) {
          setActiveListId(lists[0].id);
          setActiveListName(lists[0].name);
        } else {
          // Si aucune liste, on en crée une par défaut pour le test (nécessite un ownerId)
          // Pour l'instant on reste en attente ou on affiche un message
          setActiveListName('Aucune liste trouvée');
        }
      } catch (error) {
        console.error('Failed to load lists:', error);
        setActiveListName('Erreur de connexion');
      }
    }
    loadInitialList();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)]">
      
      <aside className="w-full sm:w-80 bg-white border-r border-gray-100 p-8 flex flex-col gap-8 sm:h-screen sm:sticky sm:top-0">
        <Logo width={200} height={60} />
        <ListSidebar activeListId={activeListId || ''} onListSelect={(id) => setActiveListId(id)} />
        
        <div className="mt-auto pt-8 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-[#1A365D] flex items-center justify-center text-white font-black text-sm">
              LG
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A365D] truncate">Lucas Guerrier</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Compte Gratuit</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-12 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[#FF6B35] font-black tracking-widest text-[10px] uppercase bg-[#FF6B35]/10 px-2 py-0.5 rounded-full">
                  {activeListId ? 'En direct' : 'Hors ligne'}
                </span>
              </div>
              <h1 className="text-3xl font-black text-[#1A365D]">
                {activeListName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 text-gray-400 hover:text-[#1A365D]" title="Partager">
                <ShareIcon className="w-6 h-6" />
              </button>
              <button className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 text-gray-400 hover:text-[#1A365D]" title="Plus d'options">
                <EllipsisHorizontalIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {activeListId ? (
            <>
              <div className="flex flex-col gap-4">
                <HopInput listId={activeListId} />
              </div>
              <ShoppingList listId={activeListId} />
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400 italic">Veuillez sélectionner ou créer une liste pour commencer.</p>
            </div>
          )}

          <footer className="mt-auto py-12 flex gap-6 flex-wrap items-center justify-center text-[#1A365D] opacity-40 text-xs">
            <p>© 2026 Et SHop! - Votre compagnon de courses propulsionné</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
