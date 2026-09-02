"use client";

import { useState, useTransition } from "react";
import { deleteLesson } from "@/app/actions/modules";

/**
 * One row in a module's aula list: thumbnail, title, optional description,
 * and a link that opens the video in a new tab -- same "thumbnail + link,
 * no embed" pattern already established for featured videos.
 */
export function LessonCard({
  id,
  moduleId,
  title,
  description,
  videoUrl,
  thumbnailUrl,
  canDelete = false,
}: {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  canDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return (
    <div className="group relative flex items-center gap-4 rounded-xl border border-border-subtle bg-surface p-3">
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-surface-3 sm:w-40"
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl" aria-hidden>
            🎬
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm text-black">
            ▶
          </span>
        </div>
      </a>

      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight text-white line-clamp-2">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-dim line-clamp-2">{description}</p>
        )}
      </a>

      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await deleteLesson(id, moduleId);
              if (!result?.error) setRemoved(true);
            });
          }}
          title="Remover aula"
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-xs text-white opacity-0 transition-opacity hover:bg-white/[0.12] group-hover:opacity-100 disabled:opacity-50"
        >
          ✕
        </button>
      )}
    </div>
  );
}
