create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price_mxn numeric(12, 2) not null default 0,
  hashtags text[] not null default '{}',
  image_url text not null,
  storage_path text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "public can read products" on public.products;
create policy "public can read products"
  on public.products for select
  using (true);

drop policy if exists "public can insert products" on public.products;
create policy "public can insert products"
  on public.products for insert
  with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read product images" on storage.objects;
create policy "public can read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "public can upload product images" on storage.objects;
create policy "public can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');
