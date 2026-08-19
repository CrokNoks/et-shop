"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import { useCreateLoyaltyCard } from "@/hooks/useLoyaltyCards";
import { BarcodeFormat } from "@/types/loyalty-card";
import { BarcodeScanner } from "./BarcodeScanner";

interface AddLoyaltyCardSheetProps {
  storeId: string;
  storeName: string;
  open: boolean;
  onClose: () => void;
}

const BARCODE_FORMAT_LABELS: Record<BarcodeFormat, string> = {
  [BarcodeFormat.CODE_128]: "CODE 128 (code-barres standard)",
  [BarcodeFormat.QR_CODE]: "QR Code",
  [BarcodeFormat.EAN_13]: "EAN-13 (produits)",
  [BarcodeFormat.UNKNOWN]: "Inconnu",
};

export function AddLoyaltyCardSheet({
  storeId,
  storeName,
  open,
  onClose,
}: AddLoyaltyCardSheetProps) {
  const createLoyaltyCard = useCreateLoyaltyCard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cardData, setCardData] = useState("");
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>(
    BarcodeFormat.CODE_128,
  );
  const [customColor, setCustomColor] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCardData("");
    setBarcodeFormat(BarcodeFormat.CODE_128);
    setCustomColor("");
    setShowScanner(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLoyaltyCard.mutateAsync({
        storeId,
        name,
        description: description || undefined,
        cardData,
        barcodeFormat,
        customColor: customColor || undefined,
      });
      toast.success("Carte de fidélité ajoutée !");
      handleClose();
    } catch {
      toast.error("Erreur lors de l'ajout de la carte.");
    }
  };

  const handleScanResult = (scannedData: string, format: BarcodeFormat) => {
    setCardData(scannedData);
    setBarcodeFormat(format);
    setShowScanner(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-[20px] font-semibold">
            Carte de fidélité
          </SheetTitle>
          <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
            Associer une carte au magasin{" "}
            <span className="font-semibold text-[var(--es-ink)]">
              {storeName}
            </span>
            .
          </SheetDescription>
        </SheetHeader>

        {showScanner ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
              Scanner le code-barres
            </p>
            <BarcodeScanner
              onScan={handleScanResult}
              onCancel={() => setShowScanner(false)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Nom de la carte
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Carte principale, conjoint..."
                className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Numéro de carte
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={cardData}
                  onChange={(e) => setCardData(e.target.value)}
                  placeholder="Ex: 1234567890"
                  className="h-[50px] flex-1 rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35]"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex h-10 w-10 items-center justify-center self-center rounded-[10px] bg-[var(--es-field)] text-[var(--es-secondary)]"
                  title="Scanner"
                >
                  <QrCodeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Format du code-barres
              </label>
              <select
                value={barcodeFormat}
                onChange={(e) =>
                  setBarcodeFormat(e.target.value as BarcodeFormat)
                }
                className="h-[50px] w-full appearance-none rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] outline-none focus:border-[#FF6B35]"
              >
                {Object.values(BarcodeFormat).map((format) => (
                  <option key={format} value={format}>
                    {BARCODE_FORMAT_LABELS[format]}
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
                  value={customColor || "#FF6B35"}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-[42px] w-[42px] cursor-pointer rounded-[10px] border border-[var(--es-hairline)] p-1"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#FF6B35"
                  className="h-[50px] flex-1 rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 font-mono text-[13px] outline-none focus:border-[#FF6B35]"
                />
                {customColor && (
                  <button
                    type="button"
                    onClick={() => setCustomColor("")}
                    className="text-[11.5px] text-[var(--es-tertiary)]"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={createLoyaltyCard.isPending}
              className="h-[50px] rounded-[14px] bg-[#1A365D] text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {createLoyaltyCard.isPending
                ? "Enregistrement..."
                : "Enregistrer la carte"}
            </button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
