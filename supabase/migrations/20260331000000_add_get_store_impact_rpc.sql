CREATE OR REPLACE FUNCTION get_store_impact(p_store_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'loyalty_cards_count', COUNT(*),
    'affected_users', COUNT(DISTINCT user_id)
  )
  FROM public.loyalty_cards
  WHERE store_id = p_store_id;
$$;
