import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";

export async function fetchApi(path: string, options: RequestInit = {}) {
  const supabase = getSupabaseBrowserClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  // Ajouter le household_id actif s'il existe
  if (typeof window !== "undefined") {
    const householdId = localStorage.getItem("active_household_id");
    if (householdId) {
      headers.set("x-household-id", householdId);
    }
  }

  const response = await fetch(`${env.API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    const error = new Error(
      errorData.message || "API request failed",
    ) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}
