import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ShoppingListsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private handleError(error: any) {
    console.error('Supabase Error Details:', error);
    if (error.code === 'PGRST116')
      throw new NotFoundException('Resource not found');
    if (error.code === '42501')
      throw new UnauthorizedException('You do not have permission');
    throw new InternalServerErrorException(error.message || 'Supabase error');
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
      .from('shopping_lists')
      .select('*')
      .eq('household_id', householdId);

    if (error) this.handleError(error);
    return data || [];
  }

  async findAllCatalog(storeId?: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const query = this.supabaseService
      .getClient()
      .from('items_catalog')
      .select('*, categories(name, sort_order)');

    if (storeId) {
      query.eq('store_id', storeId);
    } else {
      query.eq('household_id', householdId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) this.handleError(error);
    return data || [];
  }

  async createCatalogItem(payload: {
    name: string;
    barcode?: string;
    category_id?: string;
    unit?: string;
    store_id: string;
  }) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .upsert(
        { ...payload, household_id: householdId },
        { onConflict: 'name, store_id' },
      )
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async findAllCategories(storeId?: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const query = this.supabaseService
      .getClient()
      .from('categories')
      .select('*');

    if (storeId) {
      query.eq('store_id', storeId);
    } else {
      query.eq('household_id', householdId);
    }

    const { data, error } = await query.order('sort_order', {
      ascending: true,
    });

    if (error) this.handleError(error);
    return data || [];
  }

  async findOne(id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .select(
        `
        *,
        shopping_list_items (
          *,
          items_catalog (
            *,
            categories (*),
            stores (*)
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

  async update(
    id: string,
    payload: { name?: string; store_id?: string | null },
  ) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .update(payload)
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async remove(id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { error, count } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('household_id', householdId);

    if (error) this.handleError(error);
    if (count === 0) throw new NotFoundException('Shopping list not found');
    return { success: true };
  }

  async createCategory(payload: {
    name: string;
    icon?: string;
    sort_order?: number;
    store_id: string;
  }) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .insert({
        ...payload,
        icon: payload.icon || '📦',
        household_id: householdId,
      })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async importCategories(
    categories: { name: string; icon?: string; sort_order?: number }[],
    storeId: string,
  ) {
    const householdId = this.getHouseholdIdOrThrow();
    const payload = categories.map((cat) => ({
      ...cat,
      icon: cat.icon || '📦',
      household_id: householdId,
      store_id: storeId,
    }));

    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .upsert(payload, { onConflict: 'name, store_id' })
      .select();

    if (error) this.handleError(error);
    return data;
  }

  async updateCategory(
    id: string,
    payload: { name?: string; icon?: string; sort_order?: number },
  ) {
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

  async addItem(
    listId: string,
    payload: {
      name: string;
      quantity?: number;
      barcode?: string;
      category_id?: string;
      unit?: string;
      store_id?: string;
      catalog_item_id?: string;
    },
  ) {
    const client = this.supabaseService.getClient();
    const householdId = this.getHouseholdIdOrThrow();
    const {
      name,
      quantity = 1,
      barcode,
      category_id,
      unit,
      store_id: payloadStoreId,
      catalog_item_id: payloadCatalogItemId,
    } = payload;

    // 0. Si catalog_item_id est fourni directement, l'utiliser sans lookup par nom
    if (payloadCatalogItemId) {
      const { data: directCatalogItem } = await client
        .from('items_catalog')
        .select('id, name, unit, category_id, barcode')
        .eq('id', payloadCatalogItemId)
        .maybeSingle();

      if (directCatalogItem) {
        const finalUnit =
          (unit && unit !== 'pcs' ? unit : directCatalogItem.unit) || unit || 'pcs';
        const { data: existingListItem } = await client
          .from('shopping_list_items')
          .select('id, quantity')
          .eq('list_id', listId)
          .eq('catalog_item_id', directCatalogItem.id)
          .maybeSingle();

        if (existingListItem) {
          const { data, error } = await client
            .from('shopping_list_items')
            .update({
              quantity: Number(existingListItem.quantity) + Number(quantity),
              is_checked: false,
              unit: finalUnit,
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
            catalog_item_id: directCatalogItem.id,
            name: name || directCatalogItem.name,
            category_id: category_id || directCatalogItem.category_id || null,
            quantity,
            is_checked: false,
            unit: finalUnit,
            barcode: barcode || directCatalogItem.barcode || null,
            price: 0,
          })
          .select()
          .single();
        if (error) this.handleError(error);
        return data;
      }
    }

    // 0b. Récupérer le store_id de la liste si non précisé
    let finalStoreId = payloadStoreId;
    if (!finalStoreId) {
      const { data: list } = await client
        .from('shopping_lists')
        .select('store_id')
        .eq('id', listId)
        .single();
      finalStoreId = list?.store_id;
    }

    if (!finalStoreId) {
      // Fallback: chercher le premier magasin du foyer si vraiment aucun n'est défini
      const { data: firstStore } = await client
        .from('stores')
        .select('id')
        .eq('household_id', householdId)
        .limit(1)
        .maybeSingle();
      finalStoreId = firstStore?.id;
    }

    if (!finalStoreId) {
      throw new BadRequestException(
        'Un magasin est requis pour ajouter un article (aucun magasin lié à la liste ou au foyer).',
      );
    }

    // 1. Chercher dans le catalogue du magasin spécifique
    let { data: catalogItem } = await client
      .from('items_catalog')
      .select('id, name, unit, category_id, barcode')
      .ilike('name', name)
      .eq('store_id', finalStoreId)
      .maybeSingle();

    // L'unité par défaut est celle du catalogue, ou 'pcs'
    let finalUnit = catalogItem?.unit || unit || 'pcs';

    if (unit && unit !== 'pcs') {
      finalUnit = unit;
    }

    if (!catalogItem) {
      // Produit inconnu : ON LE CRÉE dans le catalogue pour ce magasin
      const { data: newItem, error: cError } = await client
        .from('items_catalog')
        .insert({
          name,
          household_id: householdId,
          store_id: finalStoreId,
          category_id: category_id || null,
          barcode: barcode || null,
          unit: finalUnit,
        })
        .select()
        .single();
      if (cError) this.handleError(cError);
      catalogItem = newItem;
    }

    if (!catalogItem)
      throw new InternalServerErrorException('Failed to resolve catalog item');

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
          unit: finalUnit,
        })
        .eq('id', existingListItem.id)
        .select()
        .single();
      if (error) this.handleError(error);
      return data;
    }

    // 3. Ajouter normalement
    const finalName = name || catalogItem.name;
    if (!finalName) {
      throw new BadRequestException('Le nom du produit est requis.');
    }

    const { data, error } = await client
      .from('shopping_list_items')
      .insert({
        list_id: listId,
        catalog_item_id: catalogItem.id,
        name: finalName,
        category_id: category_id || catalogItem.category_id || null,
        quantity,
        is_checked: false,
        unit: finalUnit,
        barcode: barcode || catalogItem.barcode || null,
        price: 0,
      })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async addItemByBarcode(listId: string, barcode: string) {
    this.getHouseholdIdOrThrow();
    const client = this.supabaseService.getClient();

    // 0. Récupérer le store_id de la liste
    const { data: list } = await client
      .from('shopping_lists')
      .select('store_id')
      .eq('id', listId)
      .single();

    const storeId = list?.store_id;
    if (!storeId) {
      throw new BadRequestException(
        'Un magasin doit être lié à la liste pour ajouter par code-barres.',
      );
    }

    const { data: catalogItem, error: cError } = await client
      .from('items_catalog')
      .select('id, name, category_id, unit')
      .eq('barcode', barcode)
      .eq('store_id', storeId)
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
          is_checked: false,
        })
        .eq('id', existingListItem.id)
        .select()
        .single();
      if (error) this.handleError(error);
      return data;
    }

    const finalName = catalogItem.name;
    if (!finalName) {
      throw new BadRequestException(
        'Le nom du produit est introuvable dans le catalogue.',
      );
    }

    const { data, error } = await client
      .from('shopping_list_items')
      .insert({
        list_id: listId,
        catalog_item_id: catalogItem.id,
        name: finalName,
        category_id: catalogItem.category_id || null,
        quantity: 1,
        is_checked: false,
        unit: catalogItem.unit,
        barcode,
        price: 0,
      })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async removeItem(itemId: string) {
    const client = this.supabaseService.getClient();
    const { error, count } = await client
      .from('shopping_list_items')
      .delete({ count: 'exact' })
      .eq('id', itemId);

    if (error) this.handleError(error);
    if (count === 0) throw new NotFoundException('Shopping list item not found');
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

  async updateCatalogItem(
    id: string,
    payload: {
      name?: string;
      barcode?: string;
      category_id?: string;
      unit?: string;
    },
  ) {
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

  async bulkUpdateCatalogItemsCategory(ids: string[], category_id: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .update({ category_id })
      .in('id', ids)
      .eq('household_id', householdId)
      .select();

    if (error) this.handleError(error);
    return data;
  }

  async suggestItems(query: string) {
    const householdId = this.getHouseholdIdOrThrow();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .select(
        'id, name, category_id, store_id, categories(name), stores(name), unit',
      )
      .eq('household_id', householdId)
      .ilike('name', `%${query}%`)
      .limit(5);
    if (error) this.handleError(error);
    return data;
  }

  async updateBarcode(itemId: string, barcode: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('shopping_list_items')
      .update({ barcode })
      .eq('id', itemId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async importCatalogItems(
    items: {
      name: string;
      barcode?: string;
      unit?: string;
      category_name?: string;
    }[],
    storeId: string,
  ) {
    const householdId = this.getHouseholdIdOrThrow();
    const client = this.supabaseService.getClient();

    // 1. Récupérer toutes les catégories du magasin pour le mapping par nom
    const { data: categories } = await client
      .from('categories')
      .select('id, name')
      .eq('store_id', storeId);

    const categoryMap = new Map(
      categories?.map((c) => [c.name.toLowerCase(), c.id]),
    );

    // 2. Préparer le payload
    const payload = items.map((item) => ({
      name: item.name,
      barcode: item.barcode || null,
      unit: item.unit || 'pcs',
      household_id: householdId,
      store_id: storeId,
      category_id: item.category_name
        ? categoryMap.get(item.category_name.toLowerCase()) || null
        : null,
    }));

    const { data, error } = await client
      .from('items_catalog')
      .upsert(payload, { onConflict: 'name, store_id' })
      .select();

    if (error) this.handleError(error);
    return data;
  }
}
