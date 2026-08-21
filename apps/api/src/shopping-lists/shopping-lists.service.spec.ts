import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListsService } from './shopping-lists.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

describe('ShoppingListsService', () => {
  let service: ShoppingListsService;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn(),
      getHouseholdId: jest.fn(),
      getUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<ShoppingListsService>(ShoppingListsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('removeItem', () => {
    it('should return success when removing an item that exists', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null, count: 1 }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.removeItem('item-001');

      expect(result).toEqual({ success: true });
      expect(mockClient.from).toHaveBeenCalledWith('shopping_list_items');
      expect(mockClient.delete).toHaveBeenCalled();
    });

    it('should return success when removing an item that does not exist (idempotent)', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null, count: 0 }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.removeItem('nonexistent-item-id');

      expect(result).toEqual({ success: true });
      // Verify no error was thrown even though count is 0 (idempotent behavior)
    });

    it('should throw NotFoundException when Supabase returns PGRST116 error', async () => {
      const supabaseError = { code: 'PGRST116', message: 'Resource not found' };
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: supabaseError }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.removeItem('item-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException when Supabase returns 42501 error', async () => {
      const supabaseError = {
        code: '42501',
        message: 'You do not have permission',
      };
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: supabaseError }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.removeItem('item-001')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw InternalServerErrorException for other Supabase errors', async () => {
      const supabaseError = {
        code: 'OTHER_ERROR',
        message: 'Database connection failed',
      };
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: supabaseError }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.removeItem('item-001')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
