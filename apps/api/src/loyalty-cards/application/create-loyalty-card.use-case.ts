import { Injectable } from '@nestjs/common';
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository';
import { LoyaltyCard } from '../domain/loyalty-card.entity';
import { CreateLoyaltyCardDto } from './dtos/create-loyalty-card.dto';

@Injectable()
export class CreateLoyaltyCardUseCase {
  constructor(private readonly loyaltyCardRepository: LoyaltyCardRepository) {}

  async execute(dto: CreateLoyaltyCardDto): Promise<LoyaltyCard> {
    const loyaltyCard = LoyaltyCard.create({
      userId: dto.userId,
      storeId: dto.storeId,
      cardData: dto.cardData,
      barcodeFormat: dto.barcodeFormat,
      customColor: dto.customColor,
    });
    return this.loyaltyCardRepository.create(loyaltyCard);
  }
}
