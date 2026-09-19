/**
 * Barra de progresso fina, usada dentro do card de módulo e no cabeçalho
 * da página de módulo. Server component de propósito: é só geometria, e
 * manter fora do bundle do cliente evita hidratar a home inteira só por
 * causa de uma barrinha.
 */
export function ProgressBar({
  percent,
  className = "",
  tone = "light",
}: {
  /** 0-100. Valores fora da faixa são cortados. */
  percent: number;
  className?: string;
  /** 'light' = branco sobre foto; 'accent' = destaque pro módulo em andamento. */
  tone?: "light" | "accent";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const fill = tone === "accent" ? "bg-white" : "bg-white/80";

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-[3px] w-full overflow-hidden rounded-full bg-white/15 ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${fill}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
