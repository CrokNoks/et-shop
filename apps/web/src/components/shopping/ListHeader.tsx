"use client";

import React from 'react';
import { EllipsisHorizontalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface ListHeaderProps {
  id: string;
  name: string;
  isSynced: boolean;
  onUpdate: (newName: string) => void;
  onDelete: () => void;
}

export const ListHeader: React.FC<ListHeaderProps> = ({ id, name, isSynced, onUpdate, onDelete }) => {
  const handleRename = async () => {
    const newName = prompt("Nouveau nom pour la liste :", name);
    if (!newName || newName === name) return;

    try {
      await fetchApi(`/shopping-lists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      });
      onUpdate(newName);
      toast.success("Liste renommée !");
    } catch (error) {
      toast.error("Erreur lors du renommage.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement la liste "${name}" ?`)) return;

    try {
      await fetchApi(`/shopping-lists/${id}`, {
        method: 'DELETE',
      });
      onDelete();
      toast.success("Liste supprimée !");
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="flex items-center justify-between text-[#1A365D]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[#FF6B35] font-black tracking-widest text-[10px] uppercase bg-[#FF6B35]/10 px-2 py-0.5 rounded-full">
            {isSynced ? 'En direct' : 'Hors ligne'}
          </span>
        </div>
        <h1 className="text-3xl font-black">
          {name}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 text-gray-400 hover:text-[#1A365D] outline-none" title="Plus d'options">
            <EllipsisHorizontalIcon className="w-6 h-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-gray-100 text-[#1A365D]">
            <DropdownMenuItem onClick={handleRename} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50 font-bold transition-colors">
              <PencilIcon className="w-4 h-4 text-gray-400" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-red-500 hover:bg-red-50 focus:bg-red-50 font-bold transition-colors">
              <TrashIcon className="w-4 h-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
