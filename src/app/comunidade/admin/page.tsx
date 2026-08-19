import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminToggleButton } from "@/components/community/admin-toggle-button";

const STATUS_LABEL: Record<string, string> = {
  incomplete: "Incompleta",
  active: "Ativa",
  past_due: "Atrasada",
  canceled: "Cancelada",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!callerProfile?.is_admin) redirect("/comunidade");

  const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, is_admin, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("profile_id, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  // subscriptions has no uniqueness guarantee per profile -- keep only the
  // most recent row per person (list is already ordered newest-first).
  const latestStatusByProfile = new Map<string, string>();
  for (const sub of subscriptions ?? []) {
    if (!latestStatusByProfile.has(sub.profile_id)) {
      latestStatusByProfile.set(sub.profile_id, sub.status);
    }
  }

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <p className="label-loose text-[10px] text-muted-dim mb-2">Admin</p>
      <h1 className="heading-tight-2 text-2xl text-white mb-1">Membros</h1>
      <p className="text-muted text-sm mb-8">
        {profiles?.length ?? 0} pessoas na comunidade.
      </p>

      <div className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle overflow-hidden">
        {(profiles ?? []).map((profile) => {
          const status = latestStatusByProfile.get(profile.id);
          return (
            <div
              key={profile.id}
              className="flex items-center justify-between gap-4 bg-surface px-5 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-white truncate">
                    {profile.display_name}
                  </span>
                  {profile.is_admin && (
                    <span className="label-loose text-[9px] text-muted-dim shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-dim mt-0.5">
                  Entrou em{" "}
                  {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                  {" · "}
                  {status ? STATUS_LABEL[status] ?? status : "Sem assinatura"}
                </p>
              </div>
              <AdminToggleButton profileId={profile.id} isAdmin={profile.is_admin} />
            </div>
          );
        })}
        {(profiles ?? []).length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-dim">Nenhum membro ainda.</p>
        )}
      </div>
    </div>
  );
}
