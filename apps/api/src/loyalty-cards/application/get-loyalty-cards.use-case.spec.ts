import { Test, TestingModule } from '@nestjs/testing';
import { GetLoyaltyCardsUseCase } from './get-loyalty-cards.use-case'; // Corrected
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository'; // Corrected
import { LoyaltyCard } from '../domain/loyalty-card.entity'; // Corrected
import { BarcodeFormat } from '../domain/barcode-format.enum'; // Corrected

describe('GetLoyaltyCardsUseCase', () => {
  let useCase: GetLoyaltyCardsUseCase;
  let repository: LoyaltyCardRepository;

  const mockLoyaltyCardRepository = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLoyaltyCardsUseCase,
        {
          provide: LoyaltyCardRepository,
          useValue: mockLoyaltyCardRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetLoyaltyCardsUseCase>(GetLoyaltyCardsUseCase);
    repository = module.get<LoyaltyCardRepository>(LoyaltyCardRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return an array of loyalty cards for a user', async () => {
    const userId = 'user-123';
    const cards = [
      LoyaltyCard.create(
        {
          userId,
          storeId: 'store-1',
          cardData: 'card1',
          barcodeFormat: BarcodeFormat.CODE_128,
        },
        'id1',
      ),
      LoyaltyCard.create(
        {
          userId,
          storeId: 'store-2',
          cardData: 'card2',
          barcodeFormat: BarcodeFormat.QR_CODE,
        },
        'id2',
      ),
    ];

    mockLoyaltyCardRepository.findByUserId.mockResolvedValue(cards);

    const result = await useCase.execute(userId);

    expect(repository.findByUserId).toHaveBeenCalledWith(userId, undefined);
    expect(result).toEqual(cards);
  });

  it('should return an array of loyalty cards for a user filtered by storeIds', async () => {
    const userId = 'user-123';
    const storeIds = ['store-1'];
    const cards = [
      LoyaltyCard.create(
        {
          userId,
          storeId: 'store-1',
          cardData: 'card1',
          barcodeFormat: BarcodeFormat.CODE_128,
        },
        'id1',
      ),
    ];

    mockLoyaltyCardRepository.findByUserId.mockResolvedValue(cards);

    const result = await useCase.execute(userId, storeIds);

    expect(repository.findByUserId).toHaveBeenCalledWith(userId, storeIds);
    expect(result).toEqual(cards);
  });

  it('should return an empty array if no cards are found', async () => {
    const userId = 'user-123';
    mockLoyaltyCardRepository.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute(userId);

    expect(repository.findByUserId).toHaveBeenCalledWith(userId, undefined);
    expect(result).toEqual([]);
  });
});
