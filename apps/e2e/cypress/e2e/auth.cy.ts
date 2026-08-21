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

  it("refuse l'inscription sans code d'invitation valide", () => {
    const randomEmail = `test-${Date.now()}@etshop.local`;
    cy.get("[data-cy=login-email]").type(randomEmail);
    cy.get("[data-cy=login-password]").type("Password123!");
    cy.get("[data-cy=login-invite-code]").type("CODEINVALIDE");
    cy.get("[data-cy=login-signup]").click();
    cy.get("[data-cy=login-error]").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("inscrit un nouvel utilisateur avec un code d'invitation valide", () => {
    cy.createSignupInviteCode().then((code) => {
      const randomEmail = `test-${Date.now()}@etshop.local`;
      cy.visit("/login");
      cy.get("[data-cy=login-email]").type(randomEmail);
      cy.get("[data-cy=login-password]").type("Password123!");
      cy.get("[data-cy=login-invite-code]").type(code);
      cy.get("[data-cy=login-signup]").click();
      // Le code rattache automatiquement au foyer de l'inviteur (fixture
      // user) : contrairement à un compte sans foyer, on atterrit sur "/",
      // pas sur /household/setup.
      cy.url().should("eq", Cypress.config("baseUrl") + "/");
    });
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

      // "Se déconnecter" vit dans le menu "..." du bandeau (écran 4j).
      cy.get("[data-cy=list-options]").click();
      cy.get("[data-cy=logout-button]").click();
      cy.url().should("include", "/login");
    });
  });
});
