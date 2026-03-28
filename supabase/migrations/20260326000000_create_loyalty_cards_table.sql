-- 20260326000000_create_loyalty_cards_table.sql

-- Create loyalty_cards table
CREATE TABLE public.loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    card_data TEXT NOT NULL,
    barcode_format TEXT NOT NULL,
    custom_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX ON public.loyalty_cards (user_id);
CREATE INDEX ON public.loyalty_cards (store_id);

-- Enable Row Level Security
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view their own loyalty cards
CREATE POLICY "Users can view their own loyalty cards." ON public.loyalty_cards
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT: Users can create their own loyalty cards
CREATE POLICY "Users can create their own loyalty cards." ON public.loyalty_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own loyalty cards
CREATE POLICY "Users can update their own loyalty cards." ON public.loyalty_cards
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own loyalty cards
CREATE POLICY "Users can delete their own loyalty cards." ON public.loyalty_cards
    FOR DELETE USING (auth.uid() = user_id);
