import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { AddRecipeItemDto } from './dto/add-recipe-item.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private handleError(error: any) {
    console.error('Supabase Error Details:', JSON.stringify(error, null, 2));
    if (error.code === 'PGRST116')
      throw new NotFoundException('Resource not found');
    if (error.code === '42501')
      throw new UnauthorizedException('You do not have permission');
    throw new InternalServerErrorException(error.message || 'Supabase error', {
      cause: error,
    });
  }

  private getHouseholdIdOrThrow(): string {
    const id = this.supabaseService.getHouseholdId();
    if (!id)
      throw new BadRequestException(
        'Active household (x-household-id) is required',
      );
    return id;
  }

  async findAll() {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('recipes')
      .select('*, recipe_items(count)')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) this.handleError(error);
    return data || [];
  }

  async findOne(id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('recipes')
      .select(
        `
        *,
        recipe_items (
          *,
          items_catalog (
            id,
            name,
            unit,
            store_id,
            categories (name, sort_order),
            stores (id, name)
          )
        )
      `,
      )
      .eq('id', id)
      .eq('household_id', householdId)
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async create(dto: CreateRecipeDto) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('recipes')
      .insert({ ...dto, household_id: householdId })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async update(id: string, dto: UpdateRecipeDto) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('recipes')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async remove(id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { error } = await this.supabaseService
      .getClient()
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('household_id', householdId);

    if (error) this.handleError(error);
    return { success: true };
  }

  async addItem(recipeId: string, dto: AddRecipeItemDto) {
    const householdId = this.getHouseholdIdOrThrow();
    // Verify recipe belongs to household
    const { data: recipe, error: rError } = await this.supabaseService
      .getClient()
      .from('recipes')
      .select('id')
      .eq('id', String(recipeId))
      .eq('household_id', householdId)
      .single();

    if (rError || !recipe) throw new NotFoundException('Recipe not found');

    const { data, error } = await this.supabaseService
      .getClient()
      .from('recipe_items')
      .insert({
        recipe_id: recipeId,
        catalog_item_id: dto.catalog_item_id,
        quantity: dto.quantity,
        unit: dto.unit,
      })
      .select(
        `*, items_catalog(id, name, unit, store_id, categories(name, sort_order), stores(id, name))`,
      )
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async updateItem(
    recipeId: string,
    itemId: string,
    payload: { quantity?: number; unit?: string },
  ) {
    const householdId = this.getHouseholdIdOrThrow();
    // Verify recipe belongs to household
    const { data: recipe, error: rError } = await this.supabaseService
      .getClient()
      .from('recipes')
      .select('id')
      .eq('id', String(recipeId))
      .eq('household_id', householdId)
      .single();

    if (rError || !recipe) throw new NotFoundException('Recipe not found');

    const { data, error } = await this.supabaseService
      .getClient()
      .from('recipe_items')
      .update(payload)
      .eq('id', itemId)
      .eq('recipe_id', recipeId)
      .select(
        `*, items_catalog(id, name, unit, store_id, categories(name, sort_order), stores(id, name))`,
      )
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async removeItem(recipeId: string, itemId: string) {
    const householdId = this.getHouseholdIdOrThrow();
    // Verify recipe belongs to household
    const { data: recipe, error: rError } = await this.supabaseService
      .getClient()
      .from('recipes')
      .select('id')
      .eq('id', String(recipeId))
      .eq('household_id', householdId)
      .single();

    if (rError || !recipe) throw new NotFoundException('Recipe not found');

    const { error } = await this.supabaseService
      .getClient()
      .from('recipe_items')
      .delete()
      .eq('id', itemId)
      .eq('recipe_id', recipeId);

    if (error) this.handleError(error);
    return { success: true };
  }

  async sendToList(recipeId: string, shoppingListId: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const client = this.supabaseService.getClient();

    // 1. Verify recipe belongs to household and fetch its items
    const { data: recipe, error: rError } = await client
      .from('recipes')
      .select('id, recipe_items(id, catalog_item_id, quantity, unit)')
      .eq('id', recipeId)
      .eq('household_id', householdId)
      .single();

    if (rError || !recipe) throw new NotFoundException('Recipe not found');

    // 2. Verify shopping list belongs to household
    const { data: list, error: lError } = await client
      .from('shopping_lists')
      .select('id, store_id')
      .eq('id', shoppingListId)
      .eq('household_id', householdId)
      .single();

    if (lError || !list) throw new NotFoundException('Shopping list not found');

    const recipeItems: {
      id: string;
      catalog_item_id: string;
      quantity: number;
      unit?: string;
    }[] = (recipe as any).recipe_items || [];

    if (recipeItems.length === 0) {
      return { success: true, applied: 0 };
    }

    // 3. Fetch existing shopping list items for those catalog items
    const catalogIds = recipeItems.map((ri) => ri.catalog_item_id);
    const { data: existingItems, error: eError } = await client
      .from('shopping_list_items')
      .select('id, catalog_item_id, quantity, is_purchased')
      .eq('list_id', shoppingListId)
      .in('catalog_item_id', catalogIds);

    if (eError) this.handleError(eError);

    const existingMap = new Map(
      (existingItems || []).map((item) => [item.catalog_item_id, item]),
    );

    // 4. Apply merge rules
    const updates: { id: string; quantity: number; is_purchased: boolean }[] =
      [];
    const inserts: {
      list_id: string;
      catalog_item_id: string;
      name: string;
      quantity: number;
      unit?: string;
      is_purchased: boolean;
      price: number;
    }[] = [];

    for (const ri of recipeItems) {
      const existing = existingMap.get(ri.catalog_item_id);

      if (existing) {
        if (existing.is_purchased) {
          // Rule 1: checked → uncheck and replace quantity
          updates.push({
            id: existing.id,
            quantity: ri.quantity,
            is_purchased: false,
          });
        } else {
          // Rule 2: not checked → add quantities
          updates.push({
            id: existing.id,
            quantity: Number(existing.quantity) + Number(ri.quantity),
            is_purchased: false,
          });
        }
      } else {
        // Rule 3: not in list → fetch catalog item name and insert
        const { data: catalogItem } = await client
          .from('items_catalog')
          .select('id, name, unit')
          .eq('id', ri.catalog_item_id)
          .single();

        if (catalogItem) {
          inserts.push({
            list_id: shoppingListId,
            catalog_item_id: ri.catalog_item_id,
            name: catalogItem.name,
            quantity: ri.quantity,
            unit: ri.unit || catalogItem.unit || 'pcs',
            is_purchased: false,
            price: 0,
          });
        }
      }
    }

    // 5. Execute all updates and inserts
    if (updates.length > 0) {
      for (const upd of updates) {
        const { error: uError } = await client
          .from('shopping_list_items')
          .update({ quantity: upd.quantity, is_purchased: upd.is_purchased })
          .eq('id', upd.id);
        if (uError) this.handleError(uError);
      }
    }

    if (inserts.length > 0) {
      const { error: iError } = await client
        .from('shopping_list_items')
        .insert(inserts);
      if (iError) this.handleError(iError);
    }

    return { success: true, applied: updates.length + inserts.length };
  }
}
