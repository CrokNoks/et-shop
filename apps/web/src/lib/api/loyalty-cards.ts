// app_build/apps/web/src/lib/api/loyalty-cards.ts

import { createBrowserClient } from "@supabase/ssr";
import { BarcodeFormat, LoyaltyCardFrontend } from "../../types/loyalty-card";
export type { BarcodeFormat, LoyaltyCardFrontend };
import { config } from "../../config";

// DTOs for frontend requests
export interface CreateLoyaltyCardPayload {
  storeId: string;
  name: string;
  description?: string;
  cardData: string;
  barcodeFormat: BarcodeFormat;
  customColor?: string;
}

export interface UpdateLoyaltyCardPayload {
  name?: string;
  description?: string;
  cardData?: string;
  barcodeFormat?: BarcodeFormat;
  customColor?: string;
}

async function getAuthToken(): Promise<string | null> {
  const supabase = createBrowserClient(config.supabaseUrl!, config.supabaseAnonKey!, {
    cookieOptions: { name: "__session" },
  });
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function fetchApi<T>(
  method: string,
  path: string,
  body?: object,
  params?: Record<string, string | number | boolean | string[]>,
): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error(
      "Authentication token not found. User might not be logged in.",
    );
  }

  const url = new URL(`${config.apiUrl}${path}`);
  if (params) {
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        if (Array.isArray(params[key])) {
          url.searchParams.append(key, params[key].join(",")); // Join array for comma-separated string
        } else {
          url.searchParams.append(key, String(params[key]));
        }
      }
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  // Handle DELETE (204 No Content) explicitly to avoid JSON parsing error
  if (response.status === 204) {
    return null as T; // Or undefined, depending on preference
  }

  return response.json();
}

export const loyaltyCardsApi = {
  async createLoyaltyCard(
    payload: CreateLoyaltyCardPayload,
  ): Promise<LoyaltyCardFrontend> {
    return fetchApi<LoyaltyCardFrontend>("POST", "/loyalty-cards", payload);
  },

  async getLoyaltyCards(storeIds?: string[]): Promise<LoyaltyCardFrontend[]> {
    return fetchApi<LoyaltyCardFrontend[]>("GET", "/loyalty-cards", undefined, {
      storeIds,
    });
  },

  async getLoyaltyCardById(id: string): Promise<LoyaltyCardFrontend> {
    return fetchApi<LoyaltyCardFrontend>("GET", `/loyalty-cards/${id}`);
  },

  async updateLoyaltyCard(
    id: string,
    payload: UpdateLoyaltyCardPayload,
  ): Promise<LoyaltyCardFrontend> {
    return fetchApi<LoyaltyCardFrontend>(
      "PUT",
      `/loyalty-cards/${id}`,
      payload,
    );
  },

  async deleteLoyaltyCard(id: string): Promise<void> {
    return fetchApi<void>("DELETE", `/loyalty-cards/${id}`);
  },
};
