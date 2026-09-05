/**
 * Members-area content, hand-edited here in code instead of through the
 * admin forms / Supabase tables (0011_modules_lessons.sql's `modules` and
 * `lessons` tables are still in the DB -- harmless, just unused -- this is
 * the real source of truth now). Add a module by adding an entry to
 * MODULES; add a lesson by adding an entry to that module's `lessons`
 * array. `id` doubles as the URL slug (/comunidade/modulos/<id>), so keep
 * it short, lowercase, hyphenated, and stable once shared/linked anywhere.
 *
 * `isLocked` still gates for real: a locked module's lessons are hidden
 * from anyone without has_content_access() (admin, or an active
 * subscription once Stripe is wired back up) -- see
 * src/app/comunidade/modulos/[id]/page.tsx.
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
  lessons: Lesson[];
  /**
   * When set, the module's page renders this interactive tool instead of
   * the Aulas/lesson list -- see src/components/community/carb-calculator.tsx
   * and src/app/comunidade/modulos/[id]/page.tsx.
   */
  customTool?: "carb-calculator";
};

export const MODULES: Module[] = [
  {
    id: "modulo-1",
    title: "Módulo 1",
    coverUrl: "/images/landing/calculadora-tool-hero.webp",
    hideCaption: true,
    isLocked: false,
    lessons: [],
    customTool: "carb-calculator",
  },
  {
    id: "modulo-2",
    title: "Módulo 2",
    coverUrl: "/images/landing/modulo1.webp",
    hideCaption: true,
    isLocked: true,
    lessons: [],
  },
];
