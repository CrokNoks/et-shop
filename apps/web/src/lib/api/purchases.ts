import { fetchApi } from "@/lib/api";

export interface PurchaseRecord {
  id: string;
  shoppingListItemId: string;
  listId: string;
  householdId: string;
  catalogItemId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  categoryId?: string;
  storeId?: string;
  purchasedAt: string;
  totalAmount: number;
}

export interface PaginatedPurchaseHistory {
  data: PurchaseRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
  itemCount: number;
}

export interface TopItem {
  catalogItemId: string;
  productName: string;
  purchaseCount: number;
  totalSpent: number;
}

export interface MonthStat {
  month: string;
  totalSpent: number;
  itemCount: number;
}

export interface PurchaseStatistics {
  totalSpent: number;
  totalItems: number;
  byCategory: CategoryStat[];
  topItems: TopItem[];
  byMonth: MonthStat[];
}

export interface PurchaseHistoryQuery {
  listId?: string;
  catalogItemId?: string;
  storeId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

export const purchasesApi = {
  async getHistory(query: PurchaseHistoryQuery = {}): Promise<PaginatedPurchaseHistory> {
    const qs = buildQueryString({
      listId: query.listId,
      catalogItemId: query.catalogItemId,
      storeId: query.storeId,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: query.limit,
    });
    return fetchApi(`/purchases/history${qs}`);
  },

  async getStatistics(from?: string, to?: string): Promise<PurchaseStatistics> {
    const qs = buildQueryString({ from, to });
    return fetchApi(`/purchases/statistics${qs}`);
  },

  async recordPurchase(listId: string, itemId: string, price?: number): Promise<PurchaseRecord> {
    return fetchApi(`/shopping-lists/${listId}/items/${itemId}/purchase`, {
      method: "PATCH",
      body: price !== undefined ? JSON.stringify({ price }) : JSON.stringify({}),
    });
  },

  async cancelPurchase(listId: string, itemId: string): Promise<void> {
    await fetchApi(`/shopping-lists/${listId}/items/${itemId}/unpurchase`, {
      method: "PATCH",
    });
  },
};
