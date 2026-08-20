"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);
  const [preview, setPreview] = useState<string | null>(null);

  function clearImage() {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Clear the input after a successful send. We don't reset optimistically
  // (before the action resolves) since a validation error needs the text
  // to stay put so the person can fix it.
  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
      setPreview(null);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="border-t border-border-subtle px-4 py-3 md:px-6">
      <input type="hidden" name="channelId" value={channelId} />

      {preview && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={clearImage}
            className="label-loose text-[10px] text-muted-dim hover:text-white transition-colors"
          >
            Remover
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Anexar imagem"
          className="shrink-0 rounded-md border border-border-subtle bg-surface-3 px-3 py-2.5 text-muted-dim hover:text-white transition-colors"
        >
          📎
        </button>
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
          {pending ? "Enviando..." : "Enviar"}
        </button>
      </div>
      {state?.error && <p className="mt-1.5 text-xs text-red-400">{state.error}</p>}
    </form>
  );
}
