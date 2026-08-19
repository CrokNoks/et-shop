import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';
import { SupabaseService } from '../supabase/supabase.service';

const HOUSEHOLD_ID = 'household-uuid-001';

/**
 * Crée un queryBuilder Supabase simulé, même pattern que
 * households.service.spec.ts : `singleResult` pour les requêtes qui finissent
 * par `.single()`, `awaitResult` pour celles awaited directement (le builder
 * est thenable).
 */
const makeQb = (
  singleResult: { data: any; error: any } = { data: null, error: null },
  awaitResult: { data?: any; error: any } = { error: null },
) => {
  const promise = Promise.resolve(awaitResult);
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(singleResult),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  return qb;
};

const makeSequencedClient = (...qbs: any[]) => {
  let i = 0;
  return { from: jest.fn(() => qbs[i++]) };
};

describe('RecipesService', () => {
  let service: RecipesService;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn(),
      getHouseholdId: jest.fn().mockReturnValue(HOUSEHOLD_ID),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne() — estimated_cost', () => {
    it('calcule le coût estimé quand tous les ingrédients ont un reference_price', async () => {
      const client = makeSequencedClient(
        makeQb({
          data: {
            id: 'recipe-1',
            recipe_items: [
              { quantity: 2, items_catalog: { reference_price: 1.5 } },
              { quantity: 1, items_catalog: { reference_price: 3 } },
            ],
          },
          error: null,
        }),
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      const result = await service.findOne('recipe-1');

      expect(result.estimated_cost).toBe(2 * 1.5 + 1 * 3);
    });

    it("laisse estimated_cost absent si un ingrédient n'a pas de reference_price", async () => {
      const client = makeSequencedClient(
        makeQb({
          data: {
            id: 'recipe-1',
            recipe_items: [
              { quantity: 2, items_catalog: { reference_price: 1.5 } },
              { quantity: 1, items_catalog: { reference_price: null } },
            ],
          },
          error: null,
        }),
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      const result = await service.findOne('recipe-1');

      expect(result.estimated_cost).toBeUndefined();
    });

    it("laisse estimated_cost absent si la recette n'a aucun ingrédient", async () => {
      const client = makeSequencedClient(
        makeQb({
          data: { id: 'recipe-1', recipe_items: [] },
          error: null,
        }),
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      const result = await service.findOne('recipe-1');

      expect(result.estimated_cost).toBeUndefined();
    });
  });

  describe('sendToList() — envoi partiel (item_ids)', () => {
    const recipeWithTwoItems = {
      id: 'recipe-1',
      recipe_items: [
        { id: 'ri-1', catalog_item_id: 'cat-1', quantity: 2, unit: 'pcs' },
        { id: 'ri-2', catalog_item_id: 'cat-2', quantity: 1, unit: 'kg' },
      ],
    };
    const list = { id: 'list-1', store_id: 'store-1' };

    it('sans item_ids, envoie tous les ingrédients (non-régression)', async () => {
      const client = makeSequencedClient(
        makeQb({ data: recipeWithTwoItems, error: null }), // recipes
        makeQb({ data: list, error: null }), // shopping_lists
        makeQb(undefined, { data: [], error: null }), // shopping_list_items (existing)
        makeQb({ data: { id: 'cat-1', name: 'Lait', unit: 'L' }, error: null }), // items_catalog for ri-1
        makeQb({
          data: { id: 'cat-2', name: 'Farine', unit: 'kg' },
          error: null,
        }), // items_catalog for ri-2
        makeQb(undefined, { error: null }), // insert
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      const result = await service.sendToList('recipe-1', 'list-1');

      expect(result).toEqual({ success: true, applied: 2 });
    });

    it('avec item_ids, ne traite que le sous-ensemble sélectionné', async () => {
      const client = makeSequencedClient(
        makeQb({ data: recipeWithTwoItems, error: null }), // recipes
        makeQb({ data: list, error: null }), // shopping_lists
        makeQb(undefined, { data: [], error: null }), // shopping_list_items (existing)
        makeQb({ data: { id: 'cat-1', name: 'Lait', unit: 'L' }, error: null }), // items_catalog for ri-1 only
        makeQb(undefined, { error: null }), // insert
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      const result = await service.sendToList('recipe-1', 'list-1', ['ri-1']);

      expect(result).toEqual({ success: true, applied: 1 });
      // Un seul insert (ri-2 exclu) : la 2e query items_catalog n'a jamais lieu.
      expect(client.from).toHaveBeenCalledTimes(5);
    });

    it('ignore silencieusement un item_id qui ne correspond à aucun ingrédient', async () => {
      const client = makeSequencedClient(
        makeQb({ data: recipeWithTwoItems, error: null }), // recipes
        makeQb({ data: list, error: null }), // shopping_lists
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      const result = await service.sendToList('recipe-1', 'list-1', [
        'ri-does-not-exist',
      ]);

      expect(result).toEqual({ success: true, applied: 0 });
    });
  });
});
