import { Injectable, Scope, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(
    private configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  getClient(): SupabaseClient {
    if (this.supabase) return this.supabase;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Critical: SUPABASE_URL or SUPABASE_KEY is missing');
      throw new Error('Server configuration error');
    }

    // Injecter le JWT de l'utilisateur pour que PostgREST exécute les requêtes avec le rôle
    // `authenticated` et que auth.uid() retourne l'identité correcte dans les triggers et politiques RLS.
    const authHeader = (this.request.headers['authorization'] as string) ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    });

    return this.supabase;
  }

  // Récupérer l'utilisateur authentifié (injecté par le SupabaseAuthGuard)
  getUser() {
    return (this.request as any).user;
  }

  // Utilitaire pour récupérer le foyer actif depuis les headers
  getHouseholdId(): string | null {
    return (this.request.headers['x-household-id'] as string) || null;
  }
}
