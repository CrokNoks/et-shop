# Fonctionnalités — Magasins

## Vue d'ensemble

Les magasins sont les enseignes (Carrefour, Lidl, etc.) auxquelles sont rattachés le catalogue produits, les catégories et les listes de courses. Chaque foyer gère ses propres magasins.

---

## Créer un magasin

Un nom suffit. Le magasin est lié au foyer via le header `x-household-id`.

## Lister les magasins du foyer

`GET /stores` retourne tous les magasins du foyer. Utilisé pour peupler les sélecteurs dans les formulaires de listes, de catalogue et de cartes de fidélité.

## Modifier / Supprimer un magasin

Le nom est modifiable. La suppression déclenche la cascade sur les données liées (catégories, articles de catalogue, listes, cartes de fidélité).

## Gérer l'ordre des rayons par magasin

`GET /stores/:id/categories` liste les catégories d'un magasin avec leur `sort_order`.

`PUT /stores/:id/categories` met à jour l'ordre des rayons pour un magasin : accepte un tableau `[{ categoryId, sortOrder }]` et applique les mises à jour en batch.

---

## Ce qui n'est pas inclus

- Logo ou image pour un magasin
- Horaires d'ouverture
- Géolocalisation
