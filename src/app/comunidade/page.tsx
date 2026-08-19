import { createClient } from "@/lib/supabase/server";
import { FeedList } from "@/components/community/feed-list";
import { MessageComposer } from "@/components/community/message-composer";
import type { MessageWithAuthor } from "@/components/community/message-list";

/**
 * Root of /comunidade — the Feed. Pulls pinned posts from the "avisos"
 * channel (admin_only_posting = true): everyone reads, only admins get the
 * composer. Auth + the sidebar shell live in layout.tsx.
 */
export default async function ComunidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout.tsx already redirects

  const [{ data: avisos }, { data: profile }] = await Promise.all([
    supabase
      .from("channels")
      .select("id, admin_only_posting")
      .eq("slug", "avisos")
      .single(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  const isAdmin = profile?.is_admin ?? false;

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
    <div className="px-6 py-10 md:px-10 md:py-12 max-w-2xl">
      <p className="label-loose text-[10px] text-muted-dim mb-2">Feed</p>
      <h1 className="heading-tight-2 text-2xl text-white mb-6">
        Avisos fixados
      </h1>

      {avisos && <FeedList key={avisos.id} channelId={avisos.id} initialMessages={initialMessages} />}

      {avisos && isAdmin && (
        <div className="mt-6 rounded-xl border border-border-subtle overflow-hidden">
          <MessageComposer channelId={avisos.id} placeholder="Publicar um aviso..." />
        </div>
      )}
    </div>
  );
}
