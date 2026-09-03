import Image from "next/image";

/**
 * Netflix-style hero: full-bleed backdrop, title + short line, a primary
 * "Assistir" CTA that opens the video link, and a secondary link down into
 * the modules grid. Driven by the most recent featured_videos row -- falls
 * back to the plain welcome banner (same photo as the landing hero) when
 * there's no featured video yet, so the page never looks broken.
 */
export function HeroBanner({
  title,
  videoUrl,
  thumbnailUrl,
  creatorName,
}: {
  title: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  creatorName: string | null;
}) {
  const hasVideo = Boolean(videoUrl);

  return (
    <section className="relative -mt-16 h-[440px] w-full overflow-hidden sm:h-[560px] md:h-[680px] lg:h-[760px]">
      <Image
        src={thumbnailUrl || "/images/landing/desktop-hero.webp"}
        alt=""
        fill
        priority
        quality={95}
        sizes="100vw"
        className="object-cover"
      />
      {/* General darken across the whole photo, strongest low and on the
          left, so the title stays legible over busy parts of the image. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/15 to-transparent" />
      {/* Tall, dedicated fade into the page background -- this is what
          makes the hero bleed seamlessly into the rest of the members
          area instead of cutting off at a hard edge. Ends in the exact
          page color (surface-2), so there's no visible seam. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-surface-2 via-surface-2/70 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-20 sm:pb-24 md:px-10 md:pb-28">
        {creatorName && (
          <p className="label-loose text-[10px] text-white/60 mb-3">{creatorName}</p>
        )}
        <h1 className="heading-tight max-w-2xl text-3xl text-white sm:text-5xl md:text-6xl">
          {title || "Carbmaxxing®"}
        </h1>
        <p className="mt-3 max-w-md text-sm font-medium tracking-tight text-white/70 sm:text-base">
          {hasVideo
            ? "Novo conteúdo em destaque -- assista agora."
            : "Treinos, refeições e módulos completos direto pra sua área de membro."}
        </p>

        <div className="mt-6 flex items-center gap-3">
          {hasVideo && (
            <a
              href={videoUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85"
            >
              <span aria-hidden>▶</span> Assistir
            </a>
          )}
          <a
            href="#modulos"
            className="flex items-center gap-2 rounded-md bg-white/[0.12] px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/[0.2]"
          >
            Ver módulos
          </a>
        </div>
      </div>
    </section>
  );
}
