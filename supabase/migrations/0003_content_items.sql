-- Carbmaxxing — Fase 2: biblioteca de conteúdos ("área de membros")
-- Um content_item pertence a um canal da categoria "conteudo" (receitas,
-- treinos, duvidas-frequentes). is_locked marca material pago -- por
-- enquanto é só um cadeado visual; a checagem real de acesso entra na
-- Fase 3 junto com o Stripe (subscriptions).

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  is_locked boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_content_items_channel_id on public.content_items (channel_id, "order");

alter table public.content_items enable row level security;

create policy "content items readable by authenticated users"
  on public.content_items for select
  to authenticated
  using (true);

create policy "only admins can write content items"
  on public.content_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- seed: placeholders pra ver a grade funcionando de verdade -- troque por
-- título/descrição/capa reais quando tiver o material definitivo.
-- ============================================================================
insert into public.content_items (channel_id, title, description, is_locked, "order")
select c.id, v.title, v.description, v.is_locked, v.ord
from public.channels c
join (
  values
    ('receitas', 'Café da manhã proteico', 'Receita base pra começar o dia dentro do protocolo.', false, 1),
    ('receitas', 'Almoço de volume', 'Prato principal do protocolo Carbmaxxing.', true, 2),
    ('receitas', 'Snack pré-treino', 'Rápido e prático antes de treinar.', true, 3),
    ('treinos', 'Treino A — Peito e Tríceps', 'Programa completo com séries e cargas.', true, 1),
    ('treinos', 'Treino B — Costas e Bíceps', 'Programa completo com séries e cargas.', true, 2),
    ('treinos', 'Treino C — Pernas', 'Programa completo com séries e cargas.', true, 3),
    ('duvidas-frequentes', 'Como calcular macros', 'Passo a passo pra montar sua dieta.', false, 1),
    ('duvidas-frequentes', 'Posso treinar em jejum?', 'Resposta direta com base no protocolo.', false, 2)
) as v(slug, title, description, is_locked, ord) on c.slug = v.slug
where c.category = 'conteudo';
