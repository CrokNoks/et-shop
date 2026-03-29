/**
 * Unit Tests — PurchaseRecord Domain Entity
 *
 * Validates the business rules of the PurchaseRecord domain entity
 * as defined in the Technical Specification.
 *
 * Target file: apps/api/src/purchases/domain/purchase-record.entity.ts
 */

// ─── Type mirror (will be implemented by Engineer) ───────────────────────────
// These interfaces mirror the contracts from Technical_Specification.md.
// Tests are written against these contracts — they will fail until the Engineer
// implements the corresponding files.

interface PurchaseRecordProps {
  id: string;
  householdId: string;
  catalogItemId: string | null;
  itemName: string;
  categoryId: string | null;
  categoryName: string | null;
  storeId: string | null;
  listId: string | null;
  quantity: number;
  unit: string | null;
  pricePerUnit: number | null;
  purchasedAt: Date;
}

// Dynamic import helper — allows tests to run even before the file exists,
// producing clear error messages instead of crashing the test suite.
async function loadPurchaseRecord() {
  try {
    return await import(
      '../../engineer/apps/api/src/purchases/domain/purchase-record.entity'
    );
  } catch {
    throw new Error(
      'PurchaseRecord entity not found at apps/api/src/purchases/domain/purchase-record.entity.ts — Engineer must implement it.',
    );
  }
}

describe('PurchaseRecord Entity', () => {
  let PurchaseRecord: any;

  beforeAll(async () => {
    ({ PurchaseRecord } = await loadPurchaseRecord());
  });

  const baseProps: Omit<PurchaseRecordProps, 'id' | 'purchasedAt'> = {
    householdId: 'household-abc',
    catalogItemId: 'catalog-item-uuid',
    itemName: 'Lait entier Bio',
    categoryId: 'category-uuid',
    categoryName: 'Produits laitiers',
    storeId: 'store-uuid',
    listId: 'list-uuid',
    quantity: 2,
    unit: 'L',
    pricePerUnit: 1.89,
  };

  describe('create()', () => {
    it('should create a PurchaseRecord with all provided props', () => {
      const record = PurchaseRecord.create(baseProps);

      expect(record).toBeDefined();
      expect(record.householdId).toBe(baseProps.householdId);
      expect(record.itemName).toBe(baseProps.itemName);
      expect(record.quantity).toBe(baseProps.quantity);
      expect(record.unit).toBe(baseProps.unit);
      expect(record.pricePerUnit).toBe(baseProps.pricePerUnit);
      expect(record.categoryName).toBe(baseProps.categoryName);
      expect(record.storeId).toBe(baseProps.storeId);
      expect(record.listId).toBe(baseProps.listId);
    });

    it('should auto-generate an id if none is provided', () => {
      const record = PurchaseRecord.create(baseProps);

      expect(record.id).toBeDefined();
      expect(typeof record.id).toBe('string');
      expect(record.id.length).toBeGreaterThan(0);
    });

    it('should use provided id when given', () => {
      const customId = 'custom-id-12345';
      const record = PurchaseRecord.create(baseProps, customId);

      expect(record.id).toBe(customId);
    });

    it('should set purchasedAt to a recent date by default', () => {
      const before = new Date();
      const record = PurchaseRecord.create(baseProps);
      const after = new Date();

      expect(record.purchasedAt).toBeDefined();
      expect(record.purchasedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(record.purchasedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should accept null catalogItemId for anonymous items', () => {
      const record = PurchaseRecord.create({ ...baseProps, catalogItemId: null });

      expect(record.catalogItemId).toBeNull();
    });

    it('should accept null categoryId and categoryName', () => {
      const record = PurchaseRecord.create({
        ...baseProps,
        categoryId: null,
        categoryName: null,
      });

      expect(record.categoryId).toBeNull();
      expect(record.categoryName).toBeNull();
    });

    it('should accept null storeId', () => {
      const record = PurchaseRecord.create({ ...baseProps, storeId: null });

      expect(record.storeId).toBeNull();
    });

    it('should accept null listId', () => {
      const record = PurchaseRecord.create({ ...baseProps, listId: null });

      expect(record.listId).toBeNull();
    });

    it('should accept null pricePerUnit', () => {
      const record = PurchaseRecord.create({ ...baseProps, pricePerUnit: null });

      expect(record.pricePerUnit).toBeNull();
    });

    it('should accept null unit', () => {
      const record = PurchaseRecord.create({ ...baseProps, unit: null });

      expect(record.unit).toBeNull();
    });

    it('should throw or reject when itemName is empty', () => {
      const createEmpty = () => PurchaseRecord.create({ ...baseProps, itemName: '' });
      expect(createEmpty).toThrow();
    });

    it('should throw or reject when householdId is empty', () => {
      const createEmpty = () =>
        PurchaseRecord.create({ ...baseProps, householdId: '' });
      expect(createEmpty).toThrow();
    });

    it('should throw or reject when quantity is zero or negative', () => {
      const createZero = () => PurchaseRecord.create({ ...baseProps, quantity: 0 });
      const createNeg = () => PurchaseRecord.create({ ...baseProps, quantity: -1 });
      expect(createZero).toThrow();
      expect(createNeg).toThrow();
    });
  });

  describe('snapshot integrity', () => {
    it('should preserve itemName as a snapshot (cannot be mutated)', () => {
      const record = PurchaseRecord.create(baseProps);
      const originalName = record.itemName;

      // PurchaseRecord is immutable — there's no update() method
      // This test verifies the entity has no mutation capabilities for snapshot fields
      expect(typeof (record as any).updateItemName).toBe('undefined');
      expect(record.itemName).toBe(originalName);
    });

    it('should preserve categoryName as a snapshot (cannot be mutated)', () => {
      const record = PurchaseRecord.create(baseProps);

      expect(typeof (record as any).updateCategoryName).toBe('undefined');
      expect(record.categoryName).toBe(baseProps.categoryName);
    });
  });

  describe('toJSON()', () => {
    it('should serialize all properties to a plain object', () => {
      const record = PurchaseRecord.create(baseProps);
      const json = record.toJSON();

      expect(json).toMatchObject({
        id: expect.any(String),
        householdId: baseProps.householdId,
        itemName: baseProps.itemName,
        quantity: baseProps.quantity,
        unit: baseProps.unit,
        pricePerUnit: baseProps.pricePerUnit,
        categoryName: baseProps.categoryName,
        purchasedAt: expect.any(Date),
      });
    });
  });
});
