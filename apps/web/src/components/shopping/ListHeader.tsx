"use client";

import React, { useState } from 'react';
import { EllipsisHorizontalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newName === name) {
      setIsRenameSheetOpen(false);
      return;
    }

    setIsRenaming(true);
    try {
      await fetchApi(`/shopping-lists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      });
      onUpdate(newName);
      toast.success("Liste renommée !");
      setIsRenameSheetOpen(false);
    } catch (error) {
      toast.error("Erreur lors du renommage.");
    } finally {
      setIsRenaming(false);
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

      <div className="hidden sm:flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 text-gray-400 hover:text-[#1A365D] outline-none" title="Plus d'options">
            <EllipsisHorizontalIcon className="w-6 h-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-gray-100 text-[#1A365D]">
            <DropdownMenuItem 
              onClick={() => {
                setNewName(name);
                setIsRenameSheetOpen(true);
              }} 
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50 font-bold transition-colors"
            >
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

      {/* Rename Sheet */}
      <Sheet open={isRenameSheetOpen} onOpenChange={setIsRenameSheetOpen}>
        <SheetContent side="right" className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]">
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">Renommer la liste</SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              Choisissez un nouveau nom pour votre liste de courses.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleRename} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="list-name" className="text-xs font-black text-gray-400 uppercase tracking-widest">Nom de la liste</Label>
              <Input 
                id="list-name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="text-lg font-bold border-gray-200 focus-visible:ring-[#FF6B35]"
                required
                autoFocus
              />
            </div>

            <SheetFooter className="mt-8 pt-4 sm:justify-start">
              <Button type="submit" disabled={isRenaming} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl">
                {isRenaming ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
