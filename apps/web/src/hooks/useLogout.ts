"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/useSupabase";
import { ACTIVE_LIST_KEY } from "@/lib/constants";

/**
 * Déconnexion partagée entre le bandeau (ListHeader) et l'écran "Mes listes
 * & foyer" (/lists) : signOut Supabase, nettoyage des clés locales de
 * session, redirection vers /login.
 */
export function useLogout() {
  const supabase = useSupabase();
  const router = useRouter();

  return useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("active_household_id");
    localStorage.removeItem(ACTIVE_LIST_KEY);
    router.push("/login");
    router.refresh();
  }, [supabase, router]);
}
