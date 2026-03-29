import "./commands";

// React 19 + Next.js 15 can throw "Cannot commit the same tree as before"
// during Cypress navigation — this is a known React internals issue, not an
// app bug. Suppress it so it does not fail tests.
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("Cannot commit the same tree as before")) {
    return false;
  }
  // Let all other exceptions fail the test
  return true;
});

after(() => {
  // Optionnel : ne nettoyer que si l'utilisateur est connecté
  // cy.cleanupTestData();
});
