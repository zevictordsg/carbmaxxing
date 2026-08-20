"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CreateVideoSchema = z.object({
  title: z.string().trim().min(3, "Dê um título pro vídeo.").max(120, "Título muito longo."),
  videoUrl: z.string().trim().url("Cole um link válido."),
  description: z.string().trim().max(300, "Descrição muito longa.").optional(),
});

export type CreateVideoState = { error?: string } | undefined;

/**
 * Pulls a predictable thumbnail straight out of the YouTube CDN when the
 * link is a YouTube video/short -- no oEmbed round-trip needed. Other
 * hosts (Vimeo, Drive, TikTok...) fall back to a placeholder card in the UI.
 */
function extractYoutubeThumbnail(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

/**
 * Admin-only (enforced twofold: the "only admins can write featured
 * videos" RLS policy in 0008_featured_videos.sql is the real backstop,
 * this is just a friendlier error message than a raw 42501).
 */
export async function createFeaturedVideo(
  _state: CreateVideoState,
  formData: FormData
): Promise<CreateVideoState> {
  const parsed = CreateVideoSchema.safeParse({
    title: formData.get("title"),
    videoUrl: formData.get("videoUrl"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const { error } = await supabase.from("featured_videos").insert({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    video_url: parsed.data.videoUrl,
    thumbnail_url: extractYoutubeThumbnail(parsed.data.videoUrl),
    created_by: user.id,
  });

  if (error) {
    console.error("[createFeaturedVideo] Supabase error:", error);
    if (error.code === "42501") {
      return { error: "Só admins podem publicar vídeos em destaque." };
    }
    return { error: "Não foi possível publicar. Tente novamente." };
  }

  revalidatePath("/comunidade");
  return undefined;
}

export type DeleteVideoState = { error?: string } | undefined;

export async function deleteFeaturedVideo(id: string): Promise<DeleteVideoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const { error } = await supabase.from("featured_videos").delete().eq("id", id);

  if (error) {
    console.error("[deleteFeaturedVideo] Supabase error:", error);
    return { error: "Não foi possível remover. Tente novamente." };
  }

  revalidatePath("/comunidade");
  return undefined;
}
