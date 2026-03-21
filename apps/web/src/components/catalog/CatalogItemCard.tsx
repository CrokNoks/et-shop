"use client";

import React from 'react';
import { QrCodeIcon, TagIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CatalogItem {
  id: string;
  name: string;
  barcode?: string;
  categories?: { name: string };
  usage_count: number;
}

interface CatalogItemCardProps {
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string, name: string) => void;
}

export const CatalogItemCard: React.FC<CatalogItemCardProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group text-[#1A365D]">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded-full w-fit">
            {item.categories?.name || 'Sans Rayon'}
          </span>
          <h3 className="text-xl font-bold">{item.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(item)}
            className="p-2 text-gray-300 hover:text-[#1A365D] hover:bg-gray-50 rounded-xl transition-all"
            title="Modifier"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDelete(item.id, item.name)}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Supprimer"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-auto">
        {item.barcode ? (
          <div className="flex items-center gap-2 text-gray-400 font-mono text-sm bg-gray-50 p-2 rounded-xl border border-gray-100 w-fit">
            <QrCodeIcon className="w-4 h-4" />
            {item.barcode}
          </div>
        ) : <div />}
        
        <div className="flex items-center gap-1 text-gray-300">
          <TagIcon className="w-4 h-4" />
          <span className="text-xs font-bold">{item.usage_count}</span>
        </div>
      </div>
    </div>
  );
};
