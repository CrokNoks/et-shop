import { Test, TestingModule } from '@nestjs/testing';
import { CreateLoyaltyCardUseCase } from './create-loyalty-card.use-case'; // Corrected
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository'; // Corrected
import { LoyaltyCard } from '../domain/loyalty-card.entity'; // Corrected
import { CreateLoyaltyCardDto } from './dtos/create-loyalty-card.dto'; // Corrected
import { BarcodeFormat } from '../domain/barcode-format.enum'; // Corrected

describe('CreateLoyaltyCardUseCase', () => {
  let useCase: CreateLoyaltyCardUseCase;
  let repository: LoyaltyCardRepository;

  const mockLoyaltyCardRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLoyaltyCardUseCase,
        {
          provide: LoyaltyCardRepository,
          useValue: mockLoyaltyCardRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateLoyaltyCardUseCase>(CreateLoyaltyCardUseCase);
    repository = module.get<LoyaltyCardRepository>(LoyaltyCardRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a loyalty card', async () => {
    const dto: CreateLoyaltyCardDto = {
      userId: 'user-123',
      storeId: 'store-abc',
      cardData: '12345',
      barcodeFormat: BarcodeFormat.CODE_128,
      customColor: '#FFFFFF',
    };
    const createdCard = LoyaltyCard.create(dto);

    mockLoyaltyCardRepository.create.mockResolvedValue(createdCard);

    const result = await useCase.execute(dto);

    expect(repository.create).toHaveBeenCalledWith(expect.any(LoyaltyCard));
    expect(result).toEqual(createdCard);
    expect(result.userId).toBe(dto.userId);
    expect(result.storeId).toBe(dto.storeId);
  });
});
