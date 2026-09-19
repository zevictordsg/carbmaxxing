import Image from "next/image";
import Link from "next/link";
import { LockIcon } from "@/components/icons/lock-icon";
import { ProgressBar } from "@/components/community/progress-bar";
import type { ModuleProgress } from "@/lib/progress";

/**
 * A capa 9:16 de um módulo na home -- a peça central da área de membros.
 *
 * Substitui o uso do ContentCard aqui (o ContentCard continua servindo os
 * canais de conteúdo legados, por isso não foi alterado): este card sabe de
 * progresso, estado concluído e trava, e é `next/image` em vez de <img>,
 * porque numa trilha com muitos módulos a home carregava todas as capas em
 * tamanho cheio.
 *
 * `hideCaption` existe porque as artes M1-M4 já vêm do Figma com a tag e o
 * título embutidos na imagem -- sobrepor texto de novo duplicaria. Nesses
 * casos o título continua vindo por `aria-label` no link, senão o card
 * ficaria sem nome nenhum pra leitor de tela.
 */
export function ModuleCoverCard({
  id,
  title,
  categoryLabel = "Módulo",
  coverUrl,
  isLocked,
  hideCaption = false,
  progress,
  priority = false,
}: {
  id: string;
  title: string;
  categoryLabel?: string;
  coverUrl: string | null;
  isLocked: boolean;
  hideCaption?: boolean;
  progress?: ModuleProgress;
  /** true no primeiro card da primeira trilha -- é ele que entra no LCP. */
  priority?: boolean;
}) {
  const showProgress = !isLocked && Boolean(progress) && progress!.total > 0 && progress!.completed > 0;
  const done = Boolean(progress?.done) && !isLocked;

  return (
    <Link
      href={`/comunidade/modulos/${id}`}
      aria-label={title}
      className="group relative block w-[44vw] shrink-0 snap-start sm:w-[13rem] md:w-[15rem] lg:w-[17.5rem] xl:w-[19.5rem]"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-white/[0.07] transition-[transform,box-shadow,--tw-ring-color] duration-500 ease-out group-hover:-translate-y-1.5 group-hover:ring-white/25 group-hover:shadow-[0_1.5rem_3rem_-1rem_rgba(0,0,0,0.85)]">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 44vw, (max-width: 1024px) 240px, 312px"
            priority={priority}
            quality={75}
            className={`object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.06] ${
              isLocked ? "grayscale brightness-[0.72] group-hover:grayscale-0" : ""
            }`}
          />
        )}

        {/* Só quando a arte não traz o próprio texto. */}
        {!hideCaption && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <p className="label-loose text-[9px] text-white/55 sm:text-[10px]">[{categoryLabel}]</p>
              <p className="heading-tight-2 mt-1 line-clamp-2 text-base leading-tight text-white sm:text-lg">
                {title}
              </p>
            </div>
          </>
        )}

        {isLocked && (
          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 backdrop-blur-sm ring-1 ring-white/10">
            <LockIcon className="h-3.5 w-3.5 text-white" />
          </span>
        )}

        {done && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-tight text-black">
            <span aria-hidden>✓</span> Concluído
          </span>
        )}

        {/* Progresso colado na base, por cima da arte -- é o lugar onde a
            pessoa já olha pra saber "onde eu estou". */}
        {showProgress && !done && (
          <div className="absolute inset-x-0 bottom-0 p-3">
            <ProgressBar percent={progress!.percent} tone="accent" />
          </div>
        )}
      </div>

      {/* Linha de status fora da capa: a arte fica limpa e a informação de
          navegação não disputa espaço com o título embutido na imagem. */}
      <div className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
        <p className="truncate text-[13px] font-semibold tracking-tight text-white/85 group-hover:text-white">
          {title}
        </p>
        {progress && progress.total > 0 && !isLocked && (
          <p className="shrink-0 text-[11px] font-medium tabular-nums text-muted-dim">
            {progress.completed}/{progress.total}
          </p>
        )}
        {isLocked && <p className="label-loose shrink-0 text-[9px] text-muted-dim">Bloqueado</p>}
      </div>
    </Link>
  );
}
