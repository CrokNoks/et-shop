import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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

    // 1. Créer le foyer
    const { data: household, error: hError } = await client
      .from('households')
      .insert({ name })
      .select()
      .single();

    if (hError) throw hError;

    // 2. Ajouter le créateur comme admin
    const { error: mError } = await client.from('household_members').insert({
      household_id: (household as Household).id,
      user_id: user.id,
      role: 'admin',
    });

    if (mError) throw mError;

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
