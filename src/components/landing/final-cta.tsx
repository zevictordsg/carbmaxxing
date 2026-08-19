import { ButtonLink } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-6 sm:px-10 py-24 sm:py-36 border-t border-border-subtle text-center flex flex-col items-center">
      <h2 className="heading-tight text-4xl sm:text-6xl max-w-2xl mb-8">
        Pronto pra entrar?
      </h2>
      <p className="text-muted max-w-md mb-10">
        Crie sua conta agora. O acesso completo libera assim que sua
        assinatura mensal for confirmada.
      </p>
      <ButtonLink href="/cadastro">Assinar o Carbomaxxing</ButtonLink>
    </section>
  );
}
