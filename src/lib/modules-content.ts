/**
 * Members-area content, hand-edited here in code instead of through the
 * admin forms / Supabase tables (0011_modules_lessons.sql's `modules` and
 * `lessons` tables are still in the DB -- harmless, just unused -- this is
 * the real source of truth now). Add a module by adding an entry to
 * MODULES; add a lesson by adding an entry to that module's `lessons`
 * array. `id` doubles as the URL slug (/comunidade/modulos/<id>), so keep
 * it short, lowercase, hyphenated, and stable once shared/linked anywhere.
 *
 * `isLocked` still gates for real: a locked module's lessons/tool are
 * hidden from anyone without access to `requiredProduct` (checked via
 * has_product_access(product), 0014_product_access_generic.sql -- admin,
 * or an active `subscriptions` row for that exact product) -- see
 * src/app/comunidade/modulos/[id]/page.tsx. Defaults to 'calculadora' when
 * omitted, for backward compatibility with modules that predate this field.
 */

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
};

export type Module = {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  /** true: card shows just the cover art, no [Módulo] tag/title overlay. */
  hideCaption?: boolean;
  isLocked: boolean;
  /** Qual produto libera este módulo quando isLocked=true (ver has_product_access). Default: 'calculadora'. */
  requiredProduct?: "pdf" | "calculadora";
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

export const MODULES: Module[] = [
  {
    id: "pdf-dieta",
    title: "PDF Como Montar Sua Dieta",
    coverUrl: "/images/landing/pdf-grayscale.png",
    isLocked: true,
    requiredProduct: "pdf",
    lessons: [],
    // Coloque o PDF de verdade em public/files/como-montar-sua-dieta.pdf
    // (crie a pasta public/files/ se ainda não existir) -- o link abaixo já
    // aponta pra lá.
    downloadUrl: "/files/como-montar-sua-dieta.pdf",
    downloadLabel: "Baixar PDF — Como Montar Sua Dieta",
  },
  {
    id: "calculadora",
    title: "Calculadora",
    coverUrl: "/images/landing/calculadora-tool-hero.webp",
    hideCaption: true,
    isLocked: true,
    requiredProduct: "calculadora",
    lessons: [],
    customTool: "carb-calculator",
  },
];
