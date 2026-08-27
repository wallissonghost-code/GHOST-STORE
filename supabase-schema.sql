-- GHOST STORE — esquema inicial Supabase
-- Execute no SQL Editor do projeto antes de preencher config.js.

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  type text not null,
  badge text default '',
  price numeric(10,2) not null default 0,
  icon text default 'BOX',
  description text not null default '',
  meta jsonb not null default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  color text default '#d8ff3f',
  published boolean not null default true,
  file_path text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
on public.products for select
to anon, authenticated
using (published = true);

-- IMPORTANTE: não crie policy pública de INSERT/UPDATE/DELETE.
-- Escritas administrativas devem ser feitas por usuário autenticado com regra própria
-- ou por backend seguro/service role. A chave service_role nunca deve ir no navegador.

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do update set public = false;

-- Nenhuma policy pública de leitura é criada no bucket.
-- Downloads pagos devem ser entregues por URL assinada após confirmação do pedido.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();
