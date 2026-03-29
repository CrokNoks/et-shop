describe("Recettes — UI", () => {
  beforeEach(() => {
    cy.loginWithFixture();
    cy.cleanupTestData();
  });

  it("affiche la page des recettes", () => {
    cy.visit("/recipes");
    cy.contains("Mes Recettes").should("be.visible");
  });

  it("crée une recette via le formulaire", () => {
    const name = `Recette Test ${Date.now()}`;
    cy.visit("/recipes/new");
    cy.get("[data-cy=recipe-name-input]").type(name);
    cy.get("[data-cy=recipe-submit]").click();

    cy.url().should("match", /\/recipes\/[\w-]+/);
    cy.contains(name).should("be.visible");
  });

  it("supprime une recette", () => {
    const name = `Recette à supprimer ${Date.now()}`;
    cy.createRecipeViaApi(name).then(() => {
      cy.visit("/recipes");
      cy.contains(name).should("be.visible");
      
      // Cliquer sur le bouton de suppression (il apparaît au hover)
      cy.contains(name)
        .closest("a")
        .find("[data-cy=recipe-delete]")
        .click({ force: true });
        
      // Confirmation navigateur
      cy.on("window:confirm", () => true);
      
      cy.contains(name).should("not.exist");
    });
  });

  it("gère les produits d'une recette (ajout, édition, suppression)", () => {
    cy.intercept("POST", "**/recipes/*/items").as("addItemToRecipe");
    
    const recipeName = `Recette items ${Date.now()}`;
    cy.createRecipeViaApi(recipeName).then((recipeId) => {
      cy.visit(`/recipes/${recipeId}`);

      // On a besoin d'un produit dans le catalogue
      const productName = `Produit ${Date.now()}`;
      cy.createStoreViaApi("Magasin Test").then((storeId) => {
        cy.apiRequest("POST", "/shopping-lists/catalog", {
          name: productName,
          store_id: storeId,
          unit: "pcs"
        }).then((catalogItem: any) => {
          // Chercher le produit
          cy.get("input[data-cy=recipe-item-search]").should("be.visible").type(productName);
          
          // Cliquer sur la suggestion (on utilise force car le overlay peut couvrir)
          cy.get(`[data-cy=recipe-item-suggestion-${catalogItem.id}]`).click({ force: true });
          
          cy.get("[data-cy=recipe-item-quantity]").clear().type("3");
          cy.get("[data-cy=recipe-item-submit]").click();

          // Extraire l'ID de la recipe_item depuis la réponse de l'intercept
          cy.wait("@addItemToRecipe").then((interception) => {
            expect(interception.response!.statusCode).to.be.oneOf([200, 201]);
            const recipeItemId = interception.response!.body.id;

            cy.contains(productName).should("be.visible");
            cy.contains(productName).parent().contains("3");

            // Modifier la quantité
            cy.get(`[data-cy=recipe-item-${recipeItemId}-edit]`, { timeout: 10000 }).click({ force: true });
            cy.get("input[type=number]").last().clear().type("5");
            cy.get(`[data-cy=recipe-item-${recipeItemId}-save]`).click({ force: true });

            cy.contains(productName).parent().contains("5");

            // Supprimer le produit
            cy.get(`[data-cy=recipe-item-${recipeItemId}-delete]`).click({ force: true });
            cy.contains(productName).should("not.exist");
          });
        });
      });
    });
  });

  it("le bouton Envoyer est désactivé sans produits", () => {
    cy.visit("/recipes/new");
    cy.get("[data-cy=recipe-name-input]").type(`Recette vide ${Date.now()}`);
    cy.get("[data-cy=recipe-submit]").click();

    cy.get("[data-cy=recipe-send]").should("be.disabled");
  });

  it("cherche un produit dans AddRecipeItemForm et vérifie les suggestions", () => {
    // Créer une recette via API
    cy.createRecipeViaApi(`Recette form ${Date.now()}`).then((recipeId) => {
      cy.visit(`/recipes/${recipeId}`);

      cy.createStoreViaApi("Store Suggest").then((storeId) => {
        cy.apiRequest("POST", "/shopping-lists/catalog", { name: "Lait de test", store_id: storeId });
        
        cy.get("[data-cy=recipe-item-search]").type("Lait");
        cy.get("[data-cy^=recipe-item-suggestion-]").should("have.length.at.least", 1);
        cy.get("[data-cy=recipe-item-submit]").should("be.disabled");
      });
    });
  });
});

