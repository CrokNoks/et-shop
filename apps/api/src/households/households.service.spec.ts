import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdsService } from './households.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('HouseholdsService', () => {
  let service: HouseholdsService;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn(),
      getUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<HouseholdsService>(HouseholdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
