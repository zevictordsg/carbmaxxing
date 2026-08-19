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
  description: string | null;
  is_locked: boolean;
  channel_slug: string;
};

/**
 * Root of /comunidade — the member home. Welcome banner, a "Meus
 * Conteúdos" preview row pulled from content_items (the paid-material
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
        .select("id, title, description, is_locked, created_at, channels(slug)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const isAdmin = profile?.is_admin ?? false;

  const featuredContent: FeaturedContentItem[] = (rawContentItems ?? []).map(
    (item) => {
      const channelRow = Array.isArray(item.channels)
        ? item.channels[0]
        : item.channels;
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        is_locked: item.is_locked,
        channel_slug:
          (channelRow as { slug: string } | null | undefined)?.slug ?? "",
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
    <div className="px-6 py-10 md:px-10 md:py-12 max-w-5xl">
      <MemberBanner />

      {featuredContent.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="heading-tight-2 text-lg text-white">Meus conteúdos</h2>
            <Link
              href="/comunidade/receitas"
              className="text-xs text-muted-dim transition-colors hover:text-white"
            >
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featuredContent.map((item) => (
              <ContentCard
                key={item.id}
                href={item.channel_slug ? `/comunidade/${item.channel_slug}` : undefined}
                title={item.title}
                description={item.description}
                isLocked={item.is_locked}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 max-w-2xl">
        <p className="label-loose text-[10px] text-muted-dim mb-2">Feed</p>
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
  );
}
