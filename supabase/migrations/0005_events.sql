-- Carbmaxxing — canal de Calls/Eventos
-- Nova categoria "eventos" (não estava no set fixo original inicio/comunidade/
-- conteudo -- channels.category é texto livre, sem check constraint, então
-- isso não quebra nada existente). Calls são agendadas por um admin com um
-- link externo (Zoom/Meet/etc) -- sem infra de voz nativa por enquanto.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  external_url text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_events_scheduled_at on public.events (scheduled_at);

alter table public.events enable row level security;

create policy "events are readable by authenticated users"
  on public.events for select
  to authenticated
  using (true);

create policy "only admins can write events"
  on public.events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- seed: canal "Calls & Eventos"
-- ============================================================================
insert into public.channels (name, description, category, slug, is_default, admin_only_posting, "order")
values (
  'Calls & Eventos',
  'Próximas calls ao vivo com a comunidade.',
  'eventos',
  'calls',
  true,
  false,
  1
)
on conflict (slug) do nothing;
