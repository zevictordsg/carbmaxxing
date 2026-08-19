"use client";

import { useState, useTransition } from "react";
import { setAdmin } from "@/app/actions/admin";

export function AdminToggleButton({
  profileId,
  isAdmin,
}: {
  profileId: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setAdmin(profileId, !isAdmin);
            if (result?.error) setError(result.error);
          });
        }}
        className={`label-loose text-[10px] rounded-md px-3 py-1.5 transition-colors disabled:opacity-50 shrink-0 ${
          isAdmin
            ? "text-muted-dim hover:text-white bg-white/[0.04] hover:bg-white/[0.08]"
            : "text-white bg-white/[0.08] hover:bg-white/[0.14]"
        }`}
      >
        {isAdmin ? "Remover admin" : "Tornar admin"}
      </button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
