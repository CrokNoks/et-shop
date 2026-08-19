"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useSupabase } from "@/hooks/useSupabase";

/**
 * Id de l'utilisateur Supabase actuellement connecté, résolu côté client
 * uniquement (aucune valeur côté serveur — cette donnée n'existe que dans la
 * session du navigateur). `null` tant qu'elle n'est pas encore résolue ou si
 * personne n'est connecté.
 */
export function useCurrentUserId(): string | null {
  const supabase = useSupabase();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return userId;
}
