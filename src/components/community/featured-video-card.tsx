"use client";

import { useState, useTransition } from "react";
import { deleteFeaturedVideo } from "@/app/actions/videos";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Styled after a "creator posted a new video" notification bot card (the
 * reference the user shared was a Discord "NotifyMe" bot post): a bold
 * auto-generated headline, then a nested embed with the creator's
 * initials avatar, caption, thumbnail, and a watch button. Publishing is
 * still manual (an admin pastes the link) -- see AGENTS.md/FeaturedVideoForm
 * for why we didn't build real auto-detection of new TikTok posts.
 */
export function FeaturedVideoCard({
  id,
  title,
  videoUrl,
  thumbnailUrl,
  creatorName,
  canDelete = false,
  className = "",
}: {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  creatorName: string | null;
  canDelete?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  const headline = creatorName
    ? `O ${creatorName.toUpperCase()} ACABOU DE POSTAR VÍDEO NOVO`
    : "VÍDEO NOVO PUBLICADO";

  return (
    <div className={`group relative rounded-xl border-l-4 border-amber-400 bg-surface pl-4 pr-3 py-3 sm:pl-5 ${className}`}>
      <p className="label-loose text-[9px] text-muted-dim mb-1.5 flex items-center gap-1.5">
        <span aria-hidden>🔔</span> Notificação
      </p>
      <p className="text-sm font-semibold tracking-tight text-white mb-3">{headline}</p>

      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border-l-4 border-amber-400/50 bg-surface-3"
      >
        {creatorName && (
          <div className="flex items-center gap-2 px-3 pt-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-semibold text-white">
              {initials(creatorName)}
            </span>
            <span className="text-sm font-semibold text-white">{creatorName}</span>
          </div>
        )}

        <p className="px-3 pt-2 pb-3 text-sm text-muted leading-relaxed whitespace-pre-wrap break-words">
          {title}
        </p>

        <div className="relative aspect-video w-full bg-surface">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
              🎬
            </div>
          )}
        </div>

        <div className="p-3">
          <span className="label-loose text-[10px] text-white bg-white/[0.08] group-hover:bg-white/[0.14] transition-colors rounded-md px-4 py-2 inline-flex items-center gap-1.5">
            <span aria-hidden>▶</span> Assistir vídeo
          </span>
        </div>
      </a>

      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await deleteFeaturedVideo(id);
              if (!result?.error) setRemoved(true);
            });
          }}
          title="Remover vídeo"
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/90 group-hover:opacity-100 disabled:opacity-50"
        >
          ✕
        </button>
      )}
    </div>
  );
}
