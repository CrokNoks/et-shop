# Fonctionnalités — Cartes de fidélité

## Vue d'ensemble

Permet à chaque utilisateur de stocker ses cartes de fidélité numériquement. Les cartes sont personnelles (non partagées au niveau du foyer) et affichent un code-barres ou QR code scannable en caisse.

---

## Ajouter une carte de fidélité

L'utilisateur associe une carte à un magasin existant. Champs requis :
- **Magasin** (obligatoire — doit exister dans la table `stores`)
- **Données de la carte** (`card_data`) : numéro, code, URL…
- **Format de code-barres** : `EAN13`, `CODE128`, `QR_CODE`, etc. (enum `BarcodeFormat`)

Champs optionnels :
- **Nom** — libellé affiché sur la carte
- **Description** — note libre
- **Couleur personnalisée** — hex pour la teinte de la carte en affichage

## Afficher et scanner une carte

Depuis `/loyalty-cards`, la liste des cartes de l'utilisateur est affichée. En appuyant sur une carte, un overlay plein-écran affiche le code-barres en grand format pour le scan en caisse.

## Filtrer par magasin

Le `GET /loyalty-cards` accepte un paramètre `storeIds` (tableau ou liste CSV) pour filtrer les cartes par magasin.

## Modifier une carte

Tous les champs (nom, description, `card_data`, format, couleur) sont modifiables via `PUT /loyalty-cards/:id`. La carte ne peut pas changer de propriétaire (`userId` est immuable après création).

## Supprimer une carte

`DELETE /loyalty-cards/:id` — accessible uniquement par le propriétaire. Retourne 204.

---

## Ce qui n'est pas inclus

- Partage de carte entre membres du foyer (les cartes sont strictement personnelles, RLS sur `user_id`)
- Scanner physique de code-barres pour capturer les données d'une carte existante
- Détection automatique du format de code-barres
