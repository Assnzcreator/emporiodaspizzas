export type Category = "novidade" | "promocao" | "classicos" | "artesanais" | "premium" | "acompanhamentos" | "bebidas" | "adicionais" | "rodizio";

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
  { id: "rodizio", label: "Rodízio", emoji: "🍽️" },
];

export const products: Product[] = [
  {
    id: "rodizio-premium",
    name: "Rodízio Premium",
    description: "✅ Pastéis crocantes e recheados\n✅ Coxinhas irresistíveis\n✅ Lasanhas saborosas\n✅ Panquecas especiais\n✅ Batata frita sequinha e crocante\n✅ Pizzas de todos os sabores, doces e salgadas\n✅ Deliciosos milkshakes para completar sua refeição",
    price: 30,
    image: "", 
    category: "rodizio",
    available_days: [5, 6]
  },
  {
    id: "rodizio-casa",
    name: "Rodízio da casa",
    description: "✅ Pastéis crocantes e recheados\n✅ Coxinhas irresistíveis\n✅ Lasanhas saborosas\n✅ Panquecas especiais\n✅ Batata frita sequinha e crocante\n✅ Pizzas de todos os sabores, doces e salgadas",
    price: 25,
    image: "", 
    category: "rodizio",
    available_days: [5, 6]
  }
];

export const PREDEFINED_EXTRAS = [];
