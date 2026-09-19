"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseYouTubeId, parseYouTubeStart } from "@/lib/youtube";

/**
 * Player da aula + gravação de progresso.
 *
 * Por que a IFrame API do YouTube e não um <iframe> simples: o iframe puro
 * não conta nada -- sem ele não existe "continuar de onde parou" nem aula
 * marcada como concluída sozinha, e aí a pessoa teria que marcar tudo à mão.
 * Com a API o componente sabe o tempo corrente e a duração, e é só isso que
 * ele lê do player.
 *
 * Domínio youtube-nocookie: mesmo player, sem os cookies de publicidade
 * enquanto ninguém dá play. Vídeo não listado toca normalmente nele.
 *
 * Gravação (save_lesson_progress, 0015_lesson_progress.sql):
 *  - a cada 10s tocando, e só quando o tempo andou de verdade;
 *  - ao pausar e ao sair da página / trocar de aba;
 *  - 'completed' ao chegar em 92% (creditar exige ver o conteúdo, não os
 *    créditos finais) ou no fim do vídeo. A RPC nunca volta completed pra
 *    false, então reassistir não desmarca.
 * Falha de gravação é engolida de propósito: progresso não pode interromper
 * a aula, e a próxima gravação (10s depois) tenta de novo.
 */

const SAVE_EVERY_SECONDS = 10;
const COMPLETE_AT = 0.92;

/* Carrega o script da API uma única vez por aba, mesmo com o componente
   remontando na navegação entre aulas. */
