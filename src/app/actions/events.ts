"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CreateEventSchema = z.object({
  title: z.string().trim().min(3, "Dê um título pra call.").max(120, "Título muito longo."),
  description: z.string().trim().max(500, "Descrição muito longa.").optional(),
  scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data/hora inválida."),
  externalUrl: z.string().trim().url("Link inválido — cole a URL completa (com https://)."),
});

export type CreateEventState = { error?: string } | undefined;

/**
 * Admin-only: schedules a call. RLS ("only admins can write events" in
 * supabase/migrations/0005_events.sql) is the real gate -- this check is
 * just so a non-admin gets a clean error instead of a silent RLS failure.
 */
export async function createEvent(
  _state: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const parsed = CreateEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    scheduledAt: formData.get("scheduledAt"),
    externalUrl: formData.get("externalUrl"),
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

  const { error } = await supabase.from("events").insert({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
    external_url: parsed.data.externalUrl,
    created_by: user.id,
  });

  if (error) {
    console.error("[createEvent] Supabase error:", error);
    if (error.code === "42501") {
      return { error: "Só admins podem agendar calls." };
    }
    return { error: "Não foi possível agendar. Tente novamente." };
  }

  revalidatePath("/comunidade/calls");
  return undefined;
}
