export type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  admin_only_posting: boolean;
  order: number;
};

export const CATEGORY_LABELS: Record<string, string> = {
  inicio: "Início",
  comunidade: "Comunidade",
  conteudo: "Conteúdo",
};

// Fixed display order regardless of what order rows come back from Supabase in.
export const CATEGORY_ORDER = ["inicio", "comunidade", "conteudo"];

export type ChannelGroup = {
  category: string;
  label: string;
  channels: Channel[];
};

export function groupChannelsByCategory(channels: Channel[]): ChannelGroup[] {
  const byCategory = new Map<string, Channel[]>();

  for (const channel of channels) {
    const bucket = byCategory.get(channel.category) ?? [];
    bucket.push(channel);
    byCategory.set(channel.category, bucket);
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return orderedCategories.map((category) => ({
    category,
    label: CATEGORY_LABELS[category] ?? category,
    channels: [...(byCategory.get(category) ?? [])].sort((a, b) => a.order - b.order),
  }));
}
