import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  profile?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Household {
  id: string;
  name: string;
  created_at: string;
  household_members?: HouseholdMember[];
}

@Injectable()
export class HouseholdsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findMyHouseholds(): Promise<Household[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('households')
      .select('*, household_members!inner(*)');

    if (error) throw error;
    return data as Household[];
  }

  async create(name: string): Promise<Household> {
    const client = this.supabaseService.getClient();
    const user = this.supabaseService.getUser();

    if (!user) throw new UnauthorizedException('User not found');

    // Le trigger BEFORE INSERT (handle_new_household) définit owner_id = auth.uid()
    // Le trigger AFTER INSERT (handle_new_household_membership) ajoute le créateur comme admin
    const { data: household, error: hError } = await client
      .from('households')
      .insert({ name })
      .select()
      .single();

    if (hError) throw hError;

    return household as Household;
  }

  async findMembers(householdId: string): Promise<HouseholdMember[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('household_members')
      .select('*, profile:profiles(*)')
      .eq('household_id', householdId);

    if (error) throw error;
    return data as HouseholdMember[];
  }

  async addMember(
    householdId: string,
    email: string,
  ): Promise<{ success: boolean }> {
    const client = this.supabaseService.getClient();
    const currentUser = this.supabaseService.getUser();

    // 1. Vérifier si l'utilisateur actuel est admin du foyer
    const { data: member, error: mError } = await client
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', currentUser.id)
      .single();

    if (mError || (member as HouseholdMember)?.role !== 'admin') {
      throw new UnauthorizedException(
        'Vous devez être administrateur pour ajouter un membre',
      );
    }

    // 2. Trouver l'utilisateur par son email
    const { data: profile, error: pError } = await client
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (pError || !profile) {
      throw new NotFoundException(
        "Aucun utilisateur trouvé avec cet email. Assurez-vous qu'il est déjà inscrit sur Et SHop!",
      );
    }

    // 3. Ajouter l'utilisateur au foyer
    const { error: iError } = await client.from('household_members').insert({
      household_id: householdId,
      user_id: (profile as { id: string }).id,
      role: 'member',
    });

    if (iError) {
      if (iError.code === '23505')
        throw new BadRequestException(
          'Cet utilisateur fait déjà partie du foyer',
        );
      throw iError;
    }

    return { success: true };
  }

  async removeMember(
    householdId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const client = this.supabaseService.getClient();
    const currentUser = this.supabaseService.getUser();

    // 1. Vérifier si l'utilisateur actuel est admin du foyer
    const { data: member, error: mError } = await client
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', currentUser.id)
      .single();

    if (mError || (member as HouseholdMember)?.role !== 'admin') {
      throw new UnauthorizedException(
        'Vous devez être administrateur pour supprimer un membre',
      );
    }

    // 2. Si la cible est admin, vérifier qu'il n'est pas le dernier
    const { data: targetMember } = await client
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', userId)
      .single();

    if ((targetMember as HouseholdMember)?.role === 'admin') {
      const { count, error: countError } = await client
        .from('household_members')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', householdId)
        .eq('role', 'admin');

      if (countError) throw countError;

      if ((count ?? 0) <= 1) {
        throw new ForbiddenException(
          'Impossible de supprimer le dernier administrateur du foyer. Promouvez un autre membre avant de procéder.',
        );
      }
    }

    // 3. Supprimer le membre
    const { error: dError } = await client
      .from('household_members')
      .delete()
      .eq('household_id', householdId)
      .eq('user_id', userId);

    if (dError) throw dError;

    return { success: true };
  }
}
