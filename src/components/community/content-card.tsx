import Link from "next/link";
import { CoverPlaceholder } from "@/components/cover-placeholder";
import { LockIcon } from "@/components/icons/lock-icon";

function CardInner({
  title,
  description,
  isLocked,
}: {
  title: string;
  description?: string | null;
  isLocked: boolean;
}) {
  return (
    <>
      <CoverPlaceholder className="aspect-[4/3] rounded-xl">
        {isLocked && (
          <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm">
            <LockIcon className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </CoverPlaceholder>
      <div className="mt-3">
        <p className="text-sm font-semibold tracking-tight text-white leading-tight">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-xs text-muted-dim leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </>
  );
}

/**
 * Rounded content card with a desaturated cover placeholder + lock icon for
 * gated material (per the original brief's "rounded content cards with lock
 * icons"). Renders as a Link when `href` is given (e.g. the Feed's featured
 * row pointing into a content channel); plain otherwise, for use inside the
 * channel grid it already lives on.
 */
export function ContentCard({
  href,
  title,
  description,
  isLocked,
}: {
  href?: string;
  title: string;
  description?: string | null;
  isLocked: boolean;
}) {
  if (href) {
    return (
      <Link href={href} className="group flex flex-col">
        <CardInner title={title} description={description} isLocked={isLocked} />
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      <CardInner title={title} description={description} isLocked={isLocked} />
    </div>
  );
}
