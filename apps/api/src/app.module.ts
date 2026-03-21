import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { HouseholdsModule } from './households/households.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    ShoppingListsModule,
    HouseholdsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
