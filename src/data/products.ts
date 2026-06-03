export type Category = "novidade" | "promocao" | "classicos" | "artesanais" | "premium" | "acompanhamentos" | "bebidas" | "adicionais";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  popular?: boolean;
  available_days?: number[];
}

export const categories: { id: Category; label: string; emoji: string }[] = [
  { id: "novidade", label: "Novidades", emoji: "✨" },
  { id: "promocao", label: "Promoções", emoji: "🔥" },
  { id: "classicos", label: "Tradicionais", emoji: "🍕" },
  { id: "artesanais", label: "Especiais", emoji: "⭐" },
  { id: "premium", label: "Doces", emoji: "🍫" },
  { id: "acompanhamentos", label: "Porções", emoji: "🍟" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "adicionais", label: "Bordas", emoji: "🧀" },
];

export const products: Product[] = [];

export const PREDEFINED_EXTRAS = [];
