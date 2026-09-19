import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModuleHero } from "@/components/community/module-hero";
import { LessonRow } from "@/components/community/lesson-row";
import { CarbCalculator } from "@/components/community/carb-calculator";
import { findModule } from "@/lib/modules-content";
import { getCompletedLessonIds } from "@/lib/progress";

/**
 * One module's page: cabeçalho com capa/progresso e, abaixo, o conteúdo do
 * módulo -- lista de aulas, a calculadora, ou o download do guia.
 *
 * Module + lesson content comes from src/lib/modules-content.ts
 * (hand-edited in code), not the `modules`/`lessons` Supabase tables. O
 * progresso das aulas, sim, vem do banco (0015_lesson_progress.sql) e
 * degrada pra vazio se a migração ainda não rodou -- ver src/lib/progress.ts.
 *
 * Access is still real: a locked module's lessons/tool stay hidden from
 * anyone without has_product_access(requiredProduct) (admin, or an active
 * subscription for that exact product -- 'calculadora' by default when the
 * module doesn't set requiredProduct) -- notFound() covers both "no such
 * module" and "exists but you can't see it" with the same shape, so nothing
 * about access leaks through the 404.
 */
export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout.tsx already redirects

  const contentModule = findModule(id);
  if (!contentModule) notFound();

  if (contentModule.isLocked) {
    const { data: hasAccess } = await supabase.rpc("has_product_access", {
      p_product: contentModule.requiredProduct ?? "calculadora",
    });
    if (!hasAccess) notFound();
  }

  const completedIds = await getCompletedLessonIds(contentModule.id);
  const lessons = contentModule.lessons;
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const percent = lessons.length === 0 ? 0 : Math.round((completedCount / lessons.length) * 100);

  /* Primeira aula não concluída -- é ela que o botão do cabeçalho abre, e é
     ela que fica destacada na lista. Não exige vídeo publicado: a página da
     aula abre de qualquer jeito (mostrando o aviso de "em breve" no lugar do
     player), e sem isso um módulo inteiro ainda sem vídeo ficaria sem
     nenhuma porta de entrada. */
  const nextLesson = lessons.find((l) => !completedIds.has(l.id));

  const heroAction = contentModule.customTool
    ? { label: "Abrir a calculadora", href: "#conteudo" }
    : contentModule.downloadUrl
      ? { label: contentModule.downloadLabel ?? "Baixar o material", href: contentModule.downloadUrl }
      : nextLesson
        ? {
            label: completedCount > 0 ? "Continuar o módulo" : "Começar a primeira aula",
            href: `/comunidade/modulos/${contentModule.id}/aulas/${nextLesson.id}`,
          }
        : null;

  return (
    <div className="flex flex-col">
      <ModuleHero
        title={contentModule.title}
        categoryLabel={contentModule.categoryLabel}
        description={contentModule.description}
        coverUrl={contentModule.coverUrl ?? null}
        lessonCount={lessons.length}
        completedCount={completedCount}
        percent={percent}
        action={heroAction}
        backHref="/comunidade"
      />

      <div id="conteudo" className="scroll-mt-20 px-6 pb-16 pt-10 md:px-10 md:pt-12">
        {contentModule.customTool === "carb-calculator" ? (
          <div id="carb-calc-print-wrap" className="mx-auto max-w-4xl">
            <CarbCalculator />
          </div>
        ) : contentModule.downloadUrl ? (
          <div className="max-w-2xl">
            <h2 className="heading-tight-2 text-xl text-white md:text-2xl">O material</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Arquivo pra baixar e consultar quando precisar. Ele não muda com o tempo, então
              vale deixar salvo no celular.
            </p>
            {/* `download` só força o download direto (em vez de abrir numa
                aba) pra link do mesmo domínio -- por isso o arquivo mora em
                public/ deste projeto, não num link externo. */}
            <a
              href={contentModule.downloadUrl}
              download
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-tight text-black transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/90"
            >
              <span aria-hidden>↓</span>
              {contentModule.downloadLabel ?? "Baixar arquivo"}
            </a>
          </div>
        ) : (
          <div className="max-w-3xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="heading-tight-2 text-xl text-white md:text-2xl">Aulas</h2>
              {lessons.length > 0 && (
                <p className="shrink-0 text-[11px] font-medium tabular-nums tracking-tight text-muted-dim">
                  {completedCount}/{lessons.length}
                </p>
              )}
            </div>

            {lessons.length === 0 ? (
              <p className="text-sm text-muted-dim">
                As aulas deste módulo estão sendo gravadas. Você vai encontrá-las aqui.
              </p>
            ) : (
              <div className="stagger flex flex-col gap-2.5">
                {lessons.map((lesson, i) => (
                  <LessonRow
                    key={lesson.id}
                    moduleId={contentModule.id}
                    lessonId={lesson.id}
                    index={i}
                    title={lesson.title}
                    description={lesson.description}
                    durationLabel={lesson.durationLabel}
                    videoUrl={lesson.videoUrl}
                    thumbnailUrl={lesson.thumbnailUrl ?? null}
                    completed={completedIds.has(lesson.id)}
                    highlighted={nextLesson?.id === lesson.id && completedCount > 0}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
