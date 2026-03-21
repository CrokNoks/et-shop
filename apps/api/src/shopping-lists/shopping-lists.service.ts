import { Injectable, NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ShoppingListsService {
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

  async addItem(listId: string, name: string) {
    const client = this.supabaseService.getClient();
    const { data: catalogItem } = await client
      .from('items_catalog')
      .select('category_id')
      .ilike('name', name)
      .maybeSingle();

    const categoryId = catalogItem?.category_id || null;

    const { data, error } = await client
      .from('shopping_list_items')
      .insert({ list_id: listId, name, category_id: categoryId })
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
}
