# Fonctionnalités — Historique des achats & Statistiques

## Vue d'ensemble

Cette feature transforme Et-Shop d'un simple gestionnaire de liste en outil de suivi des achats. Chaque article marqué "Acheté" génère un enregistrement permanent dans l'historique. La liste reste intacte et réutilisable.

---

## Marquer un article comme acheté

Depuis n'importe quelle liste de courses, l'utilisateur peut marquer un article comme acheté. L'action est atomique : `is_purchased` passe à `true` sur l'article ET un `purchase_record` est inséré en base dans la même transaction RPC.

Un snapshot est capturé au moment de l'achat : nom de l'article, catégorie, prix unitaire, quantité, unité, magasin. Ces données restent fidèles même si le catalogue est modifié ensuite.

## Annuler un achat

L'utilisateur peut annuler un achat à tout moment, sans restriction de date. Le `purchase_record` est supprimé et `is_purchased` repasse à `false` sur l'article de la liste.

## Historique global (`/historique`)

Page listant tous les achats par date décroissante. Filtrable par :
- Plage de dates (du / au)
- Magasin

La liste est paginée (20 articles par page). Chaque ligne affiche le nom de l'article, la catégorie, la quantité, le prix unitaire et la date d'achat.

## Statistiques (`/statistiques`)

Tableau de bord filtrable par plage de dates. Affiche :

- **Total dépensé** sur la période
- **Nombre d'achats** enregistrés
- **Dépenses par catégorie** — répartition des dépenses (basée sur les prix renseignés)
- **Produits les plus achetés** — classement par fréquence d'achat
- **Évolution mensuelle** — dépenses et nombre d'achats mois par mois

La période par défaut est l'année civile en cours (1er janvier au 31 décembre).

## Historique par produit

Depuis la fiche d'un article du catalogue, une section affiche l'historique des achats de ce produit spécifique : date, quantité, prix, nombre total d'achats, prix moyen, dernier achat.

---

## Ce qui n'est pas inclus

- Filtre par catégorie dans l'historique global (prévu mais non implémenté en v1)
- Export CSV / PDF de l'historique
- Comparaison entre périodes
- Notifications ou alertes sur les habitudes d'achat
