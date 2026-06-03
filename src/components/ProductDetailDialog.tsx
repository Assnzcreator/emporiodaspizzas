import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart, formatBRL, type Size } from "@/context/CartContext";
import type { Product } from "@/data/products";
import { toast } from "sonner";

const PROMO_RULES: Record<string, { label: string, categories: string[] }[]> = {
  'Combo Quarta-Feira': [
    { label: 'Pizza Salgada (Tradicional)', categories: ['classicos'] },
    { label: 'Pizza Doce', categories: ['premium'] }
  ],
  'Combo Quinta-Feira': [
    { label: 'Sabor da 1ª Pizza (Tradicional)', categories: ['classicos'] },
    { label: 'Sabor da 2ª Pizza (Tradicional)', categories: ['classicos'] }
  ],
  'Combo Sexta e Domingo': [
    { label: 'Sabor da 1ª Pizza (Tradicional)', categories: ['classicos'] },
    { label: 'Sabor da 2ª Pizza (Tradicional)', categories: ['classicos'] }
  ],
  'Combo Sábado': [
    { label: 'Sabor da 1ª Pizza (Tradicional)', categories: ['classicos'] },
    { label: 'Sabor da 2ª Pizza (Tradicional)', categories: ['classicos'] }
  ],
  'DEFAULT': [
    { label: 'Sabor da 1ª Pizza', categories: ['classicos', 'artesanais', 'premium'] },
    { label: 'Sabor da 2ª Pizza', categories: ['classicos', 'artesanais', 'premium'] }
  ]
};
interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dbProducts?: Product[];
}

const SIZES: { value: Size; label: string; sub: string }[] = [
  { value: "P", label: "Solo", sub: "Hambúrguer Avulso" },
  { value: "M", label: "Combo", sub: "+ Batata e Refri" },
  { value: "G", label: "Premium", sub: "+ Batata G e Milkshake" },
];

