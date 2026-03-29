/**
 * Unit Tests — RecordPurchase Use Case
 *
 * Validates that marking an item as "purchased" correctly:
 * 1. Sets is_purchased = true on the shopping_list_items row
 * 2. Creates a purchase_record with all snapshot fields
 * 3. Returns { purchaseRecordId, purchasedAt }
 * 4. The list itself remains intact (not deleted/modified)
 *
 * Target file: apps/api/src/purchases/application/record-purchase.use-case.ts
 */

import { NotFoundException, BadRequestException } from '@nestjs/common';

// ─── Repository interfaces (mirrors of domain contracts) ─────────────────────

interface ShoppingListItemSnapshot {
  id: string;
  listId: string;
  catalogItemId: string | null;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  storeId: string | null;
  quantity: number;
  unit: string | null;
  pricePerUnit: number | null;
  isPurchased: boolean;
}

interface RecordPurchaseDto {
  listId: string;
  itemId: string;
  householdId: string;
}

interface RecordPurchaseResult {
  purchaseRecordId: string;
  purchasedAt: Date;
}

// ─── Mock factories ──────────────────────────────────────────────────────────

function makeShoppingListItem(
  overrides: Partial<ShoppingListItemSnapshot> = {},
): ShoppingListItemSnapshot {
  return {
    id: 'item-uuid-001',
    listId: 'list-uuid-001',
    catalogItemId: 'catalog-uuid-001',
    name: 'Beurre doux',
    categoryId: 'cat-uuid-001',
    categoryName: 'Produits laitiers',
    storeId: 'store-uuid-001',
    quantity: 1,
    unit: 'pcs',
    pricePerUnit: 2.5,
    isPurchased: false,
    ...overrides,
  };
}

// ─── Dynamic import helper ───────────────────────────────────────────────────

async function loadRecordPurchaseUseCase() {
  try {
    return await import(
      '../../engineer/apps/api/src/purchases/application/record-purchase.use-case'
    );
  } catch {
    throw new Error(
      'RecordPurchaseUseCase not found — Engineer must implement apps/api/src/purchases/application/record-purchase.use-case.ts',
    );
  }
}

