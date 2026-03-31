/**
 * QA Audit — Change Request: Fix SSR 500 sur /stores/[id]
 *
 * Ce fichier vérifie statiquement chaque critère d'acceptance défini dans
 * docs/fix_stores_ssr/Technical_Specification.md.
 *
 * Chaque test lit les fichiers du codebase cible (app_build/main/apps/web/src/)
 * et vérifie les conditions attendues.
 *
 * Exécution : node tests/audit_fix_stores_ssr_acceptance_criteria.test.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Root paths ───────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, "..");
const WEB_ROOT = path.join(REPO_ROOT, "apps", "web");
const SRC = path.join(WEB_ROOT, "src");

function srcPath(...segments) {
  return path.join(SRC, ...segments);
}

function webPath(...segments) {
  return path.join(WEB_ROOT, ...segments);
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

function readSrc(...segments) {
  return readFile(srcPath(...segments));
}

function readWeb(...segments) {
  return readFile(webPath(...segments));
}

// ─── Test Runner ──────────────────────────────────────────────────────────────

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, details: e instanceof Error ? e.message : String(e) });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// AC-01 : stores/[id]/page.tsx existe
test(
  "[AC-01] apps/web/src/app/stores/[id]/page.tsx existe",
  () => {
    const fp = srcPath("app", "stores", "[id]", "page.tsx");
    assert(fs.existsSync(fp), "apps/web/src/app/stores/[id]/page.tsx est manquant");
  }
);

// AC-02 : stores/[id]/page.tsx déclare export const dynamic = "force-dynamic"
test(
  '[AC-02] stores/[id]/page.tsx déclare export const dynamic = "force-dynamic"',
  () => {
    const content = readSrc("app", "stores", "[id]", "page.tsx");
    assert(content.length > 0, "stores/[id]/page.tsx introuvable ou vide");
    assert(
      content.includes('export const dynamic = "force-dynamic"') ||
        content.includes("export const dynamic = 'force-dynamic'"),
      'stores/[id]/page.tsx doit contenir : export const dynamic = "force-dynamic"'
    );
  }
);

// AC-03 : layout.tsx importe validateEnv (import présent)
test(
  "[AC-03] apps/web/src/app/layout.tsx importe validateEnv depuis @/lib/env",
  () => {
    const content = readSrc("app", "layout.tsx");
    assert(content.length > 0, "layout.tsx introuvable ou vide");
    assert(
      content.includes("validateEnv"),
      "layout.tsx ne contient pas validateEnv — l'import ou l'appel est manquant"
    );
  }
);

// AC-04 : validateEnv() est appelé à l'intérieur du composant RootLayout (pas au niveau module)
test(
  "[AC-04] validateEnv() est appelé à l'intérieur du composant RootLayout (pas au niveau module)",
  () => {
    const content = readSrc("app", "layout.tsx");
    assert(content.length > 0, "layout.tsx introuvable ou vide");

    // L'appel doit se trouver dans le corps de la fonction RootLayout
    // On vérifie que validateEnv() n'est pas appelé avant la déclaration de la fonction
    const functionDeclIndex = content.search(/export\s+default\s+function\s+RootLayout/);
    assert(
      functionDeclIndex !== -1,
      "layout.tsx ne déclare pas 'export default function RootLayout'"
    );

    const beforeFunction = content.slice(0, functionDeclIndex);
    assert(
      !beforeFunction.includes("validateEnv()"),
      "validateEnv() est appelé au niveau module (avant RootLayout) — doit être déplacé dans le composant"
    );

    const insideFunction = content.slice(functionDeclIndex);
    assert(
      insideFunction.includes("validateEnv()"),
      "validateEnv() n'est pas appelé à l'intérieur du composant RootLayout"
    );
  }
);

// AC-05 : layout.tsx n'est pas un Client Component (pas de "use client")
test(
  '[AC-05] layout.tsx ne contient pas "use client" (doit rester Server Component)',
  () => {
    const content = readSrc("app", "layout.tsx");
    assert(content.length > 0, "layout.tsx introuvable ou vide");
    assert(
      !content.includes('"use client"') && !content.includes("'use client'"),
      'layout.tsx contient "use client" — il doit rester un Server Component'
    );
  }
);

// AC-06 : src/lib/env.ts n'a pas été modifié (validateEnv() lève toujours une erreur)
test(
  "[AC-06] src/lib/env.ts est intact — validateEnv() lève une erreur si variable manquante",
  () => {
    const content = readSrc("lib", "env.ts");
    assert(content.length > 0, "src/lib/env.ts introuvable ou vide");
    assert(
      content.includes("validateEnv"),
      "env.ts ne contient plus validateEnv"
    );
    assert(
      content.includes("throw") || content.includes("Error("),
      "env.ts doit lancer une erreur si une variable est manquante"
    );
    assert(
      content.includes("NEXT_PUBLIC_SUPABASE_URL"),
      "env.ts doit valider NEXT_PUBLIC_SUPABASE_URL"
    );
    assert(
      content.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      "env.ts doit valider NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
);

// AC-07 : /historique/page.tsx a toujours force-dynamic (non-régression)
test(
  '[AC-07] /historique/page.tsx conserve export const dynamic = "force-dynamic" (non-régression)',
  () => {
    const content = readSrc("app", "historique", "page.tsx");
    assert(content.length > 0, "historique/page.tsx introuvable ou vide");
    assert(
      content.includes('export const dynamic = "force-dynamic"') ||
        content.includes("export const dynamic = 'force-dynamic'"),
      'historique/page.tsx a perdu son export const dynamic = "force-dynamic"'
    );
  }
);

// AC-08 : /statistiques/page.tsx a toujours force-dynamic (non-régression)
test(
  '[AC-08] /statistiques/page.tsx conserve export const dynamic = "force-dynamic" (non-régression)',
  () => {
    const content = readSrc("app", "statistiques", "page.tsx");
    assert(content.length > 0, "statistiques/page.tsx introuvable ou vide");
    assert(
      content.includes('export const dynamic = "force-dynamic"') ||
        content.includes("export const dynamic = 'force-dynamic'"),
      'statistiques/page.tsx a perdu son export const dynamic = "force-dynamic"'
    );
  }
);

// AC-09 : /stores/page.tsx conserve force-dynamic (non-régression)
test(
  '[AC-09] /stores/page.tsx conserve export const dynamic = "force-dynamic" (non-régression)',
  () => {
    const content = readSrc("app", "stores", "page.tsx");
    assert(content.length > 0, "stores/page.tsx introuvable ou vide");
    assert(
      content.includes('export const dynamic = "force-dynamic"') ||
        content.includes("export const dynamic = 'force-dynamic'"),
      'stores/page.tsx a perdu son export const dynamic = "force-dynamic"'
    );
  }
);

// AC-10 : next.config.mjs existe et n'a pas ignoreBuildErrors: true
test(
  "[AC-10] next.config.mjs ne contient pas ignoreBuildErrors: true",
  () => {
    const content = readWeb("next.config.mjs");
    assert(content.length > 0, "next.config.mjs introuvable");
    assert(
      !content.includes("ignoreBuildErrors: true"),
      "next.config.mjs contient encore ignoreBuildErrors: true"
    );
  }
);

// ─── Report ───────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.passed);
const failed = results.filter((r) => !r.passed);

console.log("\n=== QA Audit — Fix SSR 500 sur /stores/[id] ===\n");

for (const r of results) {
  const icon = r.passed ? "✓" : "✗";
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
    "\nAction requise : l'agent Engineer doit corriger les points ci-dessus.\n"
  );
  process.exit(1);
} else {
  console.log("\nTous les critères d'acceptance sont satisfaits. Prêt pour la revue finale.\n");
  process.exit(0);
}
