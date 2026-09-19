import { ModuleCoverCard } from "@/components/community/module-cover-card";
import type { Module } from "@/lib/modules-content";
import type { ModuleProgress } from "@/lib/progress";

/**
 * Uma trilha da home: rótulo + faixa horizontal de capas.
 *
 * Faixa com scroll em vez de grade por um motivo de crescimento: a área vai
 * de 5 módulos pra 15 sem mudar o layout, e com 3 módulos a faixa ainda lê
 * como uma fileira proposital (é assim na referência do Balaclava) em vez de
 * uma grade com buracos. `overflow-x` nativo + snap: sem JS, sem listener
 * de arraste, funciona com trackpad, dedo e teclado.
 *
 * O padding lateral vive dentro do container que rola, não no pai -- senão
 * o primeiro card já nasceria deslocado e o último não conseguiria chegar
 * até a borda.
 */
export function ModuleRail({
  label,
  hint,
  modules,
  progress,
  lockedIds,
  priorityFirstCard = false,
}: {
  label: string;
  hint?: string;
  modules: Module[];
  progress: Record<string, ModuleProgress>;
  /** Slugs que devem aparecer travados pra quem está olhando. */
  lockedIds: Set<string>;
  priorityFirstCard?: boolean;
}) {
  if (modules.length === 0) return null;

  return (
    <section className="flex flex-col">
      <div className="flex items-end justify-between gap-4 px-6 md:px-10">
        <div className="min-w-0">
          <h2 className="heading-tight-2 text-lg text-white sm:text-xl">{label}</h2>
          {hint && <p className="mt-1 text-[13px] tracking-tight text-muted-dim">{hint}</p>}
        </div>
        <p className="label-loose shrink-0 pb-1 text-[9px] text-muted-dim">
          {modules.length} {modules.length === 1 ? "módulo" : "módulos"}
        </p>
      </div>

      <div className="rail-mask mt-4 overflow-x-auto scrollbar-hide">
        <div className="stagger flex snap-x snap-mandatory gap-3 px-6 pb-2 sm:gap-4 md:px-10">
          {modules.map((mod, i) => (
            <ModuleCoverCard
              key={mod.id}
              id={mod.id}
              title={mod.title}
              categoryLabel={mod.categoryLabel}
              coverUrl={mod.coverUrl ?? null}
              isLocked={lockedIds.has(mod.id)}
              hideCaption={mod.hideCaption}
              progress={progress[mod.id]}
              priority={priorityFirstCard && i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
