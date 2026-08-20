import Image from "next/image";
import Link from "next/link";

/**
 * Mobile landing screen — 1:1 with Figma "Phone" (node 2549:1305).
 * Link-in-bio style: logo, header, three link cards, footer handle.
 *
 * Image drops (see /public/images/landing/README.md):
 *   mobile-hero.webp, icon-community.webp, icon-auralab.webp,
 *   icon-tiktok.webp, logo-mark.svg, card-texture.png, tiktok-texture.png
 *
 */
const AURALAB_URL = "https://apps.apple.com/br/app/auralab/id6794130003";
const TIKTOK_URL = "https://www.tiktok.com/@zevictor.gym";

function LinkCard({
  href,
  external,
  className = "",
  style,
  animationDelay,
  icon,
  // "left" bleeds the artwork off the card's left edge (cards 1 and 3 in
  // Figma); "right" mirrors that for card 2, where the "A" bleeds off the
  // right edge instead, with the text on the left.
  iconPosition = "left",
  title,
  subtitle,
  titleClassName = "text-white",
  subtitleClassName = "text-white/60",
  // The grunge texture is light-colored, so it only reads clearly against
  // a dark base with "screen" (which adds light and disappears on white).
  // "overlay" keeps some contrast on the red/mid-tone card. Default to
  // overlay; the near-black card below opts into screen explicitly.
  textureBlend = "overlay",
  // Per-card texture override -- the TikTok card uses its own artwork
  // instead of the shared grunge pattern.
  textureSrc = "/images/landing/card-texture.png",
  // "cover" scales the texture to fill the card's full interior edge to
  // edge (default -- avoids the patchy look of a small tile repeating only
  // once or twice across a wide card). "tile" repeats a small swatch
  // instead, for textures meant to read as a repeating pattern.
  textureFit = "cover",
  // "high" is the bold default used on the community/auralab cards; the
  // TikTok card dials it down to "low" so its texture stays a subtle hint.
  textureOpacity = "high",
}: {
  href: string;
  external?: boolean;
  className?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
  icon: React.ReactNode;
  iconPosition?: "left" | "right";
  title: string;
  subtitle: string;
  titleClassName?: string;
  subtitleClassName?: string;
  textureBlend?: "overlay" | "screen" | "multiply" | "normal";
  textureSrc?: string;
  textureFit?: "tile" | "cover";
  textureOpacity?: "high" | "low";
}) {
  const textBlock = (
    <div className="relative flex flex-1 flex-col items-center gap-0.5 text-center">
      <span className={`text-sm font-bold tracking-tight ${titleClassName}`}>
        {title}
      </span>
      <span className={`text-xs tracking-tight ${subtitleClassName}`}>
        {subtitle}
      </span>
    </div>
  );

  // items-center + an icon taller than the card makes it bleed evenly past
  // the top/bottom edges on its own; overflow-hidden on the card (+ its
  // rounded corners) clips that overflow -- same effect as the Figma
  // frame, no manual vertical offset math needed.
  const iconBlock = (
    <div
      className={`relative shrink-0 ${iconPosition === "left" ? "-ml-5" : "-mr-5 ml-auto"}`}
    >
      {icon}
    </div>
  );

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{ ...style, animationDelay }}
      className={`animate-fade-up group relative flex items-center gap-4 w-full h-[72px] overflow-hidden rounded-xl px-5 transition-transform duration-200 ease-out hover:scale-[1.015] active:scale-[0.97] ${className}`}
    >
      {/* Grunge texture overlay -- centered (not tiled from the corner) so
          the pattern reads as a single centered motif on each card. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
          textureOpacity === "high"
            ? "opacity-70 group-hover:opacity-90"
            : "opacity-35 group-hover:opacity-50"
        }`}
        style={{
          backgroundImage: `url(${textureSrc})`,
          backgroundRepeat: textureFit === "tile" ? "repeat" : "no-repeat",
          backgroundPosition: "center",
          backgroundSize: textureFit === "tile" ? "220px auto" : "cover",
          mixBlendMode: textureBlend,
        }}
      />
      {iconPosition === "left" ? (
        <>
          {iconBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {iconBlock}
        </>
      )}
    </Link>
  );
}

export function MobileLinkBio() {
  return (
    <section className="relative flex md:hidden min-h-screen w-full flex-col items-center overflow-hidden bg-[#050505]">
      {/* Hero photo is contained to the top ~52% of the screen instead of
          the full viewport -- keeps the "vulto atrás do vidro" as a
          framed backdrop instead of dominating the whole page, matching
          the reference where the card stack reads as the focal point. */}
      <div className="absolute inset-x-0 top-0 h-[52vh] min-h-[380px]">
        <Image
          src="/images/landing/mobile-hero.webp"
          alt=""
          fill
          priority
          className="object-cover object-top opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/25 to-[#050505]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-6 pt-8">
        <Image
          src="/images/landing/logo-mark.svg"
          alt="Carbmaxxing"
          width={22}
          height={19}
          className="animate-fade-up"
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-end w-full px-6 pb-10 pt-10">
        <div className="flex flex-col items-center gap-1.5 mb-8 text-center animate-fade-up">
          <h1 className="heading-tight-2 text-lg text-white">
            Tudo o que você precisa
          </h1>
          <p className="text-xs text-white/60">
            👇🏻 Em um clique tá lá 👇🏻
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <LinkCard
            href="/cadastro"
            animationDelay="120ms"
            className="bg-black border border-white/[0.07]"
            textureBlend="screen"
            icon={
              <div className="relative w-[86px] h-[103px] -rotate-[5deg] drop-shadow-lg">
                <Image
                  src="/images/landing/icon-community.webp"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            }
            title="Carbmaxxing Community"
            subtitle="Entre na comunidade"
          />

          <LinkCard
            href={AURALAB_URL}
            external
            animationDelay="220ms"
            className="border border-white/20"
            style={{
              backgroundImage:
                "linear-gradient(170deg, rgb(211,19,19) 6%, rgb(117,18,24) 94%)",
            }}
            iconPosition="right"
            icon={
              <div className="relative w-[78px] h-[96px] drop-shadow-lg">
                <Image
                  src="/images/landing/icon-auralab.webp"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            }
            title="Baixe o Auralab"
            subtitle="Organize treino, dieta e hábitos"
          />

          <LinkCard
            href={TIKTOK_URL}
            external
            animationDelay="320ms"
            className="bg-[#f0f0f0] border border-white/[0.07]"
            textureSrc="/images/landing/tiktok-texture.png"
            textureBlend="normal"
            textureOpacity="low"
            icon={
              <div className="relative w-[90px] h-[102px] rotate-[5deg] drop-shadow-lg">
                <Image
                  src="/images/landing/icon-tiktok.webp"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            }
            title="Siga-me no Tiktok"
            subtitle="@zevictor.gym"
            titleClassName="text-black"
            subtitleClassName="text-black/60"
          />
        </div>

        <p
          className="animate-fade-up mt-10 text-[11px] text-white/20 tracking-tight"
          style={{ animationDelay: "420ms" }}
        >
          zevictordsg
        </p>
      </div>
    </section>
  );
}
