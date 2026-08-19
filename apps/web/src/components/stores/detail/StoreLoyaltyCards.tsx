"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusIcon,
  CreditCardIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
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

export function StoreLoyaltyCards({
  storeId,
  storeName,
}: StoreLoyaltyCardsProps) {
  const { data: cards, isLoading } = useLoyaltyCards([storeId]);
  const updateLoyaltyCard = useUpdateLoyaltyCard();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<LoyaltyCardFrontend | null>(
    null,
  );
  const [activeCard, setActiveCard] = useState<LoyaltyCardFrontend | null>(
    null,
  );

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCardData, setEditCardData] = useState("");
  const [editBarcodeFormat, setEditBarcodeFormat] = useState<BarcodeFormat>(
    BarcodeFormat.CODE_128,
  );
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
      <p className="py-16 text-center text-[13px] italic text-[var(--es-tertiary)]">
        Chargement des cartes...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--es-secondary)]">
          {cards && cards.length > 0
            ? `${cards.length} carte${cards.length > 1 ? "s" : ""} de fidélité`
            : "Aucune carte enregistrée pour ce magasin."}
        </p>
        <button
          onClick={() => setIsAddSheetOpen(true)}
          data-cy="loyalty-store-add"
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#FF6B35] px-3 text-[13px] font-semibold text-[#c8471c]"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          Ajouter une carte
        </button>
      </div>

      {cards && cards.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-[14px] border border-[var(--es-hairline)]">
          {cards.map((card) => {
            const masked = card.cardData.slice(-4).padStart(4, "•");
            return (
              <div
                key={card.id}
                className="group flex h-[66px] items-center gap-3 border-b border-[var(--es-hairline)] px-3.5 last:border-b-0"
              >
                <button
                  onClick={() => setActiveCard(card)}
                  data-cy={`loyalty-store-item-${card.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]"
                    style={{
                      backgroundColor: card.customColor
                        ? `${card.customColor}1a`
                        : "rgba(255,107,53,0.1)",
                      color: card.customColor || "#FF6B35",
                    }}
                  >
                    <CreditCardIcon className="h-5 w-5" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-medium text-[var(--es-ink)]">
                      {card.name}
                    </span>
                    <span className="truncate text-[11.5px] tabular-nums text-[var(--es-tertiary)]">
                      •••• {masked} · s&apos;affiche en mode magasin
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveCard(card)}
                  className="shrink-0 text-[13px] font-semibold text-[#c8471c]"
                >
                  Voir
                </button>
                <button
                  onClick={(e) => handleOpenEdit(e, card)}
                  data-cy={`loyalty-store-edit-${card.id}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
                  title="Modifier"
                >
                  <PencilIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {cards && cards.length > 0 && (
        <Link
          href="/loyalty-cards"
          data-cy="loyalty-manage-all"
          className="self-start text-[12.5px] font-semibold text-[var(--es-secondary)] hover:text-[#c8471c]"
        >
          Gérer toutes mes cartes de fidélité →
        </Link>
      )}

      <AddLoyaltyCardSheet
        storeId={storeId}
        storeName={storeName}
        open={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />

      {/* Edit Sheet */}
      <Sheet
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
      >
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              Modifier la carte
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
              Modifiez les informations de votre carte de fidélité.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleEditSubmit}
            className="mt-6 flex flex-col gap-4"
          >
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Nom de la carte
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Carte Leclerc, Fidélité Bio..."
                className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Description{" "}
                <span className="normal-case font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Ex: Carte principale, conjoint..."
                className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Numéro de carte
              </label>
              <input
                type="text"
                required
                value={editCardData}
                onChange={(e) => setEditCardData(e.target.value)}
                className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 font-mono text-[15px] outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Format du code-barres
              </label>
              <select
                value={editBarcodeFormat}
                onChange={(e) =>
                  setEditBarcodeFormat(e.target.value as BarcodeFormat)
                }
                className="h-[50px] w-full appearance-none rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] outline-none focus:border-[#FF6B35]"
              >
                {Object.values(BarcodeFormat).map((f) => (
                  <option key={f} value={f}>
                    {BARCODE_FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Couleur personnalisée{" "}
                <span className="normal-case font-normal">(optionnel)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editCustomColor || "#FF6B35"}
                  onChange={(e) => setEditCustomColor(e.target.value)}
                  className="h-[42px] w-[42px] cursor-pointer rounded-[10px] border border-[var(--es-hairline)] p-1"
                />
                <input
                  type="text"
                  value={editCustomColor}
                  onChange={(e) => setEditCustomColor(e.target.value)}
                  placeholder="#FF6B35"
                  className="h-[50px] flex-1 rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 font-mono text-[13px] outline-none focus:border-[#FF6B35]"
                />
                {editCustomColor && (
                  <button
                    type="button"
                    onClick={() => setEditCustomColor("")}
                    className="text-[11.5px] text-[var(--es-tertiary)]"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={updateLoyaltyCard.isPending}
              className="h-[50px] rounded-[14px] bg-[#1A365D] text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {updateLoyaltyCard.isPending
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>
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
