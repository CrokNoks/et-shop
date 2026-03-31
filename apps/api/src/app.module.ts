import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { HouseholdsModule } from './households/households.module';
import { StoresModule } from './stores/stores.module';
import { LoyaltyCardsModule } from './loyalty-cards/loyalty-cards.module';
import { RecipesModule } from './recipes/recipes.module';
import { PurchasesModule } from './purchases/purchases.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    ShoppingListsModule,
    HouseholdsModule,
    StoresModule,
    LoyaltyCardsModule,
    RecipesModule,
    PurchasesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
