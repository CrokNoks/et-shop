import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseRecordRepository } from '../domain/purchase-record.repository';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class CancelPurchaseUseCase {
  constructor(
    private readonly purchaseRecordRepository: PurchaseRecordRepository,
    private readonly supabaseService: SupabaseService,
  ) {}

  async execute(listId: string, itemId: string): Promise<void> {
    const householdId = this.supabaseService.getHouseholdId();
    if (!householdId) {
      throw new NotFoundException(
        'Active household (x-household-id) is required',
      );
    }

    // Verify the item belongs to the household
    const { data: item, error } = await this.supabaseService
      .getClient()
      .from('shopping_list_items')
      .select('id, list_id, is_purchased, shopping_lists!inner(household_id)')
      .eq('id', itemId)
      .eq('list_id', listId)
      .single();

    if (error || !item) {
      throw new NotFoundException(
        `Shopping list item ${itemId} not found in list ${listId}`,
      );
    }

    const list = Array.isArray(item.shopping_lists)
      ? item.shopping_lists[0]
      : item.shopping_lists;

    if (!list || list.household_id !== householdId) {
      throw new NotFoundException(
        'Item does not belong to the active household',
      );
    }

    // Idempotence : rejeu d'une action offline (ou double-clic) sur un item
    // déjà non-acheté (ex: annulé par un autre membre du foyer entre-temps)
    // doit rester un succès silencieux, pas une exception. Sans ce garde,
    // l'appel RPC échoue car aucun purchase_record n'existe plus à annuler.
    if (!item.is_purchased) {
      return;
    }

    await this.purchaseRecordRepository.cancelPurchase(itemId);
  }
}
