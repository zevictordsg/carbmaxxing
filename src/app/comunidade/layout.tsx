import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { TopBar } from "@/components/community/top-bar";

export default async function ComunidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_admin")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-surface-2">
      <TopBar
        displayName={profile?.display_name ?? user.email ?? "Membro"}
        avatarUrl={profile?.avatar_url ?? null}
        isAdmin={profile?.is_admin ?? false}
        logoutAction={logout}
      />
      {/* pt-16 reserves room for the fixed TopBar on pages without a hero
          image behind it; hero sections cancel this with -mt-16 so their
          photo still reaches the true top of the viewport. */}
      <main className="flex-1 min-w-0 bg-surface-2 pt-16">{children}</main>
    </div>
  );
}
