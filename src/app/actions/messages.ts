"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SendMessageSchema = z.object({
  channelId: z.string().uuid(),
  // Empty string is valid here -- an image-only message has no text. The
  // "at least one of content/image" rule is enforced below, after we know
  // whether a file was attached.
  content: z.string().trim().max(2000, "Mensagem muito longa."),
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export type SendMessageState = { error?: string } | undefined;

export async function sendMessage(
  _state: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  const parsed = SendMessageSchema.safeParse({
    channelId: formData.get("channelId"),
    content: formData.get("content") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };
  }

  const imageField = formData.get("image");
  const hasImage = imageField instanceof File && imageField.size > 0;

  if (!parsed.data.content && !hasImage) {
    return { error: "Escreva algo ou anexe uma imagem." };
  }

  if (hasImage) {
    const file = imageField as File;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { error: "Use PNG, JPG, WEBP ou GIF." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "Imagem muito grande (máx. 5MB)." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Recarregue a página." };
  }

  let imageUrl: string | null = null;
  if (hasImage) {
    const file = imageField as File;
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("message-images")
      .upload(path, bytes, { contentType: file.type });

    if (uploadError) {
      console.error("[sendMessage] Storage error:", uploadError);
      return { error: "Não foi possível enviar a imagem. Tente novamente." };
    }

    const { data: publicUrlData } = supabase.storage.from("message-images").getPublicUrl(path);
    imageUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from("messages").insert({
    channel_id: parsed.data.channelId,
    profile_id: user.id,
    content: parsed.data.content,
    image_url: imageUrl,
  });

  if (error) {
    // RLS blocks non-admins posting in admin_only_posting channels (e.g.
    // "avisos") with a permission-denied error -- surface that distinctly.
    console.error("[sendMessage] Supabase error:", error);
    if (error.code === "42501") {
      return { error: "Você não tem permissão para postar neste canal." };
    }
    return { error: "Não foi possível enviar. Tente novamente." };
  }

  return undefined;
}
