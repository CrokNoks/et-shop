-- Fix: household creation failing when using service role key
-- Root cause: auth.uid() returns NULL with service key, causing BEFORE trigger to set
-- owner_id = NULL, which then causes the AFTER trigger to fail with a NOT NULL violation
-- on household_members.user_id (part of PK).
--
-- Fix strategy:
-- 1. BEFORE trigger: only set owner_id if not already provided
-- 2. AFTER trigger: guard against NULL owner_id to avoid crashing the transaction

CREATE OR REPLACE FUNCTION public.handle_new_household()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set owner from JWT if not explicitly provided (e.g. from service role)
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_household_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add creator as member if owner_id is known
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
