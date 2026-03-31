# Fonctionnalités — Recettes

## Vue d'ensemble

Les recettes sont des modèles de listes de courses réutilisables. Une recette regroupe des articles du catalogue avec leurs quantités et unités. Elle peut être envoyée vers n'importe quelle liste de courses du foyer.

---

## Créer une recette

Une recette a un nom et une description optionnelle. Elle est liée au foyer (partagée entre tous les membres).

## Ajouter des produits à une recette

Chaque article d'une recette est lié à un article du catalogue (`catalog_item_id`). Champs : quantité et unité. Un article ne peut apparaître qu'une fois par recette (contrainte d'unicité `(recipe_id, catalog_item_id)`).

## Modifier / Supprimer des articles

La quantité et l'unité d'un article de recette sont modifiables. Un article peut être retiré de la recette.

## Envoyer une recette vers une liste

`POST /recipes/:id/send` avec `{ shopping_list_id }` applique la recette à la liste cible selon les règles suivantes :

| Situation | Comportement |
|---|---|
| Article absent de la liste | Ajouté avec la quantité de la recette |
| Article présent, non acheté | Quantités **additionnées** |
| Article présent, déjà acheté | Remis à `is_purchased = false`, quantité **remplacée** par celle de la recette |

Cette logique de fusion permet de réappliquer une recette sur une liste en cours sans perdre les articles non-recette déjà présents.

## Consulter le détail d'une recette

`GET /recipes/:id` retourne la recette avec ses items enrichis : nom du catalogue, unité, catégorie, magasin.

---

## Ce qui n'est pas inclus

- Duplication d'une recette
- Import/export de recettes
- Recettes personnelles (non partagées au foyer) — toutes les recettes sont au niveau foyer
- Ordonnancement des articles dans une recette
