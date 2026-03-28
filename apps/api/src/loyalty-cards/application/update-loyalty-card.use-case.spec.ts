import { Test, TestingModule } from '@nestjs/testing';
import { UpdateLoyaltyCardUseCase } from './update-loyalty-card.use-case'; // Corrected
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository'; // Corrected
import { LoyaltyCard } from '../domain/loyalty-card.entity'; // Corrected
import { BarcodeFormat } from '../domain/barcode-format.enum'; // Corrected
import { UpdateLoyaltyCardDto } from './dtos/update-loyalty-card.dto'; // Corrected
import { NotFoundException } from '@nestjs/common';

describe('UpdateLoyaltyCardUseCase', () => {
  let useCase: UpdateLoyaltyCardUseCase;
  let repository: LoyaltyCardRepository;

  const mockLoyaltyCardRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const userId = 'user-abc';
  const cardId = 'card-123';
  const initialCard = LoyaltyCard.create(
    {
      userId,
      storeId: 'store-1',
      cardData: 'old-data',
      barcodeFormat: BarcodeFormat.CODE_128,
      customColor: '#000000',
    },
    cardId,
  );

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear mocks before each test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateLoyaltyCardUseCase,
        {
          provide: LoyaltyCardRepository,
          useValue: mockLoyaltyCardRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateLoyaltyCardUseCase>(UpdateLoyaltyCardUseCase);
    repository = module.get<LoyaltyCardRepository>(LoyaltyCardRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update a loyalty card successfully', async () => {
    mockLoyaltyCardRepository.findById.mockResolvedValue(initialCard);
    mockLoyaltyCardRepository.update.mockResolvedValue({
      ...initialCard,
      cardData: 'new-data',
    });

    const dto: UpdateLoyaltyCardDto = { cardData: 'new-data' };
    const result = await useCase.execute(cardId, userId, dto);

    expect(repository.findById).toHaveBeenCalledWith(cardId);
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ cardData: 'new-data' }),
    );
    expect(result.cardData).toBe('new-data');
  });

  it('should throw NotFoundException if card is not found', async () => {
    mockLoyaltyCardRepository.findById.mockResolvedValue(null);

    const dto: UpdateLoyaltyCardDto = { cardData: 'new-data' };
    await expect(useCase.execute(cardId, userId, dto)).rejects.toThrow(
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

    const dto: UpdateLoyaltyCardDto = { cardData: 'new-data' };
    await expect(useCase.execute(cardId, userId, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw an error if userId in DTO attempts to change ownership', async () => {
    mockLoyaltyCardRepository.findById.mockResolvedValue(initialCard);

    const dto: UpdateLoyaltyCardDto = { userId: 'malicious-user-id' };
    await expect(useCase.execute(cardId, userId, dto)).rejects.toThrow(
      'Cannot change ownership of a loyalty card.',
    );
  });

  it('should update only specified fields and retain others', async () => {
    mockLoyaltyCardRepository.findById.mockResolvedValue(initialCard);
    const updatedCard = {
      ...initialCard,
      customColor: '#FF0000',
      updatedAt: new Date(),
    };
    mockLoyaltyCardRepository.update.mockResolvedValue(updatedCard);

    const dto: UpdateLoyaltyCardDto = { customColor: '#FF0000' };
    const result = await useCase.execute(cardId, userId, dto);

    expect(repository.findById).toHaveBeenCalledWith(cardId);
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        cardData: initialCard.cardData, // Should remain unchanged
        customColor: '#FF0000', // Should be updated
      }),
    );
    expect(result.customColor).toBe('#FF0000');
    expect(result.cardData).toBe(initialCard.cardData);
  });
});
