import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchaseRecordRepository } from './domain/purchase-record.repository';
import { SupabasePurchaseRecordRepository } from './infrastructure/supabase-purchase-record.repository';
import { RecordPurchaseUseCase } from './application/record-purchase.use-case';
import { CancelPurchaseUseCase } from './application/cancel-purchase.use-case';
import { GetPurchaseHistoryUseCase } from './application/get-purchase-history.use-case';
import { GetStatisticsUseCase } from './application/get-statistics.use-case';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PurchasesController],
  providers: [
    {
      provide: PurchaseRecordRepository,
      useClass: SupabasePurchaseRecordRepository,
    },
    RecordPurchaseUseCase,
    CancelPurchaseUseCase,
    GetPurchaseHistoryUseCase,
    GetStatisticsUseCase,
  ],
  exports: [
    PurchaseRecordRepository,
    RecordPurchaseUseCase,
    CancelPurchaseUseCase,
    GetPurchaseHistoryUseCase,
    GetStatisticsUseCase,
  ],
})
export class PurchasesModule {}
