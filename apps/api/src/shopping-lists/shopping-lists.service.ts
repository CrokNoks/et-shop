import { Injectable, NotFoundException, UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ShoppingListsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private handleError(error: any) {
    if (error.code === 'PGRST116') throw new NotFoundException('Resource not found');
    if (error.code === '42501') throw new UnauthorizedException('You do not have permission');
    throw new InternalServerErrorException(error.message || 'Supabase error');
  }

  private getHouseholdIdOrThrow(): string {
    const id = this.supabaseService.getHouseholdId();
    if (!id) throw new BadRequestException('Active household (x-household-id) is required');
    return id;
  }

  async findAll() {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .select('*')
      .eq('household_id', householdId);
    
    if (error) this.handleError(error);
    return data || [];
  }

  async findAllCatalog() {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .select('*, categories(name)')
      .eq('household_id', householdId)
      .order('name', { ascending: true });
    
    if (error) this.handleError(error);
    return data || [];
  }

  async findAllCategories() {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .select('*')
      .eq('household_id', householdId)
      .order('sort_order', { ascending: true });
    
    if (error) this.handleError(error);
    return data || [];
  }

  async findOne(id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .select('*, shopping_list_items(*, items_catalog(*, categories(name, sort_order)))')
      .eq('id', id)
      .eq('household_id', householdId)
      .single();
    
    if (error) this.handleError(error);
    return data;
  }

  async create(name: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .insert({ name, household_id: householdId })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async createCategory(payload: { name: string; icon?: string; sort_order?: number }) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .insert({ ...payload, household_id: householdId })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async addItem(listId: string, payload: { name: string; quantity?: number; barcode?: string; category_id?: string; unit?: string }) {
    const client = this.supabaseService.getClient();
    const householdId = this.getHouseholdIdOrThrow();
    const { name, quantity = 1, barcode, category_id, unit } = payload;

    // 1. Chercher ou Créer dans le catalogue du foyer
    let { data: catalogItem } = await client
      .from('items_catalog')
      .select('id, unit, category_id, barcode')
      .ilike('name', name)
      .eq('household_id', householdId)
      .maybeSingle();

    let finalUnit = unit || catalogItem?.unit || 'pcs';
    let finalCategoryId = category_id || catalogItem?.category_id || null;
    let finalBarcode = barcode || catalogItem?.barcode || null;

    if (!catalogItem) {
      const { data: newItem, error: cError } = await client
        .from('items_catalog')
        .insert({ 
          name, 
          household_id: householdId, 
          category_id: finalCategoryId, 
          barcode: finalBarcode,
          unit: finalUnit
        })
        .select()
        .single();
      if (cError) this.handleError(cError);
      catalogItem = newItem;
    } else {
      // Mettre à jour si de nouvelles infos sont fournies
      const updates: any = {};
      if (unit && !catalogItem.unit) updates.unit = unit;
      if (category_id && !catalogItem.category_id) updates.category_id = category_id;
      if (barcode && !catalogItem.barcode) updates.barcode = barcode;
      
      if (Object.keys(updates).length > 0) {
        await client.from('items_catalog').update(updates).eq('id', catalogItem.id);
      }
    }

    // 2. Ajouter l'article à la liste (liaison)
    const { data, error } = await client
      .from('shopping_list_items')
      .insert({ 
        list_id: listId, 
        catalog_item_id: catalogItem.id,
        quantity,
        is_checked: false,
        unit: finalUnit
      })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async toggleItem(itemId: string, isChecked: boolean) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_list_items')
      .update({ is_checked: isChecked })
      .eq('id', itemId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async updatePrice(itemId: string, price: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_list_items')
      .update({ price })
      .eq('id', itemId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async updateQuantity(itemId: string, quantity: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_list_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async updateCatalogItem(id: string, payload: { name?: string; barcode?: string; category_id?: string; unit?: string }) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .update(payload)
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async deleteCatalogItem(id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .delete()
      .eq('id', id)
      .eq('household_id', householdId);
    if (error) this.handleError(error);
    return { success: true };
  }

  async updateCategory(id: string, payload: { name?: string; icon?: string; sort_order?: number }) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .update(payload)
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async deleteCategory(id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { error } = await this.supabaseService
      .getClient()
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('household_id', householdId);
    if (error) this.handleError(error);
    return { success: true };
  }

  async suggestItems(query: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .select('name, category_id, categories(name)')
      .eq('household_id', householdId)
      .ilike('name', `%${query}%`)
      .limit(5);
    if (error) this.handleError(error);
    return data;
  }
}
