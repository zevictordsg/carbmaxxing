-- Carbomaxxing — initial schema
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push`).
-- Fase 1 only wires up `profiles` in the app; the rest of the tables exist now
-- so Fase 2 (comunidade) and Fase 3 (checkout) can build directly on top.

-- ============================================================================
-- profiles
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper used by later policies to check admin status without recursive RLS.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Every signed-in member can see the member list (needed for the feed/chat
-- later: author names, avatars). No sensitive data lives on this table.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Prevent members from granting themselves admin through the update policy
-- above -- only a service-role call (admin tooling) can flip this flag.
create function public.prevent_self_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.role() <> 'service_role' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_self_admin_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_admin_escalation();

-- Auto-create a profile row whenever a new auth user is created (covers
-- Supabase Auth signups regardless of email-confirmation settings).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- subscriptions
-- ============================================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete'
    check (status in ('incomplete', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index idx_subscriptions_profile_id on public.subscriptions (profile_id);

alter table public.subscriptions enable row level security;

-- Members can read their own subscription (to show access state in the UI).
-- Writes are intentionally left to the service role only (Stripe webhook
-- handler) -- there is no insert/update policy here on purpose, per the
-- spec's rule that access is only ever granted after a verified webhook.
create policy "users can view their own subscription"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = profile_id);

create policy "admins can view all subscriptions"
  on public.subscriptions for select
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- channels
-- ============================================================================
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  is_default boolean not null default false,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.channels enable row level security;

create policy "channels are readable by authenticated users"
  on public.channels for select
  to authenticated
  using (true);

create policy "only admins can write channels"
  on public.channels for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- messages
-- ============================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_channel_id on public.messages (channel_id, created_at);

alter table public.messages enable row level security;

create policy "messages are readable by authenticated users"
  on public.messages for select
  to authenticated
  using (true);

create policy "users can post messages as themselves"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = profile_id);

create policy "admins can delete any message"
  on public.messages for delete
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- stripe_webhook_events
-- ============================================================================
-- Idempotency ledger: the Stripe event id is the primary key, so a re-sent
-- webhook (Stripe *will* retry) is a no-op INSERT ... ON CONFLICT rather than
-- a double-processed payment.
create table public.stripe_webhook_events (
  id text primary key, -- Stripe event id, e.g. "evt_1AbC..."
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
-- No policies: this table is only ever touched by the service-role client
-- inside the webhook Route Handler. Authenticated/anon roles get zero access.

-- ============================================================================
-- realtime
-- ============================================================================
-- Needed in Fase 2 for the live chat channels.
alter publication supabase_realtime add table public.messages;
