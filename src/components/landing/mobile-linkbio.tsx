import Image from "next/image";
import Link from "next/link";

/**
 * Mobile landing screen — 1:1 with Figma "Phone" (node 2549:1305).
 * Link-in-bio style: logo, header, three link cards, footer handle.
 *
 * Expected image drops (see /public/images/landing/README.md):
 *   mobile-hero.jpg, icon-community.png, icon-auralab.png,
 *   icon-tiktok.png, logo-mark.svg
 *
 * NOTE: "Baixe o Auralab" points at a placeholder "#" href until you give
 * me the real app/website link -- swap AURALAB_URL below once you have it.
 */
const AURALAB_URL = "#";
const TIKTOK_URL = "https://www.tiktok.com/@zevictor.gym";

function LinkCard({
  href,
  external,
  className = "",
  style,
  icon,
  title,
  subtitle,
  titleClassName = "text-white",
  subtitleClassName = "text-white/60",
}: {
  href: string;
  external?: boolean;
  className?: string;
  style?: React.CSSProperties;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={style}
      className={`relative flex items-center gap-4 w-full h-[72px] rounded-xl px-5 ${className}`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm font-bold tracking-tight ${titleClassName}`}>
          {title}
        </span>
        <span className={`text-xs tracking-tight ${subtitleClassName}`}>
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

export function MobileLinkBio() {
  return (
    <section className="relative flex md:hidden min-h-screen w-full flex-col items-center overflow-hidden bg-[#050505]">
      <Image
        src="/images/landing/mobile-hero.webp"
        alt=""
        fill
        priority
        className="object-cover object-top opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />

      <div className="relative z-10 flex flex-col items-center w-full px-6 pt-8">
        <Image
          src="/images/landing/logo-mark.svg"
          alt="Carbmaxxing"
          width={22}
          height={19}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-end w-full px-6 pb-10 pt-40">
        <div className="flex flex-col items-center gap-1.5 mb-8 text-center">
          <h1 className="heading-tight-2 text-xl text-white">
            Tudo o que você precisa
          </h1>
          <p className="text-xs text-white/60">
            👇🏻 Em um clique tá lá 👇🏻
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <LinkCard
            href="/cadastro"
            className="bg-black border border-white/[0.07]"
            icon={
              <div className="relative w-11 h-11 -rotate-[5deg] rounded-md overflow-hidden shadow-lg">
                <Image
                  src="/images/landing/icon-community.png"
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            }
            title="Carbmaxxing Community"
            subtitle="Entre na comunidade"
          />

          <LinkCard
            href={AURALAB_URL}
            external
            className="border border-white/20"
            style={{
              backgroundImage:
                "linear-gradient(170deg, rgb(211,19,19) 6%, rgb(117,18,24) 94%)",
            }}
            icon={
              <div className="relative w-9 h-11">
                <Image
                  src="/images/landing/icon-auralab.png"
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
            className="bg-[#f0f0f0] border border-white/[0.07]"
            icon={
              <div className="relative w-9 h-11 rotate-[4deg]">
                <Image
                  src="/images/landing/icon-tiktok.png"
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

        <p className="mt-10 text-[11px] text-white/20 tracking-tight">
          zevictordsg
        </p>
      </div>
    </section>
  );
}
