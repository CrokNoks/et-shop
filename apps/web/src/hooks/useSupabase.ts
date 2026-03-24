import { createBrowserClient } from '@supabase/ssr';
import { useMemo } from 'react';

export const useSupabase = () => {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookieOptions: {
            name: '__session',
          },
        }
      ),
    []
  );

  return supabase;
};
