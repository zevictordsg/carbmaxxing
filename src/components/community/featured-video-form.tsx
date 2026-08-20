"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFeaturedVideo, type CreateVideoState } from "@/app/actions/videos";

const initialState: CreateVideoState = undefined;

export function FeaturedVideoForm() {
  const [state, formAction, pending] = useActionState(createFeaturedVideo, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="rounded-xl border border-amber-400/30 bg-surface p-5">
      <p className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
        <span aria-hidden>⭐</span> Publicar vídeo em destaque
      </p>
      <p className="mt-1 text-xs text-muted-dim">
        Cole um link do YouTube, Vimeo ou onde o vídeo estiver. Só você (admin) vê este formulário.
      </p>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="creatorName"
            placeholder="Nome do criador (opcional)"
            autoComplete="off"
            maxLength={60}
            className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors sm:w-48"
          />
          <input
            type="url"
            name="videoUrl"
            placeholder="Link do vídeo (https://...)"
            autoComplete="off"
            className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
          />
        </div>
        <input
          type="text"
          name="title"
          placeholder="Legenda do vídeo (aparece em destaque no card)"
          autoComplete="off"
          maxLength={120}
          className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <div className="flex items-center justify-between gap-3">
          {state?.error ? (
            <p className="text-xs text-red-400">{state.error}</p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={pending}
            className="label-loose text-[10px] text-black bg-amber-400 hover:bg-amber-300 transition-colors rounded-md px-4 py-2.5 disabled:opacity-50 shrink-0"
          >
            {pending ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}
