import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { SupabaseService } from '../supabase/supabase.service';

const STORE_ID = 'store-uuid-001';

describe('StoresService', () => {
  let service: StoresService;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getImpact()', () => {
    it("devrait retourner le nombre de cartes et d'utilisateurs affectés", async () => {
      const mockClient = {
        rpc: jest.fn().mockResolvedValue({
          data: { loyalty_cards_count: 3, affected_users: 2 },
          error: null,
        }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.getImpact(STORE_ID);

      expect(mockClient.rpc).toHaveBeenCalledWith('get_store_impact', {
        p_store_id: STORE_ID,
      });
      expect(result).toEqual({ loyalty_cards_count: 3, affected_users: 2 });
    });

    it('devrait retourner 0/0 si aucune carte de fidélité pour ce magasin', async () => {
      const mockClient = {
        rpc: jest.fn().mockResolvedValue({
          data: { loyalty_cards_count: 0, affected_users: 0 },
          error: null,
        }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.getImpact(STORE_ID);
      expect(result).toEqual({ loyalty_cards_count: 0, affected_users: 0 });
    });

    it("devrait propager l'erreur Supabase si le RPC échoue", async () => {
      const supabaseError = { message: 'function not found', code: 'PGRST202' };
      const mockClient = {
        rpc: jest.fn().mockResolvedValue({ data: null, error: supabaseError }),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.getImpact(STORE_ID)).rejects.toEqual(supabaseError);
    });
  });
});
