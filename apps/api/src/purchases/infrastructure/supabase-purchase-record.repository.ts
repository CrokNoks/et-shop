import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  PurchaseRecordRepository,
  PurchaseHistoryFilters,
  PaginatedPurchaseHistory,
  PurchaseStatistics,
} from '../domain/purchase-record.repository';
import { PurchaseRecord } from '../domain/purchase-record.entity';

@Injectable()
export class SupabasePurchaseRecordRepository implements PurchaseRecordRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  private mapToEntity(row: Record<string, unknown>): PurchaseRecord {
    return PurchaseRecord.reconstitute({
      id: row.id as string,
      shoppingListItemId: row.shopping_list_item_id as string,
      listId: row.list_id as string,
      householdId: row.household_id as string,
      catalogItemId: row.catalog_item_id as string,
      productName: (row.product_name as string) ?? '',
      quantity: (row.quantity as number) ?? 1,
      unit: (row.unit as string) ?? 'pcs',
      price: (row.price as number) ?? 0,
      categoryId: (row.category_id as string | null) ?? undefined,
      storeId: (row.store_id as string | null) ?? undefined,
      purchasedAt: new Date(row.purchased_at as string),
    });
  }

  /**
   * Atomically sets is_purchased = true on shopping_list_items AND inserts a purchase_record.
   * Uses Supabase RPC to ensure both operations succeed or fail together.
   */
  async recordPurchaseAtomic(
    itemId: string,
    record: PurchaseRecord,
  ): Promise<PurchaseRecord> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('record_purchase_atomic', {
      p_item_id: itemId,
      p_record_id: record.id,
      p_list_id: record.listId,
      p_household_id: record.householdId,
      p_catalog_item_id: record.catalogItemId,
      p_product_name: record.productName,
      p_quantity: record.quantity,
      p_unit: record.unit,
      p_price: record.price,
      p_category_id: record.categoryId ?? null,
      p_store_id: record.storeId ?? null,
      p_purchased_at: record.purchasedAt.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to record purchase atomically: ${error.message}`);
    }

    // RPC returns the inserted record row
    const row = data as Record<string, unknown>;
    return this.mapToEntity(row);
  }

  async cancelPurchase(itemId: string): Promise<void> {
    const client = this.supabaseService.getClient();

    const { error } = await client.rpc('cancel_purchase_atomic', {
      p_item_id: itemId,
    });

    if (error) {
      throw new Error(`Failed to cancel purchase atomically: ${error.message}`);
    }
  }

  async findHistory(
    filters: PurchaseHistoryFilters,
  ): Promise<PaginatedPurchaseHistory> {
    const client = this.supabaseService.getClient();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('purchase_records')
      .select('*', { count: 'exact' })
      .eq('household_id', filters.householdId)
      .order('purchased_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.listId) {
      query = query.eq('list_id', filters.listId);
    }
    if (filters.catalogItemId) {
      query = query.eq('catalog_item_id', filters.catalogItemId);
    }
    if (filters.storeId) {
      query = query.eq('store_id', filters.storeId);
    }
    if (filters.from) {
      query = query.gte('purchased_at', filters.from.toISOString());
    }
    if (filters.to) {
      query = query.lte('purchased_at', filters.to.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch purchase history: ${error.message}`);
    }

    return {
      data: (data ?? []).map((row) =>
        this.mapToEntity(row as Record<string, unknown>),
      ),
      total: count ?? 0,
      page,
      limit,
    };
  }

  async findByItem(
    catalogItemId: string,
    householdId: string,
    limit = 10,
  ): Promise<PurchaseRecord[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('purchase_records')
      .select('*')
      .eq('catalog_item_id', catalogItemId)
      .eq('household_id', householdId)
      .order('purchased_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(
        `Failed to fetch item purchase history: ${error.message}`,
      );
    }

    return (data ?? []).map((row) =>
      this.mapToEntity(row as Record<string, unknown>),
    );
  }

  async getStatistics(
    householdId: string,
    from?: Date,
    to?: Date,
  ): Promise<PurchaseStatistics> {
    const client = this.supabaseService.getClient();

    let query = client
      .from('purchase_records')
      .select('*')
      .eq('household_id', householdId);

    if (from) {
      query = query.gte('purchased_at', from.toISOString());
    }
    if (to) {
      query = query.lte('purchased_at', to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }

    const records = (data ?? []) as Record<string, unknown>[];

    // Aggregate stats in application layer
    const totalSpent = records.reduce((sum, r) => {
      return sum + ((r.price as number) ?? 0) * ((r.quantity as number) ?? 1);
    }, 0);
    const totalItems = records.length;

    // By category
    const categoryMap = new Map<
      string,
      { categoryName: string; totalSpent: number; itemCount: number }
    >();
    for (const r of records) {
      const catId = (r.category_id as string) ?? 'uncategorized';
      const catName = catId === 'uncategorized' ? 'Non catégorisé' : catId;
      const existing = categoryMap.get(catId) ?? {
        categoryName: catName,
        totalSpent: 0,
        itemCount: 0,
      };
      existing.totalSpent +=
        ((r.price as number) ?? 0) * ((r.quantity as number) ?? 1);
      existing.itemCount += 1;
      categoryMap.set(catId, existing);
    }
    const byCategory = Array.from(categoryMap.entries()).map(
      ([categoryId, v]) => ({
        categoryId,
        categoryName: v.categoryName,
        totalSpent: v.totalSpent,
        itemCount: v.itemCount,
      }),
    );

    // Top items
    const itemMap = new Map<
      string,
      { productName: string; purchaseCount: number; totalSpent: number }
    >();
    for (const r of records) {
      const itemId = r.catalog_item_id as string;
      const itemName = (r.product_name as string) ?? '';
      const existing = itemMap.get(itemId) ?? {
        productName: itemName,
        purchaseCount: 0,
        totalSpent: 0,
      };
      existing.purchaseCount += 1;
      existing.totalSpent +=
        ((r.price as number) ?? 0) * ((r.quantity as number) ?? 1);
      itemMap.set(itemId, existing);
    }
    const topItems = Array.from(itemMap.entries())
      .map(([catalogItemId, v]) => ({ catalogItemId, ...v }))
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 10);

    // By month
    const monthMap = new Map<
      string,
      { totalSpent: number; itemCount: number }
    >();
    for (const r of records) {
      const date = new Date(r.purchased_at as string);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(month) ?? { totalSpent: 0, itemCount: 0 };
      existing.totalSpent +=
        ((r.price as number) ?? 0) * ((r.quantity as number) ?? 1);
      existing.itemCount += 1;
      monthMap.set(month, existing);
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { totalSpent, totalItems, byCategory, topItems, byMonth };
  }
}
