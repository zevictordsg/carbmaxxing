import Image from "next/image";
import Link from "next/link";

/**
 * Uma aula na lista do módulo.
 *
 * Toda linha é um <Link> pra página da aula, DENTRO da área de membros
 * (/comunidade/modulos/<mod>/aulas/<aula>) -- não pro YouTube em outra aba:
 * é o que permite gravar progresso e manter a sequência.
 *
 * Aula sem vídeo também abre. Ela chega mais apagada e com o selo "Em
 * breve", e a página mostra o aviso de conteúdo ainda não publicado no
 * lugar do player -- melhor do que uma linha morta, que não deixa nem ver
 * a descrição da aula nem entender o que vem pela frente.
 *
 * `id="aula-<slug>"` é o alvo do #hash que a home usa pro "Continuar de
 * onde parou" -- o `scroll-mt` compensa a TopBar fixa, senão a linha
 * chegaria escondida atrás dela.
 */
export function LessonRow({
  moduleId,
  lessonId,
  index,
  title,
  description,
  durationLabel,
  videoUrl,
  thumbnailUrl,
  completed,
  highlighted = false,
}: {
  moduleId: string;
  lessonId: string;
  /** 0-based; o rótulo soma 1. */
  index: number;
  title: string;
  description?: string;
  durationLabel?: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  completed: boolean;
  /** true na aula em andamento -- destaca a linha que a pessoa veio retomar. */
  highlighted?: boolean;
}) {
  const published = videoUrl.trim().length > 0;

  const shell = `group flex scroll-mt-24 items-center gap-4 rounded-xl px-3 py-3 ring-1 transition-[background-color,--tw-ring-color,transform] duration-300 sm:gap-5 sm:px-4 ${
    highlighted
      ? "bg-white/[0.06] ring-white/20"
      : "bg-white/[0.02] ring-white/[0.06]"
  } hover:-translate-y-0.5 hover:bg-white/[0.06] hover:ring-white/20 ${published ? "" : "opacity-70"}`;

  const body = (
    <>
      {/* Número / check — a coluna fixa que dá o senso de sequência. */}
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums ring-1 transition-colors duration-300 ${
          completed
            ? "bg-white text-black ring-white"
            : "bg-white/[0.04] text-white/70 ring-white/10 group-hover:text-white"
        }`}
        aria-hidden
      >
        {completed ? "✓" : index + 1}
      </span>

      {thumbnailUrl && (
        <span className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-surface-3 sm:block">
          <Image src={thumbnailUrl} alt="" fill sizes="112px" className="object-cover" />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold tracking-tight text-white">{title}</span>
          {completed && (
            <span className="label-loose shrink-0 text-[8px] text-white/45">Concluída</span>
          )}
        </span>
        {description && (
          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-dim">
            {description}
          </span>
        )}
      </span>

      <span className="flex shrink-0 items-center gap-3">
        {durationLabel && published && (
          <span className="hidden text-[11px] font-medium tabular-nums text-muted-dim sm:inline">
            {durationLabel}
          </span>
        )}
        {published ? (
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[11px] text-white/70 transition-colors duration-300 group-hover:bg-white group-hover:text-black"
          >
            ▶
          </span>
        ) : (
          <span className="label-loose text-[8px] text-muted-dim">Em breve</span>
        )}
      </span>
    </>
  );

  return (
    <Link
      id={`aula-${lessonId}`}
      href={`/comunidade/modulos/${moduleId}/aulas/${lessonId}`}
      className={shell}
    >
      {body}
    </Link>
  );
}
