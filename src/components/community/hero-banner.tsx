import Image from "next/image";

/**
 * Netflix-style hero: full-bleed backdrop, title + short line, and (when
 * there's a featured video) an "Assistir" CTA that opens it. Driven by the
 * most recent featured_videos row -- falls back to the plain welcome
 * banner (same photo as the landing hero) when there's no featured video
 * yet, so the page never looks broken.
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
      {/* Photo stays bright and mostly unobscured -- just a thin, soft
          darken band right behind the title so the text stays legible,
          instead of a wash across the whole image. */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/55 to-transparent" />
      {/* Short fade into the page background, anchored right at the very
          bottom edge -- just enough to bleed into the modules grid below
          without eating into the photo itself. */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-2 to-transparent sm:h-32 md:h-40" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-10 sm:pb-12 md:px-10 md:pb-14">
        {creatorName && (
          <p className="label-loose text-[10px] text-white/60 mb-3">{creatorName}</p>
        )}
        <h1 className="heading-tight max-w-2xl text-xl text-white sm:text-3xl md:text-4xl">
          {title || "Carbmaxxing®"}
        </h1>
        <p className="mt-2 max-w-md text-xs font-medium tracking-tight text-white/70 sm:text-sm">
          {hasVideo ? "Novo conteúdo em destaque -- assista agora." : "Hackeie seus ganhos"}
        </p>

        {hasVideo && (
          <div className="mt-6 flex items-center gap-3">
            <a
              href={videoUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85"
            >
              <span aria-hidden>▶</span> Assistir
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
