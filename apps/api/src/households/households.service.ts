import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

// Alphabet sans caractères ambigus (pas de 0/O, 1/I) pour un code lisible à l'oral.
const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const INVITE_CODE_TTL_MS = 48 * 60 * 60 * 1000;

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }
  return code;
}

export interface HouseholdInvite {
  code: string;
  expires_at: string;
}

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

  /**
   * Génère un code d'invitation valable 48h, usage unique. Aligné sur `addMember`
   * (réservé aux admins) plutôt qu'ouvert à tout membre, pour garder un seul
   * modèle de permission cohérent entre "inviter par email" et "inviter par code".
   */
  async createInviteCode(householdId: string): Promise<HouseholdInvite> {
    const client = this.supabaseService.getClient();
    const currentUser = this.supabaseService.getUser();

    const { data: member, error: mError } = await client
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', currentUser.id)
      .single();

    if (mError || (member as HouseholdMember)?.role !== 'admin') {
      throw new UnauthorizedException(
        "Vous devez être administrateur pour générer un code d'invitation",
      );
    }

    // Un seul code actif à la fois : on retire les codes non utilisés existants
    // (expirés ou non) avant d'en créer un nouveau, plutôt que de les cumuler.
    const { error: dError } = await client
      .from('household_invites')
      .delete()
      .eq('household_id', householdId)
      .is('used_at', null);

    if (dError) throw dError;

    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + INVITE_CODE_TTL_MS).toISOString();

    const { data: invite, error: iError } = await client
      .from('household_invites')
      .insert({
        household_id: householdId,
        code,
        created_by: currentUser.id,
        expires_at: expiresAt,
      })
      .select('code, expires_at')
      .single();

    if (iError) throw iError;

    return invite as HouseholdInvite;
  }

  /**
   * Rejoint un foyer via un code d'invitation. Délègue entièrement à la fonction
   * SQL `join_household_by_code` (SECURITY DEFINER) : l'appelant n'est par
   * définition pas encore membre du foyer ciblé, donc RLS ne lui donnerait de
   * toute façon aucun accès direct à `household_invites`/`household_members` —
   * la validité du code, vérifiée côté SQL, est elle-même l'autorisation.
   * `auth.uid()` est résolu côté fonction à partir du JWT, pas passé en paramètre.
   */
  async joinHousehold(
    code: string,
  ): Promise<{ success: boolean; household_id: string }> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('join_household_by_code', {
      p_code: code,
    });

    if (error) {
      // Messages contrôlés par nous côté fonction SQL (join_household_by_code) :
      // correspondance stable, pas un texte d'erreur Postgres générique.
      if (error.message?.includes('Invalid invite code')) {
        throw new NotFoundException("Code d'invitation invalide");
      }
      if (error.message?.includes('already used')) {
        throw new BadRequestException('Ce code a déjà été utilisé');
      }
      if (error.message?.includes('expired')) {
        throw new BadRequestException('Ce code a expiré');
      }
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return { success: true, household_id: row.household_id };
  }
}
