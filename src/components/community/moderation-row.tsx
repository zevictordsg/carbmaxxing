"use client";

import { useState, useTransition } from "react";
import { moderateContentItem } from "@/app/actions/content";

export function ModerationRow({
  itemId,
  title,
  description,
  authorName,
}: {
  itemId: string;
  title: string;
  description: string | null;
  authorName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<"approved" | "rejected" | null>(null);

  if (resolved) return null;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-white truncate">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-xs text-muted-dim leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
          <p className="mt-1.5 text-[11px] text-muted-dim">por {authorName}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await moderateContentItem(itemId, "approved");
                if (result?.error) setError(result.error);
                else setResolved("approved");
              });
            }}
            className="label-loose text-[10px] text-white bg-white/[0.08] hover:bg-white/[0.14] transition-colors rounded-md px-3 py-1.5 disabled:opacity-50"
          >
            ✅ Aprovar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await moderateContentItem(itemId, "rejected");
                if (result?.error) setError(result.error);
                else setResolved("rejected");
              });
            }}
            className="label-loose text-[10px] text-muted-dim hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors rounded-md px-3 py-1.5 disabled:opacity-50"
          >
            ❌ Rejeitar
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
