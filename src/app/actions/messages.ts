"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SendMessageSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string().trim().min(1, "Escreva algo antes de enviar.").max(2000, "Mensagem muito longa."),
});

export type SendMessageState = { error?: string } | undefined;

export async function sendMessage(
  _state: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  const parsed = SendMessageSchema.safeParse({
    channelId: formData.get("channelId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Recarregue a página." };
  }

  const { error } = await supabase.from("messages").insert({
    channel_id: parsed.data.channelId,
    profile_id: user.id,
    content: parsed.data.content,
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
