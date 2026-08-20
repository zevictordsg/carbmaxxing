"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithAuthor } from "@/components/community/message-list";

/**
 * Same realtime-subscription shape as MessageList, styled as pinned
 * announcement cards instead of a chat log. Used for the Feed ("avisos").
 */
export function FeedList({
  channelId,
  initialMessages,
}: {
  channelId: string;
  initialMessages: MessageWithAuthor[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const authorCache = useRef(
    new Map(initialMessages.map((m) => [m.profile_id, m.author_name]))
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`feed:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            content: string;
            image_url: string | null;
            created_at: string;
            profile_id: string;
          };

          let authorName = authorCache.current.get(row.profile_id);
          if (!authorName) {
            const { data } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", row.profile_id)
              .single();
            const resolvedName: string = data?.display_name ?? "Membro";
            authorName = resolvedName;
            authorCache.current.set(row.profile_id, resolvedName);
          }

          const finalAuthorName = authorName;
          // Newest pinned post first.
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [{ ...row, author_name: finalAuthorName }, ...prev]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface px-6 py-10 text-center">
        <p className="text-sm text-muted-dim">Nenhum aviso publicado ainda.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <article
          key={message.id}
          className="rounded-xl border border-border-subtle bg-surface px-5 py-4"
        >
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="label-loose text-[9px] text-muted-dim">📌 Aviso</span>
            <span className="text-[11px] text-muted-dim">
              {new Date(message.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
          {message.content && (
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words mb-2">
              {message.content}
            </p>
          )}
          {message.image_url && (
            <a
              href={message.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 inline-block w-fit overflow-hidden rounded-lg border border-border-subtle"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.image_url}
                alt=""
                className="max-h-72 max-w-full object-cover sm:max-w-sm"
              />
            </a>
          )}
          <span className="text-xs text-muted-dim">{message.author_name}</span>
        </article>
      ))}
    </div>
  );
}
