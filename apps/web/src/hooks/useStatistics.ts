import { useQuery } from "@tanstack/react-query";
import { purchasesApi, PurchaseStatistics } from "@/lib/api/purchases";

const STATISTICS_KEY = "purchaseStatistics";

export function useStatistics(from?: string, to?: string) {
  return useQuery<PurchaseStatistics, Error>({
    queryKey: [STATISTICS_KEY, from, to],
    queryFn: () => purchasesApi.getStatistics(from, to),
  });
}
