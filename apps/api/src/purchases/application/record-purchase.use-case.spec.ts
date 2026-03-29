import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecordPurchaseUseCase } from './record-purchase.use-case';
import { PurchaseRecordRepository } from '../domain/purchase-record.repository';
import { PurchaseRecord } from '../domain/purchase-record.entity';
import { SupabaseService } from '../../supabase/supabase.service';

describe('RecordPurchaseUseCase', () => {
  let useCase: RecordPurchaseUseCase;

  const mockRecord = PurchaseRecord.create({
    shoppingListItemId: 'item-001',
    listId: 'list-001',
    householdId: 'household-001',
    catalogItemId: 'catalog-001',
    productName: 'Lait',
    quantity: 1,
    unit: 'L',
    price: 1.5,
  });

  const mockItem = {
    id: 'item-001',
    list_id: 'list-001',
    catalog_item_id: 'catalog-001',
    name: 'Lait',
    quantity: 1,
    unit: 'L',
    price: 1.5,
    category_id: null,
    shopping_lists: { household_id: 'household-001', store_id: 'store-001' },
  };

  const mockSingle = jest
    .fn()
    .mockResolvedValue({ data: mockItem, error: null });

  const mockPurchaseRecordRepository = {
    recordPurchaseAtomic: jest.fn().mockResolvedValue(mockRecord),
  };

  const mockSupabaseService = {
    getHouseholdId: jest.fn().mockReturnValue('household-001'),
    getClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: mockSingle,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordPurchaseUseCase,
        {
          provide: PurchaseRecordRepository,
          useValue: mockPurchaseRecordRepository,
        },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    useCase = module.get<RecordPurchaseUseCase>(RecordPurchaseUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw NotFoundException when no household id', async () => {
    mockSupabaseService.getHouseholdId.mockReturnValueOnce(null);

    await expect(useCase.execute('list-001', 'item-001')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when item not found', async () => {
    mockSupabaseService.getHouseholdId.mockReturnValue('household-001');
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    });

    const mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: mockSingle,
    };
    mockSupabaseService.getClient.mockReturnValueOnce(mockClient);

    await expect(useCase.execute('list-001', 'item-001')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should call recordPurchaseAtomic with a PurchaseRecord', async () => {
    mockSupabaseService.getHouseholdId.mockReturnValue('household-001');
    mockPurchaseRecordRepository.recordPurchaseAtomic.mockResolvedValue(
      mockRecord,
    );

    const mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
    };
    mockSupabaseService.getClient.mockReturnValue(mockClient);

    const result = await useCase.execute('list-001', 'item-001');

    expect(
      mockPurchaseRecordRepository.recordPurchaseAtomic,
    ).toHaveBeenCalledWith('item-001', expect.any(PurchaseRecord));
    expect(result).toBe(mockRecord);
  });
});
