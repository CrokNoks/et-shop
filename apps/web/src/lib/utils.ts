// app_build/apps/web/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Placeholder for a function that would fetch store names from store IDs.
// In a real application, this would likely involve:
// 1. Fetching all stores once and storing them in a global state/context.
// 2. Or, making an API call to a /stores endpoint to get a specific store's details.
export function getStoreName(storeId: string): string {
  // This is a dummy implementation. Replace with actual logic.
  switch (storeId) {
    case "test-store-id-456":
      return "Magasin Test (456)";
    case "store-abc":
      return "Mon Supermarché";
    case "store-1":
      return "Boulangerie du coin";
    case "store-2":
      return "Pharmacie Principale";
    default:
      return `Magasin Inconnu (${storeId})`;
  }
}

// You can add other utility functions here.
