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

`addMember` cherche l'utilisateur par email dans la table `profiles`. Si l'utilisateur n'a jamais créé de compte sur Et-Shop, la recherche échoue avec une `NotFoundException`. Il n'y a pas de flow d'invitation/onboarding.

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
