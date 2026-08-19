"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SetAdminState = { error?: string } | undefined;

/**
 * Grants/revokes is_admin on another member's profile. Only callable by an
 * already-admin caller (checked here, on top of the RLS trigger that blocks
 * self-escalation for everyone except the service role).
 *
 * Uses the service-role client on purpose: profiles.is_admin can only be
 * written by service_role per trg_prevent_self_admin_escalation
 * (supabase/migrations/0001_init.sql) -- an ordinary authenticated update
 * would silently get reverted by that trigger.
 */
export async function setAdmin(
  profileId: string,
  nextIsAdmin: boolean
): Promise<SetAdminState> {
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

  if (user.id === profileId && !nextIsAdmin) {
    return { error: "Você não pode remover seu próprio acesso de admin." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: nextIsAdmin })
    .eq("id", profileId);

  if (error) {
    console.error("[setAdmin] Supabase error:", error);
    return { error: "Não foi possível atualizar. Tente novamente." };
  }

  revalidatePath("/comunidade/admin");
  return undefined;
}
