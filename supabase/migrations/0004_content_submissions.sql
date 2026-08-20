-- Carbmaxxing — submissão de conteúdo por membros (Receitas)
-- Qualquer membro pode enviar sua própria receita; ela só aparece pra
-- geral depois que um admin aprova. Generaliza pra qualquer canal de
-- "conteudo" -- hoje só o form de Receitas usa isso, mas a coluna serve
-- pra Treinos/Dúvidas também no futuro sem precisar de outra migration.

alter table public.content_items
  add column submitted_by uuid references public.profiles (id) on delete set null,
  add column status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected'));

create index idx_content_items_status on public.content_items (channel_id, status);

-- Substitui a policy de leitura: aprovado é público pra qualquer membro,
-- mas cada um também enxerga as próprias submissões pendentes/rejeitadas
-- (pra ver o status do que mandou), e admin enxerga tudo.
drop policy if exists "content items readable by authenticated users" on public.content_items;

create policy "content items readable by authenticated users"
  on public.content_items for select
  to authenticated
  using (
    status = 'approved'
    or submitted_by = auth.uid()
    or public.is_admin()
  );

-- Policy nova, só de insert -- soma com a "only admins can write content
-- items" já existente (policies permissivas do mesmo tipo de ação se
-- combinam com OR no Postgres RLS). Força as próprias submissões a
-- entrarem sempre como "pending" -- ninguém se auto-aprova.
create policy "members can submit their own content"
  on public.content_items for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
  );
