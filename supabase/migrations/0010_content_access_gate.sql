-- Carbmaxxing — restrição real de acesso a conteúdo bloqueado
-- Até agora "🔒 bloqueado" era só um ícone -- título e descrição do item
-- eram lidos por qualquer membro logado. Antes de abrir a plataforma pra
-- gente de fora, isso vira uma trava de verdade: quem não tem acesso não
-- consegue ler a linha (nem via API direta do Supabase, RLS de verdade).
--
-- Sem o Stripe (Fase 3) no ar ainda, "ter acesso" hoje == ser admin. No
-- dia em que o checkout existir, basta uma assinatura com status='active'
-- aparecer em public.subscriptions que essa mesma função já libera --
-- nenhum código de app precisa mudar.

create or replace function public.has_content_access()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or exists (
      select 1 from public.subscriptions
      where profile_id = auth.uid() and status = 'active'
    );
$$;

grant execute on function public.has_content_access() to authenticated;

-- Substitui a policy de leitura (a mesma que 0004_content_submissions.sql
-- já tinha recriado): aprovado + destravado é público pra qualquer
-- membro; aprovado + travado exige has_content_access(); cada um também
-- enxerga as próprias submissões pendentes/rejeitadas; admin enxerga tudo.
drop policy if exists "content items readable by authenticated users" on public.content_items;

create policy "content items readable by authenticated users"
  on public.content_items for select
  to authenticated
  using (
    (status = 'approved' and is_locked = false)
    or (status = 'approved' and is_locked = true and public.has_content_access())
    or submitted_by = auth.uid()
    or public.is_admin()
  );

-- Contagem de itens travados sem expor título/descrição -- usado pra
-- mostrar "🔒 N conteúdos exclusivos" pra quem ainda não tem acesso, sem
-- vazar o que tem lá dentro.
create or replace function public.count_locked_content(p_channel_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.content_items
  where channel_id = p_channel_id
    and status = 'approved'
    and is_locked = true;
$$;

grant execute on function public.count_locked_content(uuid) to authenticated;
