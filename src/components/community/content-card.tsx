import Link from "next/link";
import { CoverPlaceholder } from "@/components/cover-placeholder";
import { LockIcon } from "@/components/icons/lock-icon";

function CardInner({
  categoryLabel,
  title,
  isLocked,
  coverUrl,
  size = "default",
  hideCaption = false,
}: {
  categoryLabel: string;
  title: string;
  isLocked: boolean;
  coverUrl?: string | null;
  size?: "default" | "large";
  hideCaption?: boolean;
}) {
  const large = size === "large";

  return (
    <CoverPlaceholder
      className={`${large ? "aspect-[9/16] rounded-2xl" : "aspect-[3/4] rounded-xl"} w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]`}
    >
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover ${isLocked ? "grayscale" : ""}`}
        />
      )}

      {/* hideCaption: pure cover art, no tag/title/darken -- used when the
          image already carries its own text and an overlay would just
          repeat or clash with it. */}
      {!hideCaption && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div className={large ? "absolute bottom-0 left-0 right-0 p-4 sm:p-6" : "absolute bottom-0 left-0 right-0 p-3 sm:p-4"}>
            <p
              className={
                large
                  ? "label-loose text-[10px] text-white/60 sm:text-xs"
                  : "label-loose text-[9px] text-white/60 sm:text-[10px]"
              }
            >
              [{categoryLabel}]
            </p>
            <p
              className={
                large
                  ? "heading-tight-2 text-xl text-white leading-tight mt-1 line-clamp-2 sm:text-2xl md:text-3xl"
                  : "heading-tight-2 text-base text-white leading-tight mt-0.5 line-clamp-2 sm:text-lg"
              }
            >
              {title}
            </p>
          </div>
        </>
      )}

      {isLocked && (
        <div
          className={`absolute top-3 right-3 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm ${large ? "h-9 w-9" : "h-8 w-8"}`}
        >
          <LockIcon className={large ? "h-4 w-4 text-white" : "h-3.5 w-3.5 text-white"} />
        </div>
      )}
    </CoverPlaceholder>
  );
}

/**
 * Full-bleed portrait content card styled after the Balaclava reference:
 * desaturated cover photo, bracketed category tag + bold title overlaid at
 * the bottom, lock icon top-right for gated material. Renders as a Link
 * when `href` is given (the Feed's carousel, pointing into a content
 * channel); plain otherwise, for the channel's own full grid.
 */
export function ContentCard({
  href,
  categoryLabel,
  title,
  isLocked,
  coverUrl,
  size = "default",
  hideCaption = false,
  className = "",
}: {
  href?: string;
  categoryLabel: string;
  title: string;
  isLocked: boolean;
  coverUrl?: string | null;
  size?: "default" | "large";
  hideCaption?: boolean;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={`group block ${className}`}>
        <CardInner categoryLabel={categoryLabel} title={title} isLocked={isLocked} coverUrl={coverUrl} size={size} hideCaption={hideCaption} />
      </Link>
    );
  }

  return (
    <div className={`group ${className}`}>
      <CardInner categoryLabel={categoryLabel} title={title} isLocked={isLocked} coverUrl={coverUrl} size={size} hideCaption={hideCaption} />
    </div>
  );
}
