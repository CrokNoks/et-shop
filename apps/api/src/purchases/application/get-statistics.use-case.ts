import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PurchaseRecordRepository,
  PurchaseStatistics,
} from '../domain/purchase-record.repository';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class GetStatisticsUseCase {
  constructor(
    private readonly purchaseRecordRepository: PurchaseRecordRepository,
    private readonly supabaseService: SupabaseService,
  ) {}

  async execute(from?: string, to?: string): Promise<PurchaseStatistics> {
    const householdId = this.supabaseService.getHouseholdId();
    if (!householdId) {
      throw new NotFoundException(
        'Active household (x-household-id) is required',
      );
    }

    return this.purchaseRecordRepository.getStatistics(
      householdId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
