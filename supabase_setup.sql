-- ========================================================
-- Script d'initialisation pour Supabase (RunPlanner Pro)
-- À coller dans l'onglet 'SQL Editor' de votre projet Supabase
-- ========================================================

-- 1. Création de la table pour stocker le plan d'entraînement partagé
create table if not exists public.training_plans (
  id text primary key default 'default',
  weeks jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Activation de la sécurité (Row Level Security) avec accès en lecture/écriture
alter table public.training_plans enable row level security;

drop policy if exists "Accès public complet aux plans" on public.training_plans;
create policy "Accès public complet aux plans"
  on public.training_plans
  for all
  using (true)
  with check (true);

-- 3. Activation du temps réel (Supabase Realtime) sur la table
alter publication supabase_realtime add table public.training_plans;
