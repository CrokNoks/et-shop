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

  async createCatalogItem(payload: { name: string; barcode?: string; category_id?: string; unit?: string }) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .insert({ ...payload, household_id: householdId })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
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
      .select(`
        *,
        shopping_list_items (
          *,
          items_catalog (
            *,
            categories (*)
          )
        )
      `)
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

  async update(id: string, name: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .update({ name })
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
      .from('shopping_lists')
      .delete()
      .eq('id', id)
      .eq('household_id', householdId);

    if (error) this.handleError(error);
    return { success: true };
  }

  async createCategory(payload: { name: string; icon?: string; sort_order?: number }) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .insert({ 
        ...payload, 
        icon: payload.icon || '📦', 
        household_id: householdId 
      })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async importCategories(categories: { name: string; icon?: string; sort_order?: number }[]) {
    const householdId = this.getHouseholdIdOrThrow();
    const payload = categories.map(cat => ({
      ...cat,
      icon: cat.icon || '📦',
      household_id: householdId
    }));

    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .insert(payload)
      .select();

    if (error) this.handleError(error);
    return data;
  }

  async addItem(listId: string, payload: { name: string; quantity?: number; barcode?: string; category_id?: string; unit?: string }) {
    const client = this.supabaseService.getClient();
    const householdId = this.getHouseholdIdOrThrow();
    const { name, quantity = 1, barcode, category_id, unit } = payload;

    // 1. Chercher dans le catalogue du foyer
    let { data: catalogItem } = await client
      .from('items_catalog')
      .select('id, unit, category_id, barcode')
      .ilike('name', name)
      .eq('household_id', householdId)
      .maybeSingle();

    // L'unité par défaut est celle du catalogue, ou 'pcs'
    let finalUnit = catalogItem?.unit || unit || 'pcs';
    
    // Si l'utilisateur a saisi une unité spécifique dans le formulaire et que le produit existe déjà, 
    // on utilise sa saisie pour CET item de liste, mais on ne met PAS à jour le catalogue.
    if (unit && unit !== 'pcs') {
      finalUnit = unit;
    }

    if (!catalogItem) {
      // Produit inconnu : ON LE CRÉE dans le catalogue
      const { data: newItem, error: cError } = await client
        .from('items_catalog')
        .insert({ 
          name, 
          household_id: householdId, 
          category_id: category_id || null, 
          barcode: barcode || null,
          unit: finalUnit
        })
        .select()
        .single();
      if (cError) this.handleError(cError);
      catalogItem = newItem;
    }

    if (!catalogItem) throw new InternalServerErrorException('Failed to resolve catalog item');

    // 2. LOGIQUE DE RÉUTILISATION : Vérifier si l'article est déjà dans la liste
    const { data: existingListItem } = await client
      .from('shopping_list_items')
      .select('id, quantity')
      .eq('list_id', listId)
      .eq('catalog_item_id', catalogItem.id)
      .maybeSingle();

    if (existingListItem) {
      const { data, error } = await client
        .from('shopping_list_items')
        .update({ 
          quantity: Number(existingListItem.quantity) + Number(quantity),
          is_checked: false,
          unit: finalUnit 
        })
        .eq('id', existingListItem.id)
        .select()
        .single();
      if (error) this.handleError(error);
      return data;
    }

    // 3. Ajouter normalement
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

  async addItemByBarcode(listId: string, barcode: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const client = this.supabaseService.getClient();
    const { data: catalogItem, error: cError } = await client
      .from('items_catalog')
      .select('id, name, category_id, unit')
      .eq('barcode', barcode)
      .eq('household_id', householdId)
      .maybeSingle();

    if (cError || !catalogItem) {
      throw new NotFoundException('Product not found in catalog.');
    }

    const { data: existingListItem } = await client
      .from('shopping_list_items')
      .select('id, quantity')
      .eq('list_id', listId)
      .eq('catalog_item_id', catalogItem.id)
      .maybeSingle();

    if (existingListItem) {
      const { data, error } = await client
        .from('shopping_list_items')
        .update({ 
          quantity: Number(existingListItem.quantity) + 1,
          is_checked: false 
        })
        .eq('id', existingListItem.id)
        .select()
        .single();
      if (error) this.handleError(error);
      return data;
    }

    const { data, error } = await client
      .from('shopping_list_items')
      .insert({ 
        list_id: listId, 
        catalog_item_id: catalogItem.id,
        quantity: 1,
        is_checked: false,
        unit: catalogItem.unit,
        barcode
      })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async removeItem(itemId: string) {
    const client = this.supabaseService.getClient();
    const { error } = await client
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);
    
    if (error) this.handleError(error);
    return { success: true };
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

  async updateUnit(itemId: string, unit: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_list_items')
      .update({ unit })
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
      .select('name, category_id, categories(name), unit')
      .eq('household_id', householdId)
      .ilike('name', `%${query}%`)
      .limit(5);
    if (error) this.handleError(error);
    return data;
  }

  async importCatalogItems(items: { name: string; barcode?: string; unit?: string; category_name?: string }[]) {
    const householdId = this.getHouseholdIdOrThrow();
    const client = this.supabaseService.getClient();

    // 1. Récupérer toutes les catégories du foyer pour le mapping par nom
    const { data: categories } = await client
      .from('categories')
      .select('id, name')
      .eq('household_id', householdId);

    const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]));

    // 2. Préparer le payload
    const payload = items.map(item => ({
      name: item.name,
      barcode: item.barcode || null,
      unit: item.unit || 'pcs',
      household_id: householdId,
      category_id: item.category_name ? categoryMap.get(item.category_name.toLowerCase()) || null : null
    }));

    const { data, error } = await client
      .from('items_catalog')
      .insert(payload)
      .select();

    if (error) this.handleError(error);
    return data;
  }
}
