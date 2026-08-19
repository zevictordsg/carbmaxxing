import { CoverPlaceholder } from "@/components/cover-placeholder";
import { LockIcon } from "@/components/icons/lock-icon";

const items = [
  { title: "Receitas", note: "receitas" },
  { title: "Treinos", note: "treinos" },
  { title: "Refeições sincronizadas", note: "comunidade" },
  { title: "Comidas-base", note: "referência" },
];

export function ContentPreview() {
  return (
    <section id="conteudo" className="px-6 sm:px-10 py-24 sm:py-32">
      <p className="label-loose text-[11px] text-muted mb-4">O que tem dentro</p>
      <h2 className="heading-tight-2 text-3xl sm:text-4xl max-w-2xl mb-12">
        Feed, canais de chat e uma biblioteca de conteúdo — tudo em um lugar
        só.
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col gap-3">
            <CoverPlaceholder
              className="aspect-[3/4] rounded-lg"
              label={item.note}
            >
              <div className="absolute top-3 right-3 text-white/70">
                <LockIcon className="w-4 h-4" />
              </div>
            </CoverPlaceholder>
            <span className="text-sm font-semibold text-white/90">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
