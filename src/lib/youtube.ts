/**
 * Parser de link do YouTube -- é o que deixa o campo `videoUrl` de
 * src/lib/modules-content.ts aceitar qualquer coisa que o YouTube devolve no
 * botão "Compartilhar", em vez de exigir um formato específico na mão.
 *
 * Vídeo NÃO LISTADO (o caso desta área de membros) toca normalmente dentro
 * de um embed: "não listado" só o tira da busca e do canal, não bloqueia a
 * reprodução. Quem tem o link assiste -- então o link continua sendo o
 * segredo, e é por isso que a página da aula fica atrás do mesmo gate de
 * produto do módulo (ver src/app/comunidade/modulos/[id]/aulas/[lessonId]).
 *
 * Vídeo PRIVADO, ao contrário, NÃO toca em embed nenhum. Se uma aula não
 * aparecer, é quase sempre isso: o vídeo está como privado no YouTube Studio
 * e precisa virar "não listado".
 */

/** Ids do YouTube têm 11 caracteres deste alfabeto. */
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extrai o id de 11 caracteres de qualquer forma usual de link -- ou do
 * próprio id, colado puro. Devolve null quando não dá pra reconhecer, e aí a
 * UI trata a aula como "vídeo indisponível" em vez de montar um embed quebrado.
 *
 * Formatos cobertos:
 *   https://www.youtube.com/watch?v=ID (com &t=, &list=, etc)
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/live/ID
 *   ID
 */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (ID_RE.test(raw)) return raw;

  let url: URL;
  try {
    // Link colado sem protocolo ("youtu.be/xyz") não é URL válida -- prefixa.
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && ID_RE.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && ID_RE.test(v)) return v;

    const segments = url.pathname.split("/").filter(Boolean);
    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    if (segments.length >= 2 && ["embed", "shorts", "live", "v"].includes(segments[0]!)) {
      const id = segments[1]!;
      return ID_RE.test(id) ? id : null;
    }
  }

  return null;
}

/**
 * Segundos de início embutidos no link (&t=90, &t=1m30s, #t=90). O player
 * usa isso só quando a pessoa ainda não tem posição salva -- o progresso do
 * banco sempre ganha do link.
 */
export function parseYouTubeStart(input: string): number | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  const t = url.searchParams.get("t") ?? url.searchParams.get("start") ?? url.hash.match(/t=([^&]+)/)?.[1];
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}
