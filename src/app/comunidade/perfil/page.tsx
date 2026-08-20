import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "@/components/community/avatar-uploader";
import { DisplayNameForm } from "@/components/community/display-name-form";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_admin, created_at")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email ?? "Membro";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="px-6 py-10 md:px-10 md:py-12 max-w-2xl">
      <p className="label-loose text-[10px] text-muted-dim mb-2">👤 Sua conta</p>
      <h1 className="heading-tight-2 text-2xl text-white mb-8">Perfil</h1>

      <div className="rounded-xl border border-border-subtle bg-surface p-6 mb-6">
        <p className="text-sm font-semibold tracking-tight text-white mb-4">Foto de perfil</p>
        <AvatarUploader displayName={displayName} avatarUrl={profile?.avatar_url ?? null} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-6 mb-6">
        <p className="text-sm font-semibold tracking-tight text-white mb-4">Nome</p>
        <DisplayNameForm currentName={displayName} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-6">
        <p className="text-sm font-semibold tracking-tight text-white mb-4">Informações</p>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-dim">E-mail</dt>
            <dd className="text-white">{user.email}</dd>
          </div>
          {memberSince && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-dim">Membro desde</dt>
              <dd className="text-white">{memberSince}</dd>
            </div>
          )}
          {profile?.is_admin && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-dim">Cargo</dt>
              <dd className="label-loose text-[10px] text-white bg-white/[0.08] rounded-full px-3 py-1">
                Admin
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
