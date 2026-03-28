import { Test, TestingModule } from '@nestjs/testing';
import { DeleteLoyaltyCardUseCase } from './delete-loyalty-card.use-case'; // Corrected
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository'; // Corrected
import { LoyaltyCard } from '../domain/loyalty-card.entity'; // Corrected
import { BarcodeFormat } from '../domain/barcode-format.enum'; // Corrected
import { NotFoundException } from '@nestjs/common';

describe('DeleteLoyaltyCardUseCase', () => {
  let useCase: DeleteLoyaltyCardUseCase;
  let repository: LoyaltyCardRepository;

  const mockLoyaltyCardRepository = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const userId = 'user-abc';
  const cardId = 'card-123';
  const existingCard = LoyaltyCard.create(
    {
      userId,
      storeId: 'store-1',
      cardData: 'data',
      barcodeFormat: BarcodeFormat.CODE_128,
    },
    cardId,
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteLoyaltyCardUseCase,
        {
          provide: LoyaltyCardRepository,
          useValue: mockLoyaltyCardRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteLoyaltyCardUseCase>(DeleteLoyaltyCardUseCase);
    repository = module.get<LoyaltyCardRepository>(LoyaltyCardRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete a loyalty card successfully', async () => {
    mockLoyaltyCardRepository.findById.mockResolvedValue(existingCard);
    mockLoyaltyCardRepository.delete.mockResolvedValue(undefined); // delete returns void

    await useCase.execute(cardId, userId);

    expect(repository.findById).toHaveBeenCalledWith(cardId);
    expect(repository.delete).toHaveBeenCalledWith(cardId);
  });

  it('should throw NotFoundException if card is not found', async () => {
    mockLoyaltyCardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(cardId, userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if card does not belong to user', async () => {
    const otherUserId = 'other-user';
    mockLoyaltyCardRepository.findById.mockResolvedValue(
      LoyaltyCard.create(
        {
          userId: otherUserId,
          storeId: 'store-1',
          cardData: 'data',
          barcodeFormat: BarcodeFormat.CODE_128,
        },
        cardId,
      ),
    );

    await expect(useCase.execute(cardId, userId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
