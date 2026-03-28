-- Add name and description fields to loyalty_cards
ALTER TABLE public.loyalty_cards
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT;