export const ProductDetailDialog = ({ product, open, onOpenChange, dbProducts }: Props) => {
  const { addItem, priceForSize } = useCart();
  const [size, setSize] = useState<Size>("M");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [promoSelections, setPromoSelections] = useState<string[]>([]);
  const [isHalf, setIsHalf] = useState(false);
  const [secondFlavor, setSecondFlavor] = useState("");

  useEffect(() => {
    if (open) {
      setSize("M");
      setQty(1);
      setNotes("");
      if (product?.category === "promocao") {
        const rules = PROMO_RULES[product.name] || PROMO_RULES['DEFAULT'];
        setPromoSelections(new Array(rules.length).fill(""));
      } else {
        setPromoSelections([]);
      }
      setIsHalf(false);
      setSecondFlavor("");
    }
  }, [open, product?.id]);

  if (!product) return null;

  const isPizza = ["classicos", "artesanais", "premium"].includes(product.category);

  let unit = priceForSize(product, size);
  if (isPizza && isHalf) {
    const hasCamarao = product.name.toLowerCase().includes("camarão") || product.name.toLowerCase().includes("camarao") || secondFlavor.toLowerCase().includes("camarão") || secondFlavor.toLowerCase().includes("camarao");
    unit = hasCamarao ? 30 : 25;
  }
  const total = unit * qty;

  const handleAdd = () => {
    if (product.category === "promocao") {
      const rules = PROMO_RULES[product.name] || PROMO_RULES['DEFAULT'];
      if (promoSelections.length !== rules.length || promoSelections.some(s => !s)) {
        return toast.error("Selecione todos os sabores da promoção!");
      }
    }

    let finalNotes = notes;
    let customPrice: number | undefined = undefined;
    
    if (product.category === "promocao") {
      const rules = PROMO_RULES[product.name] || PROMO_RULES['DEFAULT'];
      const flavorsText = promoSelections.map((s, idx) => `${idx + 1}. ${s} (${rules[idx].label})`).join("\n");
      finalNotes = `Sabores escolhidos:\n${flavorsText}\n${notes ? '\nObs: ' + notes : ''}`.trim();
    } else if (isPizza && isHalf) {
      if (!secondFlavor) return toast.error("Selecione o segundo sabor!");
      finalNotes = `METADE 1: ${product.name}\nMETADE 2: ${secondFlavor}${notes ? '\n\nObs: ' + notes : ''}`.trim();
      customPrice = unit;
    }

    addItem(product, size, qty, finalNotes, [], customPrice);
    onOpenChange(false);
    toast.success(`${product.name} adicionado!`, {
      description: `${qty}x ${SIZES.find(s => s.value === size)?.label} · ${formatBRL(total)}`,
    });
  };

  const availableFlavors = dbProducts || [];

  const currentPromoRules = product?.category === "promocao" 
    ? (PROMO_RULES[product.name] || PROMO_RULES['DEFAULT'])
    : [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[100dvh] sm:max-h-[90dvh] h-[100dvh] sm:h-auto overflow-hidden p-0 gap-0 border-white/5 bg-background shadow-2xl">
        <div className="grid md:grid-cols-2 h-full overflow-y-auto">
          <div className="relative aspect-square md:aspect-auto bg-muted shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none md:bg-gradient-to-r" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 z-50 md:hidden backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex flex-col p-8 md:p-12">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">
                  {product.category}
                </span>
                <DialogTitle className="text-4xl font-black tracking-tight uppercase leading-none">
                  {product.name}
                </DialogTitle>
              </div>
            </div>
            
            <DialogDescription className="mt-6 text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {product.description || (product as any).longDescription}
            </DialogDescription>

            <div className="mt-8">
              {product.category === "promocao" ? (
                <div className="mb-6 space-y-4 bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                  <p className="text-sm font-black uppercase tracking-widest text-primary">
                    Escolha os sabores
                  </p>
                  
                  {currentPromoRules.map((rule, idx) => {
                    const validOptions = availableFlavors.filter(f => rule.categories.includes(f.category));
                    return (
                      <div key={idx} className="space-y-2">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">{rule.label}</label>
                        <select 
                          value={promoSelections[idx] || ""} 
                          onChange={(e) => {
                            const newSelections = [...promoSelections];
                            newSelections[idx] = e.target.value;
                            setPromoSelections(newSelections);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all uppercase"
                        >
                          <option value="">-- Selecione o sabor --</option>
                          {validOptions.map(f => (
                            <option key={`f${idx}-${f.id}`} value={f.name}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              ) : isPizza ? (
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border border-white/10 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                    <input type="checkbox" checked={isHalf} onChange={e => setIsHalf(e.target.checked)} className="w-5 h-5 accent-primary shrink-0" />
                    <div>
                      <div className="font-bold">Dividir em 2 Sabores (Meio a Meio)</div>
                      <div className="text-xs text-muted-foreground mt-1">Valor fixo de R$ 25,00 (ou R$ 30,00 se um dos sabores for Camarão)</div>
                    </div>
                  </label>
                  
                  {isHalf && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Selecione a 2ª Metade</label>
                      <select 
                        value={secondFlavor} 
                        onChange={e => setSecondFlavor(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all uppercase"
                      >
                        <option value="">-- Selecione o sabor --</option>
                        {availableFlavors.filter(f => ["classicos", "artesanais", "premium"].includes(f.category) && f.id !== product.id).map(f => (
                          <option key={`half-${f.id}`} value={f.name}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="mb-4 text-xs font-black uppercase tracking-widest text-foreground/50">
                    Selecione o seu Combo
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {SIZES.map((s) => {
                      const active = size === s.value;
                      const price = priceForSize(product, s.value);
                      return (
                        <button
                          key={s.value}
                          onClick={() => setSize(s.value)}
                          className={cn(
                            "flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-smooth",
                            active
                              ? "border-primary bg-primary/5 shadow-glow"
                              : "border-white/5 bg-white/5 hover:border-white/20"
                          )}
                        >
                          <div>
                            <div className="text-sm font-black uppercase tracking-wider">{s.label}</div>
                            <div className="text-xs text-muted-foreground">{s.sub}</div>
                          </div>
                          <div className="text-sm font-black text-primary">
                            {formatBRL(price)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="mt-6">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-foreground/50">
                  Observações (ex: sem cebola, ponto da carne)
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, massa fina..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-all min-h-[80px] resize-none"
                />
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 p-2 bg-white/5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-xl hover:bg-white/10"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="w-6 text-center text-lg font-black">{qty}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-xl hover:bg-white/10"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total</div>
                  <div className="text-3xl font-black text-primary">{formatBRL(total)}</div>
                </div>
              </div>

              <Button 
                onClick={handleAdd} 
                size="lg" 
                className="w-full rounded-2xl h-16 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-lg shadow-glow transition-smooth active:scale-95"
              >
                ADICIONAR AO CARRINHO
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


