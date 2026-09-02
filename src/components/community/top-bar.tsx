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
 * shortcuts. Modeled after Netflix's top nav (logo + a couple of icons),
 * not a full nav bar, since there's nothing left to list.
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-surface/90 px-4 py-3 backdrop-blur-sm md:px-8">
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
