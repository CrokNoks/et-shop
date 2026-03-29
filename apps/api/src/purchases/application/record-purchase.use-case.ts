import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseRecordRepository } from '../domain/purchase-record.repository';
import { PurchaseRecord } from '../domain/purchase-record.entity';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class RecordPurchaseUseCase {
  constructor(
    private readonly purchaseRecordRepository: PurchaseRecordRepository,
    private readonly supabaseService: SupabaseService,
  ) {}

  async execute(
    listId: string,
    itemId: string,
    priceOverride?: number,
  ): Promise<PurchaseRecord> {
    const householdId = this.supabaseService.getHouseholdId();
    if (!householdId) {
      throw new NotFoundException(
        'Active household (x-household-id) is required',
      );
    }

    // Fetch the item details for snapshotting
    const { data: item, error } = await this.supabaseService
      .getClient()
      .from('shopping_list_items')
      .select(
        `
        id,
        list_id,
        catalog_item_id,
        name,
        quantity,
        unit,
        price,
        category_id,
        shopping_lists!inner(household_id, store_id)
      `,
      )
      .eq('id', itemId)
      .eq('list_id', listId)
      .single();

    if (error || !item) {
      throw new NotFoundException(
        `Shopping list item ${itemId} not found in list ${listId}`,
      );
    }

    const list = Array.isArray(item.shopping_lists)
      ? item.shopping_lists[0]
      : item.shopping_lists;

    if (!list || list.household_id !== householdId) {
      throw new NotFoundException(
        'Item does not belong to the active household',
      );
    }

    // Build the snapshot record
    const record = PurchaseRecord.create({
      shoppingListItemId: item.id,
      listId: item.list_id,
      householdId,
      catalogItemId: item.catalog_item_id,
      productName: item.name ?? '',
      quantity: item.quantity ?? 1,
      unit: item.unit ?? 'pcs',
      price: priceOverride !== undefined ? priceOverride : (item.price ?? 0),
      categoryId: item.category_id ?? undefined,
      storeId: list.store_id ?? undefined,
    });

    // Atomically mark as purchased and insert the record
    return this.purchaseRecordRepository.recordPurchaseAtomic(itemId, record);
  }
}
