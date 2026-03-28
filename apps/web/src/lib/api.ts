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

// Recipes API
export function getRecipes() {
  return fetchApi("/recipes");
}

export function createRecipe(data: { name: string; description?: string }) {
  return fetchApi("/recipes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getRecipe(id: string) {
  return fetchApi(`/recipes/${id}`);
}

export function updateRecipe(
  id: string,
  data: { name?: string; description?: string },
) {
  return fetchApi(`/recipes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteRecipe(id: string) {
  return fetchApi(`/recipes/${id}`, { method: "DELETE" });
}

export function addRecipeItem(
  recipeId: string,
  data: { catalog_item_id: string; quantity: number; unit?: string },
) {
  return fetchApi(`/recipes/${recipeId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRecipeItem(
  recipeId: string,
  itemId: string,
  data: { quantity?: number; unit?: string },
) {
  return fetchApi(`/recipes/${recipeId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteRecipeItem(recipeId: string, itemId: string) {
  return fetchApi(`/recipes/${recipeId}/items/${itemId}`, { method: "DELETE" });
}

export function sendRecipeToList(recipeId: string, shoppingListId: string) {
  return fetchApi(`/recipes/${recipeId}/send`, {
    method: "POST",
    body: JSON.stringify({ shopping_list_id: shoppingListId }),
  });
}
