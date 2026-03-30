/**
 * purchase-flow.cy.ts
 *
 * Teste le flux d'achat depuis une liste de courses :
 * - Marquer un article "Acheté" → vérifier que l'état visuel change
 * - Annuler un achat → vérifier que l'item revient à l'état initial
 * - Marquer plusieurs articles → vérifier que chaque action est reflétée
 *
 * NOTE : Ce test nécessite des data-testid dans les composants React.
 * Voir tests/cypress_testids_needed.md pour la liste complète.
 */

describe("Flux d'achat depuis une liste de courses", () => {
  let listId: string;
  let storeId: string;
  let catalogItemId1: string;
  let catalogItemId2: string;
  let catalogItemId3: string;
  let itemId1: string;
  let itemId2: string;
  let itemId3: string;

  beforeEach(() => {
    cy.loginWithFixture();
    cy.cleanupTestData();

    // Préparer les données de test via l'API
    cy.createStoreViaApi(`Magasin achat ${Date.now()}`).then((sId) => {
      storeId = sId;

      cy.apiRequest<{ id: string }>("POST", "/shopping-lists/catalog", {
        name: "Tomates",
        store_id: storeId,
        unit: "kg",
      }).then((item: any) => {
        catalogItemId1 = item.id;
      });

      cy.apiRequest<{ id: string }>("POST", "/shopping-lists/catalog", {
        name: "Pâtes",
        store_id: storeId,
        unit: "pcs",
      }).then((item: any) => {
        catalogItemId2 = item.id;
      });

      cy.apiRequest<{ id: string }>("POST", "/shopping-lists/catalog", {
        name: "Fromage",
        store_id: storeId,
        unit: "pcs",
      }).then((item: any) => {
        catalogItemId3 = item.id;
      });

      cy.createShoppingListViaApi(`Liste achat ${Date.now()}`).then((lId) => {
        listId = lId;

        cy.apiRequest<{ id: string }>(
          "POST",
          `/shopping-lists/${listId}/items`,
          { catalog_item_id: catalogItemId1, quantity: 1, name: "Tomates" },
        ).then((listItem: any) => {
          itemId1 = listItem.id;
        });

        cy.apiRequest<{ id: string }>(
          "POST",
          `/shopping-lists/${listId}/items`,
          { catalog_item_id: catalogItemId2, quantity: 2, name: "Pâtes" },
        ).then((listItem: any) => {
          itemId2 = listItem.id;
        });

        cy.apiRequest<{ id: string }>(
          "POST",
          `/shopping-lists/${listId}/items`,
          { catalog_item_id: catalogItemId3, quantity: 1, name: "Fromage" },
        ).then((listItem: any) => {
          itemId3 = listItem.id;
        });
      });
    });

    cy.wait(1000);
  });

  it("marquer un article Acheté change l'état visuel (checkout visuel)", () => {
    cy.intercept("PATCH", "**/items/*/toggle").as("toggleItem");

    cy.visit("/");

    // Activer le mode shopping pour que la fonctionnalité d'achat soit disponible
    cy.get("[data-cy=shopping-mode-toggle]").click();
    cy.contains("En magasin").should("be.visible");

    // Cliquer sur le premier article pour le marquer comme acheté
    cy.get(`[data-cy=item-${itemId1}]`, { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get(`[data-cy=item-${itemId1}]`).click();

    cy.wait("@toggleItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);

    // L'article doit apparaître dans la section "Déjà dans le panier" (barré)
    cy.get(`[data-cy=item-${itemId1}]`)
      .find(".line-through")
      .should("exist")
      .or(
        cy
          .get("[data-cy=shopping-done-section]")
          .contains("Tomates"),
      );
  });

  it("annuler un achat remet l'article à l'état initial", () => {
    cy.intercept("PATCH", "**/items/*/toggle").as("toggleItem");

    cy.visit("/");
    cy.get("[data-cy=shopping-mode-toggle]").click();
    cy.contains("En magasin").should("be.visible");

    // Marquer l'article comme acheté
    cy.get(`[data-cy=item-${itemId2}]`, { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get(`[data-cy=item-${itemId2}]`).click();
    cy.wait("@toggleItem", { timeout: 15000 });

    // L'article doit être dans la zone "déjà dans le panier"
    cy.get("[data-cy=shopping-done-section]", { timeout: 10000 }).should(
      "be.visible",
    );

    // Cliquer à nouveau sur l'article pour annuler l'achat
    cy.get("[data-cy=shopping-done-section]")
      .contains("Pâtes")
      .closest("[data-cy^=shopping-done-item-]")
      .click();

    cy.wait("@toggleItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);

    // L'article doit revenir dans la liste principale (sans ligne barrée)
    cy.get(`[data-cy=item-${itemId2}]`, { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get(`[data-cy=item-${itemId2}]`)
      .find(".line-through")
      .should("not.exist");
  });

  it("marquer plusieurs articles reflète chaque action individuellement", () => {
    cy.intercept("PATCH", "**/items/*/toggle").as("toggleItem");

    cy.visit("/");
    cy.get("[data-cy=shopping-mode-toggle]").click();
    cy.contains("En magasin").should("be.visible");

    // Marquer le premier article
    cy.get(`[data-cy=item-${itemId1}]`, { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.wait("@toggleItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);

    // Marquer le deuxième article
    cy.get(`[data-cy=item-${itemId2}]`, { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.wait("@toggleItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);

    // Marquer le troisième article
    cy.get(`[data-cy=item-${itemId3}]`, { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.wait("@toggleItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);

    // La section "Déjà dans le panier" doit contenir 3 articles
    cy.get("[data-cy=shopping-done-section]", { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get("[data-cy=shopping-done-section]")
      .find("[data-cy^=shopping-done-item-]")
      .should("have.length", 3);

    // La barre de progression doit être à 100%
    cy.get("[data-cy=shopping-progress-bar]", { timeout: 5000 })
      .should("be.visible")
      .invoke("attr", "style")
      .should("include", "width: 100%");
  });

  it("terminer les achats enregistre les achats et revient au mode classique", () => {
    cy.intercept("PATCH", "**/items/*/toggle").as("toggleItem");

    cy.visit("/");
    cy.get("[data-cy=shopping-mode-toggle]").click();

    // Marquer un article comme acheté
    cy.get(`[data-cy=item-${itemId1}]`, { timeout: 10000 }).click();
    cy.wait("@toggleItem", { timeout: 15000 });

    // Terminer les achats
    cy.get("[data-cy=shopping-finish]").click();

    // On doit revenir au mode classique (le bouton Mode Shopping réapparaît)
    cy.contains("Mode Shopping").should("be.visible");
  });
});
