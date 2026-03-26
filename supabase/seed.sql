-- supabase/seed.sql
-- Seed file to populate a default user for development

-- 1. Create the user in auth.users
-- Password "toto" hashed with bcrypt (Supabase default)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'd0b2f901-72f1-4f1d-910a-37e4663e0000',
  '00000000-0000-0000-0000-000000000000',
  'guerrier.lucas@gmail.com',
  crypt('toto', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Lucas Guerrier"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Ensure the identity is created (needed for some Supabase features)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'd0b2f901-72f1-4f1d-910a-37e4663e0000',
  'd0b2f901-72f1-4f1d-910a-37e4663e0000',
  format('{"sub":"%s","email":"%s"}', 'd0b2f901-72f1-4f1d-910a-37e4663e0000', 'guerrier.lucas@gmail.com')::jsonb,
  'email',
  'd0b2f901-72f1-4f1d-910a-37e4663e0000', -- provider_id is mandatory and equals user_id for email provider
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Note: The public.profiles entry will be automatically created by the trigger on_auth_user_created.
