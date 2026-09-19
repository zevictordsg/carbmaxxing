import { createClient } from "@/lib/supabase/server";
import { MODULES, findModule, type Lesson, type Module } from "@/lib/modules-content";

/**
 * Leitura do progresso do membro logado, em cima de 0015_lesson_progress.sql.
 *
 * Tudo aqui degrada pra "sem progresso" em silêncio quando a RPC falha. O
 * motivo é concreto: a migração 0015 pode ainda não ter rodado no Supabase
 * quando este código subir, e nesse caso a home e a página de módulo
 * precisam continuar funcionando (só sem barra de progresso) em vez de
 * quebrar inteiras por causa de uma função que não existe. Progresso é
 * enfeite de navegação, não conteúdo.
 */

export type ModuleProgress = {
  /** Aulas concluídas. */
  completed: number;
  /** Total de aulas do módulo (vem do código, não do banco). */
  total: number;
  /** 0-100, arredondado. 0 quando o módulo não tem aula. */
  percent: number;
  /** true quando terminou todas as aulas (e o módulo tem pelo menos uma). */
  done: boolean;
};

export type ContinueTarget = {
  module: Module;
  lesson: Lesson;
  /** Índice da aula dentro do módulo, pra mostrar "Aula 2 de 4". */
  index: number;
  positionSeconds: number;
  durationSeconds: number | null;
  /** 0-100 dentro da própria aula, quando a duração é conhecida. */
  percent: number | null;
};

function emptyFor(total: number): ModuleProgress {
  return { completed: 0, total, percent: 0, done: false };
}

/**
 * Progresso de todos os módulos, indexado pelo slug. Sempre devolve uma
 * entrada por módulo -- inclusive os de zero aula (Calculadora, PDF), que
 * vêm com total 0 e percent 0, pra quem consome não precisar checar
 * ausência de chave.
 */
export async function getModuleProgress(): Promise<Record<string, ModuleProgress>> {
  const base: Record<string, ModuleProgress> = {};
  for (const mod of MODULES) base[mod.id] = emptyFor(mod.lessons.length);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("my_module_progress");
    if (error || !data) return base;

    for (const row of data as { module_id: string; completed_lessons: number }[]) {
      const mod = findModule(row.module_id);
      if (!mod) continue; // módulo removido do código: progresso órfão, ignora
      const total = mod.lessons.length;
      // clamp: se uma aula saiu do código, o contador do banco pode passar
      // do total atual -- 5 de 4 aulas não é um estado que a UI deva exibir.
      const completed = Math.min(Number(row.completed_lessons) || 0, total);
      base[mod.id] = {
        completed,
        total,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
        done: total > 0 && completed >= total,
      };
    }
  } catch {
    return base;
  }

  return base;
}

/**
 * A última aula começada e não terminada -- alimenta o "Continuar de onde
 * parou" da home. null quando não há nada em andamento, quando a aula saiu
 * do código, ou quando a RPC não está disponível.
 */
export async function getContinueTarget(): Promise<ContinueTarget | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("my_last_lesson");
    if (error || !data) return null;

    const row = (data as {
      module_id: string;
      lesson_id: string;
      position_seconds: number;
      duration_seconds: number | null;
    }[])[0];
    if (!row) return null;

    const mod = findModule(row.module_id);
    if (!mod) return null;
    const index = mod.lessons.findIndex((l) => l.id === row.lesson_id);
    if (index === -1) return null;

    const duration = row.duration_seconds ?? null;
    return {
      module: mod,
      lesson: mod.lessons[index]!,
      index,
      positionSeconds: row.position_seconds ?? 0,
      durationSeconds: duration,
      percent:
        duration && duration > 0
          ? Math.min(100, Math.round(((row.position_seconds ?? 0) / duration) * 100))
          : null,
    };
  } catch {
    return null;
  }
}

export type LessonProgress = {
  positionSeconds: number;
  durationSeconds: number | null;
  completed: boolean;
};

/**
 * Progresso de UMA aula -- é o que o player usa pra abrir já no ponto onde
 * a pessoa parou. Zerado quando não há linha ainda (primeira vez) ou quando
 * a migração 0015 não rodou.
 */
export async function getLessonProgress(
  moduleId: string,
  lessonId: string
): Promise<LessonProgress> {
  const empty: LessonProgress = { positionSeconds: 0, durationSeconds: null, completed: false };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lesson_progress")
      .select("position_seconds, duration_seconds, completed")
      .eq("module_id", moduleId)
      .eq("lesson_id", lessonId)
      .maybeSingle();
    if (error || !data) return empty;
    const row = data as { position_seconds: number; duration_seconds: number | null; completed: boolean };
    return {
      positionSeconds: row.position_seconds ?? 0,
      durationSeconds: row.duration_seconds ?? null,
      completed: Boolean(row.completed),
    };
  } catch {
    return empty;
  }
}

/** Ids das aulas já concluídas de um módulo, pro check na lista de aulas. */
export async function getCompletedLessonIds(moduleId: string): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("module_id", moduleId)
      .eq("completed", true);
    if (error || !data) return new Set();
    return new Set((data as { lesson_id: string }[]).map((r) => r.lesson_id));
  } catch {
    return new Set();
  }
}
