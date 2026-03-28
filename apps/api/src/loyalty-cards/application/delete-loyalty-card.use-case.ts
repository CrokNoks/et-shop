import { Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository';

@Injectable()
export class DeleteLoyaltyCardUseCase {
  constructor(private readonly loyaltyCardRepository: LoyaltyCardRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const existingCard = await this.loyaltyCardRepository.findById(id);
    if (!existingCard || existingCard.userId !== userId) {
      throw new NotFoundException(
        `LoyaltyCard with ID ${id} not found or does not belong to user.`,
      );
    }
    await this.loyaltyCardRepository.delete(id);
  }
}
