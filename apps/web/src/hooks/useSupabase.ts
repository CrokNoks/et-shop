import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const useSupabase = () => {
  return getSupabaseBrowserClient();
};
