import { LoyaltyCard, LoyaltyCardProps } from './loyalty-card.entity';
import { BarcodeFormat } from './barcode-format.enum';

describe('LoyaltyCard Entity', () => {
  const MOCK_DATE = new Date('2026-03-26T10:00:00.000Z');
  const MOCK_UPDATED_DATE = new Date('2026-03-26T10:00:00.001Z'); // A slight difference

  // Use Jest's fake timers to control Date
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const commonProps: Omit<LoyaltyCardProps, 'id' | 'createdAt' | 'updatedAt'> =
    {
      userId: 'test-user-id',
      storeId: 'test-store-id',
      cardData: '1234567890',
      barcodeFormat: BarcodeFormat.CODE_128,
    };

  it('should create a new LoyaltyCard instance', () => {
    jest.setSystemTime(MOCK_DATE); // Set time for creation
    const card = LoyaltyCard.create(commonProps);

    expect(card).toBeDefined();
    expect(card.id).toBeDefined();
    expect(typeof card.id).toBe('string');
    expect(card.userId).toBe(commonProps.userId);
    expect(card.storeId).toBe(commonProps.storeId);
    expect(card.cardData).toBe(commonProps.cardData);
    expect(card.barcodeFormat).toBe(commonProps.barcodeFormat);
    expect(card.createdAt).toEqual(MOCK_DATE); // Expect exact date
    expect(card.updatedAt).toEqual(MOCK_DATE); // Expect exact date
  });

  it('should create a LoyaltyCard with a provided ID', () => {
    const customId = 'custom-card-id';
    jest.setSystemTime(MOCK_DATE);
    const card = LoyaltyCard.create(commonProps, customId);

    expect(card.id).toBe(customId);
  });

  it('should update the LoyaltyCard properties and updatedAt timestamp', () => {
    jest.setSystemTime(MOCK_DATE);
    const card = LoyaltyCard.create(commonProps);
    const initialUpdatedAt = card.updatedAt;

    jest.setSystemTime(MOCK_UPDATED_DATE); // Advance time for update
    const newProps = {
      cardData: '0987654321',
      customColor: '#FF0000',
    };

    card.update(newProps);

    expect(card.cardData).toBe(newProps.cardData);
    expect(card.customColor).toBe(newProps.customColor);
    expect(card.updatedAt).toEqual(MOCK_UPDATED_DATE); // Expect exact updated date
    expect(card.updatedAt.getTime()).toBeGreaterThan(
      initialUpdatedAt.getTime(),
    ); // Also confirm greater
  });

  it('should not update userId or id via the update method', () => {
    jest.setSystemTime(MOCK_DATE);
    const card = LoyaltyCard.create(commonProps);
    const initialUserId = card.userId;
    const initialId = card.id;

    // Attempt to update userId and id (should be ignored by update method because they are filtered out)
    card.update({ userId: 'new-user-id', id: 'new-id' } as any);

    expect(card.userId).toBe(initialUserId);
    expect(card.id).toBe(initialId);
  });

  it('should correctly set customColor as optional', () => {
    jest.setSystemTime(MOCK_DATE);
    const cardWithColor = LoyaltyCard.create({
      ...commonProps,
      customColor: '#ABCDEF',
    });
    expect(cardWithColor.customColor).toBe('#ABCDEF');

    const cardWithoutColor = LoyaltyCard.create(commonProps);
    expect(cardWithoutColor.customColor).toBeUndefined();
  });
});
