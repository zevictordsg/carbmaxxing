"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type SendMessageState } from "@/app/actions/messages";

const initialState: SendMessageState = undefined;

export function MessageComposer({
  channelId,
  placeholder = "Escreva uma mensagem...",
}: {
  channelId: string;
  placeholder?: string;
}) {
  const [state, formAction, pending] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Clear the input after a successful send. We don't reset optimistically
  // (before the action resolves) since a validation error needs the text
  // to stay put so the person can fix it.
  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="border-t border-border-subtle px-4 py-3 md:px-6">
      <input type="hidden" name="channelId" value={channelId} />
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="content"
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 rounded-md bg-surface-3 border border-border-subtle text-white placeholder:text-muted-dim text-sm px-4 py-2.5 outline-none focus:border-white/25 transition-colors"
        />
        <button
          type="submit"
          disabled={pending}
          className="label-loose text-[10px] text-white bg-white/[0.08] hover:bg-white/[0.14] transition-colors rounded-md px-4 py-2.5 disabled:opacity-50 shrink-0"
        >
          Enviar
        </button>
      </div>
      {state?.error && <p className="mt-1.5 text-xs text-red-400">{state.error}</p>}
    </form>
  );
}
