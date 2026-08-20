"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SubmitRecipeSchema = z.object({
  title: z.string().trim().min(3, "Dê um título pra sua receita.").max(120, "Título muito longo."),
  description: z
    .string()
    .trim()
    .max(500, "Descrição muito longa (máx. 500 caracteres).")
    .optional(),
});

export type SubmitRecipeState = { error?: string; success?: boolean } | undefined;

/**
 * Any authenticated member can submit a recipe -- it lands as status
 * "pending" (enforced by the "members can submit their own content" RLS
 * policy in supabase/migrations/0004_content_submissions.sql) and only
 * shows up publicly once an admin approves it.
 */
export async function submitRecipe(
  _state: SubmitRecipeState,
  formData: FormData
): Promise<SubmitRecipeState> {
  const parsed = SubmitRecipeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Recarregue a página." };
  }

  const { data: receitas } = await supabase
    .from("channels")
    .select("id")
    .eq("slug", "receitas")
    .single();

  if (!receitas) {
    return { error: "Canal de receitas não encontrado." };
  }

  const { error } = await supabase.from("content_items").insert({
    channel_id: receitas.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    is_locked: false,
    submitted_by: user.id,
    status: "pending",
  });

  if (error) {
    console.error("[submitRecipe] Supabase error:", error);
    return { error: "Não foi possível enviar. Tente novamente." };
  }

  revalidatePath("/comunidade/receitas");
  return { success: true };
}

export type ModerateContentState = { error?: string } | undefined;

/**
 * Admin-only approve/reject. Uses the ordinary (RLS-checked) client, not
 * the service-role one -- "only admins can write content items" already
 * covers this via public.is_admin(), no bypass needed.
 */
export async function moderateContentItem(
  itemId: string,
  decision: "approved" | "rejected"
): Promise<ModerateContentState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Recarregue a página." };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!callerProfile?.is_admin) {
    return { error: "Só admins podem fazer isso." };
  }

  const { error } = await supabase
    .from("content_items")
    .update({ status: decision })
    .eq("id", itemId);

  if (error) {
    console.error("[moderateContentItem] Supabase error:", error);
    return { error: "Não foi possível atualizar. Tente novamente." };
  }

  revalidatePath("/comunidade/receitas");
  return undefined;
}
