"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
        side="right"
        className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]"
      >
        <SheetHeader className="mb-10 text-left">
          <SheetTitle className="text-3xl font-black">
            Carte de fidélité
          </SheetTitle>
          <SheetDescription className="text-base text-gray-500 mt-2">
            Associer une carte au magasin{" "}
            <span className="font-semibold text-[#1A365D]">{storeName}</span>.
          </SheetDescription>
        </SheetHeader>

        {showScanner ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Scanner le code-barres
            </p>
            <BarcodeScanner
              onScan={handleScanResult}
              onCancel={() => setShowScanner(false)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Nom de la carte
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Carte principale, conjoint..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Numéro de carte
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={cardData}
                  onChange={(e) => setCardData(e.target.value)}
                  placeholder="Ex: 1234567890"
                  className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
                  title="Scanner"
                >
                  <QrCodeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Format du code-barres
              </label>
              <select
                value={barcodeFormat}
                onChange={(e) =>
                  setBarcodeFormat(e.target.value as BarcodeFormat)
                }
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all appearance-none"
              >
                {Object.values(BarcodeFormat).map((format) => (
                  <option key={format} value={format}>
                    {BARCODE_FORMAT_LABELS[format]}
                  </option>
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
                  value={customColor || "#FF6B35"}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-12 h-12 p-1 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#FF6B35"
                  className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all font-mono text-sm"
                />
                {customColor && (
                  <button
                    type="button"
                    onClick={() => setCustomColor("")}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-all"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={createLoyaltyCard.isPending}
              className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl shadow-lg"
            >
              {createLoyaltyCard.isPending
                ? "Enregistrement..."
                : "Enregistrer la carte"}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
