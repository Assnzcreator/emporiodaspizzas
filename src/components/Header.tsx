import { ShoppingBag, LayoutGrid, Pizza } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onOrdersClick?: () => void;
}

export const Header = ({ search, onSearch, onOrdersClick }: Props) => {
  const { totalItems, setIsOpen } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 overflow-hidden shadow-lg shadow-black/20">
            <Pizza className="h-7 w-7 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-black tracking-tighter text-foreground leading-none">
              EMPÓRIO<span className="text-primary"> DAS PIZZAS</span>
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none mt-0.5">
              Pizzaria Artesanal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => setIsOpen(true)}
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full btn-glass group"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white transition-transform duration-300 group-hover:scale-110" />
            </button>
            {totalItems > 0 && (
              <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[8px] sm:text-[10px] font-bold text-white shadow-lg z-10 animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </div>
        </div>
        
        <button onClick={onOrdersClick} className="flex h-10 sm:h-12 items-center gap-2 rounded-full btn-glass-primary px-3 sm:px-5 group">
          <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
          <span className="hidden sm:inline font-bold relative z-10 tracking-wide">Pedidos</span>
        </button>
      </div>
    </header>
  );
};
