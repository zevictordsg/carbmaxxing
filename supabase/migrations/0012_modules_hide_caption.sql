-- Per-module toggle: when true, the module's card renders the cover image
-- alone with no [Módulo] tag / title overlay -- for covers that already
-- carry their own text (e.g. a photographed chalkboard) where a caption
-- on top would just repeat or clash with it.
alter table public.modules
  add column hide_caption boolean not null default false;
