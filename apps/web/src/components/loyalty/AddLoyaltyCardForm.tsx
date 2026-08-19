"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateLoyaltyCard } from "../../hooks/useLoyaltyCards";
import { useStores } from "../../hooks/useStores";
import { BarcodeFormat } from "../../types/loyalty-card";
import { BarcodeScanner } from "./BarcodeScanner";

export function AddLoyaltyCardForm() {
  const router = useRouter();
  const createLoyaltyCard = useCreateLoyaltyCard();
  const { data: stores = [] } = useStores();

  const [storeId, setStoreId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [cardData, setCardData] = useState<string>("");
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>(
    BarcodeFormat.CODE_128,
  );
  const [customColor, setCustomColor] = useState<string>("");
  const [showScanner, setShowScanner] = useState<boolean>(false); // State to control scanner visibility

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
      router.push("/loyalty-cards"); // Redirect to list after successful creation
    } catch (error) {
      console.error("Failed to create loyalty card:", error);
      // Handle error, e.g., show a toast notification
    }
  };

  const handleBarcodeScanResult = (
    scannedData: string,
    format: BarcodeFormat,
  ) => {
    setCardData(scannedData);
    setBarcodeFormat(format);
    setShowScanner(false); // Hide scanner after scan
  };

  const labelClass =
    "block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]";
  const fieldClass =
    "mt-1.5 block w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 py-2.5 text-[15px] font-medium text-[var(--es-ink)] focus:border-[#FF6B35] focus:outline-none";

  return (
    <div className="rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] p-4 text-[var(--es-ink)]">
      <h2 className="mb-6 text-[20px] font-semibold">
        Ajouter une nouvelle carte de fidélité
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="storeId" className={labelClass}>
            Magasin
          </label>
          <select
            id="storeId"
            data-cy="loyalty-store"
            className={fieldClass}
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required
          >
            <option value="">Sélectionner un magasin</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            Nom de la carte
          </label>
          <input
            type="text"
            id="name"
            data-cy="loyalty-name"
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Carte Leclerc, Fidélité Bio..."
            required
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description{" "}
            <span className="font-normal normal-case text-[var(--es-tertiary)]">
              (optionnel)
            </span>
          </label>
          <input
            type="text"
            id="description"
            data-cy="loyalty-description"
            className={fieldClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Carte principale, conjoint..."
          />
        </div>

        <div>
          <label htmlFor="cardData" className={labelClass}>
            Numéro de Carte
          </label>
          <input
            type="text"
            id="cardData"
            data-cy="loyalty-card-data"
            className={`${fieldClass} font-mono`}
            value={cardData}
            onChange={(e) => setCardData(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="barcodeFormat" className={labelClass}>
            Format de Code-barres
          </label>
          <select
            id="barcodeFormat"
            data-cy="loyalty-barcode-format"
            className={fieldClass}
            value={barcodeFormat}
            onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
            required
          >
            {Object.values(BarcodeFormat).map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="customColor" className={labelClass}>
            Couleur Personnalisée (Hex)
          </label>
          <input
            type="text"
            id="customColor"
            data-cy="loyalty-color"
            className={`${fieldClass} font-mono`}
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#RRGGBB"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            data-cy="loyalty-scan"
            onClick={() => setShowScanner(true)}
            className="flex h-11 items-center justify-center rounded-[10px] bg-[var(--es-field)] px-4 text-[13px] font-semibold text-[var(--es-secondary)]"
          >
            Scanner le code-barres
          </button>
          <button
            type="submit"
            data-cy="loyalty-submit"
            className="flex h-11 items-center justify-center rounded-[10px] bg-[var(--es-banner)] px-4 text-[13px] font-semibold text-white disabled:opacity-50"
            disabled={createLoyaltyCard.isPending}
          >
            {createLoyaltyCard.isPending
              ? "Ajout en cours..."
              : "Ajouter la carte"}
          </button>
        </div>

        {createLoyaltyCard.isError && (
          <p
            data-cy="loyalty-error"
            className="mt-2 text-[13px] text-[var(--es-danger)]"
          >
            Erreur: {createLoyaltyCard.error?.message}
          </p>
        )}
      </form>

      {/* BarcodeScanner Modal/Component */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
          <div className="w-full max-w-lg rounded-[14px] bg-[var(--es-surface)] p-6 text-[var(--es-ink)] shadow-xl">
            <h3 className="mb-4 text-[17px] font-semibold">
              Scanner le code-barres
            </h3>
            <BarcodeScanner
              onScan={handleBarcodeScanResult}
              onCancel={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
