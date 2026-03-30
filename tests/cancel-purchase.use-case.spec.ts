/**
 * Unit Tests — CancelPurchase Use Case
 *
 * Validates that cancelling a purchase:
 * 1. Sets is_purchased = false on shopping_list_items
 * 2. Deletes the corresponding purchase_record (always, no date restriction)
 *
 * AC-03 : L'utilisateur peut annuler un achat à tout moment.
 *         Le purchase_record est TOUJOURS supprimé, sans restriction de date.
 *
 * Target file: apps/api/src/purchases/application/cancel-purchase.use-case.ts
 */

import { NotFoundException } from '@nestjs/common';

interface CancelPurchaseDto {
  listId: string;
  itemId: string;
  householdId: string;
}

async function loadCancelPurchaseUseCase() {
  try {
    return await import(
      '../../engineer/apps/api/src/purchases/application/cancel-purchase.use-case'
    );
  } catch {
    throw new Error(
      'CancelPurchaseUseCase not found — Engineer must implement apps/api/src/purchases/application/cancel-purchase.use-case.ts',
    );
  }
}

describe('CancelPurchaseUseCase', () => {
  let CancelPurchaseUseCase: any;
  let useCase: any;
  let mockPurchaseRepository: any;
  let mockShoppingListRepository: any;

  beforeAll(async () => {
    ({ CancelPurchaseUseCase } = await loadCancelPurchaseUseCase());
  });

  beforeEach(() => {
    mockPurchaseRepository = {
      deleteByItemId: jest.fn().mockResolvedValue(undefined),
    };

    mockShoppingListRepository = {
      findItemById: jest.fn(),
      markItemAsPurchased: jest.fn(),
    };

    useCase = new CancelPurchaseUseCase(
      mockPurchaseRepository,
      mockShoppingListRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── AC-03 : Annulation ───────────────────────────────────────────────────

  describe('AC-03 — Annulation d\'un achat', () => {
    it('should set is_purchased = false on the shopping list item', async () => {
      mockShoppingListRepository.findItemById.mockResolvedValue({
        id: 'item-uuid',
        listId: 'list-uuid',
        isPurchased: true,
        name: 'Pain complet',
      });

      const dto: CancelPurchaseDto = {
        listId: 'list-uuid',
        itemId: 'item-uuid',
        householdId: 'household-uuid',
      };

      await useCase.execute(dto);

      expect(mockShoppingListRepository.markItemAsPurchased).toHaveBeenCalledWith(
        'item-uuid',
        false,
      );
    });

    it('should delete the purchase_record associated with the item', async () => {
      mockShoppingListRepository.findItemById.mockResolvedValue({
        id: 'item-uuid',
        listId: 'list-uuid',
        isPurchased: true,
        name: 'Fromage',
      });

      await useCase.execute({
        listId: 'list-uuid',
        itemId: 'item-uuid',
        householdId: 'household-uuid',
      });

      expect(mockPurchaseRepository.deleteByItemId).toHaveBeenCalled();
    });

    it('should delete purchase_record even for an old purchase (no date restriction)', async () => {
      // Simulate an item purchased 6 months ago
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 6);

      mockShoppingListRepository.findItemById.mockResolvedValue({
        id: 'item-old',
        listId: 'list-old',
        isPurchased: true,
        name: 'Ancien article',
        purchasedAt: oldDate,
      });

      // Should NOT throw — the spec says: "sans restriction de date"
      await expect(
        useCase.execute({
          listId: 'list-old',
          itemId: 'item-old',
          householdId: 'household-uuid',
        }),
      ).resolves.not.toThrow();

      expect(mockPurchaseRepository.deleteByItemId).toHaveBeenCalled();
    });

    it('should return nothing (void / 204 behavior)', async () => {
      mockShoppingListRepository.findItemById.mockResolvedValue({
        id: 'item-uuid',
        listId: 'list-uuid',
        isPurchased: true,
        name: 'Eau minérale',
      });

      const result = await useCase.execute({
        listId: 'list-uuid',
        itemId: 'item-uuid',
        householdId: 'household-uuid',
      });

      // Result should be undefined (void) for a 204 response
      expect(result).toBeUndefined();
    });
  });

  // ─── Error handling ───────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      mockShoppingListRepository.findItemById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          listId: 'list-uuid',
          itemId: 'nonexistent',
          householdId: 'household-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle gracefully when item is not currently purchased', async () => {
      mockShoppingListRepository.findItemById.mockResolvedValue({
        id: 'item-uuid',
        listId: 'list-uuid',
        isPurchased: false,
        name: 'Confiture',
      });

      // Should not throw — idempotent cancel is acceptable
      await expect(
        useCase.execute({
          listId: 'list-uuid',
          itemId: 'item-uuid',
          householdId: 'household-uuid',
        }),
      ).resolves.not.toThrow();
    });
  });
});
