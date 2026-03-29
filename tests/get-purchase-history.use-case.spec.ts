/**
 * Unit Tests — GetPurchaseHistory Use Case
 *
 * Validates the purchase history query with pagination and filters.
 *
 * AC-04 : /historique liste tous les achats par date décroissante,
 *         filtrables par produit, catégorie ou magasin.
 *
 * Target file: apps/api/src/purchases/application/get-purchase-history.use-case.ts
 * DTO file:    apps/api/src/purchases/application/dtos/purchase-history-query.dto.ts
 *
 * Endpoint contract: GET /purchases
 *   Query: page?, limit?, catalogItemId?, categoryId?, storeId?, from?, to?
 *   Returns: { data: PurchaseRecord[], total: number, page: number, limit: number }
 */

async function loadGetPurchaseHistoryUseCase() {
  try {
    return await import(
      '../../engineer/apps/api/src/purchases/application/get-purchase-history.use-case'
    );
  } catch {
    throw new Error(
      'GetPurchaseHistoryUseCase not found — Engineer must implement apps/api/src/purchases/application/get-purchase-history.use-case.ts',
    );
  }
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function makePurchaseRecord(overrides: Record<string, any> = {}) {
  return {
    id: `pr-${Math.random().toString(36).slice(2)}`,
    householdId: 'household-uuid',
    catalogItemId: 'cat-item-001',
    itemName: 'Beurre doux',
    categoryId: 'cat-001',
    categoryName: 'Produits laitiers',
    storeId: 'store-001',
    listId: 'list-001',
    quantity: 1,
    unit: 'pcs',
    pricePerUnit: 2.5,
    purchasedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

describe('GetPurchaseHistoryUseCase', () => {
  let GetPurchaseHistoryUseCase: any;
  let useCase: any;
  let mockPurchaseRepository: any;

  beforeAll(async () => {
    ({ GetPurchaseHistoryUseCase } = await loadGetPurchaseHistoryUseCase());
  });

  beforeEach(() => {
    mockPurchaseRepository = {
      findAll: jest.fn(),
    };

    useCase = new GetPurchaseHistoryUseCase(mockPurchaseRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── AC-04 : Historique paginé ────────────────────────────────────────────

  describe('AC-04 — Historique des achats', () => {
    it('should return paginated purchase history', async () => {
      const records = [
        makePurchaseRecord({ purchasedAt: new Date('2026-03-01') }),
        makePurchaseRecord({ purchasedAt: new Date('2026-02-15') }),
        makePurchaseRecord({ purchasedAt: new Date('2026-01-20') }),
      ];

      mockPurchaseRepository.findAll.mockResolvedValue({
        data: records,
        total: 3,
        page: 1,
        limit: 20,
      });

      const result = await useCase.execute({
        householdId: 'household-uuid',
        page: 1,
        limit: 20,
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should return results sorted by date descending', async () => {
      const date1 = new Date('2026-03-01');
      const date2 = new Date('2026-02-01');
      const date3 = new Date('2026-01-01');

      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [
          makePurchaseRecord({ purchasedAt: date1 }),
          makePurchaseRecord({ purchasedAt: date2 }),
          makePurchaseRecord({ purchasedAt: date3 }),
        ],
        total: 3,
        page: 1,
        limit: 20,
      });

      const result = await useCase.execute({
        householdId: 'household-uuid',
        page: 1,
        limit: 20,
      });

      // Verify descending order
      const dates = result.data.map((r: any) => r.purchasedAt.getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should pass catalogItemId filter to repository', async () => {
      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await useCase.execute({
        householdId: 'household-uuid',
        page: 1,
        limit: 20,
        catalogItemId: 'specific-item-uuid',
      });

      const callArgs = mockPurchaseRepository.findAll.mock.calls[0][0];
      expect(callArgs.catalogItemId).toBe('specific-item-uuid');
    });

    it('should pass categoryId filter to repository', async () => {
      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await useCase.execute({
        householdId: 'household-uuid',
        page: 1,
        limit: 20,
        categoryId: 'category-uuid',
      });

      const callArgs = mockPurchaseRepository.findAll.mock.calls[0][0];
      expect(callArgs.categoryId).toBe('category-uuid');
    });

    it('should pass storeId filter to repository', async () => {
      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await useCase.execute({
        householdId: 'household-uuid',
        page: 1,
        limit: 20,
        storeId: 'store-uuid',
      });

      const callArgs = mockPurchaseRepository.findAll.mock.calls[0][0];
      expect(callArgs.storeId).toBe('store-uuid');
    });

    it('should pass date range filters (from, to) to repository', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-03-31');

      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await useCase.execute({
        householdId: 'household-uuid',
        page: 1,
        limit: 20,
        from,
        to,
      });

      const callArgs = mockPurchaseRepository.findAll.mock.calls[0][0];
      expect(callArgs.from).toEqual(from);
      expect(callArgs.to).toEqual(to);
    });

    it('should use default pagination values when not provided', async () => {
      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await useCase.execute({ householdId: 'household-uuid' });

      const callArgs = mockPurchaseRepository.findAll.mock.calls[0][0];
      expect(callArgs.page).toBeDefined();
      expect(callArgs.limit).toBeDefined();
      expect(callArgs.page).toBeGreaterThanOrEqual(1);
      expect(callArgs.limit).toBeGreaterThanOrEqual(1);
    });

    it('should always pass householdId to repository for RLS isolation', async () => {
      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await useCase.execute({ householdId: 'my-household' });

      const callArgs = mockPurchaseRepository.findAll.mock.calls[0][0];
      expect(callArgs.householdId).toBe('my-household');
    });

    it('should return empty array when no records match', async () => {
      mockPurchaseRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const result = await useCase.execute({
        householdId: 'household-uuid',
        catalogItemId: 'item-never-bought',
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
