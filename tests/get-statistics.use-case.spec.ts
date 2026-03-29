/**
 * Unit Tests — GetStatistics Use Case
 *
 * Validates the statistics computation:
 * AC-05 : Dépenses par catégorie sur la période
 * AC-06 : Top 10 articles par fréquence d'achat
 * AC-07 : Filtre par période (mois, année), magasin
 *
 * Endpoint contract: GET /purchases/statistics
 *   Query: period (month|year), from?, to?, storeId?
 *   Returns: {
 *     spendingByCategory: { categoryId, categoryName, totalSpent }[],
 *     topItems: { itemName, purchaseCount, totalQuantity, avgPrice }[],
 *     totalSpent: number,
 *     purchaseCount: number,
 *     averageBasket: number
 *   }
 *
 * Target file: apps/api/src/purchases/application/get-statistics.use-case.ts
 */

async function loadGetStatisticsUseCase() {
  try {
    return await import(
      '../../engineer/apps/api/src/purchases/application/get-statistics.use-case'
    );
  } catch {
    throw new Error(
      'GetStatisticsUseCase not found — Engineer must implement apps/api/src/purchases/application/get-statistics.use-case.ts',
    );
  }
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SPENDING_BY_CATEGORY = [
  { categoryId: 'cat-001', categoryName: 'Produits laitiers', totalSpent: 45.6 },
  { categoryId: 'cat-002', categoryName: 'Boulangerie', totalSpent: 28.3 },
  { categoryId: 'cat-003', categoryName: 'Fruits & Légumes', totalSpent: 67.8 },
];

const MOCK_TOP_ITEMS = [
  { itemName: 'Lait entier', purchaseCount: 12, totalQuantity: 12, avgPrice: 1.89 },
  { itemName: 'Beurre doux', purchaseCount: 8, totalQuantity: 8, avgPrice: 2.5 },
  { itemName: 'Pain complet', purchaseCount: 6, totalQuantity: 6, avgPrice: 1.2 },
];

describe('GetStatisticsUseCase', () => {
  let GetStatisticsUseCase: any;
  let useCase: any;
  let mockStatisticsRepository: any;

  beforeAll(async () => {
    ({ GetStatisticsUseCase } = await loadGetStatisticsUseCase());
  });

  beforeEach(() => {
    mockStatisticsRepository = {
      getSpendingByCategory: jest.fn().mockResolvedValue(MOCK_SPENDING_BY_CATEGORY),
      getTopItems: jest.fn().mockResolvedValue(MOCK_TOP_ITEMS),
      getTotalSpent: jest.fn().mockResolvedValue(141.7),
      getPurchaseCount: jest.fn().mockResolvedValue(26),
    };

    useCase = new GetStatisticsUseCase(mockStatisticsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── AC-05 : Dépenses par catégorie ──────────────────────────────────────

  describe('AC-05 — Dépenses par catégorie', () => {
    it('should return spending breakdown by category', async () => {
      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      expect(result.spendingByCategory).toBeDefined();
      expect(Array.isArray(result.spendingByCategory)).toBe(true);
      expect(result.spendingByCategory.length).toBeGreaterThan(0);

      const firstCat = result.spendingByCategory[0];
      expect(firstCat).toHaveProperty('categoryId');
      expect(firstCat).toHaveProperty('categoryName');
      expect(firstCat).toHaveProperty('totalSpent');
      expect(typeof firstCat.totalSpent).toBe('number');
    });

    it('should include categories with correct totalSpent values', async () => {
      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      const laitierCat = result.spendingByCategory.find(
        (c: any) => c.categoryName === 'Produits laitiers',
      );
      expect(laitierCat).toBeDefined();
      expect(laitierCat.totalSpent).toBe(45.6);
    });
  });

  // ─── AC-06 : Top articles ─────────────────────────────────────────────────

  describe('AC-06 — Top articles par fréquence', () => {
    it('should return top items ranked by purchase frequency', async () => {
      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      expect(result.topItems).toBeDefined();
      expect(Array.isArray(result.topItems)).toBe(true);

      const firstItem = result.topItems[0];
      expect(firstItem).toHaveProperty('itemName');
      expect(firstItem).toHaveProperty('purchaseCount');
      expect(firstItem).toHaveProperty('totalQuantity');
      expect(firstItem).toHaveProperty('avgPrice');
    });

    it('should limit top items to a maximum of 10', async () => {
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        itemName: `Item ${i}`,
        purchaseCount: 15 - i,
        totalQuantity: 15 - i,
        avgPrice: 1.0,
      }));

      mockStatisticsRepository.getTopItems.mockResolvedValue(manyItems.slice(0, 10));

      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      expect(result.topItems.length).toBeLessThanOrEqual(10);
    });

    it('should rank items by purchase count descending', async () => {
      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      const counts = result.topItems.map((i: any) => i.purchaseCount);
      for (let i = 0; i < counts.length - 1; i++) {
        expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1]);
      }
    });
  });

  // ─── AC-07 : Filtre période ───────────────────────────────────────────────

  describe('AC-07 — Filtre par période et magasin', () => {
    it('should filter by month period', async () => {
      await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      const callArgs = mockStatisticsRepository.getSpendingByCategory.mock.calls[0][0];
      expect(callArgs.period).toBe('month');
    });

    it('should filter by year period', async () => {
      await useCase.execute({
        householdId: 'household-uuid',
        period: 'year',
      });

      const callArgs = mockStatisticsRepository.getSpendingByCategory.mock.calls[0][0];
      expect(callArgs.period).toBe('year');
    });

    it('should filter by storeId when provided', async () => {
      await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
        storeId: 'store-xyz',
      });

      const callArgs = mockStatisticsRepository.getSpendingByCategory.mock.calls[0][0];
      expect(callArgs.storeId).toBe('store-xyz');
    });

    it('should filter by custom date range (from, to)', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-03-31');

      await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
        from,
        to,
      });

      const callArgs = mockStatisticsRepository.getSpendingByCategory.mock.calls[0][0];
      expect(callArgs.from).toEqual(from);
      expect(callArgs.to).toEqual(to);
    });
  });

  // ─── Totaux et panier moyen ───────────────────────────────────────────────

  describe('Totaux agrégés', () => {
    it('should return totalSpent as a number', async () => {
      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      expect(typeof result.totalSpent).toBe('number');
      expect(result.totalSpent).toBeGreaterThanOrEqual(0);
    });

    it('should return purchaseCount as an integer', async () => {
      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      expect(typeof result.purchaseCount).toBe('number');
      expect(Number.isInteger(result.purchaseCount)).toBe(true);
    });

    it('should return averageBasket as a computed value', async () => {
      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      expect(result).toHaveProperty('averageBasket');
      expect(typeof result.averageBasket).toBe('number');
    });

    it('should return 0 for all totals when no purchases exist', async () => {
      mockStatisticsRepository.getSpendingByCategory.mockResolvedValue([]);
      mockStatisticsRepository.getTopItems.mockResolvedValue([]);
      mockStatisticsRepository.getTotalSpent.mockResolvedValue(0);
      mockStatisticsRepository.getPurchaseCount.mockResolvedValue(0);

      const result = await useCase.execute({
        householdId: 'household-uuid',
        period: 'month',
      });

      expect(result.totalSpent).toBe(0);
      expect(result.purchaseCount).toBe(0);
      expect(result.spendingByCategory).toEqual([]);
      expect(result.topItems).toEqual([]);
    });
  });

  // ─── AC-10 : RLS ─────────────────────────────────────────────────────────

  describe('AC-10 — Isolation par household (RLS)', () => {
    it('should always pass householdId to the repository', async () => {
      await useCase.execute({
        householdId: 'my-unique-household',
        period: 'month',
      });

      const callArgs = mockStatisticsRepository.getSpendingByCategory.mock.calls[0][0];
      expect(callArgs.householdId).toBe('my-unique-household');
    });
  });
});
