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
      .select('*, shopping_list_items(*)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Shopping list not found');
    return data;
  }

  async create(name: string, ownerId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_lists')
      .insert({ name, owner_id: ownerId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addItem(listId: string, name: string, categoryId?: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('shopping_list_items')
      .insert({ list_id: listId, name, category_id: categoryId })
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
