import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * Placeholder landing spot for authenticated members. The full feed +
 * chat community (Fase 2) and paid-access gating (Fase 3) replace this.
 * Its job right now is to prove the auth loop end-to-end: signup/login
 * -> session cookie -> protected route.
 */
export default async function ComunidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="label-loose text-[10px] text-muted-dim mb-6">
        [Bem-vindo]
      </p>
      <h1 className="heading-tight text-4xl sm:text-5xl mb-4">
        {profile?.display_name ?? user.email}
      </h1>
      <p className="text-muted max-w-md mb-10">
        A comunidade completa (feed, canais e chat) entra na Fase 2. Por
        enquanto, isso confirma que seu login está funcionando de ponta a
        ponta.
      </p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </main>
  );
}
