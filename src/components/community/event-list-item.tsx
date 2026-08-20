function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventListItem({
  title,
  scheduledAt,
  externalUrl,
  past = false,
}: {
  title: string;
  scheduledAt: string;
  externalUrl?: string;
  past?: boolean;
}) {
  const content = (
    <>
      <span className={`text-sm font-medium tracking-tight truncate ${past ? "text-muted-dim" : "text-white"}`}>
        {title}
      </span>
      <span className="text-xs text-muted-dim shrink-0">{formatDateTime(scheduledAt)}</span>
    </>
  );

  if (past || !externalUrl) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3">
        {content}
      </div>
    );
  }

  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 hover:bg-white/[0.04] transition-colors"
    >
      {content}
    </a>
  );
}
