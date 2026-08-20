-- Sécurité critique (revue backend_mobile_ui, documentée dans decisions.md) :
-- "members_manage_self" (20260325000000_fix_recursive_policy.sql) était FOR ALL
-- USING/WITH CHECK (user_id = auth.uid()) sur household_members. Comme la ligne
-- insérée n'a besoin de satisfaire QUE "user_id = auth.uid()", n'importe quel
-- utilisateur authentifié pouvait s'auto-INSERT dans n'importe quel household_id
-- de son choix en appelant directement l'API Supabase (hors du contrôleur NestJS,
-- donc hors de toute vérification applicative), rejoignant ainsi n'importe quel
-- foyer sans invitation par email ni par code. Ça rendait tout le contrôle
-- d'accès construit dans backend_mobile_ui (point 3) cosmétique pour un appel
-- direct à l'API.
--
-- Remédiation vérifiée sûre : la seule opération légitime que "user_id =
-- auth.uid()" doit couvrir est qu'un membre quitte lui-même un foyer (DELETE) —
-- aucune fonctionnalité "quitter un foyer" n'existe encore côté app, mais rien
-- ne doit en dépendre pour un INSERT/UPDATE. Les deux chemins d'ajout légitimes
-- (création de foyer via handle_new_household_membership, jonction par code via
-- join_household_by_code) sont tous deux SECURITY DEFINER et ne passent donc
-- jamais par cette policy — leur retirer la capacité d'INSERT ne les affecte pas.
-- L'ajout par un admin (addMember, households.service.ts) insère la ligne d'un
-- AUTRE utilisateur (user_id ≠ auth.uid()) : il ne s'est jamais appuyé sur
-- "members_manage_self" mais sur "admins_manage_members", inchangée ici.
DROP POLICY IF EXISTS "members_manage_self" ON public.household_members;

CREATE POLICY "members_leave_self" ON public.household_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
