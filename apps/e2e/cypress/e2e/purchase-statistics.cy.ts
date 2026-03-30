/**
 * purchase-statistics.cy.ts
 *
 * Teste la page /statistiques :
 * - La page est accessible depuis la navigation sidebar
 * - Les sections s'affichent (total dépensé, achats, dépenses par catégorie, top articles)
 * - Le filtre de période fonctionne (paramètres from/to envoyés à l'API)
 *
 * NOTE : Ce test nécessite des data-testid dans les composants React.
 * Voir tests/cypress_testids_needed.md pour la liste complète.
 */

const MOCK_STATISTICS = {
  totalSpent: 127.45,
  totalItems: 34,
  byCategory: [
    {
      categoryId: "cat-1",
      categoryName: "Fruits & Légumes",
      totalSpent: 45.2,
      itemCount: 12,
    },
    {
      categoryId: "cat-2",
      categoryName: "Produits laitiers",
      totalSpent: 32.1,
      itemCount: 8,
    },
    {
      categoryId: "cat-3",
      categoryName: "Épicerie",
      totalSpent: 50.15,
      itemCount: 14,
    },
  ],
  topItems: [
    {
      catalogItemId: "item-1",
      productName: "Tomates",
      purchaseCount: 8,
      totalSpent: 24.0,
    },
    {
      catalogItemId: "item-2",
      productName: "Lait",
      purchaseCount: 6,
      totalSpent: 9.6,
    },
    {
      catalogItemId: "item-3",
      productName: "Pain",
      purchaseCount: 5,
      totalSpent: 8.75,
    },
  ],
  byMonth: [
    { month: "2026-01", totalSpent: 55.3, itemCount: 14 },
    { month: "2026-02", totalSpent: 72.15, itemCount: 20 },
  ],
};

describe("Page Statistiques (/statistiques)", () => {
  beforeEach(() => {
    cy.loginWithFixture();
  });

  it("est accessible depuis le lien Statistiques de la sidebar", () => {
    cy.visit("/");
    cy.get("a[href='/statistiques']").should("be.visible").click();
    cy.url().should("include", "/statistiques");
    cy.get("h1").should("contain", "Statistiques");
  });

  it("affiche le titre et la description de la page", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStats");

    cy.visit("/statistiques");
    cy.wait("@getStats");

    cy.get("h1").should("contain", "Statistiques");
    cy.contains("Analysez vos dépenses").should("be.visible");
  });

  it("affiche les filtres de date (Du / Au) par défaut sur l'année courante", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStats");

    cy.visit("/statistiques");
    cy.wait("@getStats");

    const currentYear = new Date().getFullYear();

    // Les inputs de date doivent être pré-remplis avec l'année en cours
    cy.get("input[type=date]").first().should("have.value", `${currentYear}-01-01`);
    cy.get("input[type=date]").last().should("have.value", `${currentYear}-12-31`);
  });

  it("affiche la carte Total dépensé avec le montant correct", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStats");

    cy.visit("/statistiques");
    cy.wait("@getStats");

    cy.contains("Total dépensé").should("be.visible");
    cy.contains("127.45 €").should("be.visible");
  });

  it("affiche la carte Achats enregistrés avec le compteur correct", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStats");

    cy.visit("/statistiques");
    cy.wait("@getStats");

    cy.contains("Achats enregistrés").should("be.visible");
    cy.contains("34").should("be.visible");
  });

  it("affiche la section Dépenses par catégorie avec les barres de progression", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStats");

    cy.visit("/statistiques");
    cy.wait("@getStats");

    cy.contains("Dépenses par catégorie").should("be.visible");

    // Les catégories doivent être listées
    cy.contains("Fruits & Légumes").should("be.visible");
    cy.contains("Produits laitiers").should("be.visible");
    cy.contains("Épicerie").should("be.visible");

    // Les montants par catégorie
    cy.contains("45.20 €").should("be.visible");
    cy.contains("32.10 €").should("be.visible");
    cy.contains("50.15 €").should("be.visible");
  });

  it("affiche la section Produits les plus achetés (top items)", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStats");

    cy.visit("/statistiques");
    cy.wait("@getStats");

    cy.contains("Produits les plus achetés").should("be.visible");

    // Les produits du top doivent être listés avec leur rang
    cy.contains("Tomates").should("be.visible");
    cy.contains("Lait").should("be.visible");
    cy.contains("Pain").should("be.visible");

    // Les compteurs d'achat
    cy.contains("8 achats").should("be.visible");
    cy.contains("6 achats").should("be.visible");
  });

  it("affiche la section Évolution mensuelle quand il y a des données par mois", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStats");

    cy.visit("/statistiques");
    cy.wait("@getStats");

    cy.contains("Évolution mensuelle").should("be.visible");

    // Les mois doivent être affichés en format français
    cy.contains("janvier 2026").should("be.visible");
    cy.contains("février 2026").should("be.visible");

    // Les montants mensuels
    cy.contains("55.30 €").should("be.visible");
    cy.contains("72.15 €").should("be.visible");
  });

  it("affiche un état vide adapté quand aucune donnée n'existe", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: {
        totalSpent: 0,
        totalItems: 0,
        byCategory: [],
        topItems: [],
        byMonth: [],
      },
    }).as("getStatsEmpty");

    cy.visit("/statistiques");
    cy.wait("@getStatsEmpty");

    cy.contains("0.00 €").should("be.visible");
    cy.contains("Aucune donnée disponible").should("be.visible");
  });

  it("affiche un message d'erreur si l'API échoue", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 500,
      body: { message: "Internal Server Error" },
    }).as("getStatsError");

    cy.visit("/statistiques");
    cy.wait("@getStatsError");

    cy.contains("Erreur lors du chargement des statistiques").should(
      "be.visible",
    );
  });

  it("changer le filtre de période recharge les statistiques avec les nouvelles dates", () => {
    cy.intercept("GET", "**/purchases/statistics**", {
      statusCode: 200,
      body: MOCK_STATISTICS,
    }).as("getStatsInit");

    cy.visit("/statistiques");
    cy.wait("@getStatsInit");

    cy.intercept("GET", "**/purchases/statistics**", (req) => {
      expect(req.url).to.include("from=2026-01-01");
      expect(req.url).to.include("to=2026-06-30");
      req.reply({ statusCode: 200, body: MOCK_STATISTICS });
    }).as("getStatsFiltered");

    // Modifier le filtre "Du"
    cy.get("input[type=date]").first().clear().type("2026-01-01");
    // Modifier le filtre "Au"
    cy.get("input[type=date]").last().clear().type("2026-06-30");

    cy.wait("@getStatsFiltered");
  });

  it("affiche un indicateur de chargement pendant la récupération des données", () => {
    cy.intercept("GET", "**/purchases/statistics**", (req) => {
      // Délai artificiel pour observer le chargement
      req.reply((res) => {
        res.delay = 500;
        res.send({ statusCode: 200, body: MOCK_STATISTICS });
      });
    }).as("getStatsSlow");

    cy.visit("/statistiques");
    cy.contains("Chargement des statistiques").should("be.visible");
    cy.wait("@getStatsSlow");
    cy.contains("Chargement des statistiques").should("not.exist");
    cy.contains("127.45 €").should("be.visible");
  });
});
