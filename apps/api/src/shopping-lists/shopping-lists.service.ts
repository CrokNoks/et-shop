import { Injectable, NotFoundException, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ShoppingListsService {
  private readonly logger = new Logger(ShoppingListsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private handleError(error: any) {
    if (error.code === 'PGRST116') throw new NotFoundException('Resource not found');
    if (error.code === '42501') throw new UnauthorizedException('You do not have permission (RLS)');
    throw new InternalServerErrorException(error.message || 'Supabase error');
  }

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .select('*, list_members(*)');
    if (error) this.handleError(error);
    return data || [];
  }

  async findAllCatalog() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .select('*, categories(name)')
      .order('name', { ascending: true });
    if (error) this.handleError(error);
    return data || [];
  }

  async updateCatalogItem(id: string, payload: { name?: string; barcode?: string; category_id?: string }) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async deleteCatalogItem(id: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .delete()
      .eq('id', id);
    if (error) this.handleError(error);
    return { success: true };
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .select('*, shopping_list_items(*, categories(name))')
      .eq('id', id)
      .single();
    if (error) this.handleError(error);
    if (!data) throw new NotFoundException('Shopping list not found');
    return data;
  }

  async suggestItems(query: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .select('name, category_id, categories(name)')
      .ilike('name', `%${query}%`)
      .limit(5);
    if (error) this.handleError(error);
    return data;
  }

  async create(name: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .insert({ name })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async addItem(listId: string, payload: { name: string; quantity?: number; barcode?: string }) {
    const client = this.supabaseService.getClient();
    const { name, quantity = 1, barcode } = payload;

    const { data: catalogItem } = await client
      .from('items_catalog')
      .select('id, category_id, barcode')
      .ilike('name', name)
      .maybeSingle();

    let finalCategoryId = catalogItem?.category_id || null;
    let finalBarcode = barcode || catalogItem?.barcode || null;

    if (!catalogItem) {
      // Create new catalog item
      await client.from('items_catalog').insert({ 
        name, 
        category_id: null, 
        barcode: finalBarcode 
      });
    } else if (barcode && !catalogItem.barcode) {
      // Update existing catalog item with new barcode
      await client.from('items_catalog').update({ barcode }).eq('id', catalogItem.id);
    }

    const { data, error } = await client
      .from('shopping_list_items')
      .insert({ 
        list_id: listId, 
        name, 
        category_id: finalCategoryId, 
        barcode: finalBarcode,
        quantity
      })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async addItemByBarcode(listId: string, barcode: string) {
    const client = this.supabaseService.getClient();
    const { data: catalogItem } = await client
      .from('items_catalog')
      .select('name, category_id')
      .eq('barcode', barcode)
      .maybeSingle();

    if (!catalogItem) {
      throw new NotFoundException('Product not found in catalog.');
    }

    const { data, error } = await client
      .from('shopping_list_items')
      .insert({ 
        list_id: listId, 
        name: catalogItem.name, 
        category_id: catalogItem.category_id,
        barcode
      })
      .select()
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async updateBarcode(itemId: string, barcode: string) {
    const client = this.supabaseService.getClient();
    
    // 1. Mettre à jour l'item dans la liste
    const { data, error } = await client
      .from('shopping_list_items')
      .update({ barcode })
      .eq('id', itemId)
      .select()
      .single();

    if (error) this.handleError(error);

    // 2. Mettre à jour le catalogue (apprentissage)
    if (data) {
      await client
        .from('items_catalog')
        .update({ barcode })
        .ilike('name', data.name);
    }

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
}
