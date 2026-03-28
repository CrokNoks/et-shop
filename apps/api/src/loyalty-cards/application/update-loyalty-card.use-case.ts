import { Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository';
import { LoyaltyCard } from '../domain/loyalty-card.entity';
import { UpdateLoyaltyCardDto } from './dtos/update-loyalty-card.dto';

@Injectable()
export class UpdateLoyaltyCardUseCase {
  constructor(private readonly loyaltyCardRepository: LoyaltyCardRepository) {}

  async execute(
    id: string,
    userId: string,
    dto: UpdateLoyaltyCardDto,
  ): Promise<LoyaltyCard> {
    const existingCard = await this.loyaltyCardRepository.findById(id);
    if (!existingCard || existingCard.userId !== userId) {
      throw new NotFoundException(
        `LoyaltyCard with ID ${id} not found or does not belong to user.`,
      );
    }

    // Ensure userId is not updated and storeId is handled if changed
    // The userId should not be present in the DTO if it's not meant to be updated
    // However, if it's sent and differs, it's an attempt to change ownership, which is disallowed.
    if (dto.userId && dto.userId !== userId) {
      throw new Error('Cannot change ownership of a loyalty card.');
    }

    existingCard.update({
      storeId: dto.storeId, // Nullish coalescing is handled by PartialType, if undefined, it keeps the old value
      cardData: dto.cardData,
      barcodeFormat: dto.barcodeFormat,
      customColor: dto.customColor,
    });

    return this.loyaltyCardRepository.update(existingCard);
  }
}
