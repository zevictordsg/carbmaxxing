import Image from "next/image";

/**
 * Welcome banner for the top of the Feed -- reuses the same landing-page
 * photo (public/images/landing/desktop-hero.webp) so the member area and
 * the marketing site read as one brand, styled after the reference "member
 * area" banner (full-bleed photo, dark scrim, wordmark + tagline).
 */
export function MemberBanner() {
  return (
    <section className="relative h-[220px] w-full overflow-hidden rounded-2xl border border-border-subtle sm:h-[280px] md:h-[320px]">
      <Image
        src="/images/landing/desktop-hero.webp"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 flex h-full flex-col justify-end px-6 py-6 sm:px-8 sm:py-8">
        <p className="label-loose text-[10px] text-white/60 mb-2">Bem-vindo</p>
        <h1 className="heading-tight flex items-start text-3xl text-white sm:text-4xl">
          Carbmaxxing<span className="ml-1 mt-1 text-lg sm:text-xl">®</span>
        </h1>
        <p className="mt-2 max-w-md text-sm font-medium tracking-tight text-white/70 sm:text-base">
          Treinos, refeições e uma comunidade inteira puxando pro mesmo objetivo que você.
        </p>
      </div>
    </section>
  );
}
