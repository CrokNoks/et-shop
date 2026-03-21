"use client";

import React from 'react';
import { ShareIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

interface ListHeaderProps {
  name: string;
  isSynced: boolean;
}

export const ListHeader: React.FC<ListHeaderProps> = ({ name, isSynced }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[#FF6B35] font-black tracking-widest text-[10px] uppercase bg-[#FF6B35]/10 px-2 py-0.5 rounded-full">
            {isSynced ? 'En direct' : 'Hors ligne'}
          </span>
        </div>
        <h1 className="text-3xl font-black text-[#1A365D]">
          {name}
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
  );
};
