import { createClient } from "@/lib/supabase/server";
import { HeroBanner } from "@/components/community/hero-banner";
import { ModuleCard } from "@/components/community/module-card";
import { ContentCard } from "@/components/community/content-card";
import { MODULES } from "@/lib/modules-content";

type FeaturedVideo = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  creator_name: string | null;
};

/**
 * Root of /comunidade — the members area home. Netflix-style hero (driven
 * by the latest featured video) up top, then a Balaclava-style modules
 * grid below. This replaces the old channel-sidebar/chat-first home; the
 * legacy chat channels and content_items carousel are no longer linked
 * from here (see AGENTS.md-adjacent notes in layout.tsx / sidebar.tsx --
 * that code still exists, just isn't part of the members-area nav anymore).
 *
 * Modules themselves come from src/lib/modules-content.ts, hand-edited in
 * code, not from the `modules` Supabase table / admin form (that DB table
 * + the ModuleForm UI are still there, just no longer wired up here --
 * same "leave it, just unlink it" treatment as the old sidebar). The
 * "Publicar vídeo em destaque" admin form got the same treatment: removed
 * from this page (FeaturedVideoForm/featured-video-form.tsx still exists,
 * just unused) -- the hero still reads the latest featured_videos row if
 * one's already there, it just can't be published from here anymore.
 */
export default async function ComunidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout.tsx already redirects

  const { data: rawVideos } = await supabase
    .from("featured_videos")
    .select("id, title, video_url, thumbnail_url, creator_name")
    .order("created_at", { ascending: false })
    .limit(1);

  const featuredVideo: FeaturedVideo | null = rawVideos?.[0] ?? null;

  return (
    <div className="flex flex-col">
      <HeroBanner
        title={featuredVideo?.title ?? null}
        videoUrl={featuredVideo?.video_url ?? null}
        thumbnailUrl={featuredVideo?.thumbnail_url ?? null}
        creatorName={featuredVideo?.creator_name ?? null}
      />

      <div id="modulos" className="px-6 py-10 md:px-10 md:py-12 scroll-mt-16">
        <p className="mb-6 text-sm font-semibold text-white sm:text-base">
          Meus conteúdos:
        </p>

        {MODULES.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            <ContentCard categoryLabel="Módulo" title="Em breve" isLocked size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {MODULES.map((module) => (
              <ModuleCard
                key={module.id}
                id={module.id}
                title={module.title}
                isLocked={module.isLocked}
                coverUrl={module.coverUrl ?? null}
                hideCaption={module.hideCaption}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
