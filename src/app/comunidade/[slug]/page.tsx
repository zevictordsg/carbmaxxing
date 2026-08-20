import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MessageList,
  type MessageWithAuthor,
} from "@/components/community/message-list";
import { MessageComposer } from "@/components/community/message-composer";
import { ContentCard } from "@/components/community/content-card";
import { RecipeSubmitForm } from "@/components/community/recipe-submit-form";
import { ModerationRow } from "@/components/community/moderation-row";
import { channelEmoji } from "@/lib/channels";

// Per-channel composer copy so each chat feels like its own place instead
// of one generic text box repeated everywhere.
const COMPOSER_PLACEHOLDER: Record<string, string> = {
  "chat-geral": "Escreva uma mensagem...",
  "apresente-se": "Conte quem você é e qual seu objetivo...",
  "refeicoes-sincronizadas": "Descreva sua refeição (fotos chegam em breve)...",
  "comidas-base": "Compartilhe uma comida base do protocolo...",
  sugestoes: "Sua sugestão pra comunidade ou pro app...",
};

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
    // RLS already scopes this to: approved items (everyone) + the caller's
    // own pending/rejected submissions + everything if the caller is admin
    // (see supabase/migrations/0004_content_submissions.sql).
    const { data: rawItems } = await supabase
      .from("content_items")
      .select("id, title, description, is_locked, status, submitted_by, profiles(display_name)")
      .eq("channel_id", channel.id)
      .order("order", { ascending: true });

    const items = rawItems ?? [];
    const approved = items.filter((i) => i.status === "approved");
    const pending = items.filter((i) => i.status === "pending");
    const myPending = isAdmin ? [] : pending.filter((i) => i.submitted_by === user.id);
    const acceptsSubmissions = channel.slug === "receitas";

    return (
      <div className="px-6 py-10 md:px-10 md:py-12">
        <p className="label-loose text-[10px] text-muted-dim mb-2">📚 Conteúdo</p>
        <h1 className="heading-tight-2 text-2xl text-white mb-2 flex items-center gap-2">
          <span aria-hidden>{emoji}</span> {channel.name}
        </h1>
        {channel.description && (
          <p className="text-muted max-w-md text-sm mb-6">{channel.description}</p>
        )}

        {acceptsSubmissions && (
          <div className="mb-10 max-w-2xl">
            <RecipeSubmitForm />
          </div>
        )}

        {isAdmin && pending.length > 0 && (
          <div className="mb-10">
            <p className="label-loose text-[10px] text-muted-dim mb-3 flex items-center gap-1.5">
              <span aria-hidden>⏳</span> Pendentes de aprovação ({pending.length})
            </p>
            <div className="flex max-w-2xl flex-col gap-3">
              {pending.map((item) => {
                const profileRow = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                return (
                  <ModerationRow
                    key={item.id}
                    itemId={item.id}
                    title={item.title}
                    description={item.description}
                    authorName={
                      (profileRow as { display_name: string } | null | undefined)
                        ?.display_name ?? "Membro"
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {myPending.length > 0 && (
          <div className="mb-10 max-w-2xl">
            <p className="label-loose text-[10px] text-muted-dim mb-3">
              📤 Suas submissões
            </p>
            <div className="flex flex-col gap-2">
              {myPending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3"
                >
                  <span className="text-sm text-white truncate">{item.title}</span>
                  <span className="label-loose text-[9px] text-muted-dim shrink-0">
                    ⏳ Em análise
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {approved.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {approved.map((item) => (
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
            <p className="text-sm text-muted-dim">
              {acceptsSubmissions
                ? "Nenhuma receita aprovada ainda — a sua pode ser a primeira!"
                : "Conteúdo chega em breve."}
            </p>
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
            channel.admin_only_posting
              ? "Publicar um aviso..."
              : COMPOSER_PLACEHOLDER[channel.slug] ?? "Escreva uma mensagem..."
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
