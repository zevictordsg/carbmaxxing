import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoverPlaceholder } from "@/components/cover-placeholder";
import { LessonCard } from "@/components/community/lesson-card";
import { LessonForm } from "@/components/community/lesson-form";

/**
 * One module's page: cover + title/description up top, then its aulas
 * (lessons) as a simple list. RLS already keeps a locked-and-inaccessible
 * module out of reach entirely (notFound() below covers both "doesn't
 * exist" and "exists but you can't see it" -- same shape either way, so
 * nothing about access leaks through the 404).
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

  const [{ data: module }, { data: profile }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, description, cover_url, is_locked")
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  if (!module) notFound();

  const isAdmin = profile?.is_admin ?? false;

  const { data: rawLessons } = await supabase
    .from("lessons")
    .select("id, title, description, video_url, thumbnail_url")
    .eq("module_id", module.id)
    .order("order", { ascending: true });

  const lessons = rawLessons ?? [];

  return (
    <div className="flex flex-col">
      <section className="relative h-[220px] w-full overflow-hidden sm:h-[280px] md:h-[320px]">
        <CoverPlaceholder className="h-full w-full">
          {module.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={module.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </CoverPlaceholder>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-2 via-surface-2/70 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-8 md:px-10">
          <h1 className="heading-tight text-3xl text-white sm:text-4xl md:text-5xl">
            {module.title}
          </h1>
          {module.description && (
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              {module.description}
            </p>
          )}
        </div>
      </section>

      <div className="px-6 py-10 md:px-10 md:py-12">
        <div className="max-w-2xl">
          <h2 className="heading-tight-2 text-xl text-white flex items-center gap-2 mb-6 md:text-2xl">
            <span aria-hidden>🎓</span> Aulas
          </h2>

          {isAdmin && (
            <div className="mb-6">
              <LessonForm moduleId={module.id} />
            </div>
          )}

          {lessons.length === 0 ? (
            <p className="text-sm text-muted-dim">
              {isAdmin
                ? "Nenhuma aula ainda -- adicione a primeira acima."
                : "Nenhuma aula disponível ainda neste módulo."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  id={lesson.id}
                  moduleId={module.id}
                  title={lesson.title}
                  description={lesson.description}
                  videoUrl={lesson.video_url}
                  thumbnailUrl={lesson.thumbnail_url}
                  canDelete={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
