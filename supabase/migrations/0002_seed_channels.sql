-- Carbmaxxing — Fase 2: canais padrão
-- Adiciona slug (identificador de rota, ex: /comunidade/chat-geral) e a flag
-- admin_only_posting (usada pelo canal "avisos": todo mundo lê, só admin
-- posta) em `channels`, então faz o seed dos 11 canais padrão do brief
-- original, agrupados em 3 categorias: inicio, comunidade, conteudo.

-- ============================================================================
-- channels: novas colunas
-- ============================================================================
alter table public.channels
  add column slug text,
  add column admin_only_posting boolean not null default false;

update public.channels set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
  where slug is null;

alter table public.channels
  alter column slug set not null;

create unique index idx_channels_slug on public.channels (slug);

-- ============================================================================
-- messages: só admin posta em canais marcados admin_only_posting
-- ============================================================================
drop policy if exists "users can post messages as themselves" on public.messages;

create policy "users can post messages as themselves"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = profile_id
    and (
      public.is_admin()
      or not exists (
        select 1 from public.channels c
        where c.id = channel_id and c.admin_only_posting
      )
    )
  );

-- ============================================================================
-- seed: 11 canais padrão
-- ============================================================================
insert into public.channels (name, description, category, slug, is_default, admin_only_posting, "order")
values
  -- categoria "inicio"
  ('Bem-vindo', 'Comece por aqui.', 'inicio', 'bem-vindo', true, false, 1),
  ('Regras', 'As regras da comunidade.', 'inicio', 'regras', true, false, 2),
  ('Avisos', 'Comunicados oficiais — só admins postam.', 'inicio', 'avisos', true, true, 3),

  -- categoria "comunidade"
  ('Chat Geral', 'Papo livre da comunidade.', 'comunidade', 'chat-geral', true, false, 1),
  ('Apresente-se', 'Chegou agora? Se apresente por aqui.', 'comunidade', 'apresente-se', true, false, 2),
  ('Refeições Sincronizadas', 'Poste sua refeição: foto, curtidas e comentários.', 'comunidade', 'refeicoes-sincronizadas', true, false, 3),
  ('Comidas Base', 'Referência de comidas base do protocolo.', 'comunidade', 'comidas-base', true, false, 4),
  ('Sugestões', 'Sugestões para a comunidade e o app.', 'comunidade', 'sugestoes', true, false, 5),

  -- categoria "conteudo"
  ('Receitas', 'Receitas do Carbmaxxing.', 'conteudo', 'receitas', true, false, 1),
  ('Treinos', 'Treinos e programas.', 'conteudo', 'treinos', true, false, 2),
  ('Dúvidas Frequentes', 'Perguntas frequentes.', 'conteudo', 'duvidas-frequentes', true, false, 3)
on conflict (slug) do nothing;