let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function LessonPlayer({
  moduleId,
  lessonId,
  videoUrl,
  initialPosition,
  initialCompleted,
  nextHref,
  nextTitle,
}: {
  moduleId: string;
  lessonId: string;
  videoUrl: string;
  /** Segundos salvos da última vez -- o player abre daqui. */
  initialPosition: number;
  initialCompleted: boolean;
  /** Link da próxima aula, mostrado quando o vídeo termina. */
  nextHref?: string;
  nextTitle?: string;
}) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const lastSavedRef = useRef<number>(initialPosition);
  const completedRef = useRef<boolean>(initialCompleted);

  const [completed, setCompleted] = useState(initialCompleted);
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);

  const videoId = parseYouTubeId(videoUrl);
  const linkStart = parseYouTubeStart(videoUrl) ?? 0;
  /* Posição salva ganha do &t= do link; retomar só faz sentido depois de
     alguns segundos, senão "continuar" volta pro começo de qualquer forma. */
  const startAt = completed ? 0 : initialPosition > 5 ? initialPosition : linkStart;

  const save = useCallback(
    async (position: number, duration: number | null, markCompleted: boolean) => {
      try {
        const supabase = createClient();
        await supabase.rpc("save_lesson_progress", {
          p_module: moduleId,
          p_lesson: lessonId,
          p_position: Math.max(0, Math.floor(position)),
          p_duration: duration && duration > 0 ? Math.floor(duration) : null,
          p_completed: markCompleted,
        });
        lastSavedRef.current = position;
      } catch {
        /* silencioso -- ver comentário no topo */
      }
    },
    [moduleId, lessonId]
  );

  /* Lê o player e grava se valeu a pena. `force` ignora o intervalo (pausa,
     saída da página, fim do vídeo). */
  const tick = useCallback(
    (force = false) => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;

      const position = Number(player.getCurrentTime()) || 0;
      const duration = Number(player.getDuration()) || 0;
      const reachedEnd = duration > 0 && position / duration >= COMPLETE_AT;
      const shouldComplete = completedRef.current || reachedEnd;

      const moved = Math.abs(position - lastSavedRef.current) >= SAVE_EVERY_SECONDS;
      const newlyCompleted = reachedEnd && !completedRef.current;
      if (!force && !moved && !newlyCompleted) return;

      if (newlyCompleted) {
        completedRef.current = true;
        setCompleted(true);
        // A lista de aulas e as barras de progresso são server-rendered:
        // sem o refresh o check só apareceria na próxima navegação.
        router.refresh();
      }

      void save(position, duration || null, shouldComplete);
    },
    [router, save]
  );

  useEffect(() => {
    if (!videoId) return;
    let disposed = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    void loadYouTubeApi().then(() => {
      if (disposed || !mountRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YT = (window as any).YT;
      if (!YT?.Player) return;

      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: Math.floor(startAt),
        },
        events: {
          onReady: () => {
            if (!disposed) setReady(true);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === YT.PlayerState.PLAYING) {
              setEnded(false);
              interval ??= setInterval(() => tick(), SAVE_EVERY_SECONDS * 1000);
            } else {
              if (interval) {
                clearInterval(interval);
                interval = undefined;
              }
              if (state === YT.PlayerState.PAUSED) tick(true);
              if (state === YT.PlayerState.ENDED) {
                setEnded(true);
                if (!completedRef.current) {
                  completedRef.current = true;
                  setCompleted(true);
                  router.refresh();
                }
                const player = playerRef.current;
                const duration = Number(player?.getDuration?.()) || 0;
                void save(duration, duration || null, true);
              }
            }
          },
        },
      });
    });

    /* Fechar a aba / trocar de aba é o caso mais comum de "parei no meio":
       visibilitychange dispara de forma confiável no mobile, onde pagehide
       às vezes não chega. */
    const onHide = () => tick(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);

    return () => {
      disposed = true;
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      tick(true);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // videoId/startAt mudam quando a pessoa navega pra outra aula: o player
    // é recriado, e é isso que a gente quer.
  }, [videoId, startAt, tick, save, router]);

  async function markCompleted() {
    const player = playerRef.current;
    const position = Number(player?.getCurrentTime?.()) || 0;
    const duration = Number(player?.getDuration?.()) || 0;
    completedRef.current = true;
    setCompleted(true);
    await save(position, duration || null, true);
    router.refresh();
  }

  /* Sem vídeo ainda: mostra o lugar exato onde o player vai entrar, em vez
     de esconder a área. É o que deixa a estrutura visível enquanto as aulas
     não foram gravadas. */
  if (!videoId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl bg-surface ring-1 ring-white/[0.07]">
        <span
          aria-hidden
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl text-white/25 ring-1 ring-white/10"
        >
          ▶
        </span>
        <p className="label-loose text-[9px] text-white/35">Em breve</p>
        <p className="max-w-xs px-6 text-center text-xs leading-relaxed text-muted-dim">
          O vídeo desta aula ainda não foi publicado. Quando subir, ele toca aqui mesmo — e o
          seu progresso passa a ser salvo automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/[0.07]">
        {/* A API troca esta div pelo <iframe>, então nada de filhos aqui. */}
        <div ref={mountRef} className="absolute inset-0 h-full w-full" />

        {!ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
          </div>
        )}

        {ended && nextHref && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center backdrop-blur-sm">
            <p className="label-loose text-[9px] text-white/45">Próxima aula</p>
            <p className="heading-tight-2 max-w-md text-lg text-white sm:text-2xl">{nextTitle}</p>
            <Link
              href={nextHref}
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-tight text-black transition-transform duration-300 ease-out hover:-translate-y-0.5"
            >
              <span aria-hidden>▶</span> Assistir agora
            </Link>
            <button
              type="button"
              onClick={() => setEnded(false)}
              className="label-loose text-[9px] text-white/45 transition-colors hover:text-white"
            >
              Rever esta aula
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {completed ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-[11px] font-semibold tracking-tight text-white ring-1 ring-white/15">
            <span aria-hidden>✓</span> Aula concluída
          </span>
        ) : (
          <button
            type="button"
            onClick={markCompleted}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] font-semibold tracking-tight text-white/70 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white hover:text-black hover:ring-white"
          >
            <span aria-hidden>✓</span> Marcar como concluída
          </button>
        )}
        {!completed && (
          <p className="text-[11px] text-muted-dim">
            Ou apenas assista: marcamos sozinho quando você chega ao fim.
          </p>
        )}
      </div>
    </div>
  );
}
