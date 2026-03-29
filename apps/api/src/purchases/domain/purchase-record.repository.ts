import { PurchaseRecord } from './purchase-record.entity';

export interface PurchaseHistoryFilters {
  householdId: string;
  listId?: string;
  catalogItemId?: string;
  storeId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedPurchaseHistory {
  data: PurchaseRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface PurchaseStatistics {
  totalSpent: number;
  totalItems: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    totalSpent: number;
    itemCount: number;
  }[];
  topItems: {
    catalogItemId: string;
    productName: string;
    purchaseCount: number;
    totalSpent: number;
  }[];
  byMonth: { month: string; totalSpent: number; itemCount: number }[];
}

export abstract class PurchaseRecordRepository {
  /**
   * Atomically sets is_purchased = true on shopping_list_items AND inserts a purchase_record.
   * Both operations must succeed or fail together.
   */
  abstract recordPurchaseAtomic(
    itemId: string,
    record: PurchaseRecord,
  ): Promise<PurchaseRecord>;

  /**
   * Cancels a purchase: removes the purchase_record and sets is_purchased = false.
   */
  abstract cancelPurchase(itemId: string): Promise<void>;

  abstract findHistory(
    filters: PurchaseHistoryFilters,
  ): Promise<PaginatedPurchaseHistory>;

  abstract findByItem(
    catalogItemId: string,
    householdId: string,
    limit?: number,
  ): Promise<PurchaseRecord[]>;

  abstract getStatistics(
    householdId: string,
    from?: Date,
    to?: Date,
  ): Promise<PurchaseStatistics>;
}
