"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { HopInput } from "@/components/shopping/HopInput";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { ListHeader } from "@/components/shopping/ListHeader";
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeListName, setActiveListName] = useState('Chargement...');
  const router = useRouter();

  const loadInitialList = useCallback(async () => {
    const householdId = typeof window !== 'undefined' ? localStorage.getItem('active_household_id') : null;
    if (!householdId) {
      router.push('/household/setup');
      return;
    }

    try {
      const lists = await fetchApi('/shopping-lists');
      if (lists && lists.length > 0) {
        const currentActive = lists.find((l: any) => l.id === activeListId) || lists[0];
        setActiveListId(currentActive.id);
        setActiveListName(currentActive.name);
      } else {
        setActiveListId(null);
        setActiveListName('Aucune liste trouvée');
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
      setActiveListName('Erreur de connexion');
    }
  }, [activeListId, router]);

  useEffect(() => {
    loadInitialList();
  }, [loadInitialList]);

  const handleListSelect = (id: string) => {
    setActiveListId(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)]">
      
      <Sidebar activeListId={activeListId || ''} onListSelect={handleListSelect} />

      <main className="flex-1 p-6 sm:p-12 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          
          {activeListId ? (
            <ListHeader 
              id={activeListId}
              name={activeListName} 
              isSynced={true} 
              onUpdate={(newName) => setActiveListName(newName)}
              onDelete={() => {
                setActiveListId(null);
                loadInitialList();
              }}
            />
          ) : (
            <div className="flex flex-col gap-1 text-[#1A365D]">
              <h1 className="text-3xl font-black">{activeListName}</h1>
            </div>
          )}

          {activeListId ? (
            <>
              <div className="flex flex-col gap-4">
                <HopInput listId={activeListId} />
              </div>
              <ShoppingList listId={activeListId} />
            </>
          ) : (
            <div className="py-20 text-center text-[#1A365D]">
              <p className="text-gray-400 italic font-medium">Veuillez sélectionner ou créer une liste pour commencer.</p>
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
