import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  purchasesApi,
  PaginatedPurchaseHistory,
  PurchaseHistoryQuery,
} from "@/lib/api/purchases";

const PURCHASE_HISTORY_KEY = "purchaseHistory";

export function usePurchaseHistory(query: PurchaseHistoryQuery = {}) {
  return useQuery<PaginatedPurchaseHistory, Error>({
    queryKey: [PURCHASE_HISTORY_KEY, query],
    queryFn: () => purchasesApi.getHistory(query),
  });
}

export function useRecordPurchase() {
  const queryClient = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof purchasesApi.recordPurchase>>,
    Error,
    { listId: string; itemId: string; price?: number }
  >({
    mutationFn: ({ listId, itemId, price }) =>
      purchasesApi.recordPurchase(listId, itemId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_HISTORY_KEY] });
    },
  });
}

export function useCancelPurchase() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { listId: string; itemId: string }>({
    mutationFn: ({ listId, itemId }) => purchasesApi.cancelPurchase(listId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_HISTORY_KEY] });
    },
  });
}
