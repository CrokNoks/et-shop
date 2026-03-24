-- Migration: Make owner_id optional in shopping_lists
-- Since lists now belong to a household, a single owner_id is no longer strictly required.

ALTER TABLE public.shopping_lists 
ALTER COLUMN owner_id DROP NOT NULL;
