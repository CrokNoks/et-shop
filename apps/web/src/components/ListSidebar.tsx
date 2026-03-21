"use client";

import React from 'react';
import { ListBulletIcon, PlusIcon, UsersIcon, HashtagIcon } from '@heroicons/react/24/outline';

interface List {
  id: string;
  name: string;
  itemCount: number;
  isShared: boolean;
  color: string;
}

const MOCK_LISTS: List[] = [
  { id: '1', name: 'Courses Hebdo', itemCount: 12, isShared: true, color: '#1A365D' },
  { id: '2', name: 'Apéro Samedi', itemCount: 5, isShared: true, color: '#FF6B35' },
  { id: '3', name: 'Brico / Jardin', itemCount: 3, isShared: false, color: '#2D3748' },
];

interface ListSidebarProps {
  activeListId: string;
  onListSelect: (id: string) => void;
}

export const ListSidebar: React.FC<ListSidebarProps> = ({ activeListId, onListSelect }) => {
  return (
    <div className="w-full sm:w-64 flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Mes Listes</h3>
        <button className="p-1 hover:bg-gray-100 rounded-lg text-[#FF6B35] transition-colors">
          <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {MOCK_LISTS.map((list) => (
          <button
            key={list.id}
            onClick={() => onListSelect(list.id)}
            className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
              activeListId === list.id 
                ? 'bg-white shadow-md border-l-4 border-[#FF6B35]' 
                : 'hover:bg-gray-50 border-l-4 border-transparent text-gray-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: list.color }} 
              />
              <span className={`font-bold ${activeListId === list.id ? 'text-[#1A365D]' : ''}`}>
                {list.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {list.isShared && <UsersIcon className="w-4 h-4 text-gray-300" />}
              <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-400 group-hover:bg-gray-200 transition-colors">
                {list.itemCount}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Section Organisation du foyer */}
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
  );
};
