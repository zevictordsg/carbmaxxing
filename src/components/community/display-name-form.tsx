"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateDisplayName, type UpdateProfileState } from "@/app/actions/profile";

const initialState: UpdateProfileState = undefined;

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState(updateDisplayName, initialState);
  const wasPending = useRef(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (wasPending.current && !pending && state?.success && savedTimeout.current === null) {
      savedTimeout.current = setTimeout(() => {
        savedTimeout.current = null;
      }, 2000);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="label-loose text-[10px] text-muted-dim" htmlFor="displayName">
        Nome de exibição
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="displayName"
          type="text"
          name="displayName"
          defaultValue={currentName}
          autoComplete="off"
          maxLength={60}
          className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <button
          type="submit"
          disabled={pending}
          className="label-loose text-[10px] text-white bg-white/[0.08] hover:bg-white/[0.14] transition-colors rounded-md px-5 py-2.5 disabled:opacity-50 shrink-0"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400">Nome atualizado ✓</p>}
    </form>
  );
}
