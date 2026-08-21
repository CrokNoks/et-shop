# Points d'attention — Foyers & Authentification

## Comportements non-évidents

### `active_household_id` dans `localStorage` — pas dans la session

L'ID du foyer actif n'est pas stocké dans le JWT ni dans un cookie — il est dans `localStorage`. Cela signifie :
- Il est perdu à la fermeture du navigateur si l'utilisateur vide son storage
- Il n'est pas transmis automatiquement par le middleware SSR — le frontend doit l'envoyer explicitement dans le header `x-household-id`
- Si le foyer est supprimé ou l'utilisateur en est retiré, `localStorage` contient toujours l'ancien ID jusqu'à la prochaine erreur 400/403 (qui déclenche un `router.push("/household/setup")`)

### Sélection automatique du premier foyer

Après login, si l'utilisateur a plusieurs foyers, c'est **toujours le premier** (`households[0]`) qui est sélectionné. Il n'y a pas de mémorisation du dernier foyer actif ni de sélecteur de foyer dans l'UI. Un utilisateur multi-foyers devra adapter manuellement son `localStorage`.

### Pas de protection du dernier admin

Le service permet à un admin de se supprimer lui-même du foyer (via `DELETE /households/:id/members/:userId`). Si c'est le seul admin, le foyer se retrouve sans administrateur. Il n'y a pas de guard contre cette situation.

### Invitation nécessite un compte existant

`addMember` cherche l'utilisateur par email dans la table `profiles`. Si l'utilisateur n'a jamais créé de compte sur Et-Shop, la recherche échoue avec une `NotFoundException`. Il n'y a pas de flow d'invitation/onboarding par email — en revanche, un flow par **code** existe pour ce cas précis (voir ci-dessous).

### Inscription publique fermée : code d'invitation obligatoire

L'app est à usage personnel/familial (`SPEC.md`), pas ouverte à un signup public. `supabase.auth.signUp` exige un code `household_invites` valide, passé dans `raw_user_meta_data.invite_code` (`apps/web/src/app/login/page.tsx`, `handleSignUp`) : sans code, ou avec un code invalide/expiré/déjà utilisé, le trigger `handle_new_user` (`supabase/migrations/20260402000002_signup_invite_gate.sql`) fait échouer la création du compte — la ligne `auth.users` elle-même n'est jamais créée, donc rien à nettoyer après coup. Le même code rattache aussi automatiquement le nouveau compte au foyer qui l'a généré (même table/génération que `POST /households/:id/invite-code`, réutilisée telle quelle).

Une RPC `check_signup_invite_code` (lecture seule, callable en `anon`) fait la pré-vérification côté client pour un message d'erreur précis avant l'appel à `signUp` — mais c'est le trigger qui fait foi (verrou `FOR UPDATE`, anti-race, comme `join_household_by_code`).

Échappatoire pour les comptes créés hors du formulaire public (seed SQL, future Admin API) : positionner `raw_app_meta_data.bootstrap_account = true` contourne le garde-fou. Sûr par construction — `signUp()` public n'écrit jamais dans `raw_app_meta_data`, seulement dans `raw_user_meta_data`. `supabase/seed.sql` utilise déjà ce drapeau pour le compte de dev local.

---

## Limitations connues

- **Pas de déconnexion des autres onglets** : si l'utilisateur se déconnecte dans un onglet, les autres onglets restent actifs jusqu'à l'expiration du JWT
- **Pas de "se souvenir de moi"** : la durée de session est celle configurée dans Supabase (défaut 1 semaine) — non configurable depuis l'application
- **Profils non mis à jour** : `full_name` et `avatar_url` dans `profiles` sont créés lors de l'inscription mais il n'y a pas de page de profil pour les modifier

---

## Risques opérationnels

### RLS dépend de `household_members`

Toutes les politiques RLS de l'application vérifient `household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())`. Si cette table est corrompue ou si un utilisateur est retiré d'un foyer, il perd immédiatement accès à toutes les données du foyer — listes, catalogue, recettes, historique.

### Trigger `handle_new_household_membership` — point de fragilité

Si ce trigger échoue (erreur SQL, contrainte), le foyer est créé mais l'utilisateur n'est pas ajouté comme admin. Il ne pourra alors plus accéder à son propre foyer. La migration `20260328000000_fix_household_trigger.sql` a déjà corrigé une version défaillante de ce trigger.

### Trigger `handle_new_user` — point de fragilité critique (depuis le garde-fou d'inscription)

Ce trigger (`AFTER INSERT ON auth.users`) conditionne maintenant la création de **tout** compte, pas seulement son profil : une régression ici (erreur SQL, contrainte) casse l'inscription pour tout le monde, y compris les inscriptions avec un code valide. Il fait aussi échouer tout insert direct dans `auth.users` qui ne fournit ni `raw_user_meta_data.invite_code` ni `raw_app_meta_data.bootstrap_account` — ce qui inclut un futur seed/script écrit sans ce drapeau. À tester manuellement (code valide/absent/invalide/expiré/déjà utilisé) après toute modification de ce trigger, avant déploiement.
