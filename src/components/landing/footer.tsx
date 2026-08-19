import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-6 sm:px-10 py-10 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="label-loose text-[10px] text-muted-dim">
        Carbomaxxing® — by zevictor.gym
      </p>
      <div className="flex items-center gap-6">
        <Link
          href="/login"
          className="label-loose text-[10px] text-muted hover:text-white"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="label-loose text-[10px] text-muted hover:text-white"
        >
          Criar conta
        </Link>
      </div>
    </footer>
  );
}
