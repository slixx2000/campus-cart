-- Payment database model for Bila-based monetization.
--
-- This phase establishes the source-of-truth payment tables and pricing catalog
-- without yet wiring the business logic to UI flows. The intention is to keep
-- the provider-agnostic schema in place before the first paid promotion is sold.

create extension if not exists pgcrypto;

 do $$
 begin
   if not exists (
     select 1
     from pg_type t
     join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname = 'payment_provider_name'
   ) then
     create type public.payment_provider_name as enum ('bila');
   end if;

   if not exists (
     select 1
     from pg_type t
     join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname = 'payment_status'
   ) then
     create type public.payment_status as enum (
       'pending',
       'processing',
       'paid',
       'failed',
       'cancelled',
       'refunded',
       'partially_refunded'
     );
   end if;

   if not exists (
     select 1
     from pg_type t
     join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname = 'payment_purpose'
   ) then
     create type public.payment_purpose as enum (
       'listing_boost',
       'featured_listing',
       'seller_subscription',
       'storefront_upgrade',
       'advertisement',
       'sponsored_deal',
       'transaction_fee',
       'delivery'
     );
   end if;

   if not exists (
     select 1
     from pg_type t
     join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname = 'promotion_product_kind'
   ) then
     create type public.promotion_product_kind as enum ('boost', 'featured', 'seller_pro');
   end if;
 end $$;

create table if not exists public.payment_products (
  id uuid primary key default gen_random_uuid(),
  kind public.promotion_product_kind not null,
  name text not null,
  description text,
  price_minor integer not null check (price_minor >= 0),
  currency text not null default 'ZMW' check (currency = 'ZMW'),
  duration_days integer not null check (duration_days > 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid references public.payment_products(id) on delete set null,
  provider public.payment_provider_name not null default 'bila',
  provider_payment_id text,
  provider_reference text,
  payment_reference text not null unique,
  status public.payment_status not null default 'pending',
  purpose public.payment_purpose not null,
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'ZMW' check (currency = 'ZMW'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint payments_provider_reference_unique unique (provider, provider_reference),
  constraint payments_provider_payment_id_unique unique (provider, provider_payment_id)
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  provider public.payment_provider_name not null default 'bila',
  event_name text not null,
  provider_event_id text,
  status public.payment_status,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  constraint payment_webhook_events_unique unique (provider, provider_event_id)
);

create index if not exists idx_payment_products_active_kind
  on public.payment_products (is_active, kind, price_minor);

create index if not exists idx_payments_user_status
  on public.payments (user_id, status, created_at desc);

create index if not exists idx_payments_provider_payment_id
  on public.payments (provider, provider_payment_id);

create index if not exists idx_payments_provider_reference
  on public.payments (provider, provider_reference);

create index if not exists idx_payment_webhooks_payment_id
  on public.payment_webhook_events (payment_id, received_at desc);

alter table public.payment_products enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_products'
      and policyname = 'payment_products_public_read'
  ) then
    create policy "payment_products_public_read" on public.payment_products
      for select using (
        is_active = true
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_products'
      and policyname = 'payment_products_admin_all'
  ) then
    create policy "payment_products_admin_all" on public.payment_products
      for all to authenticated using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_admin = true
        )
      ) with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payments'
      and policyname = 'payments_owner_select'
  ) then
    create policy "payments_owner_select" on public.payments
      for select using (
        auth.uid() = user_id
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payments'
      and policyname = 'payments_owner_insert'
  ) then
    create policy "payments_owner_insert" on public.payments
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payments'
      and policyname = 'payments_owner_update'
  ) then
    create policy "payments_owner_update" on public.payments
      for update using (
        auth.uid() = user_id
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_admin = true
        )
      ) with check (
        auth.uid() = user_id
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_webhook_events'
      and policyname = 'payment_webhook_events_admin_read'
  ) then
    create policy "payment_webhook_events_admin_read" on public.payment_webhook_events
      for select to authenticated using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_webhook_events'
      and policyname = 'payment_webhook_events_owner_read'
  ) then
    create policy "payment_webhook_events_owner_read" on public.payment_webhook_events
      for select using (
        exists (
          select 1 from public.payments p
          where p.id = payment_webhook_events.payment_id
            and (p.user_id = auth.uid() or exists (
              select 1 from public.profiles prof
              where prof.id = auth.uid() and prof.is_admin = true
            ))
        )
      );
  end if;
end $$;

revoke all on public.payment_products from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.payment_webhook_events from anon, authenticated;

grant select on public.payment_products to authenticated;
grant insert, update, delete on public.payment_products to authenticated;
grant select, insert, update on public.payments to authenticated;
grant select on public.payment_webhook_events to authenticated;

-- Keep operation semantics simple and explicit: these tables are authoritative
-- records for payment and promotion state, and client-side writes are limited to
-- the authenticated user's own payment records.

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'payment_products_updated_at'
  ) then
    create trigger payment_products_updated_at
      before update on public.payment_products
      for each row execute procedure public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'payments_updated_at'
  ) then
    create trigger payments_updated_at
      before update on public.payments
      for each row execute procedure public.set_updated_at();
  end if;
end $$;
