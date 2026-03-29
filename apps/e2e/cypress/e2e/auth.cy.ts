describe("Authentification", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("affiche le formulaire de connexion", () => {
    cy.get("[data-cy=login-email]").should("be.visible");
    cy.get("[data-cy=login-password]").should("be.visible");
    cy.get("[data-cy=login-submit]").should("be.visible");
    cy.get("[data-cy=login-signup]").should("be.visible");
  });

  it("affiche une erreur avec des credentials invalides", () => {
    cy.get("[data-cy=login-email]").type("invalide@test.com");
    cy.get("[data-cy=login-password]").type("mauvaismdp");
    cy.get("[data-cy=login-submit]").click();
    cy.get("[data-cy=login-error]").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("inscrit un nouvel utilisateur", () => {
    const randomEmail = `test-${Date.now()}@etshop.local`;
    cy.get("[data-cy=login-email]").type(randomEmail);
    cy.get("[data-cy=login-password]").type("Password123!");
    cy.get("[data-cy=login-signup]").click();
    // Après inscription, il devrait être redirigé vers /household/setup
    cy.url().should("include", "/household/setup");
  });

  it("connecte l'utilisateur et redirige vers /", () => {
    cy.fixture("user").then((user) => {
      cy.get("[data-cy=login-email]").type(user.email);
      cy.get("[data-cy=login-password]").type(user.password);
      cy.get("[data-cy=login-submit]").click();
      cy.url().should("not.include", "/login");
    });
  });

  it("déconnecte l'utilisateur", () => {
    cy.fixture("user").then((user) => {
      cy.get("[data-cy=login-email]").type(user.email);
      cy.get("[data-cy=login-password]").type(user.password);
      cy.get("[data-cy=login-submit]").click();
      cy.url().should("not.include", "/login");
      
      cy.get("[data-cy=logout-button]").click();
      cy.url().should("include", "/login");
    });
  });
});
