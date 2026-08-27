-- GHOST STORE — esquema Supabase seguro
-- Produtos públicos podem ser lidos por qualquer visitante somente quando published=true.
-- Criação/edição/exclusão de produtos e arquivos exige usuário autenticado presente em store_admins.

create table if not exists public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.store_admins enable row level security;

drop policy if exists "Admins can read own membership" on public.store_admins;
create policy "Admins can read own membership"
on public.store_admins for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  type text not null,
  badge text default '',
  price numeric(10,2) not null default 0 check (price >= 0),
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

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.store_admins to authenticated;

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
on public.products for select
to anon, authenticated
using (
  published = true
  or exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products for insert
to authenticated
with check (
  exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products for update
to authenticated
using (
  exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products for delete
to authenticated
using (
  exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do update set public = false;

-- Bucket privado: somente administradores autenticados podem gerenciar arquivos.
drop policy if exists "Admins can read product files" on storage.objects;
create policy "Admins can read product files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'product-files'
  and exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can upload product files" on storage.objects;
create policy "Admins can upload product files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-files'
  and exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update product files" on storage.objects;
create policy "Admins can update product files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-files'
  and exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'product-files'
  and exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can delete product files" on storage.objects;
create policy "Admins can delete product files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-files'
  and exists (
    select 1 from public.store_admins a
    where a.user_id = (select auth.uid())
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Primeiro administrador: a função só pode ser chamada por usuário autenticado.
-- Ela permite a primeira inclusão em store_admins e fecha automaticamente após isso.
create or replace function public.claim_first_store_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  claimed boolean := false;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtext('ghost_store_first_admin'));

  if not exists (select 1 from public.store_admins) then
    insert into public.store_admins (user_id) values (uid)
    on conflict do nothing;
    claimed := true;
  elsif exists (select 1 from public.store_admins where user_id = uid) then
    claimed := true;
  end if;

  return claimed;
end;
$$;

revoke all on function public.claim_first_store_admin() from public;
revoke all on function public.claim_first_store_admin() from anon;
grant execute on function public.claim_first_store_admin() to authenticated;

-- Nunca coloque service_role/secret key no config.js.
