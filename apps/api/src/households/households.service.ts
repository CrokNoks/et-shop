import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class HouseholdsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findMyHouseholds() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('households')
      .select('*, household_members!inner(*)');
    
    if (error) throw error;
    return data;
  }

  async create(name: string) {
    const client = this.supabaseService.getClient();
    const user = this.supabaseService.getUser();
    
    if (!user) throw new UnauthorizedException('User not found');

    // 1. Créer le foyer
    const { data: household, error: hError } = await client
      .from('households')
      .insert({ name })
      .select()
      .single();

    if (hError) throw hError;

    // 2. Ajouter le créateur comme admin
    const { error: mError } = await client
      .from('household_members')
      .insert({ 
        household_id: household.id, 
        user_id: user.id,
        role: 'admin' 
      });

    if (mError) throw mError;

    return household;
  }
}
