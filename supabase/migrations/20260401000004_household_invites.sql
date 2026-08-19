-- Point 3 (backend_mobile_ui) : invitation par code — table + RPC de jonction.

CREATE TABLE IF NOT EXISTS public.household_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

-- Lecture/écriture normales réservées aux membres du foyer concerné (génération du
-- code, consultation du code actif). Pas de policy UPDATE : la consommation d'un
-- code (marquer used_at) passe uniquement par join_household_by_code ci-dessous,
-- appelée par un utilisateur qui n'est justement pas encore membre du foyer.
CREATE POLICY "household_invites_select" ON public.household_invites FOR SELECT TO authenticated
  USING (household_id IN (SELECT public.get_my_households()));

CREATE POLICY "household_invites_insert" ON public.household_invites FOR INSERT TO authenticated
  WITH CHECK (household_id IN (SELECT public.get_my_households()));

-- Jonction atomique par code : SECURITY DEFINER (s'exécute avec les privilèges du
-- propriétaire de la fonction, qui contourne RLS comme record_purchase_atomic/
-- cancel_purchase_atomic le font déjà) car l'appelant n'est par définition pas
-- encore membre du foyer ciblé — la validité du code est elle-même l'autorisation.
-- `SELECT ... FOR UPDATE` verrouille la ligne d'invite le temps de la transaction
-- de la fonction : un second appel concurrent avec le même code attend, puis voit
-- used_at déjà renseigné et échoue proprement (pas de double consommation).
CREATE OR REPLACE FUNCTION public.join_household_by_code(p_code TEXT)
RETURNS TABLE (household_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_invite
  FROM public.household_invites
  WHERE code = p_code
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite code already used';
  END IF;

  IF v_invite.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Invite code expired';
  END IF;

  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_invite.household_id, v_user_id, 'member')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  UPDATE public.household_invites
    SET used_at = NOW(), used_by = v_user_id
  WHERE id = v_invite.id;

  RETURN QUERY SELECT v_invite.household_id;
END;
$$;
