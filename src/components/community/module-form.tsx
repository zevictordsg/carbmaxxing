"use client";

import { useActionState, useEffect, useRef } from "react";
import { createModule, type CreateModuleState } from "@/app/actions/modules";

const initialState: CreateModuleState = undefined;

/**
 * Admin-only "novo módulo" form -- title + optional cover image link +
 * lock toggle. Description is intentionally short (shows under the title
 * on the module page); real cover art gets swapped in later, so a blank
 * cover falls back to CoverPlaceholder everywhere it's rendered.
 */
export function ModuleForm() {
  const [state, formAction, pending] = useActionState(createModule, initialState);
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
        <span aria-hidden>➕</span> Novo módulo
      </p>
      <p className="mt-1 text-xs text-muted-dim">
        Só você (admin) vê este formulário. Dá pra adicionar as aulas depois de criar.
      </p>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          name="title"
          placeholder="Título do módulo"
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
          name="coverUrl"
          placeholder="Link da capa (opcional -- pode adicionar depois)"
          autoComplete="off"
          className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <label className="flex items-center gap-2 text-sm text-muted select-none">
          <input
            type="checkbox"
            name="isLocked"
            defaultChecked
            className="h-4 w-4 rounded border-border-subtle bg-surface-3 accent-amber-400"
          />
          Conteúdo travado (só assinantes/admin)
        </label>
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
            {pending ? "Criando..." : "Criar módulo"}
          </button>
        </div>
      </form>
    </div>
  );
}
