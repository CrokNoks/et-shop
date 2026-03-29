export interface Category {
  id: string;
  name: string;
  sort_order: number;
  icon?: string;
  store_id: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  barcode?: string;
  unit?: string;
  category_id?: string;
  store_id: string;
  categories?: { name: string; sort_order: number };
  usage_count: number;
}

export interface Store {
  id: string;
  name: string;
  household_id: string;
  created_at: string;
}

export interface StoreCategoryOrder {
  store_id: string;
  category_id: string;
  sort_order: number;
  category?: Category;
}

export interface ShoppingList {
  id: string;
  name: string;
  itemCount?: number;
  isShared?: boolean;
  color?: string;
  household_id: string;
  store_id?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  household_id: string;
  created_at: string;
  updated_at: string;
  recipe_items?: RecipeItem[];
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  catalog_item_id: string;
  quantity: number;
  unit?: string;
  created_at: string;
  items_catalog?: CatalogItem;
}

export interface ShoppingListItem {
  id: string;
  is_purchased: boolean;
  quantity: number;
  price: number;
  unit?: string;
  barcode?: string;
  name?: string;
  items_catalog:
    | {
        name?: string;
        barcode?: string;
        unit?: string;
        categories?: { name: string; sort_order: number };
        stores?: { id: string; name: string };
      }
    | {
        name?: string;
        barcode?: string;
        unit?: string;
        categories?: { name: string; sort_order: number };
        stores?: { id: string; name: string };
      }[]
    | null; // Supabase join can return object or array
}
