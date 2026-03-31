/**
 * product-purchase-history.cy.ts
 *
 * Teste l'historique d'achat sur la fiche produit dans le catalogue d'un magasin :
 * - Naviguer vers un article du catalogue
 * - Vérifier que la section "Historique des achats" est présente
 * - Vérifier qu'elle affiche les données (ou un état vide si aucun achat)
 *
 * NOTE : Ce test nécessite des data-testid dans les composants React.
 * Voir tests/cypress_testids_needed.md pour la liste complète.
 */

describe("Historique des achats sur la fiche produit", () => {
  let storeId: string;
  let catalogItemId: string;

  beforeEach(() => {
    cy.loginWithFixture();
    cy.cleanupTestData();

    cy.createStoreViaApi(`Magasin produit ${Date.now()}`).then((sId) => {
      storeId = sId;

      cy.apiRequest<{ id: string }>("POST", "/shopping-lists/catalog", {
        name: `Produit Historique ${Date.now()}`,
        store_id: storeId,
        unit: "pcs",
      }).then((item: any) => {
        catalogItemId = item.id;
      });
    });

    cy.wait(500);
  });

  it("la fiche produit dans le catalogue affiche la section Historique des achats", () => {
    cy.intercept("GET", `**/purchases/history**catalogItemId=**`, {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 5 },
    }).as("getProductHistory");

    cy.visit(`/stores/${storeId}`);

    // Naviguer vers l'onglet Catalogue
    cy.get("[data-cy=store-tab-catalogue]").click();

    // Cliquer sur l'article pour ouvrir sa fiche
    cy.get(`[data-cy=catalog-item-${catalogItemId}]`, {
      timeout: 10000,
    }).click();

    cy.wait("@getProductHistory");

    // La section "Historique des achats" doit être présente
    cy.get("[data-cy=product-purchase-history]", { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("affiche un message vide si le produit n'a jamais été acheté", () => {
    cy.intercept("GET", `**/purchases/history**catalogItemId=**`, {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 5 },
    }).as("getProductHistoryEmpty");

    cy.visit(`/stores/${storeId}`);
    cy.get("[data-cy=store-tab-catalogue]").click();
    cy.get(`[data-cy=catalog-item-${catalogItemId}]`, {
      timeout: 10000,
    }).click();
    cy.wait("@getProductHistoryEmpty");

    // Le composant affiche "Aucun historique pour <nom>"
    cy.get("[data-cy=product-purchase-history]").should("be.visible");
    cy.get("[data-cy=product-purchase-history]")
      .invoke("text")
      .should("include", "Aucun historique");
  });

  it("affiche les achats précédents quand le produit a été acheté", () => {
    const mockHistory = {
      data: [
        {
          id: "purchase-hist-1",
          shoppingListItemId: "sli-1",
          listId: "list-1",
          householdId: "hh-1",
          catalogItemId: catalogItemId,
          productName: "Produit Historique",
          quantity: 2,
          unit: "pcs",
          price: 3.5,
          totalAmount: 7.0,
          purchasedAt: "2026-03-20T14:00:00.000Z",
          storeId: storeId,
        },
        {
          id: "purchase-hist-2",
          shoppingListItemId: "sli-2",
          listId: "list-1",
          householdId: "hh-1",
          catalogItemId: catalogItemId,
          productName: "Produit Historique",
          quantity: 1,
          unit: "pcs",
          price: 3.2,
          totalAmount: 3.2,
          purchasedAt: "2026-02-10T09:00:00.000Z",
          storeId: storeId,
        },
      ],
      total: 2,
      page: 1,
      limit: 5,
    };

    cy.intercept("GET", `**/purchases/history**catalogItemId=**`, {
      statusCode: 200,
      body: mockHistory,
    }).as("getProductHistoryFull");

    cy.visit(`/stores/${storeId}`);
    cy.get("[data-cy=store-tab-catalogue]").click();
    cy.get(`[data-cy=catalog-item-${catalogItemId}]`, {
      timeout: 10000,
    }).click();
    cy.wait("@getProductHistoryFull");

    // Scroller jusqu'à l'historique (le sheet peut être plus long que le viewport)
    cy.get("[data-cy=product-purchase-history]").scrollIntoView().should("exist");

    // Les deux achats doivent être présents dans le DOM
    cy.get("[data-cy=product-purchase-history]").contains("7.00 €").should("exist");
    cy.get("[data-cy=product-purchase-history]").contains("3.20 €").should("exist");

    // Les dates doivent être présentes
    cy.get("[data-cy=product-purchase-history]").contains("20 mars 2026").should("exist");
    cy.get("[data-cy=product-purchase-history]").contains("10 février 2026").should("exist");
  });

  it("l'historique est limité à 5 achats maximum sur la fiche produit", () => {
    const sixRecords = Array.from({ length: 6 }, (_, i) => ({
      id: `purchase-${i}`,
      shoppingListItemId: `sli-${i}`,
      listId: "list-1",
      householdId: "hh-1",
      catalogItemId: catalogItemId,
      productName: "Produit Historique",
      quantity: 1,
      unit: "pcs",
      price: 2.0,
      totalAmount: 2.0,
      purchasedAt: `2026-0${(i % 3) + 1}-0${i + 1}T10:00:00.000Z`,
      storeId: storeId,
    }));

    // L'API retourne 5 éléments max (limite côté API)
    cy.intercept("GET", `**/purchases/history**catalogItemId=**`, {
      statusCode: 200,
      body: { data: sixRecords.slice(0, 5), total: 6, page: 1, limit: 5 },
    }).as("getProductHistoryLimited");

    cy.visit(`/stores/${storeId}`);
    cy.get("[data-cy=store-tab-catalogue]").click();
    cy.get(`[data-cy=catalog-item-${catalogItemId}]`, {
      timeout: 10000,
    }).click();
    cy.wait("@getProductHistoryLimited");

    // Seulement 5 lignes d'achat doivent être affichées
    cy.get("[data-cy=product-purchase-history]")
      .find("[data-cy^=purchase-history-item-]")
      .should("have.length", 5);
  });

  it("la section Historique contient le titre avec le nom du produit", () => {
    cy.intercept("GET", `**/purchases/history**catalogItemId=**`, {
      statusCode: 200,
      body: {
        data: [
          {
            id: "p1",
            shoppingListItemId: "sli-1",
            listId: "l1",
            householdId: "hh1",
            catalogItemId: catalogItemId,
            productName: "Produit Historique",
            quantity: 1,
            unit: "pcs",
            price: 1.5,
            totalAmount: 1.5,
            purchasedAt: "2026-03-01T08:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 5,
      },
    }).as("getProductHistoryWithData");

    cy.visit(`/stores/${storeId}`);
    cy.get("[data-cy=store-tab-catalogue]").click();
    cy.get(`[data-cy=catalog-item-${catalogItemId}]`, {
      timeout: 10000,
    }).click();
    cy.wait("@getProductHistoryWithData");

    // Le titre doit contenir "Historique"
    cy.get("[data-cy=product-purchase-history]").within(() => {
      cy.contains(/historique/i).should("be.visible");
    });
  });
});
