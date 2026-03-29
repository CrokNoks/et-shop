import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PurchaseRecordRepository,
  PaginatedPurchaseHistory,
} from '../domain/purchase-record.repository';
import { PurchaseHistoryQueryDto } from './dtos/purchase-history-query.dto';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class GetPurchaseHistoryUseCase {
  constructor(
    private readonly purchaseRecordRepository: PurchaseRecordRepository,
    private readonly supabaseService: SupabaseService,
  ) {}

  async execute(
    query: PurchaseHistoryQueryDto,
  ): Promise<PaginatedPurchaseHistory> {
    const householdId = this.supabaseService.getHouseholdId();
    if (!householdId) {
      throw new NotFoundException(
        'Active household (x-household-id) is required',
      );
    }

    return this.purchaseRecordRepository.findHistory({
      householdId,
      listId: query.listId,
      catalogItemId: query.catalogItemId,
      storeId: query.storeId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
