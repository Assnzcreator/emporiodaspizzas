import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/context/CartContext";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
  onOpen: (b: Product) => void;
  onQuickAdd: (b: Product) => void;
}

export const ProductCard = ({ product, onQuickAdd }: Omit<Props, 'onOpen'>) => {
  return (
    <article
      onClick={() => onQuickAdd(product)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2.5rem] bg-[#0f0f0f] border border-white/5 hover:border-primary/30 transition-all active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden bg-black/20">
        <img
          src={product.image}
          alt={`Hambúrguer ${product.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        
        {product.popular && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary text-black px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-lg">
            �x� POPULAR
          </span>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mb-1">{product.name}</h3>
        <p className="line-clamp-2 text-[10px] sm:text-xs text-muted-foreground font-medium leading-relaxed mb-4">{product.description}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter">
            {formatBRL(product.price)}
          </span>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20">
            <Plus className="h-6 w-6 sm:h-7 sm:w-7 stroke-[3px]" />
          </div>
        </div>
      </div>
    </article>
  );
};



