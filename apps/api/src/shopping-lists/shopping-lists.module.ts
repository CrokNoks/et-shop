import { Module } from '@nestjs/common';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsService } from './shopping-lists.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [SupabaseModule, PurchasesModule],
  controllers: [ShoppingListsController],
  providers: [ShoppingListsService],
})
export class ShoppingListsModule {}
