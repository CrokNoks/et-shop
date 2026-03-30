"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { ShoppingList } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

interface SendToListDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (shoppingListId: string) => void;
  isSending?: boolean;
}

export const SendToListDialog: React.FC<SendToListDialogProps> = ({
  open,
  onClose,
  onSend,
  isSending = false,
}) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    fetchApi("/shopping-lists")
      .then((data) => setLists(data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [open]);

  const handleSend = () => {
    if (!selectedListId) return;
    onSend(selectedListId);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]"
      >
        <SheetHeader className="mb-10 text-left">
          <SheetTitle className="text-3xl font-black">
            Envoyer vers une liste
          </SheetTitle>
          <SheetDescription className="text-base text-gray-500 mt-2">
            Sélectionnez la liste de courses dans laquelle vous souhaitez
            ajouter les produits de cette recette.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="text-gray-400 italic text-center py-8">
            Chargement des listes...
          </p>
        ) : lists.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">
            Aucune liste de courses disponible.
          </p>
        ) : (
          <div className="flex flex-col gap-3 mb-8">
            {lists.map((list) => (
              <button
                key={list.id}
                data-cy={`send-to-list-${list.id}`}
                onClick={() => setSelectedListId(list.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedListId === list.id
                    ? "border-[#FF6B35] bg-orange-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <ShoppingCartIcon
                  className={`w-5 h-5 flex-shrink-0 ${selectedListId === list.id ? "text-[#FF6B35]" : "text-gray-400"}`}
                />
                <span className="font-bold">{list.name}</span>
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleSend}
          data-cy="send-to-list-submit"
          disabled={!selectedListId || isSending || isLoading}
          className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl shadow-lg"
        >
          {isSending ? "Envoi en cours..." : "Envoyer la recette"}
        </Button>
      </SheetContent>
    </Sheet>
  );
};
