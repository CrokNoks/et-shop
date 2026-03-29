/**
 * QA Audit — Change Request: Historique des achats & Statistiques
 *
 * Ce fichier vérifie statiquement chaque critère d'acceptance défini dans
 * la Technical_Specification.md du Change Request historique_stats.
 *
 * Il inspecte les fichiers du codebase Engineer (app_build/historique_stats/engineer/)
 * et détecte les régressions potentielles.
 *
 * Exécution : ts-node tests/audit_historique_stats_acceptance_criteria.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ─── Root paths ───────────────────────────────────────────────────────────────

// Support both CJS (__dirname) and ESM (import.meta.url)
// Fallback to absolute path if resolution fails
const _dirname = (() => {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return '/Users/lucas/Projects/perso/et-shop/app_build/historique_stats/qa/tests';
  }
})();

const ENGINEER_ROOT = path.resolve(_dirname, '../../engineer');
const API_SRC = path.join(ENGINEER_ROOT, 'apps/api/src');
const WEB_SRC = path.join(ENGINEER_ROOT, 'apps/web/src');
const MIGRATIONS = path.join(ENGINEER_ROOT, 'supabase/migrations');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiPath(...segments: string[]): string {
  return path.join(API_SRC, ...segments);
}

function webPath(...segments: string[]): string {
  return path.join(WEB_SRC, ...segments);
}

function migrationPath(...segments: string[]): string {
  return path.join(MIGRATIONS, ...segments);
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

function readApiFile(...segments: string[]): string {
  return readFile(apiPath(...segments));
}

function readWebFile(...segments: string[]): string {
  return readFile(webPath(...segments));
}

// ─── Test Runner ──────────────────────────────────────────────────────────────

type TestResult = { name: string; passed: boolean; details?: string };
const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name, passed: false, details: msg });
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// ── Modèle de données ─────────────────────────────────────────────────────────

test('[AC-DATA-01] Migration 20260329000000_purchase_records.sql existe', () => {
  const migrationFile = path.join(
    MIGRATIONS,
    '20260329000000_purchase_records.sql',
  );
  assert(
    fileExists(migrationFile),
    `Migration manquante : ${migrationFile}\n` +
      'Doit renommer is_checked → is_purchased, créer purchase_records, RLS et vues stats.',
  );
});

test('[AC-DATA-02] Migration contient le RENAME is_checked → is_purchased', () => {
  const content = readFile(
    path.join(MIGRATIONS, '20260329000000_purchase_records.sql'),
  );
  assert(content.length > 0, 'Migration introuvable ou vide');
  assert(
    content.includes('RENAME COLUMN is_checked TO is_purchased') ||
      content.includes('RENAME COLUMN "is_checked" TO "is_purchased"'),
    'Migration doit inclure : ALTER TABLE shopping_list_items RENAME COLUMN is_checked TO is_purchased',
  );
});

test('[AC-DATA-03] Migration crée la table purchase_records', () => {
  const content = readFile(
    path.join(MIGRATIONS, '20260329000000_purchase_records.sql'),
  );
  assert(
    content.includes('CREATE TABLE purchase_records') ||
      content.includes('CREATE TABLE IF NOT EXISTS purchase_records'),
    'Migration doit créer la table purchase_records',
  );
});

test('[AC-DATA-04] Table purchase_records contient les colonnes obligatoires', () => {
  const content = readFile(
    path.join(MIGRATIONS, '20260329000000_purchase_records.sql'),
  );
  const requiredColumns = [
    'household_id',
    'item_name',
    'quantity',
    'purchased_at',
  ];
  for (const col of requiredColumns) {
    assert(
      content.includes(col),
      `La table purchase_records doit contenir la colonne : ${col}`,
    );
  }
});

test('[AC-DATA-05] Migration active le RLS sur purchase_records', () => {
  const content = readFile(
    path.join(MIGRATIONS, '20260329000000_purchase_records.sql'),
  );
  assert(
    content.includes('ENABLE ROW LEVEL SECURITY'),
    'purchase_records doit avoir le RLS activé',
  );
  assert(
    content.includes('purchase_records'),
    'La politique RLS doit référencer purchase_records',
  );
});

test('[AC-DATA-06] Migration crée les vues v_spending_by_category et v_top_items', () => {
  const content = readFile(
    path.join(MIGRATIONS, '20260329000000_purchase_records.sql'),
  );
  assert(
    content.includes('v_spending_by_category'),
    'Migration doit créer la vue v_spending_by_category',
  );
  assert(
    content.includes('v_top_items'),
    'Migration doit créer la vue v_top_items',
  );
});

// ── Backend — Module Purchases ─────────────────────────────────────────────────

test('[AC-BE-01] Entité PurchaseRecord existe', () => {
  assert(
    fileExists(apiPath('purchases/domain/purchase-record.entity.ts')),
    'Manquant : apps/api/src/purchases/domain/purchase-record.entity.ts',
  );
});

test('[AC-BE-02] Repository interface PurchaseRecord existe', () => {
  assert(
    fileExists(apiPath('purchases/domain/purchase-record.repository.ts')),
    'Manquant : apps/api/src/purchases/domain/purchase-record.repository.ts',
  );
});

test('[AC-BE-03] Use case RecordPurchase existe', () => {
  assert(
    fileExists(apiPath('purchases/application/record-purchase.use-case.ts')),
    'Manquant : apps/api/src/purchases/application/record-purchase.use-case.ts',
  );
});

test('[AC-BE-04] Use case CancelPurchase existe', () => {
  assert(
    fileExists(apiPath('purchases/application/cancel-purchase.use-case.ts')),
    'Manquant : apps/api/src/purchases/application/cancel-purchase.use-case.ts',
  );
});

test('[AC-BE-05] Use case GetPurchaseHistory existe', () => {
  assert(
    fileExists(
      apiPath('purchases/application/get-purchase-history.use-case.ts'),
    ),
    'Manquant : apps/api/src/purchases/application/get-purchase-history.use-case.ts',
  );
});

test('[AC-BE-06] Use case GetStatistics existe', () => {
  assert(
    fileExists(apiPath('purchases/application/get-statistics.use-case.ts')),
    'Manquant : apps/api/src/purchases/application/get-statistics.use-case.ts',
  );
});

test('[AC-BE-07] DTO PurchaseHistoryQuery existe', () => {
  assert(
    fileExists(
      apiPath('purchases/application/dtos/purchase-history-query.dto.ts'),
    ),
    'Manquant : apps/api/src/purchases/application/dtos/purchase-history-query.dto.ts',
  );
});

test('[AC-BE-08] Infrastructure Supabase repository existe', () => {
  assert(
    fileExists(
      apiPath(
        'purchases/infrastructure/supabase-purchase-record.repository.ts',
      ),
    ),
    'Manquant : apps/api/src/purchases/infrastructure/supabase-purchase-record.repository.ts',
  );
});

test('[AC-BE-09] Controller Purchases existe', () => {
  assert(
    fileExists(apiPath('purchases/purchases.controller.ts')),
    'Manquant : apps/api/src/purchases/purchases.controller.ts',
  );
});

test('[AC-BE-10] Module Purchases existe', () => {
  assert(
    fileExists(apiPath('purchases/purchases.module.ts')),
    'Manquant : apps/api/src/purchases/purchases.module.ts',
  );
});

test('[AC-BE-11] PurchasesModule est importé dans app.module.ts', () => {
  const content = readApiFile('app.module.ts');
  assert(content.length > 0, 'app.module.ts introuvable');
  assert(
    content.includes('PurchasesModule'),
    "app.module.ts ne contient pas 'PurchasesModule' — doit importer le module Purchases",
  );
});

// ── Endpoints ─────────────────────────────────────────────────────────────────

test('[AC-BE-12] Controller expose PATCH /purchase endpoint', () => {
  const content = readApiFile('purchases/purchases.controller.ts');
  if (content.length === 0) {
    // Check shopping-lists controller instead (endpoint may be there)
    const slContent = readApiFile('shopping-lists/shopping-lists.controller.ts');
    assert(
      slContent.includes('purchase') || slContent.includes('Purchase'),
      'Ni purchases.controller.ts ni shopping-lists.controller.ts ne définit un endpoint /purchase',
    );
  } else {
    assert(
      content.includes('@Patch') || content.includes('purchase'),
      'purchases.controller.ts doit définir des endpoints PATCH pour purchase/unpurchase',
    );
  }
});

test('[AC-BE-13] Controller expose GET /purchases (historique paginé)', () => {
  const content = readApiFile('purchases/purchases.controller.ts');
  assert(content.length > 0, 'purchases.controller.ts introuvable');
  assert(
    content.includes('@Get') || content.includes("'purchases'"),
    'purchases.controller.ts doit définir GET /purchases',
  );
});

test('[AC-BE-14] Controller expose GET /purchases/statistics', () => {
  const content = readApiFile('purchases/purchases.controller.ts');
  assert(content.length > 0, 'purchases.controller.ts introuvable');
  assert(
    content.includes('statistics'),
    "purchases.controller.ts doit définir GET /purchases/statistics",
  );
});

// ── Régression is_checked → is_purchased ──────────────────────────────────────

test('[AC-REG-01] shopping-lists.service.ts utilise is_purchased (pas is_checked)', () => {
  const content = readApiFile('shopping-lists/shopping-lists.service.ts');
  assert(content.length > 0, 'shopping-lists.service.ts introuvable');
  assert(
    !content.includes('is_checked'),
    "shopping-lists.service.ts contient encore 'is_checked' — doit être remplacé par 'is_purchased'",
  );
});

test('[AC-REG-02] shopping-lists.controller.ts utilise is_purchased (pas is_checked)', () => {
  const content = readApiFile('shopping-lists/shopping-lists.controller.ts');
  // The controller may not directly reference the column, so only check if it has is_checked
  if (content.includes('is_checked')) {
    assert(
      false,
      "shopping-lists.controller.ts contient encore 'is_checked' — doit être remplacé par 'is_purchased'",
    );
  }
});

test("[AC-REG-03] recipes.service.ts ne référence plus 'is_checked'", () => {
  const content = readApiFile('recipes/recipes.service.ts');
  if (content.length === 0) return; // File may not exist
  assert(
    !content.includes('is_checked'),
    "recipes.service.ts contient encore 'is_checked' — le renommage doit s'étendre à ce fichier (sendToList merge logic)",
  );
});

// ── Frontend ──────────────────────────────────────────────────────────────────

test('[AC-FE-01] Page historique existe (app/historique/page.tsx)', () => {
  assert(
    fileExists(webPath('app/historique/page.tsx')),
    'Manquant : apps/web/src/app/historique/page.tsx',
  );
});

test('[AC-FE-02] Page statistiques existe (app/statistiques/page.tsx)', () => {
  assert(
    fileExists(webPath('app/statistiques/page.tsx')),
    'Manquant : apps/web/src/app/statistiques/page.tsx',
  );
});

test('[AC-FE-03] Composant PurchaseHistoryList existe', () => {
  assert(
    fileExists(webPath('components/purchases/PurchaseHistoryList.tsx')),
    'Manquant : apps/web/src/components/purchases/PurchaseHistoryList.tsx',
  );
});

test('[AC-FE-04] Composant PurchaseHistoryItem existe', () => {
  assert(
    fileExists(webPath('components/purchases/PurchaseHistoryItem.tsx')),
    'Manquant : apps/web/src/components/purchases/PurchaseHistoryItem.tsx',
  );
});

test('[AC-FE-05] Composant ProductPurchaseHistory existe', () => {
  assert(
    fileExists(webPath('components/purchases/ProductPurchaseHistory.tsx')),
    'Manquant : apps/web/src/components/purchases/ProductPurchaseHistory.tsx',
  );
});

test('[AC-FE-06] Composant SpendingByCategory existe', () => {
  assert(
    fileExists(webPath('components/statistics/SpendingByCategory.tsx')),
    'Manquant : apps/web/src/components/statistics/SpendingByCategory.tsx',
  );
});

test('[AC-FE-07] Composant TopItems existe', () => {
  assert(
    fileExists(webPath('components/statistics/TopItems.tsx')),
    'Manquant : apps/web/src/components/statistics/TopItems.tsx',
  );
});

test('[AC-FE-08] Hook usePurchaseHistory existe', () => {
  assert(
    fileExists(webPath('hooks/usePurchaseHistory.ts')),
    'Manquant : apps/web/src/hooks/usePurchaseHistory.ts',
  );
});

test('[AC-FE-09] Hook useStatistics existe', () => {
  assert(
    fileExists(webPath('hooks/useStatistics.ts')),
    'Manquant : apps/web/src/hooks/useStatistics.ts',
  );
});

test('[AC-FE-10] ShoppingList.tsx remplace is_checked par is_purchased', () => {
  const content = readWebFile('components/shopping/ShoppingList.tsx');
  assert(content.length > 0, 'ShoppingList.tsx introuvable');
  assert(
    !content.includes('is_checked'),
    "ShoppingList.tsx contient encore 'is_checked' — doit être remplacé par 'is_purchased'",
  );
});

test('[AC-FE-11] Navigation contient des liens vers /historique et /statistiques', () => {
  // Check SidebarContent for navigation links
  const sidebarContent = readWebFile('components/layout/SidebarContent.tsx');
  assert(sidebarContent.length > 0, 'SidebarContent.tsx introuvable');
  assert(
    sidebarContent.includes('historique') ||
      sidebarContent.includes('Historique'),
    "Navigation (SidebarContent.tsx) ne contient pas de lien vers '/historique'",
  );
  assert(
    sidebarContent.includes('statistiques') ||
      sidebarContent.includes('Statistiques'),
    "Navigation (SidebarContent.tsx) ne contient pas de lien vers '/statistiques'",
  );
});

// ── Tests unitaires ───────────────────────────────────────────────────────────

test('[AC-TEST-01] Tests unitaires entity PurchaseRecord existent', () => {
  assert(
    fileExists(
      apiPath('purchases/domain/purchase-record.entity.spec.ts'),
    ),
    'Manquant : apps/api/src/purchases/domain/purchase-record.entity.spec.ts',
  );
});

test('[AC-TEST-02] Tests unitaires RecordPurchase use case existent', () => {
  assert(
    fileExists(
      apiPath('purchases/application/record-purchase.use-case.spec.ts'),
    ),
    'Manquant : apps/api/src/purchases/application/record-purchase.use-case.spec.ts',
  );
});

test('[AC-TEST-03] Tests unitaires CancelPurchase use case existent', () => {
  assert(
    fileExists(
      apiPath('purchases/application/cancel-purchase.use-case.spec.ts'),
    ),
    'Manquant : apps/api/src/purchases/application/cancel-purchase.use-case.spec.ts',
  );
});

test('[AC-TEST-04] Tests unitaires GetPurchaseHistory use case existent', () => {
  assert(
    fileExists(
      apiPath(
        'purchases/application/get-purchase-history.use-case.spec.ts',
      ),
    ),
    'Manquant : apps/api/src/purchases/application/get-purchase-history.use-case.spec.ts',
  );
});

test('[AC-TEST-05] Tests unitaires GetStatistics use case existent', () => {
  assert(
    fileExists(
      apiPath('purchases/application/get-statistics.use-case.spec.ts'),
    ),
    'Manquant : apps/api/src/purchases/application/get-statistics.use-case.spec.ts',
  );
});

// ─── Report ───────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.passed);
const failed = results.filter((r) => !r.passed);

console.log('\n=== QA Audit — Historique des achats & Statistiques ===\n');

for (const r of results) {
  const icon = r.passed ? '✓' : '✗';
  console.log(`  ${icon}  ${r.name}`);
  if (!r.passed && r.details) {
    console.log(`       → ${r.details}`);
  }
}

console.log(`\n─── Résultat : ${passed.length}/${results.length} critères satisfaits ───`);

if (failed.length > 0) {
  console.log(`\nCritères non satisfaits (${failed.length}) :`);
  for (const r of failed) {
    console.log(`  • ${r.name}`);
    if (r.details) console.log(`    ${r.details}`);
  }
  console.log(
    '\nAction requise : l\'agent Engineer doit implémenter les points ci-dessus.\n',
  );
  process.exit(1);
} else {
  console.log(
    '\nTous les critères d\'acceptance sont satisfaits. Prêt pour la revue finale.\n',
  );
  process.exit(0);
}