describe("Recettes — sendToList (logique de merge)", () => {
  let listId: string;
  let recipeId: string;
  const listName = "Ma Liste Merge";

  beforeEach(() => {
    cy.loginWithFixture();
    cy.cleanupTestData();

    // 1. Créer une liste
    cy.createShoppingListViaApi(listName).then((lId) => {
      listId = lId;
      // 2. Créer une recette
      return cy.createRecipeViaApi("Recette Merge");
    }).then((rId) => {
      recipeId = rId;
    });
  });

  it("Règle 3 — items absents de la liste sont créés et ajoutés", () => {
    cy.createStoreViaApi("Store Test").then((storeId) => {
      cy.apiRequest("POST", "/shopping-lists/catalog", { name: "Produit Merge 1", store_id: storeId }).then((catItem: any) => {
        const cId = catItem.id;
        cy.addRecipeItemViaApi(recipeId, cId, 2, "pcs").then(() => {
          cy.visit(`/recipes/${recipeId}`);
          cy.get("[data-cy=recipe-send]").click();
          // Attendre que le dialog soit visible, sélectionner la liste dans le dialog
          cy.get("[role=dialog]").should("be.visible");
          cy.get("[role=dialog]").contains(listName).click();
          // Attendre que le bouton soit activé (re-render React), puis cliquer
          cy.get("[data-cy=send-to-list-submit]").should("not.be.disabled").click();
          cy.contains("Recette envoyée !", { timeout: 10000 }).should("be.visible");

          // Vérifier la liste
          cy.visit("/");
          cy.contains("Produit Merge 1").should("be.visible");
          cy.contains("2").should("be.visible");
        });
      });
    });
  });

  it("Règle 2 — envoyer deux fois la même recette cumule les quantités", () => {
    cy.createStoreViaApi("Store Test").then((storeId) => {
      cy.apiRequest("POST", "/shopping-lists/catalog", { name: "Produit Merge 2", store_id: storeId }).then((catItem: any) => {
        const cId = catItem.id;
        cy.addRecipeItemViaApi(recipeId, cId, 1, "pcs").then(() => {
          cy.sendRecipeToListViaApi(recipeId, listId);
          cy.sendRecipeToListViaApi(recipeId, listId);

          cy.visit("/");
          cy.contains("Produit Merge 2").should("be.visible");
          cy.contains("2").should("be.visible"); 
        });
      });
    });
  });

  it("Règle 1 — renvoyer un item déjà coché remplace la quantité", () => {
    cy.createStoreViaApi("Store Test").then((storeId) => {
      cy.apiRequest("POST", "/shopping-lists/catalog", { name: "Produit Merge 3", store_id: storeId }).then((catItem: any) => {
        const cId = catItem.id;
        cy.apiRequest("POST", `/shopping-lists/${listId}/items`, { 
          name: "Produit Merge 3", 
          catalog_item_id: cId,
          quantity: 10
        }).then((listItem: any) => {
          return cy.apiRequest("PATCH", `/shopping-lists/items/${listItem.id}/toggle`, { isChecked: true });
        }).then(() => {
          return cy.addRecipeItemViaApi(recipeId, cId, 2, "pcs");
        }).then(() => {
          cy.sendRecipeToListViaApi(recipeId, listId);

          cy.visit("/");
          cy.contains("Produit Merge 3").should("be.visible");
          cy.contains("2").should("be.visible");
          // On vérifie que la ligne n'a plus le style barré
          cy.contains("Produit Merge 3").closest('div').find('.line-through').should('not.exist');
        });
      });
    });
  });

  it("l'UI du dialog sendToList affiche les listes disponibles", () => {
    cy.createStoreViaApi("Store Test").then((storeId) => {
      cy.apiRequest("POST", "/shopping-lists/catalog", { name: "Produit Merge 4", store_id: storeId }).then((catItem: any) => {
        cy.addRecipeItemViaApi(recipeId, catItem.id, 1).then(() => {
          cy.visit(`/recipes/${recipeId}`);
          cy.get("[data-cy=recipe-send]").click();
          cy.get("[role=dialog]").should("be.visible");
          cy.get("[role=dialog]").contains(listName).should("be.visible");
        });
      });
    });
  });
});
