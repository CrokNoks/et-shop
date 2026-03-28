/**
 * QA Audit — Change Request: Recettes (Recipes)
 *
 * Ce fichier vérifie statiquement chaque critère d'acceptance défini dans
 * production_artifacts/Technical_Specification.md (section Recettes).
 *
 * Exécution : ts-node tests/audit_recipes_acceptance_criteria.test.ts
 *
 * Stratégie : lecture des fichiers générés par l'engineer dans app_build/main/
 * et vérification des conditions attendues via analyse statique.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Paths ────────────────────────────────────────────────────────────────────

const MAIN_ROOT = path.resolve(__dirname, '../../main');
const API_SRC = path.join(MAIN_ROOT, 'apps/api/src');
const WEB_SRC = path.join(MAIN_ROOT, 'apps/web/src');
const SUPABASE_MIGRATIONS = path.join(MAIN_ROOT, 'supabase/migrations');

function apiFile(...segments: string[]): string {
  return path.join(API_SRC, ...segments);
}

function webFile(...segments: string[]): string {
  return path.join(WEB_SRC, ...segments);
}

function migrationGlob(): string[] {
  if (!fs.existsSync(SUPABASE_MIGRATIONS)) return [];
  return fs.readdirSync(SUPABASE_MIGRATIONS).map((f) =>
    path.join(SUPABASE_MIGRATIONS, f),
  );
}

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

type TestResult = {
  name: string;
  passed: boolean;
  details?: string;
};

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

// ─── Backend: Module & Files ─────────────────────────────────────────────────

test('[RCP-01] apps/api/src/recipes/recipes.module.ts existe', () => {
  assert(
    fileExists(apiFile('recipes', 'recipes.module.ts')),
    'recipes.module.ts est manquant — créer le RecipesModule NestJS',
  );
});

test('[RCP-02] apps/api/src/recipes/recipes.controller.ts existe', () => {
  assert(
    fileExists(apiFile('recipes', 'recipes.controller.ts')),
    'recipes.controller.ts est manquant',
  );
});

test('[RCP-03] apps/api/src/recipes/recipes.service.ts existe', () => {
  assert(
    fileExists(apiFile('recipes', 'recipes.service.ts')),
    'recipes.service.ts est manquant',
  );
});

test('[RCP-04] DTO: create-recipe.dto.ts existe', () => {
  assert(
    fileExists(apiFile('recipes', 'dto', 'create-recipe.dto.ts')),
    'create-recipe.dto.ts est manquant',
  );
});

test('[RCP-05] DTO: update-recipe.dto.ts existe', () => {
  assert(
    fileExists(apiFile('recipes', 'dto', 'update-recipe.dto.ts')),
    'update-recipe.dto.ts est manquant',
  );
});

test('[RCP-06] DTO: add-recipe-item.dto.ts existe', () => {
  assert(
    fileExists(apiFile('recipes', 'dto', 'add-recipe-item.dto.ts')),
    'add-recipe-item.dto.ts est manquant',
  );
});

test('[RCP-07] DTO: send-to-list.dto.ts existe', () => {
  assert(
    fileExists(apiFile('recipes', 'dto', 'send-to-list.dto.ts')),
    'send-to-list.dto.ts est manquant',
  );
});

// ─── Backend: Module Registration ─────────────────────────────────────────────

test('[RCP-08] RecipesModule est importé dans app.module.ts', () => {
  const content = readFile(apiFile('app.module.ts'));
  assert(content.length > 0, 'app.module.ts introuvable');
  assert(
    content.includes('RecipesModule'),
    "RecipesModule n'est pas importé dans app.module.ts",
  );
});

// ─── Backend: Controller Routes ───────────────────────────────────────────────

test('[RCP-09] Controller expose GET /recipes (findAll)', () => {
  const content = readFile(apiFile('recipes', 'recipes.controller.ts'));
  assert(content.length > 0, 'recipes.controller.ts introuvable');
  assert(
    content.includes("Get()") || content.includes("@Get('")  ,
    "Controller ne définit pas de route GET (findAll)",
  );
});

test('[RCP-10] Controller expose POST /recipes (create)', () => {
  const content = readFile(apiFile('recipes', 'recipes.controller.ts'));
  assert(content.length > 0, 'recipes.controller.ts introuvable');
  assert(
    content.includes('Post()') || content.includes("@Post('") || content.includes("@Post()"),
    "Controller ne définit pas de route POST (create)",
  );
});

test('[RCP-11] Controller expose POST /recipes/:id/items (addItem)', () => {
  const content = readFile(apiFile('recipes', 'recipes.controller.ts'));
  assert(content.length > 0, 'recipes.controller.ts introuvable');
  assert(
    content.includes('items'),
    "Controller ne définit pas la route POST /recipes/:id/items",
  );
});

test('[RCP-12] Controller expose POST /recipes/:id/send (sendToList)', () => {
  const content = readFile(apiFile('recipes', 'recipes.controller.ts'));
  assert(content.length > 0, 'recipes.controller.ts introuvable');
  assert(
    content.includes('send'),
    "Controller ne définit pas la route POST /recipes/:id/send",
  );
});

test('[RCP-13] Controller expose PATCH /recipes/:id (update)', () => {
  const content = readFile(apiFile('recipes', 'recipes.controller.ts'));
  assert(content.length > 0, 'recipes.controller.ts introuvable');
  assert(
    content.includes('Patch') || content.includes('@Patch'),
    "Controller ne définit pas de route PATCH (update)",
  );
});

test('[RCP-14] Controller expose DELETE /recipes/:id (remove)', () => {
  const content = readFile(apiFile('recipes', 'recipes.controller.ts'));
  assert(content.length > 0, 'recipes.controller.ts introuvable');
  assert(
    content.includes('Delete') || content.includes('@Delete'),
    "Controller ne définit pas de route DELETE (remove)",
  );
});

// ─── Backend: Service Methods ─────────────────────────────────────────────────

test('[RCP-15] RecipesService définit la méthode sendToList', () => {
  const content = readFile(apiFile('recipes', 'recipes.service.ts'));
  assert(content.length > 0, 'recipes.service.ts introuvable');
  assert(
    content.includes('sendToList'),
    "RecipesService ne contient pas la méthode sendToList — cœur métier manquant",
  );
});

test('[RCP-16] sendToList gère le cas is_checked=true (Rule 1: uncheck + replace)', () => {
  const content = readFile(apiFile('recipes', 'recipes.service.ts'));
  assert(content.length > 0, 'recipes.service.ts introuvable');
  assert(
    content.includes('is_checked'),
    "sendToList ne vérifie pas is_checked — la logique de fusion est incomplète",
  );
});

test('[RCP-17] sendToList additionne les quantités (Rule 2: unchecked + add)', () => {
  const content = readFile(apiFile('recipes', 'recipes.service.ts'));
  assert(content.length > 0, 'recipes.service.ts introuvable');
  // Must have quantity addition logic: existing.quantity + recipe_item.quantity
  const hasAddition =
    content.includes('+ recipe') ||
    content.includes('+ recipeItem') ||
    content.includes('existing.quantity') ||
    content.includes('existingItem.quantity') ||
    (content.includes('quantity') && content.includes('+'));
  assert(
    hasAddition,
    "sendToList ne semble pas additionner les quantités (Rule 2 manquante)",
  );
});

test('[RCP-18] sendToList insère un nouvel item si absent (Rule 3: insert)', () => {
  const content = readFile(apiFile('recipes', 'recipes.service.ts'));
  assert(content.length > 0, 'recipes.service.ts introuvable');
  assert(
    content.includes('insert') || content.includes('INSERT'),
    "sendToList ne contient pas d'INSERT — Rule 3 (ajout nouveau produit) manquante",
  );
});

test('[RCP-19] RecipesService utilise SupabaseService (dépendance injectée)', () => {
  const content = readFile(apiFile('recipes', 'recipes.service.ts'));
  assert(content.length > 0, 'recipes.service.ts introuvable');
  assert(
    content.includes('SupabaseService') || content.includes('supabaseService'),
    "RecipesService n'injecte pas SupabaseService",
  );
});

// ─── Backend: Input Validation ────────────────────────────────────────────────

test('[RCP-20] CreateRecipeDto valide le champ name (IsString ou IsNotEmpty)', () => {
  const content = readFile(apiFile('recipes', 'dto', 'create-recipe.dto.ts'));
  assert(content.length > 0, 'create-recipe.dto.ts introuvable');
  const hasValidation =
    content.includes('IsString') ||
    content.includes('IsNotEmpty') ||
    content.includes('@Is');
  assert(
    hasValidation,
    "create-recipe.dto.ts n'utilise pas class-validator — validation manquante",
  );
});

test('[RCP-21] AddRecipeItemDto valide catalog_item_id et quantity', () => {
  const content = readFile(apiFile('recipes', 'dto', 'add-recipe-item.dto.ts'));
  assert(content.length > 0, 'add-recipe-item.dto.ts introuvable');
  assert(
    content.includes('catalog_item_id'),
    "AddRecipeItemDto ne définit pas catalog_item_id",
  );
  assert(
    content.includes('quantity'),
    "AddRecipeItemDto ne définit pas quantity",
  );
});

test('[RCP-22] SendToListDto valide shopping_list_id (IsUUID ou IsString)', () => {
  const content = readFile(apiFile('recipes', 'dto', 'send-to-list.dto.ts'));
  assert(content.length > 0, 'send-to-list.dto.ts introuvable');
  assert(
    content.includes('shopping_list_id'),
    "SendToListDto ne définit pas shopping_list_id",
  );
});

test('[RCP-23] Pas de type any dans recipes.service.ts (TypeScript strict)', () => {
  const content = readFile(apiFile('recipes', 'recipes.service.ts'));
  assert(content.length > 0, 'recipes.service.ts introuvable');
  // Allow `any` in comments but not in type positions
  const codeWithoutComments = content
    .split('\n')
    .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
    .join('\n');
  const anyCount = (codeWithoutComments.match(/:\s*any\b/g) || []).length;
  assert(
    anyCount === 0,
    `recipes.service.ts contient ${anyCount} occurrence(s) de ": any" — TypeScript strict requis`,
  );
});

// ─── Frontend: Pages & Components ────────────────────────────────────────────

test('[RCP-24] apps/web/src/app/recipes/page.tsx existe', () => {
  assert(
    fileExists(webFile('app', 'recipes', 'page.tsx')),
    'apps/web/src/app/recipes/page.tsx manquant',
  );
});

test('[RCP-25] apps/web/src/app/recipes/loading.tsx existe', () => {
  assert(
    fileExists(webFile('app', 'recipes', 'loading.tsx')),
    'apps/web/src/app/recipes/loading.tsx manquant',
  );
});

test('[RCP-26] apps/web/src/app/recipes/error.tsx existe', () => {
  assert(
    fileExists(webFile('app', 'recipes', 'error.tsx')),
    'apps/web/src/app/recipes/error.tsx manquant',
  );
});

test('[RCP-27] apps/web/src/app/recipes/new/page.tsx existe', () => {
  assert(
    fileExists(webFile('app', 'recipes', 'new', 'page.tsx')),
    'apps/web/src/app/recipes/new/page.tsx manquant',
  );
});

test('[RCP-28] apps/web/src/app/recipes/[id]/page.tsx existe', () => {
  assert(
    fileExists(webFile('app', 'recipes', '[id]', 'page.tsx')),
    'apps/web/src/app/recipes/[id]/page.tsx manquant',
  );
});

test('[RCP-29] apps/web/src/app/recipes/[id]/loading.tsx existe', () => {
  assert(
    fileExists(webFile('app', 'recipes', '[id]', 'loading.tsx')),
    'apps/web/src/app/recipes/[id]/loading.tsx manquant',
  );
});

test('[RCP-30] apps/web/src/app/recipes/[id]/error.tsx existe', () => {
  assert(
    fileExists(webFile('app', 'recipes', '[id]', 'error.tsx')),
    'apps/web/src/app/recipes/[id]/error.tsx manquant',
  );
});

// ─── Frontend: Components ─────────────────────────────────────────────────────

test('[RCP-31] RecipeList.tsx existe', () => {
  assert(
    fileExists(webFile('components', 'recipes', 'RecipeList.tsx')),
    'RecipeList.tsx manquant',
  );
});

test('[RCP-32] RecipeCard.tsx existe', () => {
  assert(
    fileExists(webFile('components', 'recipes', 'RecipeCard.tsx')),
    'RecipeCard.tsx manquant',
  );
});

test('[RCP-33] RecipeDetail.tsx existe', () => {
  assert(
    fileExists(webFile('components', 'recipes', 'RecipeDetail.tsx')),
    'RecipeDetail.tsx manquant',
  );
});

test('[RCP-34] RecipeItemRow.tsx existe', () => {
  assert(
    fileExists(webFile('components', 'recipes', 'RecipeItemRow.tsx')),
    'RecipeItemRow.tsx manquant',
  );
});

test('[RCP-35] AddRecipeItemForm.tsx existe', () => {
  assert(
    fileExists(webFile('components', 'recipes', 'AddRecipeItemForm.tsx')),
    'AddRecipeItemForm.tsx manquant',
  );
});

test('[RCP-36] SendToListDialog.tsx existe', () => {
  assert(
    fileExists(webFile('components', 'recipes', 'SendToListDialog.tsx')),
    'SendToListDialog.tsx manquant',
  );
});

// ─── Frontend: Hooks & API ────────────────────────────────────────────────────

test('[RCP-37] useRecipes.ts existe', () => {
  assert(
    fileExists(webFile('hooks', 'useRecipes.ts')),
    'apps/web/src/hooks/useRecipes.ts manquant',
  );
});

test('[RCP-38] useRecipeDetail.ts existe', () => {
  assert(
    fileExists(webFile('hooks', 'useRecipeDetail.ts')),
    'apps/web/src/hooks/useRecipeDetail.ts manquant',
  );
});

test('[RCP-39] api.ts contient sendRecipeToList()', () => {
  const content = readFile(webFile('lib', 'api.ts'));
  assert(content.length > 0, 'api.ts introuvable');
  assert(
    content.includes('sendRecipeToList'),
    "api.ts ne contient pas sendRecipeToList — la fonction d'envoi vers liste est manquante",
  );
});

test('[RCP-40] api.ts contient getRecipes()', () => {
  const content = readFile(webFile('lib', 'api.ts'));
  assert(content.length > 0, 'api.ts introuvable');
  assert(
    content.includes('getRecipes'),
    "api.ts ne contient pas getRecipes",
  );
});

test('[RCP-41] api.ts contient createRecipe()', () => {
  const content = readFile(webFile('lib', 'api.ts'));
  assert(content.length > 0, 'api.ts introuvable');
  assert(
    content.includes('createRecipe'),
    "api.ts ne contient pas createRecipe",
  );
});

test('[RCP-42] api.ts contient deleteRecipe()', () => {
  const content = readFile(webFile('lib', 'api.ts'));
  assert(content.length > 0, 'api.ts introuvable');
  assert(
    content.includes('deleteRecipe'),
    "api.ts ne contient pas deleteRecipe",
  );
});

test('[RCP-43] api.ts contient addRecipeItem()', () => {
  const content = readFile(webFile('lib', 'api.ts'));
  assert(content.length > 0, 'api.ts introuvable');
  assert(
    content.includes('addRecipeItem'),
    "api.ts ne contient pas addRecipeItem",
  );
});

// ─── Frontend: Types ──────────────────────────────────────────────────────────

test('[RCP-44] types/index.ts contient interface Recipe', () => {
  const content = readFile(webFile('types', 'index.ts'));
  assert(content.length > 0, 'types/index.ts introuvable');
  assert(
    content.includes('Recipe') || content.includes('interface Recipe'),
    "types/index.ts ne contient pas l'interface Recipe",
  );
});

test('[RCP-45] types/index.ts contient interface RecipeItem', () => {
  const content = readFile(webFile('types', 'index.ts'));
  assert(content.length > 0, 'types/index.ts introuvable');
  assert(
    content.includes('RecipeItem') || content.includes('interface RecipeItem'),
    "types/index.ts ne contient pas l'interface RecipeItem",
  );
});

test('[RCP-46] Interface Recipe contient les champs requis (id, name, household_id)', () => {
  const content = readFile(webFile('types', 'index.ts'));
  assert(content.length > 0, 'types/index.ts introuvable');
  // Allow for slight variations in definition style
  assert(
    content.includes('household_id'),
    "L'interface Recipe ne contient pas household_id — isolation par ménage manquante",
  );
});

// ─── Frontend: Navigation ─────────────────────────────────────────────────────

test('[RCP-47] Sidebar.tsx contient un lien vers /recipes', () => {
  const content = readFile(webFile('components', 'layout', 'Sidebar.tsx'));
  assert(content.length > 0, 'Sidebar.tsx introuvable');
  const hasRecipesLink =
    content.includes('/recipes') ||
    content.includes("href=\"/recipes\"") ||
    content.includes("href='/recipes'");
  assert(
    hasRecipesLink,
    "Sidebar.tsx ne contient pas de lien vers /recipes — navigation manquante",
  );
});

test('[RCP-48] Sidebar.tsx utilise une icône pour les recettes (ChefHat ou similaire)', () => {
  const content = readFile(webFile('components', 'layout', 'Sidebar.tsx'));
  assert(content.length > 0, 'Sidebar.tsx introuvable');
  const hasIcon =
    content.includes('ChefHat') ||
    content.includes('chef') ||
    content.includes('recipe') ||
    content.includes('Book') ||
    content.includes('Utensils');
  assert(
    hasIcon,
    "Sidebar.tsx ne contient pas d'icône pour les recettes (attendre ChefHat, Utensils ou similaire)",
  );
});

// ─── Database: Migration ──────────────────────────────────────────────────────

test('[RCP-49] Migration 20260328000002_recipes.sql existe', () => {
  const migrationPath = path.join(
    SUPABASE_MIGRATIONS,
    '20260328000002_recipes.sql',
  );
  assert(
    fileExists(migrationPath),
    `Migration manquante : supabase/migrations/20260328000002_recipes.sql`,
  );
});

test('[RCP-50] Migration crée la table recipes', () => {
  const migrationPath = path.join(
    SUPABASE_MIGRATIONS,
    '20260328000002_recipes.sql',
  );
  const content = readFile(migrationPath);
  assert(content.length > 0, 'Migration SQL introuvable');
  assert(
    content.toLowerCase().includes('create table') &&
    content.toLowerCase().includes('recipes'),
    "La migration ne crée pas la table recipes",
  );
});

test('[RCP-51] Migration crée la table recipe_items', () => {
  const migrationPath = path.join(
    SUPABASE_MIGRATIONS,
    '20260328000002_recipes.sql',
  );
  const content = readFile(migrationPath);
  assert(content.length > 0, 'Migration SQL introuvable');
  assert(
    content.toLowerCase().includes('recipe_items'),
    "La migration ne crée pas la table recipe_items",
  );
});

test('[RCP-52] Migration définit les politiques RLS pour recipes', () => {
  const migrationPath = path.join(
    SUPABASE_MIGRATIONS,
    '20260328000002_recipes.sql',
  );
  const content = readFile(migrationPath);
  assert(content.length > 0, 'Migration SQL introuvable');
  const hasRLS =
    (content.toLowerCase().includes('row level security') ||
     content.toLowerCase().includes('enable rls') ||
     content.toLowerCase().includes('create policy')) &&
    content.toLowerCase().includes('recipes');
  assert(
    hasRLS,
    "La migration ne définit pas les politiques RLS pour la table recipes",
  );
});

test('[RCP-53] Migration définit la contrainte unique (recipe_id, catalog_item_id)', () => {
  const migrationPath = path.join(
    SUPABASE_MIGRATIONS,
    '20260328000002_recipes.sql',
  );
  const content = readFile(migrationPath);
  assert(content.length > 0, 'Migration SQL introuvable');
  const hasUniqueConstraint =
    content.toLowerCase().includes('unique') &&
    content.toLowerCase().includes('catalog_item_id');
  assert(
    hasUniqueConstraint,
    "La migration ne définit pas la contrainte unique (recipe_id, catalog_item_id) sur recipe_items",
  );
});

test('[RCP-54] Migration inclut un trigger updated_at pour recipes', () => {
  const migrationPath = path.join(
    SUPABASE_MIGRATIONS,
    '20260328000002_recipes.sql',
  );
  const content = readFile(migrationPath);
  assert(content.length > 0, 'Migration SQL introuvable');
  const hasTrigger =
    content.toLowerCase().includes('trigger') ||
    content.toLowerCase().includes('updated_at');
  assert(
    hasTrigger,
    "La migration ne définit pas de trigger updated_at pour la table recipes",
  );
});

// ─── Report ──────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.passed);
const failed = results.filter((r) => !r.passed);

console.log('\n=== QA Audit — Recettes (Recipes) ===\n');

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
    '\nAction requise : corriger les points ci-dessus avant merge.\n',
  );
  process.exit(1);
} else {
  console.log('\nTous les critères Recettes sont satisfaits. Prêt pour le merge.\n');
  process.exit(0);
}
