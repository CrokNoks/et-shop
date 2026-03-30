/**
 * purchase-history.cy.ts
 *
 * Teste la page /historique :
 * - La page est accessible depuis la navigation sidebar
 * - Les achats passés apparaissent avec leurs informations (date, articles, total)
 * - Les filtres (par magasin, par période) fonctionnent
 * - Le détail d'un achat est consultable
 *
 * NOTE : Ce test nécessite des data-testid dans les composants React.
 * Voir tests/cypress_testids_needed.md pour la liste complète.
 */

describe("Page Historique des Achats (/historique)", () => {
  beforeEach(() => {
    cy.loginWithFixture();
  });

  it("est accessible depuis le lien Historique de la sidebar", () => {
    cy.visit("/");
    // Le lien Historique est dans la sidebar (caché sur mobile → viewport 1280px donc visible)
    cy.get("a[href='/historique']").should("be.visible").click();
    cy.url().should("include", "/historique");
    cy.get("h1").should("contain", "Historique");
  });

  it("affiche le titre et un message quand aucun achat n'existe", () => {
    cy.intercept("GET", "**/purchases/history**", {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 20 },
    }).as("getHistory");

    cy.visit("/historique");
    cy.wait("@getHistory");

    cy.get("h1").should("contain", "Historique");
    cy.contains("Aucun achat enregistré").should("be.visible");
  });

  it("affiche les achats passés avec date, nom du produit et total", () => {
    const mockRecords = [
      {
        id: "purchase-1",
        shoppingListItemId: "item-1",
        listId: "list-1",
        householdId: "hh-1",
        catalogItemId: "cat-1",
        productName: "Pommes Bio",
        quantity: 2,
        unit: "kg",
        price: 3.5,
        totalAmount: 7.0,
        purchasedAt: "2026-03-15T10:30:00.000Z",
        storeId: "store-1",
      },
      {
        id: "purchase-2",
        shoppingListItemId: "item-2",
        listId: "list-1",
        householdId: "hh-1",
        catalogItemId: "cat-2",
        productName: "Lait Entier",
        quantity: 1,
        unit: "L",
        price: 1.2,
        totalAmount: 1.2,
        purchasedAt: "2026-03-14T09:00:00.000Z",
        storeId: "store-1",
      },
    ];

    cy.intercept("GET", "**/purchases/history**", {
      statusCode: 200,
      body: { data: mockRecords, total: 2, page: 1, limit: 20 },
    }).as("getHistory");

    cy.visit("/historique");
    cy.wait("@getHistory");

    // Les deux produits doivent être visibles
    cy.contains("Pommes Bio").should("be.visible");
    cy.contains("Lait Entier").should("be.visible");

    // Les montants doivent être affichés
    cy.contains("7.00 €").should("be.visible");
    cy.contains("1.20 €").should("be.visible");

    // Les dates doivent être affichées (format français)
    cy.contains("15 mars 2026").should("be.visible");
    cy.contains("14 mars 2026").should("be.visible");
  });

  it("affiche le nombre total d'achats", () => {
    cy.intercept("GET", "**/purchases/history**", {
      statusCode: 200,
      body: {
        data: [
          {
            id: "p1",
            shoppingListItemId: "i1",
            listId: "l1",
            householdId: "hh1",
            catalogItemId: "c1",
            productName: "Beurre",
            quantity: 1,
            unit: "pcs",
            price: 2.0,
            totalAmount: 2.0,
            purchasedAt: "2026-03-01T12:00:00.000Z",
          },
        ],
        total: 42,
        page: 1,
        limit: 20,
      },
    }).as("getHistory");

    cy.visit("/historique");
    cy.wait("@getHistory");

    // Le composant affiche "X achats au total"
    cy.contains("42 achats").should("be.visible");
  });

  it("le filtre par période recharge les données avec les bons paramètres", () => {
    cy.intercept("GET", "**/purchases/history**", {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 20 },
    }).as("getHistoryInit");

    cy.visit("/historique");
    cy.wait("@getHistoryInit");

    // Ouvrir le filtre de période si présent
    cy.get("[data-cy=history-filter-from]").should("be.visible");
    cy.get("[data-cy=history-filter-to]").should("be.visible");

    cy.intercept("GET", "**/purchases/history**", (req) => {
      expect(req.url).to.include("from=2026-01-01");
      expect(req.url).to.include("to=2026-03-31");
      req.reply({
        statusCode: 200,
        body: { data: [], total: 0, page: 1, limit: 20 },
      });
    }).as("getHistoryFiltered");

    cy.get("[data-cy=history-filter-from]").clear().type("2026-01-01");
    cy.get("[data-cy=history-filter-to]").clear().type("2026-03-31");
    cy.get("[data-cy=history-filter-submit]").click();

    cy.wait("@getHistoryFiltered");
  });

  it("le filtre par magasin recharge les données avec storeId en paramètre", () => {
    const mockStores = [
      { id: "store-abc", name: "Carrefour" },
      { id: "store-xyz", name: "Monoprix" },
    ];

    cy.intercept("GET", "**/purchases/history**", {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 20 },
    }).as("getHistoryInit");

    cy.intercept("GET", "**/stores**", {
      statusCode: 200,
      body: mockStores,
    }).as("getStores");

    cy.visit("/historique");
    cy.wait("@getHistoryInit");

    cy.intercept("GET", "**/purchases/history**", (req) => {
      expect(req.url).to.include("storeId=store-abc");
      req.reply({
        statusCode: 200,
        body: { data: [], total: 0, page: 1, limit: 20 },
      });
    }).as("getHistoryByStore");

    // Sélectionner un magasin dans le filtre
    cy.get("[data-cy=history-filter-store]").should("be.visible").select("store-abc");

    cy.wait("@getHistoryByStore");
  });

  it("la pagination permet de naviguer entre les pages", () => {
    const page1Records = Array.from({ length: 20 }, (_, i) => ({
      id: `purchase-${i}`,
      shoppingListItemId: `item-${i}`,
      listId: "list-1",
      householdId: "hh-1",
      catalogItemId: `cat-${i}`,
      productName: `Produit ${i}`,
      quantity: 1,
      unit: "pcs",
      price: 1.0,
      totalAmount: 1.0,
      purchasedAt: "2026-03-01T12:00:00.000Z",
    }));

    cy.intercept("GET", "**/purchases/history?**page=1**", {
      statusCode: 200,
      body: { data: page1Records, total: 25, page: 1, limit: 20 },
    }).as("getPage1");

    cy.intercept("GET", "**/purchases/history?**page=2**", {
      statusCode: 200,
      body: {
        data: [
          {
            id: "purchase-21",
            shoppingListItemId: "item-21",
            listId: "list-1",
            householdId: "hh-1",
            catalogItemId: "cat-21",
            productName: "Produit page 2",
            quantity: 1,
            unit: "pcs",
            price: 2.5,
            totalAmount: 2.5,
            purchasedAt: "2026-03-02T10:00:00.000Z",
          },
        ],
        total: 25,
        page: 2,
        limit: 20,
      },
    }).as("getPage2");

    cy.visit("/historique");
    cy.wait("@getPage1");

    // Le bouton "Suivant" doit être visible
    cy.contains("Suivant").should("be.visible").and("not.be.disabled").click();
    cy.wait("@getPage2");

    cy.contains("Produit page 2").should("be.visible");
    cy.contains("Page 2 / 2").should("be.visible");
  });
});
