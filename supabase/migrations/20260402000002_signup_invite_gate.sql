-- Garde-fou d'inscription : un compte ne peut être créé qu'avec un code
-- household_invites valide, qui rattache aussi automatiquement le nouveau
-- compte au foyer de la personne qui a généré le code (cf. point en suspens
-- docs/backend_mobile_ui/Technical_Specification.md, "écran de saisie du
-- code à l'inscription").

-- Pré-vérification anonyme, lecture seule, pour l'UX du formulaire
-- d'inscription : ne marque jamais le code comme utilisé (la consommation
-- réelle et atomique a lieu dans handle_new_user ci-dessous). Callable par
-- le rôle anon car aucune session n'existe encore à ce stade.
CREATE OR REPLACE FUNCTION public.check_signup_invite_code(p_code TEXT)
RETURNS TABLE (household_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT hi.*, h.name AS h_name INTO v_invite
  FROM public.household_invites hi
  JOIN public.households h ON h.id = hi.household_id
  WHERE hi.code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code d''invitation invalide';
  END IF;
  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Ce code a déjà été utilisé';
  END IF;
  IF v_invite.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Ce code a expiré';
  END IF;

  RETURN QUERY SELECT v_invite.h_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_signup_invite_code(TEXT) TO anon, authenticated;

-- Extension du trigger de création de compte (remplace la fonction définie
-- dans 20260323000000_automatic_profiles.sql, le trigger on_auth_user_created
-- n'a pas besoin de changer) : exige un code household_invites valide dans
-- raw_user_meta_data.invite_code et le consomme dans la même transaction que
-- la création du compte. Un RAISE EXCEPTION ici fait échouer tout l'INSERT
-- sur auth.users : un code absent/invalide/expiré/déjà utilisé empêche
-- l'existence même du compte, pas seulement son utilisation.
--
-- Tout reste dans une seule fonction (plutôt qu'un second trigger AFTER
-- INSERT ON auth.users) pour contrôler l'ordre des opérations nous-mêmes :
-- l'insert dans profiles doit précéder la mise à jour de used_by, qui
-- référence profiles(id).
--
-- SELECT ... FOR UPDATE verrouille la ligne d'invite le temps de la
-- transaction, comme le fait déjà join_household_by_code, pour empêcher la
-- double consommation concurrente du même code.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code TEXT := new.raw_user_meta_data ->> 'invite_code';
  v_invite RECORD;
BEGIN
  -- Échappatoire réservée aux comptes créés hors du flux d'inscription
  -- public (seed SQL direct comme supabase/seed.sql, ou une future Admin
  -- API avec la clé service_role) : seul un accès déjà privilégié au projet
  -- Supabase peut positionner raw_app_meta_data. Un appel signUp() public
  -- n'écrit jamais que dans raw_user_meta_data, donc ce drapeau ne peut pas
  -- être forgé depuis le formulaire d'inscription.
  IF NOT (new.raw_app_meta_data ? 'bootstrap_account') THEN
    IF v_code IS NULL OR v_code = '' THEN
      RAISE EXCEPTION 'Un code d''invitation est requis pour créer un compte';
    END IF;

    SELECT * INTO v_invite
    FROM public.household_invites
    WHERE code = v_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Code d''invitation invalide';
    END IF;
    IF v_invite.used_at IS NOT NULL THEN
      RAISE EXCEPTION 'Ce code a déjà été utilisé';
    END IF;
    IF v_invite.expires_at <= NOW() THEN
      RAISE EXCEPTION 'Ce code a expiré';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  IF v_invite IS NOT NULL THEN
    UPDATE public.household_invites
      SET used_at = NOW(), used_by = new.id
    WHERE id = v_invite.id;

    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (v_invite.household_id, new.id, 'member')
    ON CONFLICT (household_id, user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
