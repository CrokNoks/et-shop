-- Sécurité (contre-revue backend_mobile_ui) : household_invites n'avait que des
-- policies SELECT/INSERT, aucune DELETE. Le nettoyage des anciens codes fait par
-- createInviteCode() (households.service.ts) s'exécute avec le JWT de l'utilisateur
-- (rôle authenticated), donc RLS le filtrait silencieusement à 0 ligne, sans erreur :
-- "un seul code actif à la fois" n'était pas appliqué, et régénérer un code ne
-- révoquait jamais le précédent (un code fuité restait valide jusqu'à 48h même après
-- régénération). Admin uniquement, cohérent avec la génération (household_invites_insert
-- implicite via createInviteCode, déjà admin-only côté service).
CREATE POLICY "household_invites_delete" ON public.household_invites FOR DELETE TO authenticated
  USING (
    household_id IN (SELECT public.get_my_households())
    AND EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_invites.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'admin'
    )
  );
