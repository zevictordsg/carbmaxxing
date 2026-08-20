"use client";

import { useActionState, useRef, useState } from "react";
import { uploadAvatar, type UploadAvatarState } from "@/app/actions/profile";

const initialState: UploadAvatarState = undefined;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function AvatarUploader({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(uploadAvatar, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Once the server confirms the new avatar (avatarUrl prop changes after
  // revalidatePath), drop the local blob preview in favor of the real URL.
  // Adjusting state during render (not in an effect) per React's guidance
  // for resetting state in response to a prop change.
  const [lastSeenAvatarUrl, setLastSeenAvatarUrl] = useState(avatarUrl);
  if (avatarUrl !== lastSeenAvatarUrl) {
    setLastSeenAvatarUrl(avatarUrl);
    setPreview(null);
  }

  const src = preview ?? avatarUrl;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex items-center gap-4"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-surface-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted">
            {initials(displayName)}
          </div>
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-[9px] text-white">...</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
            formRef.current?.requestSubmit();
          }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="label-loose text-[10px] text-white bg-white/[0.08] hover:bg-white/[0.14] transition-colors rounded-md px-4 py-2 disabled:opacity-50 self-start"
        >
          {pending ? "Enviando..." : "Trocar foto"}
        </button>
        <p className="text-[11px] text-muted-dim">PNG, JPG ou WEBP · máx. 3MB</p>
        {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      </div>
    </form>
  );
}
