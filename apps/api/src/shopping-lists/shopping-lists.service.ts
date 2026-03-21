import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ShoppingListsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .select('*, list_members(*)');
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .select('*, shopping_list_items(*, categories(name))')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Shopping list not found');
    return data;
  }

  async suggestItems(query: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('items_catalog')
      .select('name, category_id, categories(name)')
      .ilike('name', `%${query}%`)
      .limit(5);
    if (error) throw error;
    return data;
  }

  async create(name: string) {
    // Le owner_id est automatiquement géré par la valeur par défaut 'auth.uid()' sur la table
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
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
      .insert({ list_id: listId, name, category_id: categoryId, added_by: null }) // added_by peut aussi être auth.uid()
      .select()
      .single();

    if (error) throw error;
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
    if (error) throw error;
    return data;
  }
}
