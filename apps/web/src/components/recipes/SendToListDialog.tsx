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
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setIsLoading(true);
      fetchApi("/shopping-lists")
        .then((data) => setLists(data || []))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    });
    return () => controller.abort();
  }, [open]);

  const handleSend = () => {
    if (!selectedListId) return;
    onSend(selectedListId);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-[20px] font-semibold">
            Envoyer vers une liste
          </SheetTitle>
          <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
            Sélectionnez la liste de courses dans laquelle ajouter les
            ingrédients de cette recette.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="py-8 text-center italic text-[var(--es-tertiary)]">
            Chargement des listes...
          </p>
        ) : lists.length === 0 ? (
          <p className="py-8 text-center italic text-[var(--es-tertiary)]">
            Aucune liste de courses disponible.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            {lists.map((list) => (
              <button
                key={list.id}
                data-cy={`send-to-list-${list.id}`}
                onClick={() => setSelectedListId(list.id)}
                className={`flex h-14 items-center gap-3 rounded-[14px] border px-3.5 text-left transition-colors ${
                  selectedListId === list.id
                    ? "border-[#FF6B35] bg-[rgba(255,107,53,0.06)]"
                    : "border-[var(--es-hairline)] hover:border-[var(--es-disabled)]"
                }`}
              >
                <ShoppingCartIcon
                  className={`h-5 w-5 shrink-0 ${selectedListId === list.id ? "text-[var(--es-accent-text)]" : "text-[var(--es-tertiary)]"}`}
                />
                <span className="text-[15px] font-medium">{list.name}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleSend}
          data-cy="send-to-list-submit"
          disabled={!selectedListId || isSending || isLoading}
          className="mt-6 flex h-[50px] items-center justify-center rounded-[14px] bg-[#1A365D] text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {isSending ? "Envoi en cours..." : "Envoyer la recette"}
        </button>
      </SheetContent>
    </Sheet>
  );
};
