# Points d'attention — Bonnes pratiques Next.js

## Comportements non-évidents

### `validateEnv()` s'exécute côté serveur uniquement

`validateEnv()` est appelé dans `layout.tsx` qui est un Server Component. Il ne s'exécute **pas** dans le browser. Si les variables sont manquantes en production, l'erreur apparaîtra dans les logs serveur (et Next.js renverra une 500), pas dans la console du navigateur.

### Le singleton Supabase est browser-only

`getSupabaseBrowserClient()` crée une instance unique persistée en mémoire du processus Node. Cela est sûr en browser (une instance par onglet). **Ne pas appeler cette fonction depuis un Server Component** — utiliser `src/lib/supabase/server.ts` à la place (qui crée une nouvelle instance par requête, comme requis par le modèle SSR).

### `"use client"` encore présent sur les pages principales

Les pages `/historique`, `/statistiques`, `/stores`, etc. restent des Client Components. Cette feature n'a pas converti les pages applicatives — uniquement le layout racine. Ajouter de nouvelles pages en Server Components reste possible mais nécessite de déplacer tout état et hook React dans des sous-composants client.

---

## Limitations connues

- Les pages `historique` et `statistiques` (ajoutées par la feature `historique_stats`) n'ont **pas** bénéficié du remplacement des couleurs hex par les variables CSS — elles utilisent encore `#1A365D` et `#FF6B35` en dur

---

## Risques opérationnels

### Suppression de `typescript.ignoreBuildErrors: true`

Le flag a été retiré. Toute erreur TypeScript dans `apps/web/` fait désormais échouer `next build`. Si de nouvelles erreurs TS apparaissent (dépendances, types manquants), le build CI bloquera. **Vérifier `pnpm build` avant tout merge** touchant le frontend.

### `next.config.ts` supprimé

Si un outil ou un script référence explicitement `next.config.ts`, il faudra le mettre à jour pour pointer sur `next.config.mjs`.
