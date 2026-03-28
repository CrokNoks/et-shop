import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      cookieOptions: {
        name: "__session",
      },
    });
  }
  return client;
}
