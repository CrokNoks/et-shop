import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { SupabaseService } from '../supabase/supabase.service';

const HOUSEHOLD_ID = 'household-uuid-001';
const ADMIN_ID = 'user-admin-001';
const TARGET_ID = 'user-target-001';

/**
 * Crée un queryBuilder Supabase simulé.
 * `singleResult` est la valeur retournée par `.single()`.
 * `awaitResult` est la valeur retournée quand le builder lui-même est awaité
 * (pattern utilisé pour les queries avec { count: 'exact', head: true } et pour delete).
 */
const makeQb = (
  singleResult = { data: null, error: null },
  awaitResult = { error: null },
) => {
  const promise = Promise.resolve(awaitResult);
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(singleResult),
    // Rendre le builder thenable pour les queries sans .single()
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  return qb;
};

/**
 * Construit un client Supabase dont chaque appel à `from()` retourne le queryBuilder
 * suivant dans la liste `qbs` (dans l'ordre d'appel).
 */
const makeSequencedClient = (...qbs: any[]) => {
  let i = 0;
  return { from: jest.fn(() => qbs[i++]) };
};

describe('HouseholdsService', () => {
  let service: HouseholdsService;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn(),
      getUser: jest.fn().mockReturnValue({ id: ADMIN_ID }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<HouseholdsService>(HouseholdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('removeMember()', () => {
    it("devrait lever UnauthorizedException si le demandeur n'est pas admin", async () => {
      const client = makeSequencedClient(
        makeQb({ data: { role: 'member' }, error: null }), // currentUser n'est pas admin
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      await expect(
        service.removeMember(HOUSEHOLD_ID, TARGET_ID),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever ForbiddenException quand la cible est le dernier admin', async () => {
      const client = makeSequencedClient(
        makeQb({ data: { role: 'admin' }, error: null }), // currentUser = admin
        makeQb({ data: { role: 'admin' }, error: null }), // target = admin
        makeQb(undefined, { count: 1, error: null }), // count admins = 1
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      await expect(
        service.removeMember(HOUSEHOLD_ID, TARGET_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it("devrait autoriser la suppression si la cible est admin mais que d'autres admins existent", async () => {
      const client = makeSequencedClient(
        makeQb({ data: { role: 'admin' }, error: null }), // currentUser = admin
        makeQb({ data: { role: 'admin' }, error: null }), // target = admin
        makeQb(undefined, { count: 2, error: null }), // count admins = 2
        makeQb(undefined, { error: null }), // delete
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      await expect(
        service.removeMember(HOUSEHOLD_ID, TARGET_ID),
      ).resolves.toEqual({
        success: true,
      });
    });

    it("devrait autoriser la suppression d'un membre non-admin sans vérifier le count", async () => {
      const client = makeSequencedClient(
        makeQb({ data: { role: 'admin' }, error: null }), // currentUser = admin
        makeQb({ data: { role: 'member' }, error: null }), // target = member (pas admin)
        makeQb(undefined, { error: null }), // delete
      );
      mockSupabaseService.getClient.mockReturnValue(client);

      await expect(
        service.removeMember(HOUSEHOLD_ID, TARGET_ID),
      ).resolves.toEqual({
        success: true,
      });
      // Seulement 3 appels à from() : check currentUser, check target, delete — pas de count
      expect(client.from).toHaveBeenCalledTimes(3);
    });
  });
});
