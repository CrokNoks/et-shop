import { Test, TestingModule } from '@nestjs/testing';
import { GetLoyaltyCardByIdUseCase } from './get-loyalty-card-by-id.use-case'; // Corrected
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository'; // Corrected
import { LoyaltyCard } from '../domain/loyalty-card.entity'; // Corrected
import { BarcodeFormat } from '../domain/barcode-format.enum'; // Corrected
import { NotFoundException } from '@nestjs/common';

describe('GetLoyaltyCardByIdUseCase', () => {
  let useCase: GetLoyaltyCardByIdUseCase;
  let repository: LoyaltyCardRepository;

  const mockLoyaltyCardRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLoyaltyCardByIdUseCase,
        {
          provide: LoyaltyCardRepository,
          useValue: mockLoyaltyCardRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetLoyaltyCardByIdUseCase>(GetLoyaltyCardByIdUseCase);
    repository = module.get<LoyaltyCardRepository>(LoyaltyCardRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return a loyalty card if found and belongs to user', async () => {
    const cardId = 'card-123';
    const userId = 'user-abc';
    const card = LoyaltyCard.create(
      {
        userId,
        storeId: 'store-1',
        cardData: 'data',
        barcodeFormat: BarcodeFormat.CODE_128,
      },
      cardId,
    );

    mockLoyaltyCardRepository.findById.mockResolvedValue(card);

    const result = await useCase.execute(cardId, userId);

    expect(repository.findById).toHaveBeenCalledWith(cardId);
    expect(result).toEqual(card);
  });

  it('should throw NotFoundException if card is not found', async () => {
    const cardId = 'non-existent-card';
    const userId = 'user-abc';

    mockLoyaltyCardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(cardId, userId)).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute(cardId, userId)).rejects.toThrow(
      `LoyaltyCard with ID ${cardId} not found or does not belong to user.`,
    );
  });

  it('should throw NotFoundException if card does not belong to user', async () => {
    const cardId = 'card-123';
    const userId = 'user-abc';
    const otherUserId = 'other-user';
    const card = LoyaltyCard.create(
      {
        userId: otherUserId,
        storeId: 'store-1',
        cardData: 'data',
        barcodeFormat: BarcodeFormat.CODE_128,
      },
      cardId,
    );

    mockLoyaltyCardRepository.findById.mockResolvedValue(card);

    await expect(useCase.execute(cardId, userId)).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute(cardId, userId)).rejects.toThrow(
      `LoyaltyCard with ID ${cardId} not found or does not belong to user.`,
    );
  });
});
