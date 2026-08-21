// app_build/apps/web/src/hooks/useLoyaltyCards.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loyaltyCardsApi,
  LoyaltyCardFrontend,
  CreateLoyaltyCardPayload,
  UpdateLoyaltyCardPayload,
} from "@/lib/api/loyalty-cards";
import { getActiveHouseholdId } from "@/hooks/useHousehold";
import {
  getCachedLoyaltyCards,
  setCachedLoyaltyCards,
} from "@/lib/offline/db";

const LOYALTY_CARDS_QUERY_KEY = "loyaltyCards";

/**
 * Consultation uniquement hors ligne (pas d'ajout/modification hors ligne,
 * cf. Technical_Specification.md) : repli sur le cache IndexedDB écrit au
 * précache proactif du login ou à toute lecture réseau réussie.
 */
export function useLoyaltyCards(storeIds?: string[]) {
  // Un appel filtré (`useLoyaltyCards([storeId])`, utilisé par
  // `ShoppingList.tsx`, `stores/page.tsx`, `StoreLoyaltyCards.tsx`) ne
  // renvoie qu'un sous-ensemble des cartes du foyer. Écrire ce
  // sous-ensemble dans le cache écraserait le snapshot complet précaché au
  // login (`app/page.tsx`) — seul un appel SANS filtre est un snapshot
  // complet légitime à mettre en cache (cf. revue Code Reviewer,
  // correction #7).
  const isUnfiltered = !storeIds?.length;

  return useQuery<LoyaltyCardFrontend[], Error>({
    queryKey: [LOYALTY_CARDS_QUERY_KEY, storeIds],
    queryFn: async () => {
      const householdId = getActiveHouseholdId();
      try {
        const cards = await loyaltyCardsApi.getLoyaltyCards(storeIds);
        if (householdId && isUnfiltered) {
          setCachedLoyaltyCards(householdId, cards);
        }
        return cards;
      } catch (error) {
        if (householdId) {
          const cached = await getCachedLoyaltyCards(householdId);
          if (cached) {
            return storeIds && storeIds.length > 0
              ? cached.filter((card) => storeIds.includes(card.storeId))
              : cached;
          }
        }
        throw error;
      }
    },
  });
}

export function useLoyaltyCard(cardId: string) {
  return useQuery<LoyaltyCardFrontend, Error>({
    queryKey: [LOYALTY_CARDS_QUERY_KEY, cardId],
    queryFn: async () => {
      try {
        return await loyaltyCardsApi.getLoyaltyCardById(cardId);
      } catch (error) {
        // Repli hors ligne sur le snapshot complet précaché (login ou
        // dernière lecture non filtrée réussie) : c'est cet écran qui rend
        // le code-barres/QR scannable, `useLoyaltyCards` (liste) n'affiche
        // que les vignettes — cf. revue Code Reviewer, correction bloquante.
        const householdId = getActiveHouseholdId();
        if (householdId) {
          const cached = await getCachedLoyaltyCards(householdId);
          const match = cached?.find((card) => card.id === cardId);
          if (match) return match;
        }
        throw error;
      }
    },
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
