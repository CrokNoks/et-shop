import { PurchaseRecord } from './purchase-record.entity';

describe('PurchaseRecord Entity', () => {
  const baseProps = {
    shoppingListItemId: 'item-001',
    listId: 'list-001',
    householdId: 'household-001',
    catalogItemId: 'catalog-001',
    productName: 'Lait entier',
    quantity: 2,
    unit: 'L',
    price: 1.5,
    categoryId: 'cat-001',
    storeId: 'store-001',
  };

  describe('create()', () => {
    it('should create a PurchaseRecord with a generated UUID', () => {
      const record = PurchaseRecord.create(baseProps);

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(typeof record.id).toBe('string');
      expect(record.id.length).toBeGreaterThan(0);
    });

    it('should use a provided id', () => {
      const customId = 'custom-uuid-123';
      const record = PurchaseRecord.create(baseProps, customId);
      expect(record.id).toBe(customId);
    });

    it('should set purchasedAt to now', () => {
      const before = new Date();
      const record = PurchaseRecord.create(baseProps);
      const after = new Date();

      expect(record.purchasedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(record.purchasedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should expose all properties correctly', () => {
      const record = PurchaseRecord.create(baseProps);

      expect(record.shoppingListItemId).toBe(baseProps.shoppingListItemId);
      expect(record.listId).toBe(baseProps.listId);
      expect(record.householdId).toBe(baseProps.householdId);
      expect(record.catalogItemId).toBe(baseProps.catalogItemId);
      expect(record.productName).toBe(baseProps.productName);
      expect(record.quantity).toBe(baseProps.quantity);
      expect(record.unit).toBe(baseProps.unit);
      expect(record.price).toBe(baseProps.price);
      expect(record.categoryId).toBe(baseProps.categoryId);
      expect(record.storeId).toBe(baseProps.storeId);
    });

    it('should compute totalAmount as price * quantity', () => {
      const record = PurchaseRecord.create(baseProps);
      expect(record.totalAmount).toBe(baseProps.price * baseProps.quantity);
    });

    it('should work without optional fields', () => {
      const record = PurchaseRecord.create({
        shoppingListItemId: 'item-002',
        listId: 'list-002',
        householdId: 'household-002',
        catalogItemId: 'catalog-002',
        productName: 'Pain',
        quantity: 1,
        unit: 'pcs',
        price: 2.0,
      });

      expect(record.categoryId).toBeUndefined();
      expect(record.storeId).toBeUndefined();
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a record from persisted data', () => {
      const persistedDate = new Date('2026-01-15T10:00:00Z');
      const record = PurchaseRecord.reconstitute({
        id: 'existing-id',
        purchasedAt: persistedDate,
        ...baseProps,
      });

      expect(record.id).toBe('existing-id');
      expect(record.purchasedAt).toEqual(persistedDate);
    });
  });

  describe('toJSON()', () => {
    it('should return a plain object with all properties', () => {
      const record = PurchaseRecord.create(baseProps, 'test-id');
      const json = record.toJSON();

      expect(json.id).toBe('test-id');
      expect(json.productName).toBe(baseProps.productName);
      expect(json.quantity).toBe(baseProps.quantity);
      expect(json.price).toBe(baseProps.price);
    });
  });
});
