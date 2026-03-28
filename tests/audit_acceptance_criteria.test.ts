/**
 * QA Audit — Change Request: Bonnes pratiques Next.js
 *
 * Ce fichier vérifie statiquement chaque critère d'acceptance défini dans
 * production_artifacts/Technical_Specification.md.
 *
 * Exécution : ts-node tests/audit_acceptance_criteria.test.ts
 * (ou via le runner de tests du projet si configuré)
 *
 * Chaque test lit les fichiers du codebase cible (app_build/main/apps/web/src/)
 * et vérifie les conditions attendues.
 */

import * as fs from "fs";
import * as path from "path";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEB_ROOT = path.resolve(
  __dirname,
  "../../main/apps/web"
);
const SRC = path.join(WEB_ROOT, "src");

function filePath(...segments: string[]): string {
  return path.join(SRC, ...segments);
}

function webFilePath(...segments: string[]): string {
  return path.join(WEB_ROOT, ...segments);
}

function fileExists(...segments: string[]): boolean {
  return fs.existsSync(filePath(...segments));
}

function webFileExists(...segments: string[]): boolean {
  return fs.existsSync(webFilePath(...segments));
}

function readFile(...segments: string[]): string {
  const fp = filePath(...segments);
  if (!fs.existsSync(fp)) return "";
  return fs.readFileSync(fp, "utf-8");
}

