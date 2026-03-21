import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';

@Module({
  imports: [SupabaseModule, ShoppingListsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
