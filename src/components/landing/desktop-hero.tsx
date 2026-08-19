import Image from "next/image";
import Link from "next/link";

/**
 * Desktop landing screen — 1:1 with Figma "Desk" (node 2549:1260).
 * Full-bleed cover photo, centered wordmark, single pill CTA.
 *
 * Drop the real export at /public/images/landing/desktop-hero.jpg
 * (photo of the two guys at the table). Until then this renders on a flat
 * dark tone so the layout/typography stay checkable.
 */
export function DesktopHero() {
  return (
    <section className="relative hidden md:flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#050505]">
      <Image
        src="/images/landing/desktop-hero.webp"
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Flat scrim (no gradient) so the wordmark stays legible over the photo */}
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 flex flex-col items-center px-6">
        <h1 className="heading-tight text-5xl lg:text-6xl xl:text-[64px] text-white flex items-start">
          Carbmaxxing
          <span className="text-2xl lg:text-3xl ml-1 mt-1">®</span>
        </h1>
        <p className="mt-2 text-white/60 text-lg lg:text-xl tracking-tight">
          by zevictor.gym
        </p>

        <Link
          href="/cadastro"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-white text-black px-8 py-4 text-base font-semibold tracking-tight hover:opacity-90 transition-opacity"
        >
          Entrar agora na Comunidade
        </Link>
      </div>
    </section>
  );
}
