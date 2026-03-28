# Spécification Technique : Gestion des Cartes de Fidélité

**Version**: 1.1
**Auteur**: Product Manager (@pm)
**Date**: 26/03/2026
**Révision 1.1**: Association avec les magasins existants et intégration à la liste de courses.

---

## 1. Vision & Objectif

Permettre aux utilisateurs de dématérialiser leurs cartes de fidélité physiques au sein de l'application. L'objectif est de simplifier leurs passages en caisse, d'alléger leur portefeuille et de s'assurer qu'ils ont toujours la bonne carte au bon moment pour ne jamais manquer un avantage.

## 2. User Stories (Fonctionnalités Clés)

### Gestion des Cartes

- [ ] **En tant qu'utilisateur, je veux pouvoir ajouter une nouvelle carte de fidélité** en l'associant à un magasin existant dans l'application.
- [ ] **En tant qu'utilisateur, je veux pouvoir scanner le code-barres de ma carte physique** avec l'appareil photo de mon téléphone pour l'ajouter rapidement et sans erreur.
- [ ] **En tant qu'utilisateur, je veux pouvoir visualiser la liste de toutes mes cartes** de fidélité enregistrées.
- [ ] **En tant qu'utilisateur, je veux pouvoir modifier les informations** d'une carte déjà enregistrée.
- [ ] **En tant qu'utilisateur, je veux pouvoir supprimer une carte** que je n'utilise plus.

### Utilisation en Magasin & Intégrations

- [ ] **En tant qu'utilisateur, je veux pouvoir sélectionner une carte dans ma liste pour afficher son code-barres** en grand format, avec une luminosité maximale, pour un scan facile en caisse.
- [ ] **En tant qu'utilisateur, en consultant ma liste de courses, je veux voir un accès rapide aux cartes de fidélité** des magasins concernés par les produits de ma liste.
- [ ] **En tant qu'utilisateur, je veux pouvoir accéder à mes cartes même sans connexion Internet.**

## 3. Modèle de Données (Agnostique)

Chaque `LoyaltyCard` devra contenir les informations suivantes :

- `cardId` (UUID) : Identifiant unique de la carte.
- `userId` (UUID) : Identifiant de l'utilisateur propriétaire.
- `storeId` (UUID, Foreign Key) : **Lien vers l'enregistrement du magasin dans la table `stores`.**
- `cardData` (String) : Le numéro ou la donnée encodée dans le code-barres.
- `barcodeFormat` (Enum) : Le format du code-barres (ex: `CODE_128`, `QR_CODE`, `EAN_13`).
- `createdAt` (Timestamp) : Date de création.
- `updatedAt` (Timestamp) : Date de dernière modification.
- `customColor` (String, Optional) : Couleur hexadécimale pour personnaliser l'affichage de la carte dans l'UI.

## 4. Endpoints d'API (Logique)

Le backend devra exposer les endpoints suivants pour gérer le cycle de vie des cartes :

- `POST /loyalty-cards`: Créer une nouvelle carte.
- `GET /loyalty-cards`: Obtenir la liste de toutes les cartes de l'utilisateur authentifié, ajouter des filtres par magasins via un paramètre optionnel `storeIds` (array de UUID).
- `PUT /loyalty-cards/{cardId}`: Mettre à jour une carte spécifique.
- `DELETE /loyalty-cards/{cardId}`: Supprimer une carte spécifique.

## 5. Parcours Utilisateur (UX/UI - Haut Niveau)

1.  **Écran principal** : Une liste ou une grille présentant les cartes enregistrées, identifiées par le logo et le nom du magasin. Un bouton "+" ou "Ajouter une carte" est clairement visible.
2.  **Écran d'ajout** : L'utilisateur sélectionne d'abord un magasin dans la liste des magasins existants. Ensuite, un formulaire lui demande le numéro de la carte avec un bouton "Scanner le code-barres" qui active la caméra.
3.  **Écran de visualisation** : En touchant une carte depuis la liste, l'utilisateur accède à un écran affichant le code-barres en grand, prêt à être scanné. Des options pour "Modifier" ou "Supprimer" sont accessibles.
4.  **Écran Liste de Courses**: En haut de la liste de courses, une section met en avant les cartes de fidélité pertinentes pour les magasins des produits listés.

## 6. Hors-Périmètre (Pour une V2)

- Suivi automatique des points de fidélité via des intégrations API avec les enseignes.
- Notifications géolocalisées ("Vous êtes chez [Magasin], voici votre carte !").
- **Partage de cartes au sein d'un foyer (`household`)**: Noté comme une fonctionnalité de **haute priorité** et l'intérêt principal pour la V2.

## 7. Métriques de Succès

- Nombre de cartes actives par utilisateur.
- Fréquence d'affichage de l'écran de visualisation (indicateur d'utilisation en magasin).
- Taux d'adoption de la fonctionnalité (utilisateurs ayant au moins une carte).

---

## Approbation

Voici la version 1.1 finale, mise à jour avec l'ensemble de vos retours. J'attends votre approbation formelle pour passer la main à l'équipe de développement.
