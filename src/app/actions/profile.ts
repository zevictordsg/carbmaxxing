"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DisplayNameSchema = z.object({
  displayName: z.string().trim().min(2, "Nome muito curto.").max(60, "Nome muito longo."),
});

export type UpdateProfileState = { error?: string; success?: boolean } | undefined;

export async function updateDisplayName(
  _state: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const parsed = DisplayNameSchema.safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    console.error("[updateDisplayName] Supabase error:", error);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/comunidade/perfil");
  revalidatePath("/comunidade");
  return { success: true };
}

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type UploadAvatarState = { error?: string; success?: boolean } | undefined;

/**
 * Uploads straight to the "avatars" Storage bucket via the request-scoped
 * (cookie-authenticated) client, so storage RLS sees the real auth.uid()
 * (see supabase/migrations/0006_avatars_storage.sql -- each user can only
 * write inside their own {user_id}/ folder).
 */
export async function uploadAvatar(
  _state: UploadAvatarState,
  formData: FormData
): Promise<UploadAvatarState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolha uma imagem." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Use PNG, JPG ou WEBP." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Imagem muito grande (máx. 3MB)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("[uploadAvatar] Storage error:", uploadError);
    return { error: "Não foi possível enviar a imagem. Tente novamente." };
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the browser picks up the new image at the same path.
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("[uploadAvatar] Supabase error:", updateError);
    return { error: "Imagem enviada, mas não deu pra salvar no perfil." };
  }

  revalidatePath("/comunidade/perfil");
  revalidatePath("/comunidade");
  return { success: true };
}
