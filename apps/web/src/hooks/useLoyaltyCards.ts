// app_build/apps/web/src/hooks/useLoyaltyCards.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loyaltyCardsApi,
  LoyaltyCardFrontend,
  CreateLoyaltyCardPayload,
  UpdateLoyaltyCardPayload,
} from "../lib/api/loyalty-cards";

const LOYALTY_CARDS_QUERY_KEY = "loyaltyCards";

export function useLoyaltyCards(storeIds?: string[]) {
  return useQuery<LoyaltyCardFrontend[], Error>({
    queryKey: [LOYALTY_CARDS_QUERY_KEY, storeIds],
    queryFn: () => loyaltyCardsApi.getLoyaltyCards(storeIds),
  });
}

export function useLoyaltyCard(cardId: string) {
  return useQuery<LoyaltyCardFrontend, Error>({
    queryKey: [LOYALTY_CARDS_QUERY_KEY, cardId],
    queryFn: () => loyaltyCardsApi.getLoyaltyCardById(cardId),
    enabled: !!cardId, // Only run query if cardId is available
  });
}

export function useCreateLoyaltyCard() {
  const queryClient = useQueryClient();
  return useMutation<LoyaltyCardFrontend, Error, CreateLoyaltyCardPayload>({
    mutationFn: loyaltyCardsApi.createLoyaltyCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_CARDS_QUERY_KEY] }); // Invalidate all loyalty cards queries
    },
  });
}

export function useUpdateLoyaltyCard() {
  const queryClient = useQueryClient();
  return useMutation<
    LoyaltyCardFrontend,
    Error,
    { id: string; payload: UpdateLoyaltyCardPayload }
  >({
    mutationFn: ({ id, payload }) =>
      loyaltyCardsApi.updateLoyaltyCard(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_CARDS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [LOYALTY_CARDS_QUERY_KEY, data.id],
      }); // Invalidate specific card query
    },
  });
}

export function useDeleteLoyaltyCard() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: loyaltyCardsApi.deleteLoyaltyCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_CARDS_QUERY_KEY] });
    },
  });
}
