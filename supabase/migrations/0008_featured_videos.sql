-- Carbmaxxing — vídeos em destaque
-- Só admin publica (o próprio painel de admin já usa a mesma
-- public.is_admin()), todo mundo vê numa seção própria no topo do Feed.

create table public.featured_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_featured_videos_created_at on public.featured_videos (created_at desc);

alter table public.featured_videos enable row level security;

create policy "featured videos are readable by authenticated users"
  on public.featured_videos for select
  to authenticated
  using (true);

create policy "only admins can write featured videos"
  on public.featured_videos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
