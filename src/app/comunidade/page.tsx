import { createClient } from "@/lib/supabase/server";
import { MembersHero, type HeroAction } from "@/components/community/members-hero";
import { ModuleRail } from "@/components/community/module-rail";
import { ContinueCard } from "@/components/community/continue-card";
import { GROUPS, MODULES, type Module } from "@/lib/modules-content";
import { getContinueTarget, getModuleProgress } from "@/lib/progress";

type FeaturedVideo = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  creator_name: string | null;
};

const FALLBACK_HERO = "/images/landing/desktop-hero.webp";

/**
 * Root of /comunidade — the members area home.
 *
 * Estrutura (na ordem em que a pessoa encontra): hero de boas-vindas com
 * UMA ação principal, a faixa "Continuar de onde parou" quando há algo em
 * andamento, e as trilhas de módulos agrupadas por GROUPS.
 *
 * O hero muda de função conforme o estado de quem entra -- retomar a aula
 * em andamento, assistir o destaque, ou começar o primeiro módulo -- porque
 * a decisão de "o que eu faço agora" é a única coisa que importa na
 * primeira tela, e ela é diferente na décima visita e na primeira.
 *
 * Os módulos vêm de src/lib/modules-content.ts (editado à mão no código),
 * não da tabela `modules` / do form de admin (essa tabela e o ModuleForm
 * continuam existindo, só não estão ligados aqui -- mesmo tratamento
 * "deixa vivo, só desliga da navegação" dado ao sidebar de canais antigo).
 * Progresso, esse sim, vem do banco (0015_lesson_progress.sql).
 */
export default async function ComunidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout.tsx already redirects

  const [videosResult, progress, continueTarget] = await Promise.all([
    supabase
      .from("featured_videos")
      .select("id, title, video_url, thumbnail_url, creator_name")
      .order("created_at", { ascending: false })
      .limit(1),
    getModuleProgress(),
    getContinueTarget(),
  ]);

  const featuredVideo: FeaturedVideo | null = videosResult.data?.[0] ?? null;

  // Grayscale/cadeado no card já é 100% CSS -- só faltava esse `isLocked`
  // vir do acesso real de quem está olhando, não do dado estático do
  // módulo. Um módulo travado só continua "visualmente travado" pra quem
  // NÃO tem o produto; quem tem, vê a capa colorida e sem cadeado.
  const lockedIds = new Set<string>();
  await Promise.all(
    MODULES.filter((m) => m.isLocked).map(async (mod) => {
      const { data: hasAccess } = await supabase.rpc("has_product_access", {
        p_product: mod.requiredProduct ?? "calculadora",
      });
      if (!hasAccess) lockedIds.add(mod.id);
    })
  );

  const byGroup: { id: string; label: string; hint?: string; modules: Module[] }[] = GROUPS.map(
    (group) => ({
      ...group,
      // Módulo sem `group` cai na primeira trilha em vez de sumir da home.
      modules: MODULES.filter(
        (m) => (m.group ?? GROUPS[0]!.id) === group.id
      ),
    })
  ).filter((group) => group.modules.length > 0);

  /* Ação do hero, em ordem de prioridade: retomar > destaque > começar. */
  let heroAction: HeroAction | null = null;
  if (continueTarget) {
    heroAction = {
      label: "Continuar de onde parou",
      href: `/comunidade/modulos/${continueTarget.module.id}/aulas/${continueTarget.lesson.id}`,
      context: `${continueTarget.module.title} · Aula ${continueTarget.index + 1} de ${continueTarget.module.lessons.length}`,
      percent: continueTarget.percent,
    };
  } else if (featuredVideo?.video_url) {
    heroAction = {
      label: "Assistir o destaque",
      href: featuredVideo.video_url,
      context: featuredVideo.creator_name ?? undefined,
      external: true,
    };
  } else {
    const firstOpen = MODULES.find((m) => m.lessons.length > 0 && !lockedIds.has(m.id));
    if (firstOpen) {
      heroAction = {
        label: "Começar agora",
        href: `/comunidade/modulos/${firstOpen.id}`,
        context: `Comece por ${firstOpen.title}`,
      };
    }
  }

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const doneLessons = Object.values(progress).reduce((sum, p) => sum + p.completed, 0);

  return (
    <div className="flex flex-col">
      <MembersHero
        title={featuredVideo?.title ?? "Carbmaxxing"}
        description={
          featuredVideo
            ? "Novo conteúdo em destaque na sua área. Abaixo, a trilha completa e as ferramentas."
            : "Tudo que você precisa pra montar e ajustar a própria dieta, na ordem. Comece pela trilha e use a calculadora no dia a dia."
        }
        imageUrl={featuredVideo?.thumbnail_url || FALLBACK_HERO}
        action={heroAction}
      />

      {continueTarget && (
        <div className="px-6 pt-10 md:px-10 md:pt-12">
          <ContinueCard
            moduleId={continueTarget.module.id}
            moduleTitle={continueTarget.module.title}
            lessonId={continueTarget.lesson.id}
            lessonTitle={continueTarget.lesson.title}
            lessonIndex={continueTarget.index}
            lessonCount={continueTarget.module.lessons.length}
            coverUrl={continueTarget.lesson.thumbnailUrl ?? continueTarget.module.coverUrl ?? null}
            percent={continueTarget.percent}
          />
        </div>
      )}

      <div id="trilhas" className="scroll-mt-20 px-0 py-10 md:py-14">
        <div className="mb-8 flex items-end justify-between gap-4 px-6 md:px-10">
          <p className="text-sm font-semibold tracking-tight text-white sm:text-base">
            Meus conteúdos:
          </p>
          {totalLessons > 0 && (
            <p className="shrink-0 text-[11px] font-medium tabular-nums tracking-tight text-muted-dim">
              {doneLessons} de {totalLessons} aulas
            </p>
          )}
        </div>

        <div className="flex flex-col gap-12 md:gap-14">
          {byGroup.map((group, i) => (
            <ModuleRail
              key={group.id}
              label={group.label}
              hint={group.hint}
              modules={group.modules}
              progress={progress}
              lockedIds={lockedIds}
              priorityFirstCard={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
