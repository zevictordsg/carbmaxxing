import Link from "next/link";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Slim top bar for the members area -- logo on the left, profile/admin/exit
 * on the right. Replaces the old channel sidebar entirely: there's no
 * longer a list of chat channels to navigate, just the member's own
 * shortcuts. `fixed` + a transparent-to-nothing gradient (not a solid bar)
 * so it floats directly over the hero image instead of pushing it down --
 * the Netflix/Balaclava treatment, logo overlaid on the photo itself.
 * layout.tsx reserves matching top padding on <main> for pages that don't
 * have a hero image behind the bar; hero sections cancel that padding
 * with a negative margin so the photo still starts at the true viewport
 * top.
 */
export function TopBar({
  displayName,
  avatarUrl,
  isAdmin,
  logoutAction,
}: {
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  logoutAction: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent px-4 py-3 md:px-8 print:hidden">
      <Link href="/comunidade" className="heading-tight-2 text-base text-white shrink-0">
        Carbmaxxing<span className="align-super text-[9px]">®</span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4">
        {isAdmin && (
          <Link
            href="/comunidade/admin"
            className="label-loose text-[10px] text-muted-dim hover:text-white transition-colors hidden sm:inline"
          >
            🛠️ Admin
          </Link>
        )}
        <Link href="/comunidade/perfil" className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-surface-3 flex items-center justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-semibold text-muted">{initials(displayName)}</span>
            )}
          </div>
          <span className="hidden text-sm font-medium tracking-tight text-white truncate sm:inline">
            {displayName}
          </span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Sair"
            className="label-loose text-[10px] text-muted-dim hover:text-white transition-colors"
          >
            🚪<span className="hidden sm:inline"> Sair</span>
          </button>
        </form>
      </div>
    </header>
  );
}
