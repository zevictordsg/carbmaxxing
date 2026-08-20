"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitRecipe, type SubmitRecipeState } from "@/app/actions/content";

const initialState: SubmitRecipeState = undefined;

export function RecipeSubmitForm() {
  const [state, formAction, pending] = useActionState(submitRecipe, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.success) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
        <span aria-hidden>✍️</span> Manda sua receita
      </p>
      <p className="mt-1 text-xs text-muted-dim leading-relaxed">
        Qualquer membro pode contribuir. Sua receita entra em análise e aparece pra
        todo mundo assim que um admin aprovar.
      </p>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          name="title"
          placeholder="Título da receita"
          autoComplete="off"
          maxLength={120}
          className="w-full rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <textarea
          name="description"
          placeholder="Ingredientes e modo de preparo (opcional, até 500 caracteres)"
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />

        <div className="flex items-center justify-between gap-3">
          <div>
            {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
            {state?.success && (
              <p className="text-xs text-muted-dim">
                ✅ Enviada! Assim que um admin aprovar, ela aparece na grade.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="label-loose text-[10px] text-white bg-white/[0.08] hover:bg-white/[0.14] transition-colors rounded-md px-4 py-2.5 disabled:opacity-50 shrink-0"
          >
            {pending ? "Enviando..." : "Enviar receita"}
          </button>
        </div>
      </form>
    </div>
  );
}
