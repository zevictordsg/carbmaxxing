"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEvent, type CreateEventState } from "@/app/actions/events";

const initialState: CreateEventState = undefined;

export function EventCreateForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
        <span aria-hidden>🗓️</span> Agendar call
      </p>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          name="title"
          placeholder="Título da call"
          autoComplete="off"
          maxLength={120}
          className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <textarea
          name="description"
          placeholder="Descrição (opcional)"
          maxLength={500}
          rows={2}
          className="w-full resize-none rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="datetime-local"
            name="scheduledAt"
            className="w-full rounded-md bg-surface-3 border border-border-subtle text-white text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors [color-scheme:dark]"
          />
          <input
            type="url"
            name="externalUrl"
            placeholder="Link (Zoom, Meet...)"
            autoComplete="off"
            className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {state?.error ? (
            <p className="text-xs text-red-400">{state.error}</p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={pending}
            className="label-loose text-[10px] text-white bg-white/[0.08] hover:bg-white/[0.14] transition-colors rounded-md px-4 py-2.5 disabled:opacity-50 shrink-0"
          >
            {pending ? "Agendando..." : "Agendar"}
          </button>
        </div>
      </form>
    </div>
  );
}
