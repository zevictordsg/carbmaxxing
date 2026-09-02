"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLesson, type CreateLessonState } from "@/app/actions/modules";

const initialState: CreateLessonState = undefined;

export function LessonForm({ moduleId }: { moduleId: string }) {
  const [state, formAction, pending] = useActionState(createLesson, initialState);
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
        <span aria-hidden>➕</span> Nova aula
      </p>
      <p className="mt-1 text-xs text-muted-dim">Só você (admin) vê este formulário.</p>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="moduleId" value={moduleId} />
        <input
          type="text"
          name="title"
          placeholder="Título da aula"
          autoComplete="off"
          maxLength={120}
          className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <textarea
          name="description"
          placeholder="Descrição curta (opcional)"
          maxLength={300}
          rows={2}
          className="w-full resize-none rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <input
          type="url"
          name="videoUrl"
          placeholder="Link do vídeo (https://...)"
          autoComplete="off"
          className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <input
          type="url"
          name="thumbnailUrl"
          placeholder="Link da miniatura (opcional)"
          autoComplete="off"
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
            {pending ? "Adicionando..." : "Adicionar aula"}
          </button>
        </div>
      </form>
    </div>
  );
}
