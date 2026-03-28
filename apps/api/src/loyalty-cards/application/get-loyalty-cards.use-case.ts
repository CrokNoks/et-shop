import { Injectable } from '@nestjs/common';
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository';
import { LoyaltyCard } from '../domain/loyalty-card.entity';

@Injectable()
export class GetLoyaltyCardsUseCase {
  constructor(private readonly loyaltyCardRepository: LoyaltyCardRepository) {}

  async execute(userId: string, storeIds?: string[]): Promise<LoyaltyCard[]> {
    return this.loyaltyCardRepository.findByUserId(userId, storeIds);
  }
}
