import { Module } from '@nestjs/common';
import { LoyaltyCardsController } from './loyalty-cards.controller';
import { SupabaseLoyaltyCardRepository } from './infrastructure/supabase-loyalty-card.repository';
import { LoyaltyCardRepository } from './domain/loyalty-card.repository';
import { CreateLoyaltyCardUseCase } from './application/create-loyalty-card.use-case';
import { GetLoyaltyCardsUseCase } from './application/get-loyalty-cards.use-case';
import { GetLoyaltyCardByIdUseCase } from './application/get-loyalty-card-by-id.use-case';
import { UpdateLoyaltyCardUseCase } from './application/update-loyalty-card.use-case';
import { DeleteLoyaltyCardUseCase } from './application/delete-loyalty-card.use-case';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [LoyaltyCardsController],
  providers: [
    // Provide the concrete implementation for the abstract repository
    {
      provide: LoyaltyCardRepository,
      useClass: SupabaseLoyaltyCardRepository,
    },
    // Provide all use cases
    CreateLoyaltyCardUseCase,
    GetLoyaltyCardsUseCase,
    GetLoyaltyCardByIdUseCase,
    UpdateLoyaltyCardUseCase,
    DeleteLoyaltyCardUseCase,
  ],
  exports: [
    LoyaltyCardRepository, // Export repository if other modules need to use it
    CreateLoyaltyCardUseCase, // Export use cases if needed by other modules
    GetLoyaltyCardsUseCase,
    GetLoyaltyCardByIdUseCase,
    UpdateLoyaltyCardUseCase,
    DeleteLoyaltyCardUseCase,
  ],
})
export class LoyaltyCardsModule {}
