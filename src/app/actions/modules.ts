"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CreateModuleSchema = z.object({
  title: z.string().trim().min(3, "Dê um título pro módulo.").max(120, "Título muito longo."),
  description: z.string().trim().max(300, "Descrição muito longa.").optional(),
  // Accepts a full URL or a relative /public path (e.g. /images/landing/foo.png)
  // -- both resolve fine in an <img src>, and a relative path works the same
  // locally and once deployed, so it doesn't have to be an absolute URL.
  coverUrl: z.string().trim().max(2000, "Link muito longo.").optional().or(z.literal("")),
  isLocked: z.boolean(),
  hideCaption: z.boolean(),
});

export type CreateModuleState = { error?: string } | undefined;

/**
 * Admin-only (the "only admins can write modules" RLS policy in
 * 0011_modules_lessons.sql is the real backstop -- this is just a
 * friendlier error message than a raw 42501).
 */
export async function createModule(
  _state: CreateModuleState,
  formData: FormData
): Promise<CreateModuleState> {
  const parsed = CreateModuleSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    coverUrl: formData.get("coverUrl") || "",
    isLocked: formData.get("isLocked") === "on",
    hideCaption: formData.get("hideCaption") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const { data: maxOrderRow } = await supabase
    .from("modules")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxOrderRow?.order ?? -1) + 1;

  const { error } = await supabase.from("modules").insert({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    cover_url: parsed.data.coverUrl || null,
    is_locked: parsed.data.isLocked,
    hide_caption: parsed.data.hideCaption,
    order: nextOrder,
  });

  if (error) {
    console.error("[createModule] Supabase error:", error);
    if (error.code === "42501") {
      return { error: "Só admins podem criar módulos." };
    }
    return { error: "Não foi possível criar o módulo. Tente novamente." };
  }

  revalidatePath("/comunidade");
  return undefined;
}

export type DeleteModuleState = { error?: string } | undefined;

export async function deleteModule(id: string): Promise<DeleteModuleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const { error } = await supabase.from("modules").delete().eq("id", id);

  if (error) {
    console.error("[deleteModule] Supabase error:", error);
    return { error: "Não foi possível remover. Tente novamente." };
  }

  revalidatePath("/comunidade");
  return undefined;
}

const CreateLessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().trim().min(3, "Dê um título pra aula.").max(120, "Título muito longo."),
  description: z.string().trim().max(300, "Descrição muito longa.").optional(),
  videoUrl: z.string().trim().url("Cole um link de vídeo válido."),
  thumbnailUrl: z.string().trim().url("Cole um link de imagem válido.").optional().or(z.literal("")),
});

export type CreateLessonState = { error?: string } | undefined;

export async function createLesson(
  _state: CreateLessonState,
  formData: FormData
): Promise<CreateLessonState> {
  const parsed = CreateLessonSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    videoUrl: formData.get("videoUrl"),
    thumbnailUrl: formData.get("thumbnailUrl") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const { data: maxOrderRow } = await supabase
    .from("lessons")
    .select("order")
    .eq("module_id", parsed.data.moduleId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxOrderRow?.order ?? -1) + 1;

  const { error } = await supabase.from("lessons").insert({
    module_id: parsed.data.moduleId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    video_url: parsed.data.videoUrl,
    thumbnail_url: parsed.data.thumbnailUrl || null,
    order: nextOrder,
  });

  if (error) {
    console.error("[createLesson] Supabase error:", error);
    if (error.code === "42501") {
      return { error: "Só admins podem adicionar aulas." };
    }
    return { error: "Não foi possível adicionar a aula. Tente novamente." };
  }

  revalidatePath(`/comunidade/modulos/${parsed.data.moduleId}`);
  return undefined;
}

export type DeleteLessonState = { error?: string } | undefined;

export async function deleteLesson(id: string, moduleId: string): Promise<DeleteLessonState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Recarregue a página." };

  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    console.error("[deleteLesson] Supabase error:", error);
    return { error: "Não foi possível remover. Tente novamente." };
  }

  revalidatePath(`/comunidade/modulos/${moduleId}`);
  return undefined;
}
