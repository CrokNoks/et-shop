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

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Ajouter une nouvelle carte de fidélité
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="storeId"
            className="block text-sm font-medium text-gray-700"
          >
            Magasin
          </label>
          <select
            id="storeId"
            data-cy="loyalty-store"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom de la carte
          </label>
          <input
            type="text"
            id="name"
            data-cy="loyalty-name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Carte Leclerc, Fidélité Bio..."
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <input
            type="text"
            id="description"
            data-cy="loyalty-description"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Carte principale, conjoint..."
          />
        </div>

        <div>
          <label
            htmlFor="cardData"
            className="block text-sm font-medium text-gray-700"
          >
            Numéro de Carte
          </label>
          <input
            type="text"
            id="cardData"
            data-cy="loyalty-card-data"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={cardData}
            onChange={(e) => setCardData(e.target.value)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="barcodeFormat"
            className="block text-sm font-medium text-gray-700"
          >
            Format de Code-barres
          </label>
          <select
            id="barcodeFormat"
            data-cy="loyalty-barcode-format"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
          <label
            htmlFor="customColor"
            className="block text-sm font-medium text-gray-700"
          >
            Couleur Personnalisée (Hex)
          </label>
          <input
            type="text"
            id="customColor"
            data-cy="loyalty-color"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#RRGGBB"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            data-cy="loyalty-scan"
            onClick={() => setShowScanner(true)}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Scanner le code-barres
          </button>
          <button
            type="submit"
            data-cy="loyalty-submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={createLoyaltyCard.isPending}
          >
            {createLoyaltyCard.isPending
              ? "Ajout en cours..."
              : "Ajouter la carte"}
          </button>
        </div>

        {createLoyaltyCard.isError && (
          <p data-cy="loyalty-error" className="text-red-500 text-sm mt-2">
            Erreur: {createLoyaltyCard.error?.message}
          </p>
        )}
      </form>

      {/* BarcodeScanner Modal/Component */}
      {showScanner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-4">
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
