import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findLesson } from "@/lib/modules-content";
import { getCompletedLessonIds, getLessonProgress } from "@/lib/progress";
import { LessonPlayer } from "@/components/community/lesson-player";
import { LessonPlaylist } from "@/components/community/lesson-playlist";

/**
 * A página de uma aula: player embutido, a lista do módulo do lado, e
 * navegação anterior/próxima.
 *
 * Fica DENTRO da área de membros de propósito (em vez de mandar pro YouTube
 * numa aba nova): é o que permite gravar progresso, continuar de onde parou,
 * e manter a pessoa na sequência do módulo. Os vídeos são links não listados
 * do YouTube -- cole cada um em `videoUrl` em src/lib/modules-content.ts.
 *
 * O gate de acesso é o MESMO da página do módulo, repetido aqui de
 * propósito: sem isso a URL da aula seria uma porta lateral pra dentro de um
 * módulo travado. notFound() cobre "não existe" e "existe mas você não vê"
 * com a mesma resposta, pra 404 não virar oráculo de conteúdo pago.
 *
 * Aula anunciada e ainda sem vídeo não dá 404 -- abre com o painel "ainda
 * não publicada", que é a informação que a pessoa quer quando chega por um
 * link antigo.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout.tsx already redirects

  const found = findLesson(id, lessonId);
  if (!found) notFound();
  const { module: contentModule, lesson, index, previous, next } = found;

  if (contentModule.isLocked) {
    const { data: hasAccess } = await supabase.rpc("has_product_access", {
      p_product: contentModule.requiredProduct ?? "calculadora",
    });
    if (!hasAccess) notFound();
  }

  const [completedIds, lessonProgress] = await Promise.all([
    getCompletedLessonIds(contentModule.id),
    getLessonProgress(contentModule.id, lesson.id),
  ]);

  /* Pula a próxima aula ainda não publicada -- o card de fim de vídeo só
     oferece o que dá pra assistir de verdade. */
  const nextPublished = contentModule.lessons
    .slice(index + 1)
    .find((l) => l.videoUrl.trim().length > 0);

  return (
    <div className="px-6 pb-16 pt-8 md:px-10 md:pt-10">
      <Link
        href={`/comunidade/modulos/${contentModule.id}`}
        className="label-loose animate-fade-up inline-flex w-fit items-center gap-1.5 text-[9px] text-white/45 transition-colors hover:text-white"
      >
        <span aria-hidden>←</span> {contentModule.title}
      </Link>

      <div className="animate-fade-up mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10 [animation-delay:0.06s]">
        <div className="min-w-0">
          <LessonPlayer
            moduleId={contentModule.id}
            lessonId={lesson.id}
            videoUrl={lesson.videoUrl}
            initialPosition={lessonProgress.positionSeconds}
            initialCompleted={lessonProgress.completed}
            nextHref={
              nextPublished
                ? `/comunidade/modulos/${contentModule.id}/aulas/${nextPublished.id}`
                : undefined
            }
            nextTitle={nextPublished?.title}
          />

          <div className="mt-7 max-w-2xl">
            <p className="label-loose text-[9px] text-white/40">
              Aula {index + 1} de {contentModule.lessons.length}
              {lesson.durationLabel ? ` · ${lesson.durationLabel}` : ""}
            </p>
            <h1 className="heading-tight mt-2 text-2xl text-white sm:text-3xl md:text-4xl">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="mt-4 text-[13px] leading-relaxed tracking-tight text-white/60 sm:text-sm">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Anterior / próxima -- a navegação que evita o vai-e-volta pela
              página do módulo entre duas aulas seguidas. */}
          <nav className="mt-9 flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-stretch sm:justify-between">
            {previous ? (
              <Link
                href={`/comunidade/modulos/${contentModule.id}/aulas/${previous.id}`}
                className="group flex min-w-0 flex-1 flex-col gap-1 rounded-xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.06] transition-[background-color,--tw-ring-color] duration-300 hover:bg-white/[0.05] hover:ring-white/20"
              >
                <span className="label-loose text-[8px] text-white/40">← Anterior</span>
                <span className="truncate text-[13px] font-semibold tracking-tight text-white/80 group-hover:text-white">
                  {previous.title}
                </span>
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}

            {next ? (
              <Link
                href={`/comunidade/modulos/${contentModule.id}/aulas/${next.id}`}
                className="group flex min-w-0 flex-1 flex-col items-end gap-1 rounded-xl bg-white/[0.02] px-4 py-3 text-right ring-1 ring-white/[0.06] transition-[background-color,--tw-ring-color] duration-300 hover:bg-white/[0.05] hover:ring-white/20"
              >
                <span className="label-loose text-[8px] text-white/40">Próxima →</span>
                <span className="truncate text-[13px] font-semibold tracking-tight text-white/80 group-hover:text-white">
                  {next.title}
                </span>
              </Link>
            ) : (
              <Link
                href={`/comunidade/modulos/${contentModule.id}`}
                className="group flex min-w-0 flex-1 flex-col items-end gap-1 rounded-xl bg-white/[0.02] px-4 py-3 text-right ring-1 ring-white/[0.06] transition-[background-color,--tw-ring-color] duration-300 hover:bg-white/[0.05] hover:ring-white/20"
              >
                <span className="label-loose text-[8px] text-white/40">Fim do módulo</span>
                <span className="truncate text-[13px] font-semibold tracking-tight text-white/80 group-hover:text-white">
                  Voltar pro módulo
                </span>
              </Link>
            )}
          </nav>
        </div>

        <LessonPlaylist
          moduleId={contentModule.id}
          moduleTitle={contentModule.title}
          lessons={contentModule.lessons}
          currentLessonId={lesson.id}
          completedIds={completedIds}
        />
      </div>
    </div>
  );
}
