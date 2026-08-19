import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-6 sm:px-10 py-6">
      <Link href="/" className="heading-tight-2 text-lg">
        Carbomaxxing<span className="align-super text-[9px]">®</span>
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/login"
          className="label-loose text-[11px] text-white/80 hover:text-white hidden sm:inline"
        >
          Entrar
        </Link>
        <ButtonLink href="/cadastro" className="px-5 py-2.5 text-[11px]">
          Assinar
        </ButtonLink>
      </nav>
    </header>
  );
}
