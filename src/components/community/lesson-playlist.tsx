import Link from "next/link";
import type { Lesson } from "@/lib/modules-content";
import { ProgressBar } from "@/components/community/progress-bar";

/**
 * A lista de aulas ao lado do player -- é o que mantém a sequência visível
 * sem obrigar a voltar pra página do módulo entre uma aula e outra.
 *
 * Três estados por linha, iguais aos da lista do módulo: concluída (check),
 * atual (fundo mais claro e barra lateral), e "Em breve" (sem link, quando
 * `videoUrl` está vazia). No desktop ela vira coluna fixa ao lado do vídeo;
 * no mobile desce pra baixo dele.
 */
export function LessonPlaylist({
  moduleId,
  moduleTitle,
  lessons,
  currentLessonId,
  completedIds,
}: {
  moduleId: string;
  moduleTitle: string;
  lessons: Lesson[];
  currentLessonId: string;
  completedIds: Set<string>;
}) {
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const percent = lessons.length === 0 ? 0 : Math.round((completedCount / lessons.length) * 100);

  return (
    /* self-start: sem isso o card do grid esticava até a altura da coluna do
       player e sobrava um painel vazio embaixo da lista. sticky mantém a
       sequência visível enquanto a pessoa rola o texto da aula. */
    <aside className="flex flex-col gap-4 self-start rounded-2xl bg-surface/60 p-4 ring-1 ring-white/[0.06] lg:sticky lg:top-20">
      <div>
        <p className="label-loose text-[9px] text-white/40">Neste módulo</p>
        <Link
          href={`/comunidade/modulos/${moduleId}`}
          className="heading-tight-2 mt-1 block text-base text-white transition-colors hover:text-white/70"
        >
          {moduleTitle}
        </Link>
        <p className="mt-2 text-[11px] font-medium tabular-nums tracking-tight text-muted-dim">
          {completedCount} de {lessons.length} concluída{completedCount === 1 ? "" : "s"}
        </p>
        <ProgressBar percent={percent} className="mt-2" tone="accent" />
      </div>

      <ol className="flex flex-col gap-1">
        {lessons.map((lesson, i) => {
          const isCurrent = lesson.id === currentLessonId;
          const isDone = completedIds.has(lesson.id);
          const published = lesson.videoUrl.trim().length > 0;

          const inner = (
            <>
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ring-1 ${
                  isDone
                    ? "bg-white text-black ring-white"
                    : isCurrent
                      ? "bg-white/15 text-white ring-white/30"
                      : "bg-white/[0.03] text-white/55 ring-white/10"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] font-medium tracking-tight ${
                    isCurrent ? "text-white" : "text-white/70"
                  }`}
                >
                  {lesson.title}
                </span>
                {(lesson.durationLabel || !published) && (
                  <span className="mt-0.5 block text-[10px] tabular-nums text-muted-dim">
                    {published ? lesson.durationLabel : "Em breve"}
                  </span>
                )}
              </span>
            </>
          );

          const shell = `flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-300 ${
            isCurrent ? "bg-white/[0.07]" : published ? "hover:bg-white/[0.04]" : "opacity-50"
          }`;

          return (
            <li key={lesson.id}>
              {published && !isCurrent ? (
                <Link href={`/comunidade/modulos/${moduleId}/aulas/${lesson.id}`} className={shell}>
                  {inner}
                </Link>
              ) : (
                <div className={shell} aria-current={isCurrent ? "true" : undefined}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
