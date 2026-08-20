import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MessageList,
  type MessageWithAuthor,
} from "@/components/community/message-list";
import { MessageComposer } from "@/components/community/message-composer";
import { ContentCard } from "@/components/community/content-card";
import { channelEmoji } from "@/lib/channels";

type StaticStep = { icon: string; title: string; description: string };
type StaticPage = { icon: string; title: string; steps: StaticStep[] };

// Hardcoded editorial copy for the two purely-static "inicio" channels.
// "avisos" (also "inicio") is data-driven instead -- see the message-backed
// branch below.
const STATIC_COPY: Record<string, StaticPage> = {
  "bem-vindo": {
    icon: "👋",
    title: "Bem-vindo(a) ao Carbmaxxing",
    steps: [
      {
        icon: "🙋",
        title: "Se apresente",
        description: "Vá no canal Apresente-se e diga oi pra galera.",
      },
      {
        icon: "📜",
        title: "Leia as regras",
        description: "Rapidinho, mas importante — é ali no canal Regras.",
      },
      {
        icon: "📚",
        title: "Explore o conteúdo",
        description: "Receitas, treinos e dúvidas frequentes na categoria Conteúdo.",
      },
      {
        icon: "💬",
        title: "Participe do chat",
        description: "O Chat Geral é o coração da comunidade — bora trocar ideia.",
      },
    ],
  },
  regras: {
    icon: "📜",
    title: "Regras da comunidade",
    steps: [
      {
        icon: "🤝",
        title: "Respeite todo mundo",
        description: "Sem exceções.",
      },
      {
        icon: "🚫",
        title: "Sem spam",
        description: "Nem autopromoção fora do combinado.",
      },
      {
        icon: "📸",
        title: "Poste de verdade",
        description:
          "Refeições e treinos reais — essa comunidade é sobre consistência, não perfeição.",
      },
      {
        icon: "🆘",
        title: "Precisa de ajuda?",
        description: "Fale com um admin.",
      },
    ],
  },
};

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // layout.tsx already redirects unauthenticated visitors before this page
  // renders; this is just a type-narrowing guard for the queries below.
  if (!user) return null;

  const [{ data: channel }, { data: profile }] = await Promise.all([
    supabase
      .from("channels")
      .select("id, name, description, category, slug, admin_only_posting")
      .eq("slug", slug)
      .single(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  if (!channel) notFound();

  const isAdmin = profile?.is_admin ?? false;
  const emoji = channelEmoji(channel.slug);

  if (channel.category === "conteudo") {
    const { data: items } = await supabase
      .from("content_items")
      .select("id, title, is_locked")
      .eq("channel_id", channel.id)
      .order("order", { ascending: true });

    return (
      <div className="px-6 py-10 md:px-10 md:py-12">
        <p className="label-loose text-[10px] text-muted-dim mb-2">📚 Conteúdo</p>
        <h1 className="heading-tight-2 text-2xl text-white mb-2 flex items-center gap-2">
          <span aria-hidden>{emoji}</span> {channel.name}
        </h1>
        {channel.description && (
          <p className="text-muted max-w-md text-sm mb-10">{channel.description}</p>
        )}

        {items && items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <ContentCard
                key={item.id}
                categoryLabel={channel.name}
                title={item.title}
                isLocked={item.is_locked}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface px-6 py-10 text-center">
            <p className="text-sm text-muted-dim">Conteúdo chega em breve.</p>
          </div>
        )}
      </div>
    );
  }

  if (channel.category === "inicio" && STATIC_COPY[channel.slug]) {
    const copy = STATIC_COPY[channel.slug];
    return (
      <div className="px-6 py-10 md:px-10 md:py-12 max-w-2xl">
        <p className="label-loose text-[10px] text-muted-dim mb-2">🏠 Início</p>
        <h1 className="heading-tight-2 text-2xl text-white mb-6 flex items-center gap-2">
          <span aria-hidden>{copy.icon}</span> {copy.title}
        </h1>
        <div className="flex flex-col gap-3">
          {copy.steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-border-subtle bg-surface px-5 py-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-base" aria-hidden>
                {step.icon}
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-dim leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Message-backed channel: every "comunidade" category chat, plus "avisos"
  // (inicio, admin_only_posting) which reads as an announcements feed --
  // everyone reads, only admins get the composer.
  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, content, created_at, profile_id, profiles(display_name)")
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: true })
    .limit(200);

  const initialMessages: MessageWithAuthor[] = (rawMessages ?? []).map((m) => {
    // Supabase's untyped nested-select inference treats the profiles join as
    // an array even though profile_id -> profiles.id is a to-one relationship.
    const profileRow = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      content: m.content,
      created_at: m.created_at,
      profile_id: m.profile_id,
      author_name:
        (profileRow as { display_name: string } | null | undefined)?.display_name ??
        "Membro",
    };
  });

  const canPost = !channel.admin_only_posting || isAdmin;

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border-subtle px-4 py-4 md:px-6">
        <h1 className="heading-tight-2 text-lg text-white flex items-center gap-2">
          <span aria-hidden>{emoji}</span> {channel.name}
        </h1>
        {channel.description && (
          <p className="text-xs text-muted-dim mt-0.5">{channel.description}</p>
        )}
      </div>

      <MessageList
        key={channel.id}
        channelId={channel.id}
        initialMessages={initialMessages}
        currentProfileId={user.id}
      />

      {canPost ? (
        <MessageComposer
          channelId={channel.id}
          placeholder={
            channel.admin_only_posting ? "Publicar um aviso..." : "Escreva uma mensagem..."
          }
        />
      ) : (
        <div className="border-t border-border-subtle px-4 py-3 md:px-6">
          <p className="text-xs text-muted-dim">🔒 Só admins podem postar neste canal.</p>
        </div>
      )}
    </div>
  );
}
