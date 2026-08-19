/**
 * Dark, desaturated placeholder used wherever a real cover photo will
 * eventually go (landing hero, content cards, etc). Flat tone, no gradient,
 * matching the monochrome direction until real imagery is supplied.
 */
export function CoverPlaceholder({
  className = "",
  label,
  children,
}: {
  className?: string;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative bg-surface border border-border-subtle overflow-hidden ${className}`}
    >
      {label && (
        <span className="absolute bottom-3 left-3 label-loose text-[10px] text-muted-dim">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
