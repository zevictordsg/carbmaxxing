-- Nome do criador do vídeo (ex: "gui"), usado no título automático do
-- card ("O GUI ACABOU DE POSTAR VÍDEO NOVO") e no avatar de iniciais.
-- Opcional -- sem ele o card usa um título genérico.

alter table public.featured_videos add column if not exists creator_name text;
