import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CancelPurchaseUseCase } from './cancel-purchase.use-case';
import { PurchaseRecordRepository } from '../domain/purchase-record.repository';
import { SupabaseService } from '../../supabase/supabase.service';

describe('CancelPurchaseUseCase', () => {
  let useCase: CancelPurchaseUseCase;

  const mockItem = {
    id: 'item-001',
    list_id: 'list-001',
    shopping_lists: { household_id: 'household-001' },
  };

  const mockPurchaseRecordRepository = {
    cancelPurchase: jest.fn().mockResolvedValue(undefined),
  };

  const mockSingle = jest
    .fn()
    .mockResolvedValue({ data: mockItem, error: null });

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
        CancelPurchaseUseCase,
        {
          provide: PurchaseRecordRepository,
          useValue: mockPurchaseRecordRepository,
        },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    useCase = module.get<CancelPurchaseUseCase>(CancelPurchaseUseCase);
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

    const mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'not found' } }),
    };
    mockSupabaseService.getClient.mockReturnValueOnce(mockClient);

    await expect(useCase.execute('list-001', 'item-001')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should call cancelPurchase with the item id', async () => {
    mockSupabaseService.getHouseholdId.mockReturnValue('household-001');

    const mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
    };
    mockSupabaseService.getClient.mockReturnValue(mockClient);
    mockPurchaseRecordRepository.cancelPurchase.mockResolvedValue(undefined);

    await useCase.execute('list-001', 'item-001');

    expect(mockPurchaseRecordRepository.cancelPurchase).toHaveBeenCalledWith(
      'item-001',
    );
  });
});
