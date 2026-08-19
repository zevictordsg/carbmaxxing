import { CoverPlaceholder } from "@/components/cover-placeholder";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative w-full min-h-[92vh] flex flex-col justify-end overflow-hidden">
      <CoverPlaceholder className="absolute inset-0 border-0" label="imagem de capa" />
      {/* Flat scrim (no gradient) so headline stays legible over the future cover photo */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 px-6 sm:px-10 pb-16 sm:pb-20 max-w-4xl">
        <p className="label-loose text-[11px] text-white/60 mb-5">
          Comunidade paga · nutrição e treino
        </p>
        <h1 className="heading-tight text-5xl sm:text-7xl mb-6">
          Coma carbo.
          <br />
          Treine sério.
        </h1>
        <p className="text-white/70 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
          Carbomaxxing é a comunidade fechada de nutrição e treino do
          zevictor.gym: refeições sincronizadas, treinos, receitas e um chat
          ao vivo com quem leva o processo a sério.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/cadastro">Entrar para a comunidade</ButtonLink>
          <ButtonLink href="#conteudo" variant="ghost">
            Ver o que tem dentro
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
