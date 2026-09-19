import Image from "next/image";
import Link from "next/link";
import { ProgressBar } from "@/components/community/progress-bar";

/**
 * Cabeçalho da página de um módulo.
 *
 * A capa é 9:16 (as artes vêm do Figma nesse formato) e o cabeçalho é
 * largo, então a mesma imagem entra duas vezes com papéis diferentes: uma
 * desfocada e ampliada como fundo, pra dar a cor e o clima do módulo sem
 * distorcer nada, e uma nítida no tamanho certo ao lado do texto. É o que
 * evita o corte violento que dá ao esticar um retrato num banner.
 *
 * `-mt-16` cancela o `pt-16` que o layout reserva pra TopBar fixa, igual ao
 * hero da home -- ver o comentário em layout.tsx.
 */
export function ModuleHero({
  title,
  categoryLabel = "Módulo",
  description,
  coverUrl,
  lessonCount,
  completedCount,
  percent,
  action,
  backHref,
}: {
  title: string;
  categoryLabel?: string;
  description?: string;
  coverUrl: string | null;
  lessonCount: number;
  completedCount: number;
  percent: number;
  action?: { label: string; href: string; external?: boolean } | null;
  /** Volta pra listagem. Fica dentro do hero, como migalha. */
  backHref?: string;
}) {
  const hasLessons = lessonCount > 0;
  const started = completedCount > 0;

  return (
    <section className="grain relative -mt-16 w-full overflow-hidden">
      {coverUrl && (
        <div aria-hidden className="absolute inset-0">
          <Image
            src={coverUrl}
            alt=""
            fill
            priority
            quality={75}
            sizes="100vw"
            className="scale-110 object-cover object-center blur-2xl"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface-2 to-transparent" />

      <div className="relative z-10 flex flex-col px-6 pb-12 pt-24 md:px-10 md:pb-14 md:pt-28">
        {backHref && (
          <Link
            href={backHref}
            className="label-loose animate-fade-up mb-8 inline-flex w-fit items-center gap-1.5 text-[9px] text-white/50 transition-colors hover:text-white"
          >
            <span aria-hidden>←</span> Todos os módulos
          </Link>
        )}

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
        {coverUrl && (
          <div className="animate-fade-up relative aspect-[9/16] w-32 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 shadow-[0_1.5rem_3rem_-1rem_rgba(0,0,0,0.9)] sm:w-40 md:w-44">
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="176px"
              quality={95}
              className="object-cover"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="label-loose animate-fade-up text-[10px] text-white/55">[{categoryLabel}]</p>
          <h1 className="heading-tight animate-fade-up mt-2 text-3xl text-white [animation-delay:0.06s] sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="animate-fade-up mt-4 max-w-xl text-[13px] leading-relaxed tracking-tight text-white/60 [animation-delay:0.12s] sm:text-sm">
              {description}
            </p>
          )}

          <div className="animate-fade-up mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium tracking-tight text-muted [animation-delay:0.18s]">
            {hasLessons ? (
              <>
                <span className="tabular-nums">
                  {lessonCount} {lessonCount === 1 ? "aula" : "aulas"}
                </span>
                <span aria-hidden className="text-muted-dim">
                  ·
                </span>
                <span className="tabular-nums">
                  {started ? `${completedCount} concluída${completedCount === 1 ? "" : "s"}` : "Você ainda não começou"}
                </span>
              </>
            ) : (
              <span>Ferramenta · acesso direto</span>
            )}
          </div>

          {hasLessons && started && (
            <ProgressBar percent={percent} className="animate-fade-up mt-4 max-w-xs [animation-delay:0.2s]" tone="accent" />
          )}

          {action && (
            <div className="animate-fade-up mt-7 [animation-delay:0.26s]">
              {action.external ? (
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-tight text-black transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/90"
                >
                  <span aria-hidden>▶</span> {action.label}
                </a>
              ) : (
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-tight text-black transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/90"
                >
                  <span aria-hidden>▶</span> {action.label}
                </Link>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
