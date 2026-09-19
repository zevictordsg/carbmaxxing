import Image from "next/image";
import Link from "next/link";
import { ProgressBar } from "@/components/community/progress-bar";

/**
 * Faixa "Continuar de onde parou" -- card largo, deitado, acima das
 * trilhas. Serve de atalho de uma linha pra retomar sem procurar o módulo
 * na faixa e a aula na lista.
 *
 * Aparece duplicado com a ação do hero de propósito: o hero é visto por
 * quem chega e olha a primeira tela, este card por quem já rolou a página
 * -- e como a home não é longa, ter os dois custa pouco e evita o caso de
 * alguém rolar direto pras capas e perder o atalho.
 */
export function ContinueCard({
  moduleId,
  moduleTitle,
  lessonId,
  lessonTitle,
  lessonIndex,
  lessonCount,
  coverUrl,
  percent,
}: {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  /** Índice 0-based; o rótulo soma 1. */
  lessonIndex: number;
  lessonCount: number;
  coverUrl: string | null;
  percent: number | null;
}) {
  return (
    <Link
      href={`/comunidade/modulos/${moduleId}/aulas/${lessonId}`}
      className="group flex items-stretch gap-4 overflow-hidden rounded-2xl bg-surface ring-1 ring-white/[0.07] transition-[box-shadow,--tw-ring-color,transform] duration-500 ease-out hover:-translate-y-0.5 hover:ring-white/20 hover:shadow-[0_1rem_2.5rem_-1rem_rgba(0,0,0,0.8)] sm:gap-6"
    >
      <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden sm:w-32 md:w-36">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 96px, 144px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-3 text-xl" aria-hidden>
            🎬
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm text-black">
            ▶
          </span>
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-4 pr-4 sm:py-5 sm:pr-6">
        <p className="label-loose text-[9px] text-white/45">
          Continuar · {moduleTitle}
        </p>
        <p className="heading-tight-2 line-clamp-2 text-base text-white sm:text-xl">{lessonTitle}</p>
        <p className="text-[11px] font-medium tabular-nums tracking-tight text-muted-dim">
          Aula {lessonIndex + 1} de {lessonCount}
          {typeof percent === "number" ? ` · ${percent}% assistido` : ""}
        </p>
        {typeof percent === "number" && (
          <ProgressBar percent={percent} className="mt-1.5 max-w-sm" tone="accent" />
        )}
      </div>
    </Link>
  );
}
