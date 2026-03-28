import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { LoyaltyCardRepository } from '../domain/loyalty-card.repository';
import { LoyaltyCard } from '../domain/loyalty-card.entity';
import { SupabaseService } from '../../supabase/supabase.service';
import { BarcodeFormat } from '../domain/barcode-format.enum';

@Injectable()
export class SupabaseLoyaltyCardRepository implements LoyaltyCardRepository {
  private readonly supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  private mapToEntity(data: any): LoyaltyCard | null {
    if (!data) return null;
    return LoyaltyCard.create(
      {
        userId: data.user_id,
        storeId: data.store_id,
        cardData: data.card_data,
        barcodeFormat: data.barcode_format as BarcodeFormat, // Cast to enum
        customColor: data.custom_color,
      },
      data.id,
    );
  }

  private mapToData(entity: LoyaltyCard): any {
    return {
      id: entity.id,
      user_id: entity.userId,
      store_id: entity.storeId,
      card_data: entity.cardData,
      barcode_format: entity.barcodeFormat,
      custom_color: entity.customColor,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  async create(loyaltyCard: LoyaltyCard): Promise<LoyaltyCard> {
    const { data, error } = await this.supabase
      .from('loyalty_cards')
      .insert(this.mapToData(loyaltyCard))
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase create error: ${error.message}`);
    }
    return this.mapToEntity(data) as LoyaltyCard;
  }

  async findById(id: string): Promise<LoyaltyCard | null> {
    const { data, error } = await this.supabase
      .from('loyalty_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found"
      throw new Error(`Supabase findById error: ${error.message}`);
    }
    return this.mapToEntity(data);
  }

  async findByUserId(
    userId: string,
    storeIds?: string[],
  ): Promise<LoyaltyCard[]> {
    let query = this.supabase
      .from('loyalty_cards')
      .select('*')
      .eq('user_id', userId);

    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase findByUserId error: ${error.message}`);
    }
    return data.map(this.mapToEntity).filter(Boolean) as LoyaltyCard[];
  }

  async update(loyaltyCard: LoyaltyCard): Promise<LoyaltyCard> {
    const { data, error } = await this.supabase
      .from('loyalty_cards')
      .update(this.mapToData(loyaltyCard))
      .eq('id', loyaltyCard.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }
    return this.mapToEntity(data) as LoyaltyCard;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('loyalty_cards')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
  }
}
