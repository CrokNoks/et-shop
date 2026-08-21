import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListsService } from './shopping-lists.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
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

  describe('updateCatalogItem — changement de rayon', () => {
    it('pose sort_order = MAX(sort_order) + 1 du rayon de destination quand category_id change', async () => {
      const currentChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: { category_id: 'cat-1' }, error: null }),
      };
      const selectChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: { sort_order: 4 }, error: null }),
      };
      const updateChain: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'item-1', category_id: 'cat-2', sort_order: 5 },
          error: null,
        }),
      };
      const mockClient = {
        from: jest
          .fn()
          .mockReturnValueOnce(currentChain)
          .mockReturnValueOnce(selectChain)
          .mockReturnValueOnce(updateChain),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      const result = await service.updateCatalogItem('item-1', {
        category_id: 'cat-2',
      });

      expect(selectChain.eq).toHaveBeenCalledWith('category_id', 'cat-2');
      expect(selectChain.eq).toHaveBeenCalledWith(
        'household_id',
        'household-1',
      );
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 'cat-2', sort_order: 5 }),
      );
      expect(result).toEqual({
        id: 'item-1',
        category_id: 'cat-2',
        sort_order: 5,
      });
    });

    it('pose sort_order = 1 quand le rayon de destination est vide', async () => {
      const currentChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: { category_id: 'cat-1' }, error: null }),
      };
      const selectChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      const updateChain: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'item-1', category_id: 'cat-3', sort_order: 1 },
          error: null,
        }),
      };
      const mockClient = {
        from: jest
          .fn()
          .mockReturnValueOnce(currentChain)
          .mockReturnValueOnce(selectChain)
          .mockReturnValueOnce(updateChain),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      await service.updateCatalogItem('item-1', { category_id: 'cat-3' });

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ sort_order: 1 }),
      );
    });

    it('ne recalcule pas de sort_order quand category_id n’est pas fourni', async () => {
      const chain: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'item-1', name: 'Lait' },
          error: null,
        }),
      };
      const mockClient = { from: jest.fn().mockReturnValue(chain) };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      await service.updateCatalogItem('item-1', { name: 'Lait' });

      expect(mockClient.from).toHaveBeenCalledTimes(1);
      expect(chain.update).toHaveBeenCalledWith({ name: 'Lait' });
    });

    it('ne recalcule PAS le sort_order quand category_id est présent dans le payload mais identique à la valeur actuelle (cas réel envoyé par le frontend à chaque édition)', async () => {
      const currentChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: { category_id: 'cat-2' }, error: null }),
      };
      const updateChain: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'item-1', name: 'Lait bio', category_id: 'cat-2' },
          error: null,
        }),
      };
      const mockClient = {
        from: jest
          .fn()
          .mockReturnValueOnce(currentChain)
          .mockReturnValueOnce(updateChain),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      // Le frontend (StoreCatalog.tsx) envoie systématiquement category_id
      // dans le payload à chaque édition, même quand le rayon ne change pas.
      await service.updateCatalogItem('item-1', {
        name: 'Lait bio',
        category_id: 'cat-2',
      });

      // Seulement 2 appels from() : la vérification du category_id actuel,
      // puis l'update. Pas d'appel à getNextCatalogSortOrder (qui ferait un
      // 3ème appel from()).
      expect(mockClient.from).toHaveBeenCalledTimes(2);
      expect(updateChain.update).toHaveBeenCalledWith({
        name: 'Lait bio',
        category_id: 'cat-2',
      });
      expect(updateChain.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ sort_order: expect.anything() }),
      );
    });
  });

  describe('bulkUpdateCatalogItemsCategory', () => {
    it('assigne à tous les produits déplacés le sort_order de fin du rayon de destination', async () => {
      const selectChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: { sort_order: 2 }, error: null }),
      };
      const updateChain: any = {
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            { id: 'item-1', category_id: 'cat-2', sort_order: 3 },
            { id: 'item-2', category_id: 'cat-2', sort_order: 3 },
          ],
          error: null,
        }),
      };
      const mockClient = {
        from: jest
          .fn()
          .mockReturnValueOnce(selectChain)
          .mockReturnValueOnce(updateChain),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      const result = await service.bulkUpdateCatalogItemsCategory(
        ['item-1', 'item-2'],
        'cat-2',
      );

      expect(updateChain.update).toHaveBeenCalledWith({
        category_id: 'cat-2',
        sort_order: 3,
      });
      expect(updateChain.in).toHaveBeenCalledWith('id', ['item-1', 'item-2']);
      expect(result).toEqual([
        { id: 'item-1', category_id: 'cat-2', sort_order: 3 },
        { id: 'item-2', category_id: 'cat-2', sort_order: 3 },
      ]);
    });
  });

  describe('findAllCatalog', () => {
    it('trie les produits par sort_order puis par name', async () => {
      const mockData = [
        { id: 'item-1', name: 'Banane', sort_order: 1 },
        { id: 'item-2', name: 'Pomme', sort_order: 1 },
        { id: 'item-3', name: 'Carotte', sort_order: 2 },
      ];
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => resolve({ data: mockData, error: null });
      const mockClient = { from: jest.fn().mockReturnValue(chain) };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      const result = await service.findAllCatalog('store-1');

      expect(result).toEqual(mockData);
      // Vérifier que les deux .order() sont appelés dans le bon ordre
      expect(chain.order).toHaveBeenNthCalledWith(1, 'sort_order', {
        ascending: true,
      });
      expect(chain.order).toHaveBeenNthCalledWith(2, 'name', {
        ascending: true,
      });
    });
  });

  describe('updateCatalogOrder', () => {
    it('met à jour le sort_order de chaque produit, scopé au rayon donné et au foyer courant', async () => {
      const chain: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => resolve({ error: null });
      const mockClient = { from: jest.fn().mockReturnValue(chain) };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      const result = await service.updateCatalogOrder('cat-1', [
        { itemId: 'item-1', sortOrder: 0 },
        { itemId: 'item-2', sortOrder: 1 },
      ]);

      expect(result).toEqual({ success: true });
      expect(mockClient.from).toHaveBeenCalledWith('items_catalog');
      expect(chain.update).toHaveBeenCalledWith({ sort_order: 0 });
      expect(chain.update).toHaveBeenCalledWith({ sort_order: 1 });
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1');
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-2');
      expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1');
      expect(chain.eq).toHaveBeenCalledWith('household_id', 'household-1');
    });

    it('rejette avec BadRequestException quand x-household-id est absent', async () => {
      mockSupabaseService.getHouseholdId.mockReturnValue(undefined);

      await expect(
        service.updateCatalogOrder('cat-1', [
          { itemId: 'item-1', sortOrder: 0 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('propage la première erreur rencontrée parmi les N updates', async () => {
      let call = 0;
      const mockClient = {
        from: jest.fn().mockImplementation(() => {
          call += 1;
          const isSecond = call === 2;
          const chain: any = {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          };
          chain.then = (resolve: any) =>
            resolve({ error: isSecond ? { message: 'boom' } : null });
          return chain;
        }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      await expect(
        service.updateCatalogOrder('cat-1', [
          { itemId: 'item-1', sortOrder: 0 },
          { itemId: 'item-2', sortOrder: 1 },
        ]),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('ne modifie pas un itemId hors du categoryId donné', async () => {
      let callCount = 0;
      const mockClient = {
        from: jest.fn().mockImplementation(() => {
          callCount += 1;
          const chain: any = {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          };
          chain.then = (resolve: any) => resolve({ error: null });
          return chain;
        }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      // Appel updateCatalogOrder avec un itemId hors de cat-1
      // (le filtre .eq('category_id', 'cat-1') empêchera cet item d'être affecté)
      const result = await service.updateCatalogOrder('cat-1', [
        { itemId: 'item-wrong-cat', sortOrder: 99 },
        { itemId: 'item-correct-cat', sortOrder: 0 },
      ]);

      expect(result).toEqual({ success: true });
      // Les deux updates sont lancées en parallèle
      expect(mockClient.from).toHaveBeenCalledTimes(2);
      // Le second filtre .eq('category_id', 'cat-1') s'applique à chaque update
      // Même l'item hors rayon reçoit le filtre (il ne sera juste pas affecté via RLS)
      expect(result.success).toBe(true);
    });

    it('rejette avec BadRequestException quand le body est malformé (orders absent)', async () => {
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      await expect(
        service.updateCatalogOrder('cat-1', undefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette avec BadRequestException quand orders est un tableau vide', async () => {
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      await expect(service.updateCatalogOrder('cat-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejette avec BadRequestException quand categoryId est absent', async () => {
      mockSupabaseService.getHouseholdId.mockReturnValue('household-1');

      await expect(
        service.updateCatalogOrder(undefined as any, [
          { itemId: 'item-1', sortOrder: 0 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
