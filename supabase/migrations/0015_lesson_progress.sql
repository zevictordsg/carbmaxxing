-- Carbmaxxing — progresso de aula (área de membros)
--
-- Por que os ids são `text` e não FKs pra `lessons`/`modules`: o conteúdo
-- real da área de membros mora em src/lib/modules-content.ts (editado à
-- mão no código -- ver o comentário lá e em 0011_modules_lessons.sql). As
-- tabelas `modules`/`lessons` continuam no banco mas não são a fonte da
-- verdade, então amarrar o progresso nelas por FK travaria o conteúdo num
-- lugar que ninguém usa. Aqui o par (module_id, lesson_id) é o mesmo slug
-- que aparece na URL, o que também mantém o progresso válido se um dia o
-- conteúdo migrar de volta pro banco.
--
-- Uma linha por (perfil, módulo, aula). `position_seconds` guarda onde a
-- pessoa parou (pro "Continuar assistindo"); `completed` é o estado final,
-- marcado explicitamente ou quando o vídeo passa do fim.

create table public.lesson_progress (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  module_id text not null,
  lesson_id text not null,
  completed boolean not null default false,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (profile_id, module_id, lesson_id)
);

-- O "Continuar assistindo" pega a linha mais recente do perfil, então o
-- índice precisa cobrir (profile_id, updated_at desc) -- a PK não serve
-- porque ordena por module_id/lesson_id.
create index idx_lesson_progress_recent
  on public.lesson_progress (profile_id, updated_at desc);

alter table public.lesson_progress enable row level security;

-- Progresso é dado privado: cada um lê e escreve só o seu. Nem admin lê o
-- dos outros por aqui (se um dia precisar de relatório, faz por
-- service_role numa rota de admin, não afrouxando esta policy).
create policy "members read their own progress"
  on public.lesson_progress for select
  to authenticated
  using (auth.uid() = profile_id);

create policy "members write their own progress"
  on public.lesson_progress for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "members update their own progress"
  on public.lesson_progress for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ============================================================================
-- upsert
-- ============================================================================
-- Chamada pelo player a cada intervalo. `security definer` + auth.uid()
-- fixo no corpo: o cliente não escolhe de quem é o progresso que está
-- salvando, mesmo que mande outro profile_id.
--
-- `completed` nunca volta pra false por aqui -- quem terminou a aula
-- continua tendo ela como concluída mesmo que reassista do começo (senão
-- o primeiro segundo de um rewatch zeraria o progresso do módulo).
create or replace function public.save_lesson_progress(
  p_module text,
  p_lesson text,
  p_position integer default 0,
  p_duration integer default null,
  p_completed boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.lesson_progress as lp (
    profile_id, module_id, lesson_id, completed, position_seconds, duration_seconds,
    completed_at, updated_at
  )
  values (
    auth.uid(), p_module, p_lesson, coalesce(p_completed, false),
    greatest(coalesce(p_position, 0), 0), p_duration,
    case when p_completed then now() end, now()
  )
  on conflict (profile_id, module_id, lesson_id) do update
  set
    position_seconds = greatest(coalesce(p_position, 0), 0),
    duration_seconds = coalesce(p_duration, lp.duration_seconds),
    completed = lp.completed or coalesce(p_completed, false),
    completed_at = case
      when lp.completed then lp.completed_at
      when coalesce(p_completed, false) then now()
      else null
    end,
    updated_at = now();
end;
$$;

grant execute on function public.save_lesson_progress(text, text, integer, integer, boolean) to authenticated;

-- ============================================================================
-- leitura
-- ============================================================================
-- Quantas aulas de cada módulo o membro já concluiu. O total de aulas fica
-- no código (modules-content.ts), então a view devolve só o numerador -- a
-- página cruza com o total que ela já conhece.
create or replace function public.my_module_progress()
returns table (module_id text, completed_lessons bigint)
language sql
security definer
set search_path = public
stable
as $$
  select module_id, count(*)
  from public.lesson_progress
  where profile_id = auth.uid() and completed
  group by module_id;
$$;

grant execute on function public.my_module_progress() to authenticated;

-- A última aula tocada e não concluída -- o "Continuar de onde parou" da
-- home. Concluídas ficam de fora de propósito: retomar uma aula que já
-- acabou não é continuar, é reassistir.
create or replace function public.my_last_lesson()
returns table (
  module_id text,
  lesson_id text,
  position_seconds integer,
  duration_seconds integer,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select module_id, lesson_id, position_seconds, duration_seconds, updated_at
  from public.lesson_progress
  where profile_id = auth.uid()
    and not completed
    and position_seconds > 0
  order by updated_at desc
  limit 1;
$$;

grant execute on function public.my_last_lesson() to authenticated;
