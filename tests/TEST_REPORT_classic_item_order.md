# Test Report — classic_item_order

## Résumé
- Total : 12 tests
- Passés : 12
- Échoués : 0
- Skipped : 0

## Fichier de tests
`tests/classic_item_order.regression.spec.ts`

## Runner
Jest 30 + ts-jest (via `apps/api/node_modules/.bin/jest`)

## Tests échoués
Aucun — tous les tests passent.

## Description des tests

### Bug 1 — Décochage : repositionnement de l'article décoché

| Test | Description |
|---|---|
| `unchecked item appears before checked items after re-sort` | Vérifie qu'un article décoché (`is_purchased: false`) remontre avant les articles cochés après tri. |
| `multiple unchecked items all appear before all checked items` | Vérifie que plusieurs articles décochés se retrouvent tous avant les cochés. |
| `all unchecked list stays fully sorted to top after mass-uncheck` | Vérifie qu'une liste entièrement décochée reste correctement triée. |

### Bug 2 — Ajout depuis le catalogue : le nouvel article va dans les non-cochés

| Test | Description |
|---|---|
| `newly added unchecked item appears before existing checked items` | Vérifie qu'un article nouvellement ajouté (non-coché) s'insère avant les articles déjà cochés. |
| `multiple new unchecked items all appear before all checked items` | Vérifie que plusieurs nouveaux articles non-cochés se retrouvent tous avant les cochés. |
| `single new unchecked item in a list of all checked items goes to top` | Vérifie qu'un seul nouvel article non-coché dans une liste entièrement cochée remonte en tête. |

### Invariant : le cochage descend toujours l'article en bas

| Test | Description |
|---|---|
| `checked item appears after unchecked items (regression guard)` | Vérifie que le comportement de cochage (qui fonctionnait avant le bug) est toujours correct. |

### Idempotence : double-tri stable

| Test | Description |
|---|---|
| `sorting an already-correctly-sorted list produces the same result` | Vérifie que trier deux fois de suite donne le même résultat. |

### Cas limites

| Test | Description |
|---|---|
| `empty list returns empty array` | Liste vide → résultat vide. |
| `single unchecked item returns a one-element array` | Un seul article non-coché. |
| `single checked item returns a one-element array` | Un seul article coché. |
| `original array is not mutated by the sort` | Vérifie que le tableau original n'est pas muté (le fix utilise `[...items].sort(...)`). |

## Observations
- La correction est purement frontale : elle se situe dans le `useMemo` de `ShoppingList.tsx` (ligne ~275).
- Le tri `Number(a.is_purchased) - Number(b.is_purchased)` est stable et correctement appliqué avec un spread (`[...items]`) pour ne pas muter l'état React.
- Aucun bug résiduel détecté dans la logique de tri.
- L'immutabilité du tableau source est garantie par le spread — confirmée par le test dédié.
