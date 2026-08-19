# Décisions techniques — Adaptation backend refonte mobile

## Invitation par code réservée aux admins

`POST /households/:id/invite-code` exige le rôle `admin`, aligné sur `addMember` (invitation par email, déjà admin-only) — un seul modèle de permission entre les deux façons d'inviter plutôt que d'ouvrir la génération de code à tout membre.

## Auteur de la coche : résolu côté front, pas d'embed `profiles(full_name)`

`GET /shopping-lists` expose `purchased_by` (un `user_id`) mais ne l'embed pas avec le profil correspondant. Le nom est résolu côté frontend (`ShoppingList.tsx`) depuis la liste des membres du foyer déjà chargée par la page (`useHouseholdMembers`), sans appel réseau supplémentaire. Dégradation propre : si l'auteur n'est plus dans la liste des membres actuels (parti du foyer entre-temps), l'affichage retombe sur « Coché · {ancienneté} » sans nom, jamais une erreur.

## `POST /households/join` existe côté API, aucun écran ne le consomme

Le endpoint est fonctionnel et testé, mais aucune UI ne permet de saisir un code reçu pour rejoindre un foyer — un code peut être généré et partagé, personne ne peut encore le saisir. Construire cet écran est un ajout de scope (nouveau flux de navigation, vraisemblablement dans l'onboarding/connexion — où un utilisateur sans foyer choisirait entre « créer un foyer » et « rejoindre avec un code ») plutôt qu'une correction de bug de ce Change Request. Signalé, non traité ici — à cadrer séparément si retenu.

## Deux vulnérabilités de sécurité découvertes en revue, préexistantes à ce Change Request

**Corrigée dans ce cycle** (la fonction concernée était déjà réécrite par ce CR pour `purchased_by`) : `record_purchase_atomic` vérifiait que l'appelant est membre de `p_household_id`, mais jamais que l'item à marquer acheté appartient à une liste de ce foyer. Fonction `SECURITY DEFINER` (contourne RLS) exécutable par `PUBLIC` via PostgREST — un membre légitime d'un foyer aurait pu marquer acheté un item d'un *autre* foyer en fournissant son propre `household_id` avec l'id d'un item étranger. Corrigé (`20260401000007_rpc_record_purchase_atomic_scope_household.sql`) en scopant l'`UPDATE` à un item dont la liste appartient réellement au `household_id` fourni, avec `RAISE EXCEPTION` si aucune ligne n'est affectée.

**Non corrigée, hors périmètre de ce Change Request, à traiter séparément** : la policy `members_manage_self` sur `public.household_members` (posée par `20260325000000_fix_recursive_policy.sql`, `FOR ALL USING/WITH CHECK (user_id = auth.uid())`) permet à **n'importe quel utilisateur authentifié de s'auto-insérer dans n'importe quel foyer** en appelant directement PostgREST (`POST /household_members` via l'API Supabase, en dehors du contrôleur NestJS), sans passer par une invitation par email ou par code. Ça rend le contrôle d'accès construit dans ce cycle (invitation par code) cosmétique du strict point de vue sécurité — l'app ne l'exploite pas (elle passe toujours par les endpoints NestJS), mais un appel direct à l'API Supabase le peut. Corriger nécessite de restreindre cette policy (probablement au seul `DELETE` — quitter un foyer — en retirant la possibilité d'`INSERT` arbitraire) après avoir vérifié qu'aucun flux légitime existant ne dépend d'un `INSERT` direct via cette policy (ex. le trigger de création de foyer, à vérifier s'il est bien `SECURITY DEFINER` et n'a donc pas besoin de cette policy pour fonctionner). Recommandé comme priorité de sécurité séparée, indépendante de ce cycle.
