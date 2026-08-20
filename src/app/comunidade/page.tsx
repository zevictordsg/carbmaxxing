import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FeedList } from "@/components/community/feed-list";
import { MessageComposer } from "@/components/community/message-composer";
import { MemberBanner } from "@/components/community/member-banner";
import { ContentCard } from "@/components/community/content-card";
import type { MessageWithAuthor } from "@/components/community/message-list";

type FeaturedContentItem = {
  id: string;
  title: string;
  is_locked: boolean;
  channel_slug: string;
  channel_name: string;
};

/**
 * Root of /comunidade — the member home. Full-bleed welcome banner, a
 * "Meus Conteúdos" carousel pulled from content_items (the paid-material
 * library — see supabase/migrations/0003_content_items.sql), then the
 * pinned Avisos feed. Auth + the sidebar shell live in layout.tsx.
 */
export default async function ComunidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout.tsx already redirects

  const [{ data: avisos }, { data: profile }, { data: rawContentItems }] =
    await Promise.all([
      supabase
        .from("channels")
        .select("id, admin_only_posting")
        .eq("slug", "avisos")
        .single(),
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
      supabase
        .from("content_items")
        .select("id, title, is_locked, created_at, channels(slug, name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const isAdmin = profile?.is_admin ?? false;

  const featuredContent: FeaturedContentItem[] = (rawContentItems ?? []).map(
    (item) => {
      const channelRow = Array.isArray(item.channels)
        ? item.channels[0]
        : item.channels;
      const c = channelRow as { slug: string; name: string } | null | undefined;
      return {
        id: item.id,
        title: item.title,
        is_locked: item.is_locked,
        channel_slug: c?.slug ?? "",
        channel_name: c?.name ?? "Conteúdo",
      };
    }
  );

  let initialMessages: MessageWithAuthor[] = [];
  if (avisos) {
    const { data: rawMessages } = await supabase
      .from("messages")
      .select("id, content, created_at, profile_id, profiles(display_name)")
      .eq("channel_id", avisos.id)
      .order("created_at", { ascending: false })
      .limit(50);

    initialMessages = (rawMessages ?? []).map((m) => {
      const profileRow = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        profile_id: m.profile_id,
        author_name:
          (profileRow as { display_name: string } | null | undefined)
            ?.display_name ?? "Membro",
      };
    });
  }

  return (
    <div className="flex flex-col">
      <MemberBanner />

      {featuredContent.length > 0 && (
        <section className="w-full pt-10 pb-2 md:pt-12">
          <div className="mb-5 flex items-baseline justify-between px-6 md:px-10">
            <h2 className="heading-tight-2 text-xl text-white flex items-center gap-2 md:text-2xl">
              <span aria-hidden>📚</span> Meus conteúdos
            </h2>
            <Link
              href="/comunidade/receitas"
              className="text-xs text-muted-dim transition-colors hover:text-white"
            >
              Ver tudo →
            </Link>
          </div>
          <div className="relative">
            <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 md:gap-5 md:px-10">
              {featuredContent.map((item) => (
                <ContentCard
                  key={item.id}
                  href={item.channel_slug ? `/comunidade/${item.channel_slug}` : undefined}
                  categoryLabel={item.channel_name}
                  title={item.title}
                  isLocked={item.is_locked}
                  className="w-[200px] shrink-0 snap-start sm:w-[230px] md:w-[250px]"
                />
              ))}
            </div>
            {/* Edge fades signal there's more to scroll -- plain gradient
                overlays instead of a CSS mask, which rendered inconsistently. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-surface-2 to-transparent md:w-12"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface-2 to-transparent md:w-12"
            />
          </div>
        </section>
      )}

      <div className="px-6 py-10 md:px-10 md:py-12">
        <section className="max-w-2xl">
          <p className="label-loose text-[10px] text-muted-dim mb-2 flex items-center gap-1.5">
            <span aria-hidden>📌</span> Feed
          </p>
          <h2 className="heading-tight-2 text-xl text-white mb-6">Avisos fixados</h2>

          {avisos && (
            <FeedList key={avisos.id} channelId={avisos.id} initialMessages={initialMessages} />
          )}

          {avisos && isAdmin && (
            <div className="mt-6 overflow-hidden rounded-xl border border-border-subtle">
              <MessageComposer channelId={avisos.id} placeholder="Publicar um aviso..." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
