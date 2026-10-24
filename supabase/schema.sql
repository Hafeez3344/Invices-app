-- Wasl Recipt App — Supabase schema
-- Run this in the Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  full_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  password_hash text not null,
  is_seed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  invoice_number text,
  -- Allowed: In Transit | Sent | Delivered | Failed | Cancelled
  status text default 'In Transit',
  payload jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: auto-delete invoices older than 5 days (run once in SQL editor)
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'purge-old-invoices',
--   '0 * * * *',
--   $$delete from public.invoices where created_at < now() - interval '5 days'$$
-- );

-- Seed admin (password: admin123)
insert into public.app_users (username, full_name, role, is_active, password_hash, is_seed)
values (
  'admin',
  'مسؤول النظام',
  'admin',
  true,
  '$2b$10$1TLo/UbIp4GY4leyuEEVPeGuSmw4ibpnaBse2v7bhS/.uu5r5AVD2',
  true
)
on conflict (username) do nothing;
