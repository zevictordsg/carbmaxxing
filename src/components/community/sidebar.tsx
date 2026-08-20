"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_EMOJI, channelEmoji, type ChannelGroup } from "@/lib/channels";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function AvatarThumb({ displayName, avatarUrl }: { displayName: string; avatarUrl: string | null }) {
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-surface-3 flex items-center justify-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-semibold text-muted">{initials(displayName)}</span>
      )}
    </div>
  );
}

function NavBody({
  groups,
  pathname,
  isAdmin,
  onNavigate,
}: {
  groups: ChannelGroup[];
  pathname: string;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4">
      <Link
        href="/comunidade"
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium tracking-tight mb-1 transition-colors ${
          pathname === "/comunidade"
            ? "bg-white/[0.06] text-white"
            : "text-muted hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        <span aria-hidden>🔥</span> Feed
      </Link>

      <Link
        href="/comunidade/perfil"
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium tracking-tight transition-colors ${
          pathname === "/comunidade/perfil"
            ? "bg-white/[0.06] text-white"
            : "text-muted hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        <span aria-hidden>👤</span> Perfil
      </Link>

      {isAdmin && (
        <Link
          href="/comunidade/admin"
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium tracking-tight mb-4 transition-colors ${
            pathname === "/comunidade/admin"
              ? "bg-white/[0.06] text-white"
              : "text-muted hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <span aria-hidden>🛠️</span> Painel Admin
        </Link>
      )}
      {!isAdmin && <div className="mb-4" />}

      {groups.map((group) => (
        <div key={group.category} className="mb-5">
          <p className="label-loose text-[10px] text-muted-dim px-3 mb-1.5 flex items-center gap-1.5">
            <span aria-hidden>{CATEGORY_EMOJI[group.category] ?? "•"}</span>
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.channels.map((channel) => {
              const href = `/comunidade/${channel.slug}`;
              const active = pathname === href;
              return (
                <li key={channel.id}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm tracking-tight transition-colors ${
                      active
                        ? "bg-white/[0.06] text-white"
                        : "text-muted hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span aria-hidden>{channelEmoji(channel.slug)}</span>
                      <span className="truncate">{channel.name}</span>
                    </span>
                    {channel.admin_only_posting && (
                      <span className="label-loose text-[8px] text-muted-dim shrink-0">
                        Admin
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({
  displayName,
  avatarUrl,
  isAdmin,
  groups,
  logoutAction,
}: {
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  groups: ChannelGroup[];
  logoutAction: () => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoutButton = (
    <form action={logoutAction}>
      <button
        type="submit"
        className="label-loose text-[10px] text-muted-dim hover:text-white transition-colors flex items-center gap-1"
      >
        <span aria-hidden>🚪</span> Sair
      </button>
    </form>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
        <span className="heading-tight-2 text-sm text-white">Carbmaxxing</span>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="label-loose text-[10px] text-muted-dim hover:text-white transition-colors"
        >
          {mobileOpen ? "Fechar" : "Menu"}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-b border-border-subtle bg-surface px-3 pb-4 flex flex-col">
          <NavBody
            groups={groups}
            pathname={pathname}
            isAdmin={isAdmin}
            onNavigate={() => setMobileOpen(false)}
          />
          <div className="border-t border-border-subtle px-3 pt-3 flex items-center justify-between gap-2">
            <Link
              href="/comunidade/perfil"
              onClick={() => setMobileOpen(false)}
              className="flex min-w-0 items-center gap-2"
            >
              <AvatarThumb displayName={displayName} avatarUrl={avatarUrl} />
              <span className="text-sm font-medium tracking-tight text-white truncate">
                {displayName}
              </span>
            </Link>
            {logoutButton}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface h-screen sticky top-0">
        <div className="px-5 pt-6 pb-4">
          <span className="heading-tight-2 text-base text-white">Carbmaxxing</span>
        </div>

        <NavBody groups={groups} pathname={pathname} isAdmin={isAdmin} />

        <div className="border-t border-border-subtle px-4 py-4 flex items-center justify-between gap-2">
          <Link href="/comunidade/perfil" className="flex min-w-0 items-center gap-2">
            <AvatarThumb displayName={displayName} avatarUrl={avatarUrl} />
            <span className="text-sm font-medium tracking-tight text-white truncate">
              {displayName}
            </span>
          </Link>
          {logoutButton}
        </div>
      </aside>
    </>
  );
}
