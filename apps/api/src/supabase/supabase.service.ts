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
    @Inject(REQUEST) private readonly request: Request
  ) {}

  getClient(): SupabaseClient {
    if (this.supabase) return this.supabase;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Critical: SUPABASE_URL or SUPABASE_KEY is missing');
      throw new Error('Server configuration error');
    }

    const authHeader = this.request.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (token) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    return this.supabase;
  }

  // Utilitaire pour récupérer le foyer actif depuis les headers
  getHouseholdId(): string | null {
    return (this.request.headers['x-household-id'] as string) || null;
  }
}
