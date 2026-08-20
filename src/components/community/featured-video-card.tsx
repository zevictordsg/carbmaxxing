"use client";

import { useState, useTransition } from "react";
import { deleteFeaturedVideo } from "@/app/actions/videos";

export function FeaturedVideoCard({
  id,
  title,
  videoUrl,
  thumbnailUrl,
  canDelete = false,
  className = "",
}: {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  canDelete?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return (
    <div className={`group relative ${className}`}>
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video w-full overflow-hidden rounded-xl border border-amber-400/40 bg-surface-3"
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl" aria-hidden>
            🎬
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        <span className="absolute top-3 left-3 label-loose text-[9px] text-black bg-amber-400 rounded-full px-2.5 py-1 flex items-center gap-1 shadow">
          <span aria-hidden>⭐</span> Destaque
        </span>

        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
            ▶
          </span>
        </span>

        <p className="absolute bottom-0 left-0 right-0 p-3 heading-tight-2 text-sm text-white leading-tight line-clamp-2 sm:p-4 sm:text-base">
          {title}
        </p>
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
