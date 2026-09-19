import Image from "next/image";
import Link from "next/link";
import { ProgressBar } from "@/components/community/progress-bar";

export type HeroAction = {
  label: string;
  href: string;
  /** Linha pequena acima do bloco de ação (ex: "O Início · Aula 2 de 4"). */
  context?: string;
  /** 0-100, quando a ação é retomar algo em andamento. */
  percent?: number | null;
  /** true quando o destino é externo (vídeo em outra aba). */
  external?: boolean;
};

/**
 * Hero da área de membros, no formato da referência do Balaclava: foto
 * sangrando na largura toda, rótulo entre colchetes, a marca em peso alto
 * e tracking fechado, e uma descrição curta em corpo pequeno.
 *
 * `-mt-16` cancela o `pt-16` que o layout reserva pra TopBar fixa -- sem
 * isso a foto começaria 64px abaixo do topo real da viewport e o efeito de
 * logo sobreposto na imagem se perderia (ver o comentário em layout.tsx).
 *
 * A ação principal é opcional e muda de significado: "Continuar" quando há
 * progresso, "Começar" quando é a primeira visita. É a decisão que a pessoa
 * tem que tomar ao abrir a área, então fica no hero e não enterrada na
 * lista.
 */
export function MembersHero({
  eyebrow = "Bem vindo",
  title,
  description,
  imageUrl,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  imageUrl: string;
  action?: HeroAction | null;
}) {
  /* min-h-svh, não dvh: svh é a altura com a barra do navegador VISÍVEL, que
     é exatamente o "inicialmente" do pedido -- com dvh o hero muda de altura
     quando a barra recolhe no scroll e a página dá um pulo. Combinado com o
     -mt-16, a foto começa em y=0 e termina exatamente na dobra. */
  return (
    <section className="grain relative -mt-16 flex min-h-svh w-full flex-col justify-end overflow-hidden">
      {/* A foto não cobre a mesma área nas duas larguras, e é de propósito.
          A arte é deitada (16:9); num celular em pé, object-cover num bloco
          de tela cheia amplia tanto que sobra só uma tira do meio -- o
          assunto sai do quadro. Então no mobile ela ocupa a faixa de cima e
          derrete no preto, com o texto embaixo dela; de lg pra cima, onde a
          proporção da tela já é parecida com a da arte, cobre tudo.
          A seção continua com min-h-svh nos dois casos: a primeira tela é
          toda dela, que é o pedido. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[62svh] lg:inset-0 lg:h-auto">
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Vinheta pros cantos + faixa de legibilidade: a foto continua clara
            no meio e o texto nunca cai em cima de uma área de brilho
            imprevisível. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent lg:h-2/3 lg:via-black/55" />
      </div>

      {/* Emenda curta com o fundo da página, pra dobra não virar um degrau. */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-2 to-transparent sm:h-32" />

      <div className="relative z-10 flex flex-col px-6 pb-12 pt-28 md:px-10 md:pb-16">
        <div className="max-w-2xl">
          <p className="label-loose animate-fade-up text-[10px] text-white/55">[{eyebrow}]</p>
          <h1 className="heading-tight animate-fade-up mt-2 text-4xl text-white sm:text-5xl lg:text-6xl [animation-delay:0.08s]">
            {title}
            <span className="align-super text-[0.35em] font-semibold">®</span>
          </h1>
          {description && (
            <p className="animate-fade-up mt-4 max-w-md text-[13px] leading-relaxed tracking-tight text-white/60 [animation-delay:0.16s] sm:text-sm">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="animate-fade-up mt-8 flex max-w-md flex-col gap-3 [animation-delay:0.24s]">
            {action.context && (
              <p className="label-loose text-[9px] text-white/45">{action.context}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {action.external ? (
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-tight text-black transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/90"
                >
                  <span aria-hidden>▶</span> {action.label}
                </a>
              ) : (
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-tight text-black transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/90"
                >
                  <span aria-hidden>▶</span> {action.label}
                </Link>
              )}
              <Link
                href="#trilhas"
                className="label-loose rounded-full px-4 py-3 text-[10px] text-white/60 ring-1 ring-white/15 transition-colors duration-300 hover:text-white hover:ring-white/40"
              >
                Ver todos os módulos
              </Link>
            </div>
            {typeof action.percent === "number" && (
              <ProgressBar percent={action.percent} className="max-w-[18rem]" tone="accent" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
