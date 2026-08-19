const placeholderQuotes = [
  {
    quote: "[espaço reservado para depoimento real de um membro]",
    name: "[nome do membro]",
  },
  {
    quote: "[espaço reservado para depoimento real de um membro]",
    name: "[nome do membro]",
  },
  {
    quote: "[espaço reservado para depoimento real de um membro]",
    name: "[nome do membro]",
  },
];

export function SocialProof() {
  return (
    <section className="px-6 sm:px-10 py-24 sm:py-32 border-t border-border-subtle">
      <p className="label-loose text-[11px] text-muted mb-4">Prova social</p>
      <h2 className="heading-tight-2 text-3xl sm:text-4xl max-w-2xl mb-12">
        Substitua esta seção pelos depoimentos reais dos seus membros.
      </h2>

      <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
        {placeholderQuotes.map((item, i) => (
          <div key={i} className="border-t border-border-subtle pt-6">
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              &ldquo;{item.quote}&rdquo;
            </p>
            <p className="label-loose text-[10px] text-muted-dim">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
