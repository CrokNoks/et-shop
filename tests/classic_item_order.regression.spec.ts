/**
 * Regression Tests — Bugfix: classic_item_order
 *
 * Bug Report: apps/web/src/components/shopping/ShoppingList.tsx
 *
 * Bug 1 — Unchecking: When an item is unchecked (is_purchased: false), it was
 *   staying at its position (after checked items) instead of being sorted back
 *   to the top of its category.
 *
 * Bug 2 — Catalog add: A newly added item (is_purchased: false) was appearing
 *   after already-checked items instead of being sorted to the top.
 *
 * The fix adds a sort by `is_purchased` (false first) on every category's
 * items array inside the `useMemo` block of ShoppingList.tsx.
 *
 * These tests verify the sorting function in isolation, exactly as it is
 * implemented in the component after the fix.
 */

// ─── Types (mirrors of apps/web/src/types/index.ts) ──────────────────────────

interface ShoppingListItem {
  id: string;
  is_purchased: boolean;
  quantity: number;
  price: number;
  unit?: string;
  barcode?: string;
  name?: string;
  items_catalog:
    | {
        name?: string;
        barcode?: string;
        unit?: string;
        categories?: { name: string; sort_order: number };
        stores?: { id: string; name: string };
      }
    | null;
}

// ─── Sorting logic extracted from ShoppingList.tsx (after bugfix) ─────────────
//
// The fixed useMemo sorts category items with:
//   [...categoryData.items].sort(
//     (a, b) => Number(a.is_purchased) - Number(b.is_purchased)
//   )
//
// We extract this as a pure function so it can be tested without React.

