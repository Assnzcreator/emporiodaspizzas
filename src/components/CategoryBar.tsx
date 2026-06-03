import { categories, type Category } from "@/data/products";
import { cn } from "@/lib/utils";

interface Props {
  active: Category | "todos" | "pedidos";
  onChange: (c: Category | "todos" | "pedidos") => void;
  showPedidos?: boolean;
}

export const CategoryBar = ({ active, onChange, showPedidos }: Props) => {
  const all: any[] = [{ id: "todos" as const, label: "Todos", emoji: "🍕" }, ...categories.filter(c => c.id !== "adicionais")];
  if (showPedidos) {
    all.push({ id: "pedidos" as const, label: "Meus Pedidos", emoji: "📜" });
  }
  return (
    <div className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b">
      <div className="container">
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
          {all.map((c) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onChange(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
