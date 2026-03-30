describe("Magasins", () => {
  beforeEach(() => {
    cy.loginWithFixture();
    cy.visit("/stores");
  });

  it("affiche la page des magasins", () => {
    cy.contains("Mes Magasins").should("be.visible");
    cy.get("[data-cy=stores-new]").should("be.visible");
  });

  it("crée un nouveau magasin", () => {
    const storeName = `Supermarché ${Date.now()}`;

    cy.get("[data-cy=stores-new]").click();
    cy.get("[data-cy=store-name-input]").type(storeName);
    cy.get("[data-cy=store-submit]").click();

    cy.contains(storeName).should("be.visible");
  });

  it("modifie le nom d'un magasin", () => {
    // Créer un magasin d'abord
    const storeName = `Magasin edit ${Date.now()}`;
    cy.get("[data-cy=stores-new]").click();
    cy.get("[data-cy=store-name-input]").type(storeName);
    cy.get("[data-cy=store-submit]").click();

    // Trouver le bouton edit du magasin créé
    cy.contains(storeName)
      .closest("a")
      .find("[data-cy*=-edit]")
      .click({ force: true });

    const newName = `Magasin modifié ${Date.now()}`;
    cy.get("[data-cy=store-name-input]").clear().type(newName);
    cy.get("[data-cy=store-submit]").click();

    cy.contains(newName).should("be.visible");
    cy.contains(storeName).should("not.exist");
  });

  it("supprime un magasin", () => {
    const storeName = `Magasin delete ${Date.now()}`;
    cy.get("[data-cy=stores-new]").click();
    cy.get("[data-cy=store-name-input]").type(storeName);
    cy.get("[data-cy=store-submit]").click();

    cy.contains(storeName)
      .closest("a")
      .find("[data-cy*=-delete]")
      .click({ force: true });

    // Confirmation navigateur
    cy.on("window:confirm", () => true);

    cy.contains(storeName).should("not.exist");
  });

  it("navigue vers la page de détail du magasin", () => {
    const storeName = `Magasin détail ${Date.now()}`;
    cy.get("[data-cy=stores-new]").click();
    cy.get("[data-cy=store-name-input]").type(storeName);
    cy.get("[data-cy=store-submit]").click();

    cy.contains(storeName).click();
    cy.url().should("match", /\/stores\/[\w-]+/);
  });

  it("gère les rayons d'un magasin", () => {
    const storeName = `Magasin rayons ${Date.now()}`;
    cy.get("[data-cy=stores-new]").click();
    cy.get("[data-cy=store-name-input]").type(storeName);
    cy.get("[data-cy=store-submit]").click();

    cy.contains(storeName).click();

    // On est sur l'onglet rayons par défaut
    cy.get("[data-cy=store-tab-rayons]").should("have.class", "bg-white");

    // Créer un nouveau rayon
    const catName = "Surgelés";
    cy.get("[data-cy=store-category-new]").click();
    cy.get("[data-cy=product-form-name]").type(catName);
    cy.get("[data-cy=product-form-icon-❄️]").click();
    cy.get("[data-cy=product-form-submit]").click();

    cy.contains(catName).should("be.visible");

    // Modifier le rayon
    cy.contains(catName)
      .closest(".group")
      .find("[data-cy=store-category-edit]")
      .click({ force: true });
    
    cy.get("[data-cy=product-form-name]").clear().type("Glaces");
    cy.get("[data-cy=product-form-submit]").click();

    cy.contains("Glaces").should("be.visible");
    cy.contains(catName).should("not.exist");

    // Supprimer le rayon
    cy.contains("Glaces")
      .closest(".group")
      .find("[data-cy=store-category-delete]")
      .click({ force: true });
    
    // Confirmation navigateur
    cy.on("window:confirm", () => true);
    
    cy.contains("Glaces").should("not.exist");
  });
});
