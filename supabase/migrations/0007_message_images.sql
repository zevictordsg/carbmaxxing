-- Carbmaxxing — anexo de imagem nas mensagens do chat
-- Cada mensagem pode opcionalmente ter uma imagem. Reaproveita a mesma
-- convenção de pasta por usuário do bucket "avatars" (0006): o dono do
-- arquivo é identificado pelo primeiro segmento do path.

alter table public.messages add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('message-images', 'message-images', true)
on conflict (id) do nothing;

create policy "message images are publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'message-images');

create policy "users can upload their own message images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'message-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own message images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'message-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
