-- Migration: Fix Schema Cache and missing columns
-- This migration ensures the database matches the code expectations

-- 1. Add missing columns to items_catalog
ALTER TABLE public.items_catalog 
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs';

-- 2. Add missing columns to shopping_list_items
ALTER TABLE public.shopping_list_items
ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES public.items_catalog(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 3. Update unique constraint for items_catalog if needed
-- (Already handled in previous migration for name/store_id)

-- 4. Refresh PostgREST cache (Supabase does this automatically usually, but good to have columns here)
