describe("Liste de courses", () => {
  beforeEach(() => {
    cy.loginWithFixture();
    cy.cleanupTestData();

    // Créer un magasin par défaut car l'API refuse d'ajouter des items sans magasin dans le foyer
    cy.createStoreViaApi("Magasin Test Global");

    cy.wait(1000);
  });

  function createListViaListsScreen(listName: string) {
    cy.visit("/lists");
    cy.get("[data-cy=lists-new-list]").click();
    cy.get("[data-cy=lists-list-input]").type(listName);
    cy.get("[data-cy=lists-create-submit]").click();
    cy.url({ timeout: 10000 }).should("eq", `${Cypress.config("baseUrl")}/`);
  }

  it("crée une nouvelle liste via l'écran Mes listes", () => {
    const listName = `Test List ${Date.now()}`;

    createListViaListsScreen(listName);

    cy.contains(listName, { timeout: 10000 })
      .scrollIntoView()
      .should("be.visible");
  });

  it("ajoute un article via HopInput", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");

    const listName = `Liste ajout ${Date.now()}`;
    createListViaListsScreen(listName);
    cy.get("h1").should("contain", listName);

    cy.wait(1000);

    cy.get("[data-cy=hop-input]").should("be.visible");
    cy.get("[data-cy=hop-input]").type("Bananes");

    cy.get("body").then(($body) => {
      if ($body.find("[data-cy^=hop-suggestion-]").length > 0) {
        cy.get("[data-cy^=hop-suggestion-]").first().click();
      } else {
        cy.get("[data-cy=hop-create-product]").click();
        cy.get("[data-cy=product-form-name]").should("be.visible");
        cy.get("[data-cy=product-form-submit]").click();
      }
    });

    cy.wait("@addItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    cy.contains("Bananes", { timeout: 10000 }).should("be.visible");
  });

  it("coche un article", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");
    cy.intercept("PATCH", /\/items\/[^/]+\/(purchase|unpurchase)/).as(
      "toggleItem",
    );

    const listName = `Liste check ${Date.now()}`;
    createListViaListsScreen(listName);
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=hop-input]").type("Pommes");
    cy.get("[data-cy=hop-create-product]").click();
    cy.get("[data-cy=product-form-submit]").click();
    cy.wait("@addItem", { timeout: 15000 });

    cy.contains("Pommes", { timeout: 10000 }).should("be.visible");
    cy.get("[data-cy^=item-]").first().click();

    cy.wait("@toggleItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);
    cy.get("[class*=line-through]").should("exist");
  });

  it("modifie la quantité d'un article", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");
    cy.intercept("PATCH", "**/items/*/quantity").as("updateQty");

    const listName = `Liste qty ${Date.now()}`;
    createListViaListsScreen(listName);
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=hop-input]").type("Lait");
    cy.get("[data-cy=hop-create-product]").click();
    cy.get("[data-cy=product-form-submit]").click();
    cy.wait("@addItem", { timeout: 15000 });

    cy.contains("Lait", { timeout: 10000 }).should("be.visible");
    cy.get("[data-cy$=-plus]").first().click();

    cy.wait("@updateQty", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);
    cy.get("[data-cy$=-qty]").first().should("contain", "2");
  });

  it("supprime un article", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");
    cy.intercept("DELETE", "**/items/*").as("deleteItem");

    const listName = `Liste delete ${Date.now()}`;
    createListViaListsScreen(listName);
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=hop-input]").type("Yaourt");
    cy.get("[data-cy=hop-create-product]").click();
    cy.get("[data-cy=product-form-submit]").click();
    cy.wait("@addItem", { timeout: 15000 });

    cy.contains("Yaourt", { timeout: 10000 }).should("be.visible");
    cy.get("[data-cy$=-delete]").first().click();

    cy.wait("@deleteItem", { timeout: 15000 })
      .its("response.statusCode")
      .should("be.oneOf", [200, 204]);
    cy.contains("Yaourt").should("not.exist");
  });

  it("supprime une liste", () => {
    cy.intercept("DELETE", "**/shopping-lists/*").as("deleteList");

    const listName = `Liste à supprimer ${Date.now()}`;
    createListViaListsScreen(listName);
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.on("window:confirm", () => true);

    cy.get("[data-cy=list-options]").click();
    cy.get("[data-cy=list-delete]").click();

    cy.wait("@deleteList", { timeout: 15000 });

    // On recharge pour forcer le refresh si Realtime est capricieux
    cy.reload();

    cy.get("h1", { timeout: 10000 }).should("not.contain", listName);

    // Plus d'<aside> depuis le retrait du Sidebar (Cycle D) : la liste des
    // listes vit maintenant sur /lists.
    cy.visit("/lists");
    cy.contains(listName).should("not.exist");
  });

  it("renomme une liste", () => {
    const listName = `Liste rename ${Date.now()}`;
    createListViaListsScreen(listName);
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=list-options]").click();
    cy.get("[data-cy=list-edit]").click();

    const newName = `Liste renommée ${Date.now()}`;
    cy.get("[data-cy=list-name-input]")
      .clear()
      .type(newName + "{enter}");

    cy.get("h1").should("contain", newName);
  });

  it("bascule en mode shopping et termine", () => {
    const listName = `Liste shopping ${Date.now()}`;
    createListViaListsScreen(listName);
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=shopping-mode-toggle]").click();
    cy.contains("En magasin").should("be.visible");

    cy.get("[data-cy=shopping-finish]").click();
    cy.contains("Démarrer le mode magasin").should("be.visible");
  });
});
