"use client";

import { useState, useTransition } from "react";
import { ContentCard } from "@/components/community/content-card";
import { deleteModule } from "@/app/actions/modules";

/**
 * ContentCard (the Balaclava-style cover card) plus an admin-only delete
 * button. Kept as its own client component instead of teaching ContentCard
 * about deletion, since ContentCard is also used by the legacy
 * (unlinked-but-still-live) content channels.
 */
export function ModuleCard({
  id,
  title,
  isLocked,
  coverUrl,
  canDelete = false,
  className = "",
}: {
  id: string;
  title: string;
  isLocked: boolean;
  coverUrl: string | null;
  canDelete?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return (
    <div className={`group relative ${className}`}>
      <ContentCard
        href={`/comunidade/modulos/${id}`}
        categoryLabel="Módulo"
        title={title}
        isLocked={isLocked}
        coverUrl={coverUrl}
      />
      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await deleteModule(id);
              if (!result?.error) setRemoved(true);
            });
          }}
          title="Remover módulo"
          className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/90 group-hover:opacity-100 disabled:opacity-50"
        >
          ✕
        </button>
      )}
    </div>
  );
}
