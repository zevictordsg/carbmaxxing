/**
 * Members-area content, hand-edited here in code instead of through the
 * admin forms / Supabase tables (0011_modules_lessons.sql's `modules` and
 * `lessons` tables are still in the DB -- harmless, just unused -- this is
 * the real source of truth now). Add a module by adding an entry to
 * MODULES; add a lesson by adding an entry to that module's `lessons`
 * array. `id` doubles as the URL slug (/comunidade/modulos/<id>), so keep
 * it short, lowercase, hyphenated, and stable once shared/linked anywhere
 * -- o progresso em 0015_lesson_progress.sql é gravado por esse slug, então
 * renomear um id depois de publicado zera o progresso de quem já assistiu.
 *
 * `isLocked` still gates for real: a locked module's lessons/tool are
 * hidden from anyone without access to `requiredProduct` (checked via
 * has_product_access(product), 0014_product_access_generic.sql -- admin,
 * or an active `subscriptions` row for that exact product) -- see
 * src/app/comunidade/modulos/[id]/page.tsx. Defaults to 'calculadora' when
 * omitted, for backward compatibility with modules that predate this field.
 *
 * `group` agrupa os módulos em trilhas na home (ver GROUPS abaixo). Um
 * módulo sem `group` cai na primeira trilha, então adicionar um card novo
 * nunca faz ele desaparecer da home por esquecimento.
 */

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  /**
   * URL do vídeo. Vazio = aula anunciada mas ainda não publicada: a lista
   * mostra a linha como "Em breve", sem link (ver LessonRow).
   */
  videoUrl: string;
  thumbnailUrl?: string;
  /** Só rótulo de UI ("12 min") -- a duração real vem do player. */
  durationLabel?: string;
};

export type ModuleGroup = "trilha" | "ferramentas";

export type Module = {
  id: string;
  title: string;
  /** Rótulo entre colchetes no card e no topo da página do módulo. */
  categoryLabel?: string;
  description?: string;
  coverUrl?: string;
  /** true: card shows just the cover art, no [Módulo] tag/title overlay. */
  hideCaption?: boolean;
  isLocked: boolean;
  /** Qual produto libera este módulo quando isLocked=true (ver has_product_access). Default: 'calculadora'. */
  requiredProduct?: "pdf" | "calculadora";
  /** Em qual trilha da home o card aparece. Default: 'trilha'. */
  group?: ModuleGroup;
  lessons: Lesson[];
  /**
   * Quando setado, a página do módulo mostra um botão "Baixar PDF" (link
   * com `download`, mesma origem -- ver src/app/comunidade/modulos/[id]/page.tsx)
   * em vez da lista de aulas. Caminho relativo dentro de `public/`
   * (ex: "/files/como-montar-sua-dieta.pdf") ou URL completa.
   */
  downloadUrl?: string;
  downloadLabel?: string;
  /**
   * When set, the module's page renders this interactive tool instead of
   * the Aulas/lesson list -- see src/components/community/carb-calculator.tsx
   * and src/app/comunidade/modulos/[id]/page.tsx.
   */
  customTool?: "carb-calculator";
};

/**
 * Ordem e rótulo das trilhas na home. Pra criar uma trilha nova: adiciona
 * a chave em ModuleGroup, a entrada aqui, e usa `group` nos módulos. A home
 * ignora trilha sem nenhum módulo, então dá pra deixar preparada antes de
 * ter conteúdo.
 */
export const GROUPS: { id: ModuleGroup; label: string; hint?: string }[] = [
  {
    id: "trilha",
    label: "Trilha principal",
    hint: "Na ordem. Cada módulo assume que você viu o anterior.",
  },
  {
    id: "ferramentas",
    label: "Ferramentas",
    hint: "Pra usar no dia a dia, na ordem que você quiser.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   ATENÇÃO — DUAS COISAS PENDENTES AQUI

   1. Os títulos e descrições das aulas já são os definitivos; falta só o
      vídeo. Cole em `videoUrl` o link NÃO LISTADO do YouTube de cada aula
      (qualquer formato serve: youtu.be/ID, watch?v=ID, ou só o ID -- ver
      src/lib/youtube.ts). Enquanto `videoUrl` estiver vazia a aula aparece
      como "Em breve", sem link. `durationLabel` é opcional: preencha
      ("12 min") se quiser mostrar a duração na lista.
      ATENÇÃO: vídeo PRIVADO não toca em player embutido -- tem que estar
      como "não listado" no YouTube Studio.

   2. Esses três módulos estão com isLocked=false, ou seja: QUALQUER pessoa
      logada vê as aulas, inclusive quem só criou conta em /cadastro sem
      comprar nada. Isso é proposital só enquanto o conteúdo é placeholder.
      Antes de publicar aula de verdade, escolha um dos dois:
        a) isLocked=true + requiredProduct de um produto existente
           ('calculadora' ou 'pdf'); ou
        b) criar um produto novo (ex: 'comunidade') -- aí precisa de uma
           migração nova: o gate has_product_access(text) já é genérico
           (0014), mas as assinaturas precisam existir com esse `product`.
   ───────────────────────────────────────────────────────────────────────── */

