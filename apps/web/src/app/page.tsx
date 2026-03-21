"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { HopInput } from "@/components/shopping/HopInput";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { ListHeader } from "@/components/shopping/ListHeader";
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
          setActiveListName('Aucune liste trouvée');
        }
      } catch (error) {
        console.error('Failed to load lists:', error);
        setActiveListName('Erreur de connexion');
      }
    }
    loadInitialList();
  }, []);

  const handleListSelect = (id: string) => {
    setActiveListId(id);
    // On pourrait refetch le nom ici si besoin, ou le passer via Sidebar
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)]">
      
      <Sidebar activeListId={activeListId || ''} onListSelect={handleListSelect} />

      <main className="flex-1 p-6 sm:p-12 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          
          <ListHeader 
            name={activeListName} 
            isSynced={!!activeListId} 
          />

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

          <footer className="mt-auto py-12 flex gap-6 flex-wrap items-center justify-center text-[#1A365D] opacity-40 text-xs text-center">
            <p>© 2026 Et SHop! - Votre compagnon de courses propulsionné</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
