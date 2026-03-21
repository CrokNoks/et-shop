import { Injectable, Scope, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  getClient(): SupabaseClient {
    if (this.supabase) return this.supabase;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    
    // Récupérer le token de l'utilisateur depuis la requête
    const authHeader = this.request.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (token) {
      // Créer un client "au nom de l'utilisateur" pour que le RLS s'applique
      this.supabase = createClient(supabaseUrl!, supabaseKey!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } else {
      // Client standard (service role ou anonyme)
      this.supabase = createClient(supabaseUrl!, supabaseKey!);
    }

    return this.supabase;
  }
}
