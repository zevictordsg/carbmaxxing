import Image from "next/image";

/**
 * Full-bleed welcome banner at the very top of the Feed -- no rounding, no
 * border, no side padding. Reuses the same landing photo
 * (public/images/landing/desktop-hero.webp) so the member area and the
 * marketing site read as one brand. Meant to feel cinematic/epic, not like
 * a boxed card -- callers must render it as the first, unpadded child of
 * the content pane (see src/app/comunidade/page.tsx).
 */
export function MemberBanner() {
  return (
    <section className="relative h-[300px] w-full overflow-hidden sm:h-[400px] md:h-[460px] lg:h-[520px]">
      <Image
        src="/images/landing/desktop-hero.webp"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-black/30 to-black/10" />
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-10 text-center sm:pb-14">
        <p className="label-loose text-[10px] text-white/60 mb-3">Bem-vindo</p>
        <h1 className="heading-tight flex items-start text-4xl text-white sm:text-5xl md:text-6xl">
          Carbmaxxing<span className="ml-1 mt-1 text-xl sm:text-2xl md:text-3xl">®</span>
        </h1>
        <p className="mt-3 max-w-md text-sm font-medium tracking-tight text-white/70 sm:text-base">
          Treinos, refeições e uma comunidade inteira puxando pro mesmo objetivo que você.
        </p>
      </div>
    </section>
  );
}
