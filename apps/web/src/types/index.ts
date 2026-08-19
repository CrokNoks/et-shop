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
  isShared?: boolean;
  color?: string;
  household_id: string;
  store_id?: string;
}

/** Forme renvoyée par `GET /recipes` (liste) : PostgREST agrège `recipe_items(count)` plutôt que le détail des lignes. */
export interface RecipeItemsCountAggregate {
  count: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  household_id: string;
  created_at: string;
  updated_at: string;
  /**
   * `GET /recipes/:id` (détail, `RecipeDetail`) renvoie le détail réel des
   * lignes : `RecipeItem[]`. `GET /recipes` (liste, `RecipeCard`) renvoie
   * un agrégat de comptage : `RecipeItemsCountAggregate[]` (un seul élément
   * `{ count }`), pas le détail des ingrédients — ne pas lire `.name` ni
   * `.items_catalog` dessus sans avoir d'abord vérifié laquelle des deux
   * formes on manipule.
   */
  recipe_items?: RecipeItem[] | RecipeItemsCountAggregate[];
  servings?: number;
  /** Absent (pas 0) dès qu'un ingrédient n'a pas de prix de référence connu. */
  estimated_cost?: number;
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
  updated_at?: string;
  purchased_by?: string | null;
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
