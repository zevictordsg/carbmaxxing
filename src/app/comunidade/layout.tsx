import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Sidebar } from "@/components/community/sidebar";
import { groupChannelsByCategory, type Channel } from "@/lib/channels";

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

  const [{ data: profile }, { data: channels }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("channels")
      .select("id, name, slug, description, category, admin_only_posting, order")
      .order("order"),
  ]);

  const groups = groupChannelsByCategory((channels ?? []) as Channel[]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <Sidebar
        displayName={profile?.display_name ?? user.email ?? "Membro"}
        groups={groups}
        logoutAction={logout}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
