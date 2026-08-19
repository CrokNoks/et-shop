describe("Onboarding — Création du foyer", () => {
  const randomEmail = `onboarding-${Date.now()}@etshop.local`;

  beforeEach(() => {
    // On crée un nouvel utilisateur pour chaque test d'onboarding
    // pour s'assurer qu'il n'a pas encore de foyer
    cy.visit("/login");
    cy.get("[data-cy=login-email]").type(randomEmail + "-" + Math.random());
    cy.get("[data-cy=login-password]").type("Password123!");
    cy.get("[data-cy=login-signup]").click();
    cy.url().should("include", "/household/setup");
  });

  it("affiche le formulaire de création de foyer", () => {
    cy.get("[data-cy=household-name]").should("be.visible");
  });

  it("crée un foyer, propose d'inviter (étape 2/2), puis redirige vers /", () => {
    const householdName = "Foyer de test " + Date.now();
    cy.get("[data-cy=household-name]").type(householdName);
    cy.get("[data-cy=household-submit]").click();

    // Étape 2/2 : proposition d'inviter un membre avant d'entrer dans l'app.
    cy.get("[data-cy=household-invite-later]").should("be.visible").click();
    cy.url().should("eq", Cypress.config("baseUrl") + "/");

    cy.visit("/lists");
    cy.contains(householdName).should("exist");
  });
});
