import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('HouseholdsController', () => {
  let controller: HouseholdsController;
  let mockHouseholdsService: any;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockHouseholdsService = {
      findMyHouseholds: jest.fn(),
      create: jest.fn(),
      findMembers: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
    };
    mockSupabaseService = {
      getClient: jest.fn(),
      getUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HouseholdsController],
      providers: [
        {
          provide: HouseholdsService,
          useValue: mockHouseholdsService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    controller = module.get<HouseholdsController>(HouseholdsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
