import Link from "next/link";
import { CoverPlaceholder } from "@/components/cover-placeholder";
import { LockIcon } from "@/components/icons/lock-icon";

function CardInner({
  categoryLabel,
  title,
  isLocked,
}: {
  categoryLabel: string;
  title: string;
  isLocked: boolean;
}) {
  return (
    <CoverPlaceholder className="aspect-[3/4] w-full rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {isLocked && (
        <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm">
          <LockIcon className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <p className="label-loose text-[9px] text-white/60 sm:text-[10px]">
          [{categoryLabel}]
        </p>
        <p className="heading-tight-2 text-base text-white leading-tight mt-0.5 line-clamp-2 sm:text-lg">
          {title}
        </p>
      </div>
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
  className = "",
}: {
  href?: string;
  categoryLabel: string;
  title: string;
  isLocked: boolean;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={`group block ${className}`}>
        <CardInner categoryLabel={categoryLabel} title={title} isLocked={isLocked} />
      </Link>
    );
  }

  return (
    <div className={className}>
      <CardInner categoryLabel={categoryLabel} title={title} isLocked={isLocked} />
    </div>
  );
}
