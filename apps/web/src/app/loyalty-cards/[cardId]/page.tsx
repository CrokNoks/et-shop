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
  const [editedDescription, setEditedDescription] = useState(
    loyaltyCard?.description || "",
  );
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

  const labelClass =
    "block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]";
  const fieldClass =
    "mt-1.5 block w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 py-2.5 text-[15px] font-medium text-[var(--es-ink)] focus:border-[#FF6B35] focus:outline-none";

  if (isLoading) {
    return (
      <div className="p-4 text-center text-[var(--es-secondary)]">
        Chargement de la carte...
      </div>
    );
  }

  if (isError || !loyaltyCard) {
    return (
      <div className="p-4 text-center text-[var(--es-danger)]">
        Erreur : {(error as Error)?.message || "Carte non trouvée."}
      </div>
    );
  }

  const storeName = storeMap[loyaltyCard.storeId] ?? loyaltyCard.storeId;

  return (
    <div className="flex flex-col gap-6 text-[var(--es-ink)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/loyalty-cards")}
            data-cy="loyalty-back"
            className="text-[var(--es-secondary)] transition-colors hover:text-[var(--es-ink)]"
            aria-label="Retour à la liste"
          >
            ←
          </button>
          <h1 className="text-[22px] font-semibold">
            Détails de la Carte de Fidélité
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            data-cy="loyalty-edit"
            className="rounded-[10px] bg-[var(--es-banner)] px-4 py-2 text-[13px] font-semibold text-white"
          >
            Modifier
          </button>
        )}
      </div>

      <div className="space-y-4 rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] p-6">
        {isEditing ? (
          // Edit Form
          <>
            <div>
              <label htmlFor="editedName" className={labelClass}>
                Nom de la carte
              </label>
              <input
                type="text"
                id="editedName"
                data-cy="loyalty-edit-name"
                className={fieldClass}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="editedDescription" className={labelClass}>
                Description{" "}
                <span className="font-normal normal-case text-[var(--es-tertiary)]">
                  (optionnel)
                </span>
              </label>
              <input
                type="text"
                id="editedDescription"
                data-cy="loyalty-edit-description"
                className={fieldClass}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="editedCardData" className={labelClass}>
                Numéro de Carte
              </label>
              <input
                type="text"
                id="editedCardData"
                data-cy="loyalty-edit-card-data"
                className={`${fieldClass} font-mono`}
                value={editedCardData}
                onChange={(e) => setEditedCardData(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="editedCustomColor" className={labelClass}>
                Couleur Personnalisée (Hex)
              </label>
              <input
                type="text"
                id="editedCustomColor"
                data-cy="loyalty-edit-color"
                className={`${fieldClass} font-mono`}
                value={editedCustomColor}
                onChange={(e) => setEditedCustomColor(e.target.value)}
                placeholder="#RRGGBB"
              />
            </div>
            <div>
              <label htmlFor="editedBarcodeFormat" className={labelClass}>
                Format de Code-barres
              </label>
              <select
                id="editedBarcodeFormat"
                data-cy="loyalty-edit-barcode-format"
                className={fieldClass}
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
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                data-cy="loyalty-cancel"
                className="rounded-[10px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-4 py-2 text-[13px] font-semibold text-[var(--es-ink)]"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                data-cy="loyalty-save"
                className="rounded-[10px] bg-[var(--es-banner)] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
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
                <span className="font-semibold">Description:</span>{" "}
                {loyaltyCard.description}
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

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDelete}
                data-cy="loyalty-delete"
                className="rounded-[10px] border border-[rgba(179,38,30,0.4)] px-4 py-2 text-[13px] font-semibold text-[var(--es-danger)] disabled:opacity-50"
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
