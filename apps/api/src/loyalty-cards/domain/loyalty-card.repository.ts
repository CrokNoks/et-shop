import { LoyaltyCard } from './loyalty-card.entity';

export abstract class LoyaltyCardRepository {
  abstract create(loyaltyCard: LoyaltyCard): Promise<LoyaltyCard>;
  abstract findById(id: string): Promise<LoyaltyCard | null>;
  abstract findByUserId(
    userId: string,
    storeIds?: string[],
  ): Promise<LoyaltyCard[]>;
  abstract update(loyaltyCard: LoyaltyCard): Promise<LoyaltyCard>;
  abstract delete(id: string): Promise<void>;
}
