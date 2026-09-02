-- Carbmaxxing — área de membros de verdade: módulos + aulas
--
-- Pivô de estrutura: a comunidade deixa de girar em torno de canais estilo
-- Discord (chat/threads) e passa a ser uma área de membros com módulos
-- (cada um pode ter várias aulas dentro). Tabelas novas, não reaproveitam
-- channels/content_items -- por pedido explícito, sem herdar a estrutura
-- antiga.
--
-- Mesmo padrão de trava real da Fase 3 (0010_content_access_gate.sql):
-- is_locked + has_content_access() na própria RLS, não só um cadeado
-- visual. Um módulo travado e inacessível nem aparece na query; as aulas
-- dele idem (checam o módulo pai via EXISTS).

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_url text,
  is_locked boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_modules_order on public.modules ("order");

alter table public.modules enable row level security;

create policy "modules readable when unlocked or accessible"
  on public.modules for select
  to authenticated
  using (is_locked = false or public.has_content_access());

create policy "only admins can write modules"
  on public.modules for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_lessons_module_id on public.lessons (module_id, "order");

alter table public.lessons enable row level security;

create policy "lessons readable when parent module is accessible"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1 from public.modules m
      where m.id = module_id
        and (m.is_locked = false or public.has_content_access())
    )
  );

create policy "only admins can write lessons"
  on public.lessons for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Contagem de módulos travados sem vazar título/capa -- mesmo espírito do
-- count_locked_content, pra mostrar "N módulos exclusivos" pra quem ainda
-- não tem acesso sem revelar o que tem dentro.
create or replace function public.count_locked_modules()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.modules
  where is_locked = true;
$$;

grant execute on function public.count_locked_modules() to authenticated;