function readWebFile(...segments: string[]): string {
  const fp = webFilePath(...segments);
  if (!fs.existsSync(fp)) return "";
  return fs.readFileSync(fp, "utf-8");
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

// ─── Tests ───────────────────────────────────────────────────────────────────

// 1. layout.tsx ne contient plus "use client"
test(
  '[AC-01] src/app/layout.tsx ne contient pas "use client"',
  () => {
    const content = readFile("app", "layout.tsx");
    assert(content.length > 0, "layout.tsx introuvable");
    assert(
      !content.includes('"use client"') && !content.includes("'use client'"),
      'layout.tsx contient encore "use client" — il doit être un Server Component'
    );
  }
);

// 2. src/app/error.tsx existe et affiche un message + bouton reset
test(
  "[AC-02] src/app/error.tsx existe avec bouton reset",
  () => {
    assert(
      fileExists("app", "error.tsx"),
      "src/app/error.tsx est manquant"
    );
    const content = readFile("app", "error.tsx");
    assert(
      content.includes('"use client"') || content.includes("'use client'"),
      'error.tsx doit être un Client Component ("use client")'
    );
    assert(
      content.includes("reset"),
      "error.tsx doit exposer le prop reset (bouton de retry)"
    );
    assert(
      content.includes("error"),
      "error.tsx doit exposer le prop error (message d'erreur)"
    );
  }
);

// 3. src/app/loading.tsx existe et affiche un skeleton
test(
  "[AC-03] src/app/loading.tsx existe avec skeleton",
  () => {
    assert(
      fileExists("app", "loading.tsx"),
      "src/app/loading.tsx est manquant"
    );
    const content = readFile("app", "loading.tsx");
    // Doit exporter un composant par défaut
    assert(
      content.includes("export default"),
      "loading.tsx doit avoir un export default"
    );
    // Un skeleton peut utiliser des divs animées ou le mot "skeleton"
    const hasSkeleton =
      content.toLowerCase().includes("skeleton") ||
      content.includes("animate-pulse") ||
      content.includes("animate-spin");
    assert(hasSkeleton, "loading.tsx devrait afficher un skeleton (animate-pulse, animate-spin ou 'skeleton')");
  }
);

// 4. src/app/stores/loading.tsx existe
test(
  "[AC-04] src/app/stores/loading.tsx existe",
  () => {
    assert(
      fileExists("app", "stores", "loading.tsx"),
      "src/app/stores/loading.tsx est manquant"
    );
  }
);

// 5. src/app/stores/error.tsx existe
test(
  "[AC-05] src/app/stores/error.tsx existe",
  () => {
    assert(
      fileExists("app", "stores", "error.tsx"),
      "src/app/stores/error.tsx est manquant"
    );
  }
);

// 6. src/app/loyalty-cards/loading.tsx existe
test(
  "[AC-06] src/app/loyalty-cards/loading.tsx existe",
  () => {
    assert(
      fileExists("app", "loyalty-cards", "loading.tsx"),
      "src/app/loyalty-cards/loading.tsx est manquant"
    );
  }
);

// 7. src/app/loyalty-cards/error.tsx existe
test(
  "[AC-07] src/app/loyalty-cards/error.tsx existe",
  () => {
    assert(
      fileExists("app", "loyalty-cards", "error.tsx"),
      "src/app/loyalty-cards/error.tsx est manquant"
    );
  }
);

// 8. globals.css contient --color-brand et --color-accent
test(
  "[AC-08] src/app/globals.css contient --color-brand et --color-accent",
  () => {
    const content = readFile("app", "globals.css");
    assert(content.length > 0, "globals.css introuvable");
    assert(
      content.includes("--color-brand"),
      "globals.css ne contient pas --color-brand (#1A365D)"
    );
    assert(
      content.includes("--color-accent"),
      "globals.css ne contient pas --color-accent (#FF6B35)"
    );
  }
);

// 9. Aucune occurrence de #1A365D dans les fichiers .tsx modifiés
test(
  "[AC-09] Aucune occurrence de #1A365D dans les fichiers .tsx ciblés",
  () => {
    const targets = [
      filePath("components", "shopping", "ShoppingList.tsx"),
      filePath("components", "layout", "Sidebar.tsx"),
      filePath("components", "layout", "SidebarContent.tsx"),
      filePath("app", "login", "page.tsx"),
    ];

    const violations: string[] = [];
    for (const fp of targets) {
      if (!fs.existsSync(fp)) continue;
      const content = fs.readFileSync(fp, "utf-8");
      if (content.includes("#1A365D")) {
        violations.push(path.relative(SRC, fp));
      }
    }
    assert(
      violations.length === 0,
      `Couleur hardcodée #1A365D encore présente dans : ${violations.join(", ")}`
    );
  }
);

// 10. Aucune occurrence de #FF6B35 dans les fichiers .tsx modifiés
test(
  "[AC-10] Aucune occurrence de #FF6B35 dans les fichiers .tsx ciblés",
  () => {
    const targets = [
      filePath("components", "shopping", "ShoppingList.tsx"),
      filePath("components", "layout", "Sidebar.tsx"),
      filePath("components", "layout", "SidebarContent.tsx"),
      filePath("app", "login", "page.tsx"),
    ];

    const violations: string[] = [];
    for (const fp of targets) {
      if (!fs.existsSync(fp)) continue;
      const content = fs.readFileSync(fp, "utf-8");
      if (content.includes("#FF6B35")) {
        violations.push(path.relative(SRC, fp));
      }
    }
    assert(
      violations.length === 0,
      `Couleur hardcodée #FF6B35 encore présente dans : ${violations.join(", ")}`
    );
  }
);

// 11. src/lib/supabase/client.ts existe avec le pattern singleton
test(
  "[AC-11] src/lib/supabase/client.ts existe avec pattern singleton",
  () => {
    assert(
      fileExists("lib", "supabase", "client.ts"),
      "src/lib/supabase/client.ts est manquant"
    );
    const content = readFile("lib", "supabase", "client.ts");
    // Le pattern singleton initialise une variable `let client` réutilisée
    const hasSingleton =
      content.includes("let client") ||
      content.includes("let _client") ||
      (content.includes("if (") && content.includes("client"));
    assert(
      hasSingleton,
      "client.ts ne semble pas implémenter le pattern singleton (variable partagée + guard)"
    );
    assert(
      content.includes("createBrowserClient"),
      "client.ts devrait utiliser createBrowserClient de @supabase/ssr"
    );
  }
);

// 12. src/lib/supabase/server.ts existe
test(
  "[AC-12] src/lib/supabase/server.ts existe",
  () => {
    assert(
      fileExists("lib", "supabase", "server.ts"),
      "src/lib/supabase/server.ts est manquant"
    );
  }
);

// 13. src/lib/env.ts existe et lève une erreur si variable manquante
test(
  "[AC-13] src/lib/env.ts existe avec validateEnv() qui lève une erreur",
  () => {
    assert(
      fileExists("lib", "env.ts"),
      "src/lib/env.ts est manquant"
    );
    const content = readFile("lib", "env.ts");
    assert(
      content.includes("validateEnv") || content.includes("validate"),
      "env.ts doit exposer une fonction de validation (validateEnv)"
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

// 14. src/lib/api.ts utilise getSupabaseBrowserClient() et env.API_URL
test(
  "[AC-14] src/lib/api.ts utilise getSupabaseBrowserClient() et env.API_URL",
  () => {
    const content = readFile("lib", "api.ts");
    assert(content.length > 0, "api.ts introuvable");
    assert(
      content.includes("getSupabaseBrowserClient"),
      "api.ts doit utiliser getSupabaseBrowserClient() (singleton Supabase)"
    );
    assert(
      content.includes("env.API_URL") || content.includes("env"),
      "api.ts doit utiliser env.API_URL depuis src/lib/env.ts"
    );
    // Ne doit plus créer un client inline
    assert(
      !content.includes("createBrowserClient"),
      "api.ts ne devrait plus appeler createBrowserClient directement (utiliser le singleton)"
    );
  }
);

// 15. src/app/login/page.tsx utilise getSupabaseBrowserClient()
test(
  "[AC-15] src/app/login/page.tsx utilise getSupabaseBrowserClient()",
  () => {
    const content = readFile("app", "login", "page.tsx");
    assert(content.length > 0, "login/page.tsx introuvable");
    assert(
      content.includes("getSupabaseBrowserClient"),
      "login/page.tsx doit utiliser getSupabaseBrowserClient() (singleton Supabase)"
    );
    assert(
      !content.includes("createBrowserClient"),
      "login/page.tsx ne devrait plus appeler createBrowserClient directement"
    );
  }
);

// 16. next.config.ts supprimé
test(
  "[AC-16] next.config.ts est supprimé (doublon)",
  () => {
    assert(
      !webFileExists("next.config.ts"),
      "next.config.ts existe encore — il doit être supprimé (doublon de next.config.mjs)"
    );
  }
);

// 17. next.config.mjs sans typescript.ignoreBuildErrors: true
test(
  "[AC-17] next.config.mjs n'a plus typescript.ignoreBuildErrors: true",
  () => {
    const content = readWebFile("next.config.mjs");
    assert(content.length > 0, "next.config.mjs introuvable");
    assert(
      !content.includes("ignoreBuildErrors: true"),
      "next.config.mjs contient encore ignoreBuildErrors: true — doit être false ou absent"
    );
  }
);

// 18. layout.tsx utilise validateEnv() (bonus — selon la spec)
test(
  "[AC-18] src/app/layout.tsx appelle validateEnv()",
  () => {
    const content = readFile("app", "layout.tsx");
    assert(content.length > 0, "layout.tsx introuvable");
    assert(
      content.includes("validateEnv"),
      "layout.tsx devrait appeler validateEnv() au démarrage du serveur"
    );
  }
);

// 19. hooks/useSupabase.ts utilise le singleton (pas de createBrowserClient inline)
test(
  "[AC-19] src/hooks/useSupabase.ts utilise le singleton Supabase",
  () => {
    const content = readFile("hooks", "useSupabase.ts");
    assert(content.length > 0, "useSupabase.ts introuvable");
    assert(
      content.includes("getSupabaseBrowserClient"),
      "useSupabase.ts doit déléguer à getSupabaseBrowserClient() du singleton"
    );
    assert(
      !content.includes("createBrowserClient"),
      "useSupabase.ts ne devrait plus appeler createBrowserClient directement"
    );
  }
);

// ─── Report ──────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.passed);
const failed = results.filter((r) => !r.passed);

console.log("\n=== QA Audit — Bonnes pratiques Next.js ===\n");

for (const r of results) {
  const icon = r.passed ? "✓" : "✗";
  console.log(`  ${icon}  ${r.name}`);
  if (!r.passed && r.details) {
    console.log(`       → ${r.details}`);
  }
}

console.log(`\n─── Résultat : ${passed.length}/${results.length} tests passés ───`);

if (failed.length > 0) {
  console.log(`\nCritères non satisfaits (${failed.length}) :`);
  for (const r of failed) {
    console.log(`  • ${r.name}`);
    if (r.details) console.log(`    ${r.details}`);
  }
  console.log(
    "\nAction requise : l'agent Engineer doit corriger les points ci-dessus avant le build final.\n"
  );
  process.exit(1);
} else {
  console.log("\nTous les critères d'acceptance sont satisfaits. Prêt pour le build.\n");
  process.exit(0);
}
