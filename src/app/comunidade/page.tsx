import { createClient } from "@/lib/supabase/server";
import { HeroBanner } from "@/components/community/hero-banner";
import { ModuleCard } from "@/components/community/module-card";
import { ModuleForm } from "@/components/community/module-form";
import { FeaturedVideoForm } from "@/components/community/featured-video-form";
import { ContentCard } from "@/components/community/content-card";

type ModuleRow = {
  id: string;
  title: string;
  is_locked: boolean;
  cover_url: string | null;
};

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
 */
export default async function ComunidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout.tsx already redirects

  const [{ data: profile }, { data: rawModules }, { data: rawVideos }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    supabase
      .from("modules")
      .select("id, title, is_locked, cover_url")
      .order("order", { ascending: true }),
    supabase
      .from("featured_videos")
      .select("id, title, video_url, thumbnail_url, creator_name")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const isAdmin = profile?.is_admin ?? false;
  const modules: ModuleRow[] = rawModules ?? [];
  const featuredVideo: FeaturedVideo | null = rawVideos?.[0] ?? null;

  let hiddenLockedCount = 0;
  if (!isAdmin) {
    const { data: lockedCount } = await supabase.rpc("count_locked_modules");
    hiddenLockedCount = lockedCount ?? 0;
  }

  return (
    <div className="flex flex-col">
      <HeroBanner
        title={featuredVideo?.title ?? null}
        videoUrl={featuredVideo?.video_url ?? null}
        thumbnailUrl={featuredVideo?.thumbnail_url ?? null}
        creatorName={featuredVideo?.creator_name ?? null}
      />

      {isAdmin && (
        <div className="px-6 pt-8 md:px-10">
          <div className="max-w-xl">
            <FeaturedVideoForm />
          </div>
        </div>
      )}

      <div id="modulos" className="px-6 py-10 md:px-10 md:py-12 scroll-mt-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="heading-tight-2 text-xl text-white flex items-center gap-2 md:text-2xl">
            <span aria-hidden>📚</span> Módulos
          </h2>
        </div>

        {isAdmin && (
          <div className="mb-8 max-w-xl">
            <ModuleForm />
          </div>
        )}

        {modules.length === 0 && hiddenLockedCount === 0 ? (
          <p className="text-sm text-muted-dim">
            {isAdmin
              ? "Nenhum módulo ainda -- crie o primeiro acima."
              : "Nenhum módulo disponível por enquanto."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                id={module.id}
                title={module.title}
                isLocked={module.is_locked}
                coverUrl={module.cover_url}
                canDelete={isAdmin}
              />
            ))}
            {Array.from({ length: hiddenLockedCount }).map((_, i) => (
              <ContentCard
                key={`locked-${i}`}
                categoryLabel="Módulo"
                title="Conteúdo exclusivo"
                isLocked
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
