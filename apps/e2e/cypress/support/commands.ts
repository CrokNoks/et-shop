/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginWithFixture(): Chainable<void>;
      setActiveHousehold(householdId: string): Chainable<void>;
      getSupabaseToken(): Chainable<string>;
      apiRequest<T = unknown>(
        method: string,
        path: string,
        body?: unknown,
      ): Chainable<T>;
      createShoppingListViaApi(name: string): Chainable<string>;
      createStoreViaApi(name: string): Chainable<string>;
      createRecipeViaApi(name: string, description?: string): Chainable<string>;
      addRecipeItemViaApi(
        recipeId: string,
        catalogItemId: string,
        quantity?: number,
        unit?: string,
      ): Chainable<string>;
      sendRecipeToListViaApi(
        recipeId: string,
        shoppingListId: string,
      ): Chainable<void>;
      getShoppingListItemsViaApi(listId: string): Chainable<unknown[]>;
      cleanupTestData(): Chainable<void>;
    }
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get("[data-cy=login-email]").type(email);
  cy.get("[data-cy=login-password]").type(password);
  cy.get("[data-cy=login-submit]").click();
  cy.url().should("not.include", "/login");
});

Cypress.Commands.add("loginWithFixture", () => {
  cy.fixture("user").then((user) => {
    cy.login(user.email, user.password);
    
    // On visite la page d'accueil pour forcer le chargement de la session et du foyer
    cy.visit("/");
    cy.get("h1", { timeout: 15000 }).should("be.visible");
  });
});

Cypress.Commands.add("setActiveHousehold", (householdId: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem("active_household_id", householdId);
  });
});

// ─── Token extraction ─────────────────────────────────────────────────────────
// Supabase stocke la session dans localStorage sous la clé sb-*-auth-token

Cypress.Commands.add("getSupabaseToken", () => {
  // @supabase/ssr stores the session in cookies (not localStorage).
  // Cookie name: "__session-auth-token" (or chunked as "__session-auth-token.0", etc.)
  return cy.getCookies().then((cookies) => {
    // @supabase/ssr with cookieOptions.name="__session" stores the session
    // either in "__session" directly or chunked as "__session.0", "__session.1", etc.
    const chunks = cookies
      .filter(
        (c) => c.name === "__session" || c.name.startsWith("__session."),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    if (chunks.length === 0) {
      throw new Error(
        "Supabase auth cookie not found (__session). " +
          `Available cookies: ${cookies.map((c) => c.name).join(", ")}`,
      );
    }

    let raw = chunks.map((c) => decodeURIComponent(c.value)).join("");
    // @supabase/ssr encodes the session as "base64-<base64EncodedJSON>"
    if (raw.startsWith("base64-")) {
      raw = atob(raw.slice("base64-".length));
    }
    const session = JSON.parse(raw);
    const token = session.access_token;
    if (!token) throw new Error("access_token missing in Supabase session cookie");
    return token as string;
  });
});

// ─── Generic API helper ───────────────────────────────────────────────────────

Cypress.Commands.add(
  "apiRequest",
  <T = unknown>(method: string, path: string, body?: unknown) => {
    return cy.getSupabaseToken().then((token) => {
      return cy
        .window()
        .then((win) => {
          const householdId = win.localStorage.getItem("active_household_id");
          return cy.request<T>({
            method,
            url: `${Cypress.env("apiUrl")}${path}`,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              ...(householdId ? { "x-household-id": householdId } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
            failOnStatusCode: true,
          });
        })
        .then((res) => res.body as T);
    });
  },
);

// ─── Shopping Lists ───────────────────────────────────────────────────────────

Cypress.Commands.add("createShoppingListViaApi", (name: string) => {
  return cy
    .apiRequest<{ id: string }>("POST", "/shopping-lists", { name })
    .then((list) => list.id);
});

Cypress.Commands.add("createStoreViaApi", (name: string) => {
  return cy
    .apiRequest<{ id: string }>("POST", "/stores", { name })
    .then((store) => store.id);
});

Cypress.Commands.add("getShoppingListItemsViaApi", (listId: string) => {
  return cy
    .apiRequest<{ shopping_list_items: unknown[] }>("GET", `/shopping-lists/${listId}`)
    .then((data) => data.shopping_list_items);
});

// ─── Recipes ─────────────────────────────────────────────────────────────────

Cypress.Commands.add(
  "createRecipeViaApi",
  (name: string, description?: string) => {
    return cy
      .apiRequest<{ id: string }>("POST", "/recipes", { name, description })
      .then((recipe) => recipe.id);
  },
);

Cypress.Commands.add(
  "addRecipeItemViaApi",
  (
    recipeId: string,
    catalogItemId: string,
    quantity = 1,
    unit = "pcs",
  ) => {
    return cy
      .apiRequest<{ id: string }>(`POST`, `/recipes/${recipeId}/items`, {
        catalog_item_id: catalogItemId,
        quantity,
        unit,
      })
      .then((item) => item.id);
  },
);

Cypress.Commands.add(
  "sendRecipeToListViaApi",
  (recipeId: string, shoppingListId: string) => {
    return cy.apiRequest("POST", `/recipes/${recipeId}/send`, {
      shopping_list_id: shoppingListId,
    });
  },
);

Cypress.Commands.add("cleanupTestData", () => {
  // Supprimer les listes de test
  cy.apiRequest<{ id: string; name: string }[]>("GET", "/shopping-lists").then(
    (lists) => {
      const toDelete = lists.filter(
        (list) =>
          list.name.includes("Test") ||
          list.name.includes("Liste") ||
          list.name.includes("shopping"),
      );
      if (toDelete.length > 0) {
        cy.wrap(toDelete).each((list: { id: string }) => {
          cy.apiRequest("DELETE", `/shopping-lists/${list.id}`);
        });
      }
    },
  );

  // Supprimer les recettes de test
  cy.apiRequest<{ id: string; name: string }[]>("GET", "/recipes").then(
    (recipes) => {
      const toDelete = recipes.filter((recipe) =>
        recipe.name.includes("Recette"),
      );
      if (toDelete.length > 0) {
        cy.wrap(toDelete).each((recipe: { id: string }) => {
          cy.apiRequest("DELETE", `/recipes/${recipe.id}`);
        });
      }
    },
  );

  // Supprimer les magasins de test
  cy.apiRequest<{ id: string; name: string }[]>("GET", "/stores").then(
    (stores) => {
      const toDelete = stores.filter(
        (store) =>
          store.name.includes("Magasin") ||
          store.name.includes("Supermarché"),
      );
      if (toDelete.length > 0) {
        cy.wrap(toDelete).each((store: { id: string }) => {
          cy.apiRequest("DELETE", `/stores/${store.id}`);
        });
      }
    },
  );
});

export {};
