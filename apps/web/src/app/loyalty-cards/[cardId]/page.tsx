// app_build/apps/web/src/app/loyalty-cards/[cardId]/page.tsx

"use client"; // This page uses client-side hooks

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useLoyaltyCard,
  useDeleteLoyaltyCard,
  useUpdateLoyaltyCard,
} from "../../../hooks/useLoyaltyCards";
import { LoyaltyCardDisplay } from "../../../components/loyalty/LoyaltyCardDisplay";
import { useStoreMap } from "../../../hooks/useStores";
import { BarcodeFormat } from "../../../types/loyalty-card";
import { useState } from "react"; // For edit mode

export default function LoyaltyCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const {
    data: loyaltyCard,
    isLoading,
    isError,
    error,
  } = useLoyaltyCard(cardId);
  const deleteLoyaltyCard = useDeleteLoyaltyCard();
  const updateLoyaltyCard = useUpdateLoyaltyCard();

  const storeMap = useStoreMap();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(loyaltyCard?.name || "");
  const [editedDescription, setEditedDescription] = useState(loyaltyCard?.description || "");
  const [editedCardData, setEditedCardData] = useState(
    loyaltyCard?.cardData || "",
  );
  const [editedCustomColor, setEditedCustomColor] = useState(
    loyaltyCard?.customColor || "",
  );
  const [editedBarcodeFormat, setEditedBarcodeFormat] = useState<BarcodeFormat>(
    loyaltyCard?.barcodeFormat || BarcodeFormat.CODE_128,
  );

  React.useEffect(() => {
    if (loyaltyCard) {
      setEditedName(loyaltyCard.name);
      setEditedDescription(loyaltyCard.description || "");
      setEditedCardData(loyaltyCard.cardData);
      setEditedCustomColor(loyaltyCard.customColor || "");
      setEditedBarcodeFormat(loyaltyCard.barcodeFormat);
    }
  }, [loyaltyCard]);

  const handleDelete = async () => {
    if (
      confirm("Êtes-vous sûr de vouloir supprimer cette carte de fidélité ?")
    ) {
      try {
        await deleteLoyaltyCard.mutateAsync(cardId);
        router.push("/loyalty-cards"); // Redirect to list after deletion
      } catch (err) {
        console.error("Failed to delete loyalty card:", err);
        // Handle error
      }
    }
  };

  const handleUpdate = async () => {
    if (!loyaltyCard) return;

    try {
      await updateLoyaltyCard.mutateAsync({
        id: cardId,
        payload: {
          name: editedName,
          description: editedDescription || undefined,
          cardData: editedCardData,
          customColor: editedCustomColor || undefined,
          barcodeFormat: editedBarcodeFormat,
        },
      });
      setIsEditing(false); // Exit edit mode
    } catch (err) {
      console.error("Failed to update loyalty card:", err);
      // Handle error
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Chargement de la carte...</div>;
  }

  if (isError || !loyaltyCard) {
    return (
      <div className="p-4 text-red-500 text-center">
        Erreur : {(error as Error)?.message || "Carte non trouvée."}
      </div>
    );
  }

  const storeName = storeMap[loyaltyCard.storeId] ?? loyaltyCard.storeId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/loyalty-cards")}
            data-cy="loyalty-back"
            className="text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Retour à la liste"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de la Carte de Fidélité
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            data-cy="loyalty-edit"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Modifier
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {isEditing ? (
          // Edit Form
          <>
            <div>
              <label htmlFor="editedName" className="block text-sm font-medium text-gray-700">
                Nom de la carte
              </label>
              <input
                type="text"
                id="editedName"
                data-cy="loyalty-edit-name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="editedDescription" className="block text-sm font-medium text-gray-700">
                Description <span className="font-normal text-gray-400">(optionnel)</span>
              </label>
              <input
                type="text"
                id="editedDescription"
                data-cy="loyalty-edit-description"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="editedCardData"
                className="block text-sm font-medium text-gray-700"
              >
                Numéro de Carte
              </label>
              <input
                type="text"
                id="editedCardData"
                data-cy="loyalty-edit-card-data"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={editedCardData}
                onChange={(e) => setEditedCardData(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="editedCustomColor"
                className="block text-sm font-medium text-gray-700"
              >
                Couleur Personnalisée (Hex)
              </label>
              <input
                type="text"
                id="editedCustomColor"
                data-cy="loyalty-edit-color"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={editedCustomColor}
                onChange={(e) => setEditedCustomColor(e.target.value)}
                placeholder="#RRGGBB"
              />
            </div>
            <div>
              <label
                htmlFor="editedBarcodeFormat"
                className="block text-sm font-medium text-gray-700"
              >
                Format de Code-barres
              </label>
              <select
                id="editedBarcodeFormat"
                data-cy="loyalty-edit-barcode-format"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={editedBarcodeFormat}
                onChange={(e) =>
                  setEditedBarcodeFormat(e.target.value as BarcodeFormat)
                }
              >
                {Object.values(BarcodeFormat).map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                data-cy="loyalty-cancel"
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                data-cy="loyalty-save"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                disabled={updateLoyaltyCard.isPending}
              >
                {updateLoyaltyCard.isPending ? "Mise à jour..." : "Sauvegarder"}
              </button>
            </div>
          </>
        ) : (
          // View Mode
          <>
            <p>
              <span className="font-semibold">Nom:</span> {loyaltyCard.name}
            </p>
            {loyaltyCard.description && (
              <p>
                <span className="font-semibold">Description:</span> {loyaltyCard.description}
              </p>
            )}
            <p>
              <span className="font-semibold">Magasin:</span> {storeName}
            </p>
            <p>
              <span className="font-semibold">Numéro de Carte:</span>{" "}
              {loyaltyCard.cardData}
            </p>
            <p>
              <span className="font-semibold">Format Code-barres:</span>{" "}
              {loyaltyCard.barcodeFormat}
            </p>
            {loyaltyCard.customColor && (
              <p>
                <span className="font-semibold">Couleur personnalisée:</span>{" "}
                {loyaltyCard.customColor}
              </p>
            )}

            <div className="mt-6">
              <LoyaltyCardDisplay
                cardData={loyaltyCard.cardData}
                barcodeFormat={loyaltyCard.barcodeFormat}
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleDelete}
                data-cy="loyalty-delete"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={deleteLoyaltyCard.isPending}
              >
                {deleteLoyaltyCard.isPending
                  ? "Suppression..."
                  : "Supprimer la carte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