function sortItemsByPurchaseStatus(
  items: ShoppingListItem[],
): ShoppingListItem[] {
  return [...items].sort(
    (a, b) => Number(a.is_purchased) - Number(b.is_purchased),
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeItem(
  id: string,
  is_purchased: boolean,
  name = 'Item',
): ShoppingListItem {
  return {
    id,
    is_purchased,
    quantity: 1,
    price: 0,
    name,
    items_catalog: null,
  };
}

// ─── Bug 1 — Unchecking: unchecked item must appear before checked items ──────

describe('Bug 1 — Unchecking: item repositions when unchecked', () => {
  test('unchecked item appears before checked items after re-sort', () => {
    // Simulate state AFTER unchecking: item-A has is_purchased reset to false
    // but still sits after checked items in the raw array (server order).
    const rawItems: ShoppingListItem[] = [
      makeItem('item-B', true, 'Bananes'),   // checked — was there first
      makeItem('item-A', false, 'Avocats'),  // just unchecked
    ];

    const sorted = sortItemsByPurchaseStatus(rawItems);

    // Unchecked item must come first
    expect(sorted[0].id).toBe('item-A');
    expect(sorted[0].is_purchased).toBe(false);

    // Checked item must come last
    expect(sorted[1].id).toBe('item-B');
    expect(sorted[1].is_purchased).toBe(true);
  });

  test('multiple unchecked items all appear before all checked items', () => {
    const rawItems: ShoppingListItem[] = [
      makeItem('item-C', true, 'Carottes'),
      makeItem('item-D', true, 'Dattes'),
      makeItem('item-A', false, 'Amandes'),
      makeItem('item-B', false, 'Bananes'),
    ];

    const sorted = sortItemsByPurchaseStatus(rawItems);

    const uncheckedIds = sorted
      .filter((i) => !i.is_purchased)
      .map((i) => i.id);
    const checkedIds = sorted.filter((i) => i.is_purchased).map((i) => i.id);

    // All unchecked items come before any checked item
    // Find last index of unchecked items and first index of checked items
    let lastUncheckedIndex = -1;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (!sorted[i].is_purchased) { lastUncheckedIndex = i; break; }
    }
    const firstCheckedIndex = sorted.findIndex((i) => i.is_purchased);

    expect(lastUncheckedIndex).toBeLessThan(firstCheckedIndex);
    expect(uncheckedIds).toEqual(expect.arrayContaining(['item-A', 'item-B']));
    expect(checkedIds).toEqual(expect.arrayContaining(['item-C', 'item-D']));
  });

  test('all unchecked list stays fully sorted to top after mass-uncheck', () => {
    // Simulate: user unchecked all items — all is_purchased = false
    const rawItems: ShoppingListItem[] = [
      makeItem('item-A', false),
      makeItem('item-B', false),
      makeItem('item-C', false),
    ];

    const sorted = sortItemsByPurchaseStatus(rawItems);

    // All items should still be present and all unchecked
    expect(sorted).toHaveLength(3);
    expect(sorted.every((i) => !i.is_purchased)).toBe(true);
  });
});

// ─── Bug 2 — Catalog add: new item (unchecked) goes before checked items ──────

describe('Bug 2 — Catalog add: new item appears before checked items', () => {
  test('newly added unchecked item appears before existing checked items', () => {
    // Simulate state returned by fetchItems() after adding a new item from
    // the catalog. The server returns the new item appended at the end.
    const rawItems: ShoppingListItem[] = [
      makeItem('item-A', true, 'Anchois'),   // already checked
      makeItem('item-B', true, 'Beurre'),    // already checked
      makeItem('item-NEW', false, 'Nouvel article'),  // newly added, unchecked
    ];

    const sorted = sortItemsByPurchaseStatus(rawItems);

    // New item must be first
    expect(sorted[0].id).toBe('item-NEW');
    expect(sorted[0].is_purchased).toBe(false);

    // Checked items come after
    expect(sorted[1].is_purchased).toBe(true);
    expect(sorted[2].is_purchased).toBe(true);
  });

  test('multiple new unchecked items all appear before all checked items', () => {
    const rawItems: ShoppingListItem[] = [
      makeItem('item-checked-1', true),
      makeItem('item-checked-2', true),
      makeItem('item-new-1', false),
      makeItem('item-new-2', false),
    ];

    const sorted = sortItemsByPurchaseStatus(rawItems);

    expect(sorted[0].is_purchased).toBe(false);
    expect(sorted[1].is_purchased).toBe(false);
    expect(sorted[2].is_purchased).toBe(true);
    expect(sorted[3].is_purchased).toBe(true);
  });

  test('single new unchecked item in a list of all checked items goes to top', () => {
    const rawItems: ShoppingListItem[] = [
      makeItem('item-A', true),
      makeItem('item-B', true),
      makeItem('item-C', true),
      makeItem('item-NEW', false),
    ];

    const sorted = sortItemsByPurchaseStatus(rawItems);

    expect(sorted[0].id).toBe('item-NEW');
    expect(sorted.slice(1).every((i) => i.is_purchased)).toBe(true);
  });
});

// ─── Invariant: checking an item still moves it to the bottom ─────────────────

describe('Invariant: checking an item still moves it to the bottom', () => {
  test('checked item appears after unchecked items (regression guard)', () => {
    // This was already working before the bugfix — must still work.
    const rawItems: ShoppingListItem[] = [
      makeItem('item-A', false),
      makeItem('item-CHECKED', true),
      makeItem('item-B', false),
    ];

    const sorted = sortItemsByPurchaseStatus(rawItems);

    expect(sorted[sorted.length - 1].id).toBe('item-CHECKED');
    expect(sorted[sorted.length - 1].is_purchased).toBe(true);
  });
});

// ─── Idempotency: sorting an already-sorted list produces the same result ─────

describe('Idempotency: double-sort is stable', () => {
  test('sorting an already-correctly-sorted list produces the same result', () => {
    const items: ShoppingListItem[] = [
      makeItem('item-A', false),
      makeItem('item-B', false),
      makeItem('item-C', true),
      makeItem('item-D', true),
    ];

    const onceSorted = sortItemsByPurchaseStatus(items);
    const twiceSorted = sortItemsByPurchaseStatus(onceSorted);

    expect(twiceSorted.map((i) => i.id)).toEqual(
      onceSorted.map((i) => i.id),
    );
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  test('empty list returns empty array', () => {
    expect(sortItemsByPurchaseStatus([])).toEqual([]);
  });

  test('single unchecked item returns a one-element array', () => {
    const result = sortItemsByPurchaseStatus([makeItem('solo', false)]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('solo');
  });

  test('single checked item returns a one-element array', () => {
    const result = sortItemsByPurchaseStatus([makeItem('solo', true)]);
    expect(result).toHaveLength(1);
    expect(result[0].is_purchased).toBe(true);
  });

  test('original array is not mutated by the sort', () => {
    const original: ShoppingListItem[] = [
      makeItem('item-A', true),
      makeItem('item-B', false),
    ];
    const originalOrder = original.map((i) => i.id);

    sortItemsByPurchaseStatus(original);

    // Original array must be unchanged (sort uses a copy via spread)
    expect(original.map((i) => i.id)).toEqual(originalOrder);
  });
});
