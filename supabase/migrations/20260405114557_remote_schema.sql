-- Curated reconciliation migration
-- Captures missing app/web objects from the development database
-- without destructive drop/recreate churn from full schema diff output.

create table if not exists public.favorites (
  user_id uuid not null,
  listing_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_images (
  id uuid not null default gen_random_uuid(),
  listing_id uuid not null,
  storage_path text not null,
  public_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.university_domains (
  id uuid not null default gen_random_uuid(),
  university_id uuid,
  domain text not null,
  created_at timestamptz default now()
);

alter table public.favorites enable row level security;
alter table public.listing_images enable row level security;
alter table public.university_domains enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'favorites_pkey') then
    alter table public.favorites add constraint favorites_pkey primary key (user_id, listing_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'favorites_user_id_fkey') then
    alter table public.favorites
      add constraint favorites_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'favorites_listing_id_fkey') then
    alter table public.favorites
      add constraint favorites_listing_id_fkey
      foreign key (listing_id) references public.listings(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_images_pkey') then
    alter table public.listing_images add constraint listing_images_pkey primary key (id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_images_listing_id_fkey') then
    alter table public.listing_images
      add constraint listing_images_listing_id_fkey
      foreign key (listing_id) references public.listings(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'university_domains_pkey') then
    alter table public.university_domains add constraint university_domains_pkey primary key (id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'university_domains_domain_key') then
    alter table public.university_domains add constraint university_domains_domain_key unique (domain);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'university_domains_university_id_fkey') then
    alter table public.university_domains
      add constraint university_domains_university_id_fkey
      foreign key (university_id) references public.universities(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_messages_expiry on public.messages(expires_at);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_owner_all'
  ) then
    create policy "favorites_owner_all"
      on public.favorites
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_images' and policyname = 'listing_images_public_read'
  ) then
    create policy "listing_images_public_read"
      on public.listing_images
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_images' and policyname = 'listing_images_owner_insert'
  ) then
    create policy "listing_images_owner_insert"
      on public.listing_images
      for insert
      with check (
        auth.uid() = (
          select seller_id
          from public.listings
          where id = listing_images.listing_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_images' and policyname = 'listing_images_owner_delete'
  ) then
    create policy "listing_images_owner_delete"
      on public.listing_images
      for delete
      using (
        auth.uid() = (
          select seller_id
          from public.listings
          where id = listing_images.listing_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'university_domains' and policyname = 'domains_public_read'
  ) then
    create policy "domains_public_read"
      on public.university_domains
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listings' and policyname = 'verified_students_can_create_listings'
  ) then
    create policy "verified_students_can_create_listings"
      on public.listings
      for insert
      with check (
        auth.uid() = seller_id
        and exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.is_verified_student = true
        )
      );
  end if;
end $$;

create or replace function public.users_are_blocked(user1 uuid, user2 uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.blocked_users
    where (blocker_id = user1 and blocked_id = user2)
       or (blocker_id = user2 and blocked_id = user1)
  );
$$;

create or replace function public.set_message_expiry()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := now() + interval '24 hours';
  return new;
end;
$$;

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  update public.listings
  set last_bumped_at = now()
  where id = (
    select c.listing_id
    from public.conversations c
    where c.id = new.conversation_id
  );

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  email_domain text;
  verified boolean := false;
  uni_id uuid;
begin
  user_email := new.email;
  email_domain := split_part(user_email, '@', 2);

  select university_id
  into uni_id
  from public.university_domains
  where domain = email_domain
  limit 1;

  if uni_id is not null then
    verified := true;
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone,
    university_id,
    is_verified_student
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    uni_id,
    verified
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'message_expiry_trigger'
      and tgrelid = 'public.messages'::regclass
  ) then
    create trigger message_expiry_trigger
      before insert on public.messages
      for each row execute function public.set_message_expiry();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'messages_touch_conversation'
      and tgrelid = 'public.messages'::regclass
  ) then
    create trigger messages_touch_conversation
      after insert on public.messages
      for each row execute function public.touch_conversation();
  end if;
end $$;

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then
      null;
  end;
end $$;
