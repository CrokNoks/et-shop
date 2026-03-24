import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(householdId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .select('*')
      .eq('household_id', householdId);

    if (error) throw error;
    return data;
  }

  async findOne(id: string, householdId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .select('*')
      .eq('id', id)
      .eq('household_id', householdId)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createStoreDto: CreateStoreDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .insert({
        name: createStoreDto.name,
        household_id: createStoreDto.householdId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, name: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  async getCategories(storeId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  async updateCategoryOrders(storeId: string, orders: { categoryId: string, sortOrder: number }[]) {
    const client = this.supabaseService.getClient();

    // On met à jour le sort_order directement sur la table categories
    const updates = orders.map(o => 
      client
        .from('categories')
        .update({ sort_order: o.sortOrder })
        .eq('id', o.categoryId)
        .eq('store_id', storeId)
    );

    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;
    
    if (firstError) throw firstError;
    return { success: true };
  }
}
