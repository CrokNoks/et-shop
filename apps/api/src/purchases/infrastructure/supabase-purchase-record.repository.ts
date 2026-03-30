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
      shoppingListItemId: (row.shopping_list_item_id as string) ?? '',
      listId: row.list_id as string,
      householdId: row.household_id as string,
      catalogItemId: row.catalog_item_id as string,
      itemName: (row.item_name as string) ?? '',
      categoryName: (row.category_name as string | null) ?? undefined,
      pricePerUnit: (row.price_per_unit as number) ?? 0,
      quantity: (row.quantity as number) ?? 1,
      unit: (row.unit as string) ?? 'pcs',
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
      p_household_id: record.householdId,
      p_list_item_id: itemId,
      p_catalog_item_id: record.catalogItemId,
      p_item_name: record.itemName,
      p_category_id: record.categoryId ?? null,
      p_category_name: record.categoryName ?? null,
      p_store_id: record.storeId ?? null,
      p_list_id: record.listId,
      p_quantity: record.quantity,
      p_unit: record.unit,
      p_price_per_unit: record.pricePerUnit,
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
      p_list_item_id: itemId,
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

    // ── v_spending_by_category ──────────────────────────────────────────────
    let categoryQuery = client
      .from('v_spending_by_category')
      .select('category_id, category_name, month, total_spent')
      .eq('household_id', householdId);

    if (from) {
      categoryQuery = categoryQuery.gte('month', from.toISOString());
    }
    if (to) {
      categoryQuery = categoryQuery.lte('month', to.toISOString());
    }

    const { data: categoryRows, error: categoryError } = await categoryQuery;

    if (categoryError) {
      throw new Error(
        `Failed to fetch category statistics: ${categoryError.message}`,
      );
    }

    // ── v_top_items ──────────────────────────────────────────────────────────
    const { data: topItemRows, error: topItemsError } = await client
      .from('v_top_items')
      .select(
        'catalog_item_id, item_name, purchase_count, avg_price, total_quantity',
      )
      .eq('household_id', householdId)
      .order('purchase_count', { ascending: false })
      .limit(10);

    if (topItemsError) {
      throw new Error(
        `Failed to fetch top items statistics: ${topItemsError.message}`,
      );
    }

    // ── Aggregate byCategory (sum across months) ─────────────────────────────
    const categoryMap = new Map<
      string,
      { categoryName: string; totalSpent: number; itemCount: number }
    >();
    for (const row of categoryRows ?? []) {
      const catId = (row.category_id as string) ?? 'uncategorized';
      const catName =
        (row.category_name as string) ??
        (catId === 'uncategorized' ? 'Non catégorisé' : catId);
      const existing = categoryMap.get(catId) ?? {
        categoryName: catName,
        totalSpent: 0,
        itemCount: 0,
      };
      existing.totalSpent += (row.total_spent as number) ?? 0;
      existing.itemCount += 1; // one row = one category-month bucket
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

    // ── topItems from v_top_items ────────────────────────────────────────────
    const topItems = (topItemRows ?? []).map((row) => ({
      catalogItemId: row.catalog_item_id as string,
      productName: (row.item_name as string) ?? '',
      purchaseCount: (row.purchase_count as number) ?? 0,
      totalSpent:
        ((row.avg_price as number) ?? 0) *
        ((row.total_quantity as number) ?? 0),
    }));

    // ── byMonth (aggregate from category rows) ───────────────────────────────
    const monthMap = new Map<
      string,
      { totalSpent: number; itemCount: number }
    >();
    for (const row of categoryRows ?? []) {
      const rawMonth = row.month as string;
      // month is a TIMESTAMPTZ from DATE_TRUNC; normalise to "YYYY-MM"
      const month = rawMonth.slice(0, 7);
      const existing = monthMap.get(month) ?? { totalSpent: 0, itemCount: 0 };
      existing.totalSpent += (row.total_spent as number) ?? 0;
      existing.itemCount += 1;
      monthMap.set(month, existing);
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // ── totals ───────────────────────────────────────────────────────────────
    const totalSpent = byCategory.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalItems = topItems.reduce((sum, i) => sum + i.purchaseCount, 0);

    return { totalSpent, totalItems, byCategory, topItems, byMonth };
  }
}
