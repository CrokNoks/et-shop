describe("Cartes de fidélité", () => {
  let storeId: string;

  beforeEach(() => {
    cy.loginWithFixture();
    cy.createStoreViaApi(`Magasin loyalty ${Date.now()}`).then((id) => {
      storeId = id;
    });
    cy.visit("/loyalty-cards");
  });

  it("affiche la page des cartes de fidélité", () => {
    cy.contains("cartes").should("be.visible");
  });

  it("ajoute une carte de fidélité", () => {
    cy.visit("/loyalty-cards/add");

    cy.get("[data-cy=loyalty-store]").select(storeId);
    cy.get("[data-cy=loyalty-name]").type("Ma Carte Test");
    cy.get("[data-cy=loyalty-card-data]").type("123456789");
    cy.get("[data-cy=loyalty-submit]").click();

    cy.url().should("include", "/loyalty-cards");
    cy.contains("Ma Carte Test").should("be.visible");
  });

  it("navigue vers le détail d'une carte", () => {
    cy.visit("/loyalty-cards/add");
    cy.get("[data-cy=loyalty-store]").select(storeId);
    cy.get("[data-cy=loyalty-name]").type(`Carte nav ${Date.now()}`);
    cy.get("[data-cy=loyalty-card-data]").type("987654321");
    cy.get("[data-cy=loyalty-submit]").click();

    cy.get("a[href*='/loyalty-cards/']:not([href$='/add'])").first().click();
    cy.url().should("match", /\/loyalty-cards\/[\w-]+/);
  });

  it("modifie une carte de fidélité", () => {
    cy.visit("/loyalty-cards/add");
    cy.get("[data-cy=loyalty-store]").select(storeId);
    cy.get("[data-cy=loyalty-name]").type(`Carte edit ${Date.now()}`);
    cy.get("[data-cy=loyalty-card-data]").type("111222333");
    cy.get("[data-cy=loyalty-submit]").click();

    cy.get("a[href*='/loyalty-cards/']:not([href$='/add'])").first().click();

    cy.get("[data-cy=loyalty-edit]").click();
    cy.get("[data-cy=loyalty-edit-name]").clear().type("Carte modifiée");
    cy.get("[data-cy=loyalty-save]").click();

    cy.contains("Carte modifiée").should("be.visible");
  });

  it("supprime une carte de fidélité", () => {
    cy.visit("/loyalty-cards/add");
    cy.get("[data-cy=loyalty-store]").select(storeId);
    const cardName = `Carte delete ${Date.now()}`;
    cy.get("[data-cy=loyalty-name]").type(cardName);
    cy.get("[data-cy=loyalty-card-data]").type("444555666");
    cy.get("[data-cy=loyalty-submit]").click();

    cy.get("a[href*='/loyalty-cards/']:not([href$='/add'])").first().click();

    cy.on("window:confirm", () => true);
    cy.get("[data-cy=loyalty-delete]").click();

    cy.url().should("include", "/loyalty-cards");
    cy.contains(cardName).should("not.exist");
  });

  it("affiche le barcode de la carte", () => {
    cy.visit("/loyalty-cards/add");
    cy.get("[data-cy=loyalty-store]").select(storeId);
    cy.get("[data-cy=loyalty-name]").type(`Carte barcode ${Date.now()}`);
    cy.get("[data-cy=loyalty-card-data]").type("777888999");
    cy.get("[data-cy=loyalty-submit]").click();

    cy.get("a[href*='/loyalty-cards/']:not([href$='/add'])").first().click();

    cy.get("svg, canvas, img").should("exist");
  });

  it("annule la modification d'une carte", () => {
    cy.visit("/loyalty-cards/add");
    cy.get("[data-cy=loyalty-store]").select(storeId);
    const cardName = `Carte cancel ${Date.now()}`;
    cy.get("[data-cy=loyalty-name]").type(cardName);
    cy.get("[data-cy=loyalty-card-data]").type("000111222");
    cy.get("[data-cy=loyalty-submit]").click();

    // Navigate to the specific card we just created
    cy.contains("a", cardName).click();

    cy.get("[data-cy=loyalty-edit]").click();
    cy.get("[data-cy=loyalty-edit-name]").clear().type("Nom modifié pas sauvegardé");
    cy.get("[data-cy=loyalty-cancel]").click();

    cy.contains(cardName).should("be.visible");
    cy.contains("Nom modifié pas sauvegardé").should("not.exist");
  });
});
