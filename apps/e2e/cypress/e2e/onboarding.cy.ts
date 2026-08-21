describe("Onboarding — Création du foyer", () => {
  const randomEmail = `onboarding-${Date.now()}@etshop.local`;

  beforeEach(() => {
    // Un compte créé via le formulaire d'inscription public rattache
    // désormais toujours à un foyer existant (code d'invitation
    // obligatoire) : pour tester l'écran "créer son propre foyer", on
    // bootstrappe un compte sans foyer via l'API Admin Supabase plutôt que
    // via le formulaire public.
    const email = `${randomEmail}-${Math.random()}`;
    const password = "Password123!";
    cy.createBootstrapAccount(email, password);
    cy.login(email, password);
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
