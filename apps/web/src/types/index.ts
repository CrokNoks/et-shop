export interface Category {
  id: string;
  name: string;
  sort_order: number;
  icon?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  barcode?: string;
  unit?: string;
  category_id?: string;
  categories?: { name: string; sort_order: number };
  usage_count: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  itemCount?: number;
  isShared?: boolean;
  color?: string;
  household_id: string;
}

export interface ShoppingListItem {
  id: string;
  is_checked: boolean;
  quantity: number;
  price: number;
  unit?: string;
  barcode?: string;
  name?: string;
  items_catalog: any; // Using any for Supabase join variations
}