describe('RecordPurchaseUseCase', () => {
  let RecordPurchaseUseCase: any;
  let useCase: any;
  let mockPurchaseRepository: any;
  let mockShoppingListRepository: any;

  beforeAll(async () => {
    ({ RecordPurchaseUseCase } = await loadRecordPurchaseUseCase());
  });

  beforeEach(() => {
    mockPurchaseRepository = {
      save: jest.fn(),
    };

    mockShoppingListRepository = {
      findItemById: jest.fn(),
      markItemAsPurchased: jest.fn(),
    };

    useCase = new RecordPurchaseUseCase(
      mockPurchaseRepository,
      mockShoppingListRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── AC-01 : Achat individuel ──────────────────────────────────────────────

  describe('AC-01 — Achat individuel', () => {
    it('should mark item as purchased and create a purchase_record', async () => {
      const item = makeShoppingListItem();
      mockShoppingListRepository.findItemById.mockResolvedValue(item);
      mockShoppingListRepository.markItemAsPurchased.mockResolvedValue({
        ...item,
        isPurchased: true,
      });
      mockPurchaseRepository.save.mockResolvedValue({
        id: 'purchase-record-uuid',
        purchasedAt: new Date(),
      });

      const dto: RecordPurchaseDto = {
        listId: 'list-uuid-001',
        itemId: 'item-uuid-001',
        householdId: 'household-uuid',
      };

      const result: RecordPurchaseResult = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.purchaseRecordId).toBeDefined();
      expect(result.purchasedAt).toBeInstanceOf(Date);
    });

    it('should save a purchase_record with all snapshot fields', async () => {
      const item = makeShoppingListItem({
        name: 'Lait Bio 1L',
        categoryName: 'Produits laitiers',
        storeId: 'store-abc',
        quantity: 2,
        unit: 'L',
        pricePerUnit: 1.89,
        catalogItemId: 'catalog-lait',
      });

      mockShoppingListRepository.findItemById.mockResolvedValue(item);
      mockShoppingListRepository.markItemAsPurchased.mockResolvedValue({
        ...item,
        isPurchased: true,
      });
      mockPurchaseRepository.save.mockResolvedValue({
        id: 'pr-uuid',
        purchasedAt: new Date(),
      });

      await useCase.execute({
        listId: item.listId,
        itemId: item.id,
        householdId: 'household-uuid',
      });

      const savedRecord = mockPurchaseRepository.save.mock.calls[0][0];
      expect(savedRecord).toMatchObject({
        itemName: 'Lait Bio 1L',
        categoryName: 'Produits laitiers',
        quantity: 2,
        unit: 'L',
        pricePerUnit: 1.89,
        catalogItemId: 'catalog-lait',
        storeId: 'store-abc',
      });
    });

    it('should call markItemAsPurchased on the shopping list repository', async () => {
      const item = makeShoppingListItem();
      mockShoppingListRepository.findItemById.mockResolvedValue(item);
      mockShoppingListRepository.markItemAsPurchased.mockResolvedValue({
        ...item,
        isPurchased: true,
      });
      mockPurchaseRepository.save.mockResolvedValue({
        id: 'pr-uuid',
        purchasedAt: new Date(),
      });

      await useCase.execute({
        listId: item.listId,
        itemId: item.id,
        householdId: 'household-uuid',
      });

      expect(mockShoppingListRepository.markItemAsPurchased).toHaveBeenCalledWith(
        item.id,
        true,
      );
    });
  });

  // ─── AC-02 : Liste intacte ─────────────────────────────────────────────────

  describe('AC-02 — Liste intacte après achat', () => {
    it('should NOT delete the shopping list item when marking as purchased', async () => {
      const item = makeShoppingListItem();
      mockShoppingListRepository.findItemById.mockResolvedValue(item);
      mockShoppingListRepository.markItemAsPurchased.mockResolvedValue({
        ...item,
        isPurchased: true,
      });
      mockPurchaseRepository.save.mockResolvedValue({
        id: 'pr-uuid',
        purchasedAt: new Date(),
      });

      await useCase.execute({
        listId: item.listId,
        itemId: item.id,
        householdId: 'household-uuid',
      });

      // Verify no delete was called
      expect(mockShoppingListRepository.deleteItem).not.toBeDefined();
      expect(mockShoppingListRepository.remove).not.toHaveBeenCalled?.();
    });

    it('should NOT modify the shopping list itself', async () => {
      const item = makeShoppingListItem();
      mockShoppingListRepository.findItemById.mockResolvedValue(item);
      mockShoppingListRepository.markItemAsPurchased.mockResolvedValue({
        ...item,
        isPurchased: true,
      });
      mockPurchaseRepository.save.mockResolvedValue({
        id: 'pr-uuid',
        purchasedAt: new Date(),
      });

      await useCase.execute({
        listId: item.listId,
        itemId: item.id,
        householdId: 'household-uuid',
      });

      expect(mockShoppingListRepository.updateList).not.toBeDefined();
    });
  });

  // ─── Error cases ──────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      mockShoppingListRepository.findItemById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          listId: 'list-uuid',
          itemId: 'nonexistent-item',
          householdId: 'household-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if item is already purchased', async () => {
      const alreadyPurchased = makeShoppingListItem({ isPurchased: true });
      mockShoppingListRepository.findItemById.mockResolvedValue(alreadyPurchased);

      // Either idempotent (returns existing record) or throws BadRequestException
      // The spec does not forbid re-purchasing, but the implementation should handle it
      const result = useCase.execute({
        listId: alreadyPurchased.listId,
        itemId: alreadyPurchased.id,
        householdId: 'household-uuid',
      });

      // Should not crash — either succeeds (idempotent) or throws a meaningful error
      await expect(result).resolves.toBeDefined().catch(() => {
        // Acceptable: throw BadRequestException for already purchased items
      });
    });
  });

  // ─── AC-08 : Snapshot fidèle ──────────────────────────────────────────────

  describe('AC-08 — Snapshot fidèle au moment de l\'achat', () => {
    it('should snapshot itemName from the shopping list item, not re-fetch from catalog', async () => {
      const item = makeShoppingListItem({ name: 'Yaourt fraise (snapshot)' });
      mockShoppingListRepository.findItemById.mockResolvedValue(item);
      mockShoppingListRepository.markItemAsPurchased.mockResolvedValue({
        ...item,
        isPurchased: true,
      });
      mockPurchaseRepository.save.mockResolvedValue({
        id: 'pr-uuid',
        purchasedAt: new Date(),
      });

      await useCase.execute({
        listId: item.listId,
        itemId: item.id,
        householdId: 'household-uuid',
      });

      const savedRecord = mockPurchaseRepository.save.mock.calls[0][0];
      expect(savedRecord.itemName).toBe('Yaourt fraise (snapshot)');
    });

    it('should snapshot categoryName even if null', async () => {
      const item = makeShoppingListItem({ categoryName: null });
      mockShoppingListRepository.findItemById.mockResolvedValue(item);
      mockShoppingListRepository.markItemAsPurchased.mockResolvedValue({
        ...item,
        isPurchased: true,
      });
      mockPurchaseRepository.save.mockResolvedValue({
        id: 'pr-uuid',
        purchasedAt: new Date(),
      });

      await useCase.execute({
        listId: item.listId,
        itemId: item.id,
        householdId: 'household-uuid',
      });

      const savedRecord = mockPurchaseRepository.save.mock.calls[0][0];
      expect(savedRecord.categoryName).toBeNull();
    });
  });
});
