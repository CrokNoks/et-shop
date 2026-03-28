const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function validateEnv() {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Variable d'environnement manquante : ${key}`);
    }
  }
}

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
};
