CREATE OR REPLACE VIEW public.v_spending_by_category AS
  SELECT
    pr.household_id,
    pr.category_id,
    c.name AS category_name,
    pr.store_id,
    DATE_TRUNC('month', pr.purchased_at) AS month,
    SUM(pr.price_per_unit * pr.quantity)  AS total_spent
  FROM public.purchase_records pr
  LEFT JOIN public.categories c ON c.id = pr.category_id
  WHERE pr.price_per_unit IS NOT NULL
  GROUP BY
    pr.household_id,
    pr.category_id,
    c.name,
    pr.store_id,
    DATE_TRUNC('month', pr.purchased_at);
