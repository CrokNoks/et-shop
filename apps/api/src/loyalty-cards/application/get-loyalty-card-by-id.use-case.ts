import { Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository';
import { LoyaltyCard } from '../domain/loyalty-card.entity';

@Injectable()
export class GetLoyaltyCardByIdUseCase {
  constructor(private readonly loyaltyCardRepository: LoyaltyCardRepository) {}

  async execute(id: string, userId: string): Promise<LoyaltyCard> {
    const card = await this.loyaltyCardRepository.findById(id);
    if (!card || card.userId !== userId) {
      throw new NotFoundException(
        `LoyaltyCard with ID ${id} not found or does not belong to user.`,
      );
    }
    return card;
  }
}
