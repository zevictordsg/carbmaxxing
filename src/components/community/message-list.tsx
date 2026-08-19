"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type MessageWithAuthor = {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  author_name: string;
};

export function MessageList({
  channelId,
  initialMessages,
  currentProfileId,
}: {
  channelId: string;
  initialMessages: MessageWithAuthor[];
  currentProfileId: string;
}) {
  // Callers must render this with `key={channelId}` so switching channels
  // remounts the component (fresh state) instead of needing an effect to
  // resync `messages`/`authorCache` from new initialMessages.
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const authorCache = useRef(
    new Map(initialMessages.map((m) => [m.profile_id, m.author_name]))
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${channelId}`)
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
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [...prev, { ...row, author_name: finalAuthorName }]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 flex flex-col gap-4">
      {messages.length === 0 && (
        <p className="text-sm text-muted-dim">
          Nenhuma mensagem ainda. Seja o primeiro a escrever.
        </p>
      )}
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">
              {message.author_name}
            </span>
            {message.profile_id === currentProfileId && (
              <span className="text-[10px] text-muted-dim">você</span>
            )}
            <span className="text-[11px] text-muted-dim">
              {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
