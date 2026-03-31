describe("Liste de courses", () => {
  beforeEach(() => {
    cy.loginWithFixture();
    cy.cleanupTestData();
    
    // Créer un magasin par défaut car l'API refuse d'ajouter des items sans magasin dans le foyer
    cy.createStoreViaApi("Magasin Test Global");
    
    cy.wait(1000);
  });

  it("crée une nouvelle liste via la sidebar", () => {
    const listName = `Test List ${Date.now()}`;

    cy.get("[data-cy=sidebar-new-list]").click();
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);

    cy.contains(listName, { timeout: 10000 }).scrollIntoView().should("be.visible");
  });

  it("ajoute un article via HopInput", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");

    cy.get("[data-cy=sidebar-new-list]").click();
    const listName = `Liste ajout ${Date.now()}`;
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);
    cy.get("[data-cy=sidebar-list-input]").should("not.exist");
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

    cy.wait("@addItem", { timeout: 15000 }).its("response.statusCode").should("be.oneOf", [200, 201]);

    cy.contains("Bananes", { timeout: 10000 }).should("be.visible");
  });

  it("coche un article", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");
    cy.intercept("PATCH", /\/items\/[^/]+\/(purchase|unpurchase)/).as("toggleItem");

    cy.get("[data-cy=sidebar-new-list]").click();
    const listName = `Liste check ${Date.now()}`;
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);
    cy.get("[data-cy=sidebar-list-input]").should("not.exist");
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=hop-input]").type("Pommes");
    cy.get("[data-cy=hop-create-product]").click();
    cy.get("[data-cy=product-form-submit]").click();
    cy.wait("@addItem", { timeout: 15000 });

    cy.contains("Pommes", { timeout: 10000 }).should("be.visible");
    cy.get("[data-cy^=item-]").first().click();
    
    cy.wait("@toggleItem", { timeout: 15000 }).its("response.statusCode").should("eq", 200);
    cy.get("[class*=line-through]").should("exist");
  });

  it("modifie la quantité d'un article", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");
    cy.intercept("PATCH", "**/items/*/quantity").as("updateQty");

    cy.get("[data-cy=sidebar-new-list]").click();
    const listName = `Liste qty ${Date.now()}`;
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);
    cy.get("[data-cy=sidebar-list-input]").should("not.exist");
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=hop-input]").type("Lait");
    cy.get("[data-cy=hop-create-product]").click();
    cy.get("[data-cy=product-form-submit]").click();
    cy.wait("@addItem", { timeout: 15000 });

    cy.contains("Lait", { timeout: 10000 }).should("be.visible");
    cy.get("[data-cy$=-plus]").first().click();
    
    cy.wait("@updateQty", { timeout: 15000 }).its("response.statusCode").should("eq", 200);
    cy.get("[data-cy$=-qty]").first().should("contain", "2");
  });

  it("supprime un article", () => {
    cy.intercept("POST", "**/shopping-lists/*/items").as("addItem");
    cy.intercept("DELETE", "**/items/*").as("deleteItem");

    cy.get("[data-cy=sidebar-new-list]").click();
    const listName = `Liste delete ${Date.now()}`;
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);
    cy.get("[data-cy=sidebar-list-input]").should("not.exist");
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=hop-input]").type("Yaourt");
    cy.get("[data-cy=hop-create-product]").click();
    cy.get("[data-cy=product-form-submit]").click();
    cy.wait("@addItem", { timeout: 15000 });

    cy.contains("Yaourt", { timeout: 10000 }).should("be.visible");
    cy.get("[data-cy$=-delete]").first().click();
    
    cy.wait("@deleteItem", { timeout: 15000 }).its("response.statusCode").should("be.oneOf", [200, 204]);
    cy.contains("Yaourt").should("not.exist");
  });

  it("supprime une liste", () => {
    cy.intercept("DELETE", "**/shopping-lists/*").as("deleteList");

    cy.get("[data-cy=sidebar-new-list]").click();
    const listName = `Liste à supprimer ${Date.now()}`;
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);
    cy.get("[data-cy=sidebar-list-input]").should("not.exist");
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.on("window:confirm", () => true);

    cy.get("[data-cy=list-options]").click();
    cy.get("[data-cy=list-delete]").click();
    
    cy.wait("@deleteList", { timeout: 15000 });
    
    // On recharge pour forcer le refresh si Realtime est capricieux
    cy.reload();
    
    cy.get("h1", { timeout: 10000 }).should("not.contain", listName);
    cy.get("aside", { timeout: 10000 }).should("not.contain", listName);
  });

  it("renomme une liste", () => {
    cy.get("[data-cy=sidebar-new-list]").click();
    const listName = `Liste rename ${Date.now()}`;
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);
    cy.get("[data-cy=sidebar-list-input]").should("not.exist");
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=list-options]").click();
    cy.get("[data-cy=list-edit]").click();

    const newName = `Liste renommée ${Date.now()}`;
    cy.get("[data-cy=list-name-input]").clear().type(newName + "{enter}");

    cy.get("h1").should("contain", newName);
  });

  it("bascule en mode shopping et termine", () => {
    cy.get("[data-cy=sidebar-new-list]").click();
    const listName = `Liste shopping ${Date.now()}`;
    cy.get("[data-cy=sidebar-list-input]").type(`${listName}{enter}`);
    cy.get("[data-cy=sidebar-list-input]").should("not.exist");
    cy.get("h1").should("contain", listName);
    cy.wait(1000);

    cy.get("[data-cy=shopping-mode-toggle]").click();
    cy.contains("En magasin").should("be.visible");

    cy.get("[data-cy=shopping-finish]").click();
    cy.contains("Mode Shopping").should("be.visible");
  });
});
