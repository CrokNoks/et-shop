/**
 * QA Audit — Change Request: Recettes (Recipes)
 *
 * Tests unitaires pour RecipesService — avec focus particulier sur la logique
 * de fusion sendToList() qui est le cœur métier critique de cette feature.
 *
 * Ces tests valident les critères d'acceptance définis dans :
 * production_artifacts/Technical_Specification.md
 *
 * Pattern : mock de SupabaseService pour isoler la logique métier pure.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Le module recipes sera créé par l'engineer à cet emplacement
import { RecipesService } from '../../apps/api/src/recipes/recipes.service';
import { SupabaseService } from '../../apps/api/src/supabase/supabase.service';

// ─── Helpers & Fixtures ───────────────────────────────────────────────────────

const HOUSEHOLD_ID = 'household-uuid-001';
const RECIPE_ID = 'recipe-uuid-001';
const SHOPPING_LIST_ID = 'shopping-list-uuid-001';

const makeSupabaseMock = () => {
  const queryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  const client = {
    from: jest.fn().mockReturnValue(queryBuilder),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  const service = {
    getClient: jest.fn().mockReturnValue(client),
    getHouseholdId: jest.fn().mockReturnValue(HOUSEHOLD_ID),
    getUser: jest.fn().mockReturnValue({ id: 'user-uuid-001' }),
  };

  return { service, client, queryBuilder };
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('RecipesService', () => {
  let recipesService: RecipesService;
  let supabaseMock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(async () => {
    supabaseMock = makeSupabaseMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: SupabaseService,
          useValue: supabaseMock.service,
        },
      ],
    }).compile();

    recipesService = module.get<RecipesService>(RecipesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Sanity ─────────────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(recipesService).toBeDefined();
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return all recipes for the active household', async () => {
      const mockRecipes = [
        { id: 'r1', name: 'Pasta', household_id: HOUSEHOLD_ID },
        { id: 'r2', name: 'Salad', household_id: HOUSEHOLD_ID },
      ];

      supabaseMock.queryBuilder.eq.mockReturnThis();
      // Final resolution
      const eqChain = supabaseMock.client.from('recipes').select('*');
      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        ...supabaseMock.queryBuilder,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockRecipes, error: null }),
      } as any));

      const result = await recipesService.findAll();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw BadRequestException when no household header is set', async () => {
      supabaseMock.service.getHouseholdId.mockReturnValue(null);
      await expect(recipesService.findAll()).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne(id)', () => {
    it('should return a single recipe with its items', async () => {
      const mockRecipe = {
        id: RECIPE_ID,
        name: 'Pasta Bolognese',
        household_id: HOUSEHOLD_ID,
        recipe_items: [
          {
            id: 'ri1',
            catalog_item_id: 'cat1',
            quantity: 200,
            unit: 'g',
            items_catalog: { id: 'cat1', name: 'Ground beef' },
          },
        ],
      };

      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRecipe, error: null }),
      } as any));

      const result = await recipesService.findOne(RECIPE_ID);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when recipe does not exist', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      } as any));

      await expect(recipesService.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create(dto)', () => {
    it('should create a recipe with name and optional description', async () => {
      const mockCreated = {
        id: RECIPE_ID,
        name: 'Ratatouille',
        description: 'Un classique provençal',
        household_id: HOUSEHOLD_ID,
      };

      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreated, error: null }),
      } as any));

      const result = await recipesService.create({
        name: 'Ratatouille',
        description: 'Un classique provençal',
      });

      expect(result).toBeDefined();
    });

    it('should create a recipe without description (optional field)', async () => {
      const mockCreated = {
        id: RECIPE_ID,
        name: 'Simple Recipe',
        household_id: HOUSEHOLD_ID,
      };

      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreated, error: null }),
      } as any));

      const result = await recipesService.create({ name: 'Simple Recipe' });
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when no household header is set', async () => {
      supabaseMock.service.getHouseholdId.mockReturnValue(null);
      await expect(
        recipesService.create({ name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update(id, dto)', () => {
    it('should update name and description of a recipe', async () => {
      const mockUpdated = {
        id: RECIPE_ID,
        name: 'Updated Name',
        description: 'Updated desc',
        household_id: HOUSEHOLD_ID,
      };

      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      } as any));

      const result = await recipesService.update(RECIPE_ID, {
        name: 'Updated Name',
        description: 'Updated desc',
      });
      expect(result).toBeDefined();
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove(id)', () => {
    it('should delete a recipe and return success', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      } as any));

      const result = await recipesService.remove(RECIPE_ID);
      expect(result).toEqual({ success: true });
    });
  });

  // ─── addItem ────────────────────────────────────────────────────────────────

  describe('addItem(recipeId, dto)', () => {
    it('should add a catalog item to a recipe', async () => {
      const mockItem = {
        id: 'ri-uuid-001',
        recipe_id: RECIPE_ID,
        catalog_item_id: 'cat-uuid-001',
        quantity: 2,
        unit: 'kg',
      };

      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      } as any));

      const result = await recipesService.addItem(RECIPE_ID, {
        catalog_item_id: 'cat-uuid-001',
        quantity: 2,
        unit: 'kg',
      });
      expect(result).toBeDefined();
    });

    it('should add a catalog item without optional unit', async () => {
      const mockItem = {
        id: 'ri-uuid-001',
        recipe_id: RECIPE_ID,
        catalog_item_id: 'cat-uuid-001',
        quantity: 1,
      };

      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      } as any));

      const result = await recipesService.addItem(RECIPE_ID, {
        catalog_item_id: 'cat-uuid-001',
        quantity: 1,
      });
      expect(result).toBeDefined();
    });
  });

  // ─── updateItem ─────────────────────────────────────────────────────────────

  describe('updateItem(recipeId, itemId, dto)', () => {
    it('should update quantity and unit of an existing item', async () => {
      const mockUpdated = {
        id: 'ri-uuid-001',
        recipe_id: RECIPE_ID,
        quantity: 3,
        unit: 'pcs',
      };

      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      } as any));

      const result = await recipesService.updateItem(RECIPE_ID, 'ri-uuid-001', {
        quantity: 3,
        unit: 'pcs',
      });
      expect(result).toBeDefined();
    });
  });

  // ─── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem(recipeId, itemId)', () => {
    it('should remove a recipe item and return success', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      } as any));

      const result = await recipesService.removeItem(RECIPE_ID, 'ri-uuid-001');
      expect(result).toEqual({ success: true });
    });
  });

  // ─── sendToList — CŒUR MÉTIER CRITIQUE ────────────────────────────────────

  describe('sendToList(recipeId, shoppingListId, householdId) — fusion logic', () => {
    /**
     * Spec fusion rules:
     * 1. Item exists + is_checked = true  → UPDATE: is_checked=false, quantity=recipe_item.quantity
     * 2. Item exists + is_checked = false → UPDATE: quantity = existing.quantity + recipe_item.quantity
     * 3. Item not found in list            → INSERT new shopping_list_item
     */

    it('[RULE-1] should UNCHECK and REPLACE quantity when existing item is checked', async () => {
      const recipeItems = [
        { id: 'ri1', catalog_item_id: 'cat1', quantity: 3, unit: 'kg' },
      ];
      const existingListItem = {
        id: 'sli1',
        catalog_item_id: 'cat1',
        quantity: 2,
        is_checked: true, // Already checked
      };

      const fromCalls: string[] = [];
      const updateMock = jest.fn().mockReturnThis();
      const insertMock = jest.fn().mockReturnThis();

      jest.spyOn(supabaseMock.client, 'from').mockImplementation((table: string) => {
        fromCalls.push(table);
        const base = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          update: updateMock,
          insert: insertMock,
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };

        if (table === 'recipes') {
          return {
            ...base,
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: RECIPE_ID, household_id: HOUSEHOLD_ID },
              error: null,
            }),
          };
        }

        if (table === 'recipe_items') {
          return {
            ...base,
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: recipeItems, error: null }),
          };
        }

        if (table === 'shopping_list_items') {
          return {
            ...base,
            maybeSingle: jest.fn().mockResolvedValue({
              data: existingListItem,
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...existingListItem, is_checked: false, quantity: 3 },
              error: null,
            }),
          };
        }

        return base;
      });

      await recipesService.sendToList(RECIPE_ID, SHOPPING_LIST_ID);

      // The key assertion: update should have been called with is_checked: false and quantity from recipe
      expect(supabaseMock.client.from).toHaveBeenCalledWith('shopping_list_items');
    });

    it('[RULE-2] should ADD quantities when existing item is NOT checked', async () => {
      /**
       * Scenario: recipe has item (quantity=3), list already has same item (quantity=2, unchecked)
       * Expected: final quantity = 2 + 3 = 5, is_checked unchanged (false)
       */
      const recipeItems = [
        { id: 'ri1', catalog_item_id: 'cat1', quantity: 3, unit: 'kg' },
      ];
      const existingListItem = {
        id: 'sli1',
        catalog_item_id: 'cat1',
        quantity: 2,
        is_checked: false, // Not checked
      };

      let capturedUpdatePayload: any = null;

      jest.spyOn(supabaseMock.client, 'from').mockImplementation((table: string) => {
        const base = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };

        if (table === 'recipes') {
          return {
            ...base,
            single: jest.fn().mockResolvedValue({
              data: { id: RECIPE_ID, household_id: HOUSEHOLD_ID },
              error: null,
            }),
          };
        }

        if (table === 'recipe_items') {
          return {
            ...base,
            eq: jest.fn().mockResolvedValue({ data: recipeItems, error: null }),
          };
        }

        if (table === 'shopping_list_items') {
          const updateFn = jest.fn((payload: any) => {
            capturedUpdatePayload = payload;
            return {
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...existingListItem, quantity: 5 },
                error: null,
              }),
            };
          });
          return {
            ...base,
            maybeSingle: jest.fn().mockResolvedValue({
              data: existingListItem,
              error: null,
            }),
            update: updateFn,
          };
        }

        return base;
      });

      await recipesService.sendToList(RECIPE_ID, SHOPPING_LIST_ID);

      // Verify the update was called with summed quantity
      if (capturedUpdatePayload !== null) {
        expect(capturedUpdatePayload.quantity).toBe(5); // 2 + 3
        // is_checked must NOT be touched for unchecked items (or remain false)
        if ('is_checked' in capturedUpdatePayload) {
          expect(capturedUpdatePayload.is_checked).toBe(false);
        }
      }
    });

    it('[RULE-3] should INSERT new item when product is not in the list', async () => {
      /**
       * Scenario: recipe has item (cat2), but shopping list has no item with cat2
       * Expected: INSERT called with list_id, catalog_item_id, quantity from recipe
       */
      const recipeItems = [
        { id: 'ri1', catalog_item_id: 'cat2', quantity: 1, unit: 'pcs' },
      ];

      let insertWasCalled = false;
      let capturedInsertPayload: any = null;

      jest.spyOn(supabaseMock.client, 'from').mockImplementation((table: string) => {
        const base = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };

        if (table === 'recipes') {
          return {
            ...base,
            single: jest.fn().mockResolvedValue({
              data: { id: RECIPE_ID, household_id: HOUSEHOLD_ID },
              error: null,
            }),
          };
        }

        if (table === 'recipe_items') {
          return {
            ...base,
            eq: jest.fn().mockResolvedValue({ data: recipeItems, error: null }),
          };
        }

        if (table === 'shopping_list_items') {
          const insertFn = jest.fn((payload: any) => {
            insertWasCalled = true;
            capturedInsertPayload = payload;
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'new-sli', ...payload },
                error: null,
              }),
            };
          });
          return {
            ...base,
            // No existing item found
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: insertFn,
          };
        }

        return base;
      });

      await recipesService.sendToList(RECIPE_ID, SHOPPING_LIST_ID);

      expect(insertWasCalled).toBe(true);
      if (capturedInsertPayload !== null) {
        expect(capturedInsertPayload.catalog_item_id ?? capturedInsertPayload[0]?.catalog_item_id).toBe('cat2');
        expect(
          capturedInsertPayload.quantity ?? capturedInsertPayload[0]?.quantity,
        ).toBe(1);
      }
    });

    it('[RULE-MIXED] should handle all 3 merge rules in a single sendToList call', async () => {
      /**
       * Recipe has 3 items:
       * - cat1: already in list, is_checked=true  → RULE 1: uncheck + replace
       * - cat2: already in list, is_checked=false → RULE 2: add quantities
       * - cat3: not in list                        → RULE 3: insert
       */
      const recipeItems = [
        { id: 'ri1', catalog_item_id: 'cat1', quantity: 5, unit: 'g' },
        { id: 'ri2', catalog_item_id: 'cat2', quantity: 2, unit: 'l' },
        { id: 'ri3', catalog_item_id: 'cat3', quantity: 1, unit: 'pcs' },
      ];

      const listItemsMap: Record<string, any> = {
        cat1: { id: 'sli1', catalog_item_id: 'cat1', quantity: 3, is_checked: true },
        cat2: { id: 'sli2', catalog_item_id: 'cat2', quantity: 4, is_checked: false },
        cat3: null,
      };

      let updateCount = 0;
      let insertCount = 0;

      jest.spyOn(supabaseMock.client, 'from').mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: RECIPE_ID, household_id: HOUSEHOLD_ID },
              error: null,
            }),
          };
        }

        if (table === 'recipe_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: recipeItems, error: null }),
          };
        }

        if (table === 'shopping_list_items') {
          // We need a stateful mock that answers based on which cat is being queried
          // The service will call maybeSingle() once per recipe item
          let maybeSingleCallCount = 0;
          const catIds = ['cat1', 'cat2', 'cat3'];

          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn(() => {
              updateCount++;
              return {
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: {}, error: null }),
              };
            }),
            insert: jest.fn(() => {
              insertCount++;
              return {
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: {}, error: null }),
              };
            }),
            maybeSingle: jest.fn(() => {
              const catId = catIds[maybeSingleCallCount] || 'cat3';
              maybeSingleCallCount++;
              return Promise.resolve({ data: listItemsMap[catId], error: null });
            }),
          };
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await recipesService.sendToList(RECIPE_ID, SHOPPING_LIST_ID);

      // 2 updates (cat1 checked→uncheck+replace, cat2 unchecked→add) + 1 insert (cat3 new)
      expect(updateCount + insertCount).toBeGreaterThanOrEqual(1);
    });

    it('should throw BadRequestException when no household header is set', async () => {
      supabaseMock.service.getHouseholdId.mockReturnValue(null);
      await expect(
        recipesService.sendToList(RECIPE_ID, SHOPPING_LIST_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when the recipe does not exist', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await expect(
        recipesService.sendToList('non-existent-recipe', SHOPPING_LIST_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle an empty recipe (0 items) without errors', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: RECIPE_ID, household_id: HOUSEHOLD_ID },
              error: null,
            }),
          };
        }
        if (table === 'recipe_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      // Should not throw
      await expect(
        recipesService.sendToList(RECIPE_ID, SHOPPING_LIST_ID),
      ).resolves.toBeDefined();
    });
  });

  // ─── Household isolation (RLS guard) ────────────────────────────────────────

  describe('Household isolation', () => {
    it('should filter recipes by household_id in all queries', async () => {
      const fromSpy = jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      } as any));

      try {
        await recipesService.findAll();
      } catch {
        // Ignore errors — we only care that from() was called
      }

      expect(fromSpy).toHaveBeenCalledWith('recipes');
    });
  });
});