export const MODULES: Module[] = [
  {
    id: "o-inicio",
    title: "O Início",
    categoryLabel: "Dieta",
    description:
      "A parte mais importante: ajustar o metabolismo antes de mexer em qualquer outra coisa. Déficit calórico e o percentual certo pro seu caso.",
    // A arte já traz a tag e o título embutidos (M1-M4 vêm do Figma assim),
    // então o card não sobrepõe texto -- ver hideCaption no ContentCard.
    coverUrl: "/images/landing/M1.webp",
    hideCaption: true,
    isLocked: false,
    group: "trilha",
    lessons: [
      {
        id: "ajustando-o-metabolismo",
        title: "Ajustando o metabolismo",
        description: "Déficit calórico e o percentual correto.",
        videoUrl: "",
      },
    ],
  },
  {
    id: "sem-medo",
    title: "Sem medo",
    categoryLabel: "Dieta",
    description:
      "Sem medo de comer: como montar a sua dieta do zero. Da conta das calorias até a escolha dos alimentos e as substituições.",
    coverUrl: "/images/landing/M2.webp",
    hideCaption: true,
    isLocked: false,
    group: "trilha",
    lessons: [
      {
        id: "calculando-as-calorias",
        title: "Calculando as calorias",
        description: "Como fazer os cálculos e trackear as calorias.",
        videoUrl: "",
      },
      {
        id: "montando-a-dieta",
        title: "Montando a dieta do jeito correto",
        description: "Os melhores alimentos, fontes e opções de substituições.",
        videoUrl: "",
      },
      {
        id: "aplicando-os-hacks",
        title: "Aplicando os hacks corretos",
        description: "Dicas de cardio, gasto calórico e a relação com os bpms.",
        videoUrl: "",
      },
    ],
  },
  {
    id: "o-hack",
    title: "O hack",
    categoryLabel: "Dieta",
    description:
      "O maior hack da dieta: o banco de calorias. Como usar sem paranoia e como distribuir a semana pra fazer a refeição livre sem culpa.",
    coverUrl: "/images/landing/M3.webp",
    hideCaption: true,
    isLocked: false,
    group: "trilha",
    lessons: [
      {
        id: "banco-de-calorias",
        title: "Banco de calorias",
        description: "O conceito por trás e alguns adendos.",
        videoUrl: "",
      },
      {
        id: "como-fazer-corretamente",
        title: "Como fazer corretamente",
        description: "As melhores maneiras de aplicar, sem virar paranoia.",
        videoUrl: "",
      },
      {
        id: "refeicao-livre-sem-culpa",
        title: "Faça refeição livre sem culpa",
        description: "Como distribuir as calorias corretamente.",
        videoUrl: "",
      },
    ],
  },
  {
    id: "calculadora",
    title: "Calculadora",
    categoryLabel: "Ferramenta",
    description:
      "Você coloca os seus números e ela devolve a meta calórica da semana, os macros do dia e o plano de refeições com os alimentos que você já come.",
    coverUrl: "/images/landing/M4.webp",
    hideCaption: true,
    isLocked: true,
    requiredProduct: "calculadora",
    group: "ferramentas",
    lessons: [],
    customTool: "carb-calculator",
  },
  {
    id: "pdf-dieta",
    title: "Como Montar Sua Própria Dieta",
    categoryLabel: "Guia",
    description:
      "As 6 contas que definem a sua meta calórica, a linha do tempo do carboidrato e um exemplo real montado do começo ao fim. O material de consulta pra ter do lado.",
    // Capa colorida original -- o cinza/cadeado quando travado já é
    // aplicado via CSS pelo ContentCard (`grayscale` quando isLocked),
    // então não precisa de uma imagem pré-dessaturada separada.
    coverUrl: "/images/landing/pdf.png",
    // A arte do guia também já traz o próprio título -- sobrepor o texto do
    // card duplicava o nome em cima da capa.
    hideCaption: true,
    isLocked: true,
    requiredProduct: "pdf",
    group: "ferramentas",
    lessons: [],
    // Coloque o PDF de verdade em public/files/como-montar-sua-dieta.pdf
    // (crie a pasta public/files/ se ainda não existir) -- o link abaixo já
    // aponta pra lá.
    downloadUrl: "/files/como-montar-sua-dieta.pdf",
    downloadLabel: "Baixar o guia em PDF",
  },
];

/** Módulo pelo slug da URL, ou undefined. */
export function findModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id);
}

/** Aula pelo par de slugs, com o módulo dela. */
export function findLesson(moduleId: string, lessonId: string) {
  const mod = findModule(moduleId);
  if (!mod) return undefined;
  const index = mod.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;
  return {
    module: mod,
    lesson: mod.lessons[index]!,
    index,
    previous: index > 0 ? mod.lessons[index - 1]! : undefined,
    next: index < mod.lessons.length - 1 ? mod.lessons[index + 1]! : undefined,
  };
}
