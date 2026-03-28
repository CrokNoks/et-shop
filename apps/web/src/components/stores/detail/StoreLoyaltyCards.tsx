"use client";

import React, { useState } from "react";
import { PlusIcon, CreditCardIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useLoyaltyCards, useUpdateLoyaltyCard } from "@/hooks/useLoyaltyCards";
import { AddLoyaltyCardSheet } from "@/components/loyalty/AddLoyaltyCardSheet";
import { LoyaltyCardOverlay } from "@/components/loyalty/LoyaltyCardOverlay";
import { BarcodeFormat, LoyaltyCardFrontend } from "@/types/loyalty-card";

interface StoreLoyaltyCardsProps {
  storeId: string;
  storeName: string;
}


const BARCODE_FORMAT_LABELS: Record<BarcodeFormat, string> = {
  [BarcodeFormat.CODE_128]: "CODE 128 (code-barres standard)",
  [BarcodeFormat.QR_CODE]: "QR Code",
  [BarcodeFormat.EAN_13]: "EAN-13 (produits)",
  [BarcodeFormat.UNKNOWN]: "Inconnu",
};

export function StoreLoyaltyCards({ storeId, storeName }: StoreLoyaltyCardsProps) {
  const { data: cards, isLoading } = useLoyaltyCards([storeId]);
  const updateLoyaltyCard = useUpdateLoyaltyCard();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<LoyaltyCardFrontend | null>(null);
  const [activeCard, setActiveCard] = useState<LoyaltyCardFrontend | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCardData, setEditCardData] = useState("");
  const [editBarcodeFormat, setEditBarcodeFormat] = useState<BarcodeFormat>(BarcodeFormat.CODE_128);
  const [editCustomColor, setEditCustomColor] = useState("");

  const handleOpenEdit = (e: React.MouseEvent, card: LoyaltyCardFrontend) => {
    e.stopPropagation();
    setEditingCard(card);
    setEditName(card.name);
    setEditDescription(card.description ?? "");
    setEditCardData(card.cardData);
    setEditBarcodeFormat(card.barcodeFormat);
    setEditCustomColor(card.customColor ?? "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    try {
      await updateLoyaltyCard.mutateAsync({
        id: editingCard.id,
        payload: {
          name: editName,
          description: editDescription || undefined,
          cardData: editCardData,
          barcodeFormat: editBarcodeFormat,
          customColor: editCustomColor || undefined,
        },
      });
      toast.success("Carte mise à jour !");
      setEditingCard(null);
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  if (isLoading) {
    return (
      <p className="text-center py-20 text-gray-400 italic animate-pulse">
        Chargement des cartes...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">
          {cards && cards.length > 0
            ? `${cards.length} carte${cards.length > 1 ? "s" : ""} de fidélité`
            : "Aucune carte enregistrée pour ce magasin."}
        </p>
        <Button
          onClick={() => setIsAddSheetOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl px-5 py-5 shadow-lg transition-all border-none"
        >
          <PlusIcon className="w-5 h-5 mr-2" strokeWidth={3} />
          Ajouter une carte
        </Button>
      </div>

      {cards && cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 group"
              style={card.customColor ? { borderLeftColor: card.customColor, borderLeftWidth: 4 } : {}}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveCard(card)}
                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: card.customColor || "#FF6B35" }}
                  >
                    <CreditCardIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="font-black text-[#1A365D] truncate">
                      {card.name}
                    </p>
                    {card.description && (
                      <p className="text-sm text-gray-500 truncate">{card.description}</p>
                    )}
                  </div>
                </button>
                <button
                  onClick={(e) => handleOpenEdit(e, card)}
                  className="p-3 text-gray-300 hover:text-[#1A365D] hover:bg-gray-50 rounded-2xl transition-all shrink-0"
                  title="Modifier"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddLoyaltyCardSheet
        storeId={storeId}
        storeName={storeName}
        open={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />

      {/* Edit Sheet */}
      <Sheet open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <SheetContent side="right" className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]">
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">Modifier la carte</SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              Modifiez les informations de votre carte de fidélité.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Nom de la carte
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Carte Leclerc, Fidélité Bio..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Description{" "}
                <span className="normal-case font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Ex: Carte principale, conjoint..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Numéro de carte
              </label>
              <input
                type="text"
                required
                value={editCardData}
                onChange={(e) => setEditCardData(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Format du code-barres
              </label>
              <select
                value={editBarcodeFormat}
                onChange={(e) => setEditBarcodeFormat(e.target.value as BarcodeFormat)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all appearance-none"
              >
                {Object.values(BarcodeFormat).map((f) => (
                  <option key={f} value={f}>{BARCODE_FORMAT_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Couleur personnalisée{" "}
                <span className="normal-case font-normal">(optionnel)</span>
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={editCustomColor || "#FF6B35"}
                  onChange={(e) => setEditCustomColor(e.target.value)}
                  className="w-12 h-12 p-1 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer"
                />
                <input
                  type="text"
                  value={editCustomColor}
                  onChange={(e) => setEditCustomColor(e.target.value)}
                  placeholder="#FF6B35"
                  className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all font-mono text-sm"
                />
                {editCustomColor && (
                  <button type="button" onClick={() => setEditCustomColor("")} className="text-xs text-gray-400 hover:text-gray-600">
                    Effacer
                  </button>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateLoyaltyCard.isPending}
              className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl shadow-lg"
            >
              {updateLoyaltyCard.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {activeCard && (
        <LoyaltyCardOverlay
          card={activeCard}
          storeName={storeName}
          onClose={() => setActiveCard(null)}
        />
      )}
    </div>
  );
}
