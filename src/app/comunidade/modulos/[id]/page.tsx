import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoverPlaceholder } from "@/components/cover-placeholder";
import { LessonCard } from "@/components/community/lesson-card";
import { CarbCalculator } from "@/components/community/carb-calculator";
import { MODULES } from "@/lib/modules-content";

/**
 * One module's page: cover + title/description up top, then its aulas
 * (lessons) as a simple list. Module + lesson content comes from
 * src/lib/modules-content.ts (hand-edited in code), not the `modules`/
 * `lessons` Supabase tables. Access is still real, though: a locked
 * module's lessons/tool stay hidden from anyone without
 * has_product_access(requiredProduct) (admin, or an active subscription
 * for that exact product -- 'calculadora' by default when the module
 * doesn't set requiredProduct) -- notFound() covers both "no such module"
 * and "exists but you can't see it" with the same shape, so nothing about
 * access leaks through the 404.
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

  const contentModule = MODULES.find((m) => m.id === id);
  if (!contentModule) notFound();

  if (contentModule.isLocked) {
    const { data: hasAccess } = await supabase.rpc("has_product_access", {
      p_product: contentModule.requiredProduct ?? "calculadora",
    });
    if (!hasAccess) notFound();
  }

  return (
    <div className="flex flex-col">
      <section className="relative -mt-16 h-[220px] w-full overflow-hidden sm:h-[280px] md:h-[320px]">
        <CoverPlaceholder className="h-full w-full">
          {contentModule.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contentModule.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </CoverPlaceholder>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-2 via-surface-2/70 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-8 md:px-10">
          <h1 className="heading-tight text-3xl text-white sm:text-4xl md:text-5xl">
            {contentModule.title}
          </h1>
          {contentModule.description && (
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              {contentModule.description}
            </p>
          )}
        </div>
      </section>

      {contentModule.customTool === "carb-calculator" ? (
        <div id="carb-calc-print-wrap" className="px-6 py-10 md:px-10 md:py-12">
          <div className="mx-auto max-w-4xl">
            <CarbCalculator />
          </div>
        </div>
      ) : contentModule.downloadUrl ? (
        <div className="px-6 py-10 md:px-10 md:py-12">
          <div className="max-w-2xl">
            {/* `download` só força o download direto (em vez de abrir numa
                aba) pra link do mesmo domínio -- por isso o arquivo mora em
                public/ deste projeto, não num link externo. */}
            <a
              href={contentModule.downloadUrl}
              download
              className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-300"
            >
              <span aria-hidden>⬇️</span>
              {contentModule.downloadLabel ?? "Baixar arquivo"}
            </a>
          </div>
        </div>
      ) : (
        <div className="px-6 py-10 md:px-10 md:py-12">
          <div className="max-w-2xl">
            <h2 className="heading-tight-2 text-xl text-white flex items-center gap-2 mb-6 md:text-2xl">
              <span aria-hidden>🎓</span> Aulas
            </h2>

            {contentModule.lessons.length === 0 ? (
              <p className="text-sm text-muted-dim">Nenhuma aula disponível ainda neste módulo.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {contentModule.lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    id={lesson.id}
                    moduleId={contentModule.id}
                    title={lesson.title}
                    description={lesson.description ?? null}
                    videoUrl={lesson.videoUrl}
                    thumbnailUrl={lesson.thumbnailUrl ?? null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
