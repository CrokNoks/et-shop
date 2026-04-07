# Bug Report — Ordre des articles incorrect en mode classique

## Résumé
En mode classique, les articles cochés restent dans leur groupe catégorie au lieu de passer en bas de liste, et les nouveaux articles ajoutés apparaissent après les cochés au lieu d'être insérés parmi les non-cochés.

## Environnement
- Stack : TypeScript, Next.js 16, React 19, NestJS 11, Supabase (PostgreSQL)
- Environnement : dev / production
- Date de détection : 2026-04-07

## Étapes pour reproduire
1. Ouvrir la liste de courses en **mode classique** (pas le mode shopping)
2. Cocher un produit dans la liste
3. Observer que le produit reste à sa position d'origine dans son groupe magasin/catégorie
4. Ajouter un nouveau produit depuis le catalogue
5. Observer que le nouveau produit apparaît après les articles cochés au lieu d'apparaître parmi les non-cochés

## Comportement observé
- Les articles cochés (`is_purchased: true`) restent mélangés avec les articles non-cochés dans leur groupe magasin/catégorie
- Les nouveaux articles ajoutés depuis le catalogue apparaissent après les cochés (en bas absolu de liste) au lieu d'être regroupés avec les non-cochés

## Comportement attendu
- Les articles cochés doivent descendre en bas de liste (séparés des non-cochés), identique au comportement du mode shopping
- Les nouveaux articles non-cochés doivent apparaître dans leur groupe catégorie, AVANT les articles cochés

## Impact
- **Sévérité** : Majeur
- **Utilisateurs impactés** : Tous les utilisateurs utilisant le mode classique
- **Contournement disponible** : Oui — passer en mode shopping contourne le problème car la séparation cochés/non-cochés y est correcte

## Composant probable
`apps/web/src/components/shopping/ShoppingList.tsx`

**Cause racine identifiée** : Le `useMemo` (ligne 243) ne sépare les articles cochés vers `doneItems` que si `isShoppingMode` est `true` :

```typescript
// ACTUEL — séparation uniquement en mode shopping
if (isShoppingMode && item.is_purchased) done.push(item);

// ATTENDU — séparation dans les deux modes
if (item.is_purchased) done.push(item);
```

De plus, le rendu de la section `doneItems` (ligne 540) est conditionnel à `isShoppingMode`, donc même si les items étaient séparés, ils ne seraient pas affichés en mode classique.

## Contexte additionnel
La logique de tri est correcte en mode shopping — la section "Déjà dans le panier" fonctionne bien. Le correctif consiste à étendre cette même logique au mode classique, en retirant la condition `isShoppingMode` du filtre dans le `useMemo` et en affichant la section `doneItems` dans les deux modes.
