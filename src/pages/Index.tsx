import { useMemo, useRef, useState, useEffect } from "react";
import { CartProvider, useCart } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryBar } from "@/components/CategoryBar";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { CartSheet } from "@/components/CartSheet";
import { Footer } from "@/components/Footer";
import { categories, products as staticProducts, type Category, type Product } from "@/data/products";
import { toast } from "sonner";
import { useOrders } from "@/context/OrderContext";
import { OrdersSheet } from "@/components/OrdersSheet";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clock, Instagram, MessageCircle, X, Bell, Check, Loader2 } from "lucide-react";

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (ref.current) {
                ref.current.classList.remove("opacity-0", "translate-y-16");
                ref.current.classList.add("opacity-100", "translate-y-0");
              }
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className="opacity-0 translate-y-16 transition-all duration-[1000ms] ease-out" style={{ transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
      {children}
    </div>
  );
};

const Storefront = () => {
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<Category | "todos">("todos");
  const [selected, setSelected] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [openingTime, setOpeningTime] = useState("");
  const [showClosedModal, setShowClosedModal] = useState(false);
  
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStoreSettings();
    fetchProducts();

    const settingsSubscription = supabase
      .channel("public:store_settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, (payload: any) => {
        if (payload.new && payload.new.id === 1) {
          setIsStoreOpen(payload.new.is_open);
          setOpeningTime(payload.new.opening_time || "18:00");
          if (!payload.new.is_open) setShowClosedModal(true);
          else setShowClosedModal(false);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(settingsSubscription); };
  }, []);

  const fetchStoreSettings = async () => {
    const { data } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    if (data) {
      setIsStoreOpen(data.is_open);
      setOpeningTime(data.opening_time || "18:00");
      if (!data.is_open) setShowClosedModal(true);
    }
  };

  const fetchProducts = async () => {
    setIsProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("available", true);
      
      const dbList = (data as any) || [];
      
      // Combinar estÃ¡ticos e dinÃ¢micos (Merge)
      const merged = [...dbList];
      staticProducts.forEach(sb => {
        if (!merged.find(db => db.id === sb.id)) {
          merged.push(sb);
        }
      });
      setDbProducts(merged);
    } catch (e) {
      setDbProducts(staticProducts);
    }
    setIsProductsLoading(false);
  };

  const currentDay = new Date().getDay();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dbProducts.filter((b: any) => {
      // Regra de disponibilidade (sÃ³ aplica se o campo existir no objeto)
      if (b.available_days) {
        const isAvailableToday = b.available_days.includes(currentDay);
        if (!isAvailableToday) return false;
      }

      const matchCat = activeCat === "todos" ? b.category !== "adicionais" : b.category === activeCat;
      const matchSearch = !q || b.name.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, activeCat, dbProducts, currentDay]);

  const grouped = useMemo(() => {
    if (activeCat !== "todos") return [{ cat: activeCat, items: filtered }];
    return categories
      .filter((c) => c.id !== "adicionais" && c.id !== "rodizio")
      .map((c) => ({ cat: c.id, items: filtered.filter((b) => b.category === c.id) }))
  }, [filtered, activeCat]);

  const openDetail = (b: Product) => {
    setSelected(b); 
    setOpen(true);
  };

  const quickAdd = (b: Product) => {
    if (!isStoreOpen) { 
      setShowClosedModal(true); 
      return; 
    }
    if (b.category === "promocao") {
      openDetail(b);
      return;
    }
    addItem(b, "M", 1);
    toast.success(`${b.name} adicionado!`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Dialog open={showClosedModal} onOpenChange={setShowClosedModal}>
        <DialogContent className="sm:max-w-[420px] bg-black border border-white/10 text-white p-0 overflow-hidden rounded-[2.5rem]">
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20"><Clock className="h-8 w-8 text-primary" /></div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase">Loja Fechada</h2>
              <p className="text-xs text-muted-foreground px-8">Estamos preparando tudo para a reabertura. Sinta-se à vontade para ver o cardápio.</p>
            </div>
            <div className="w-full py-6 bg-white/[0.03] border border-white/5 rounded-3xl">
              <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-black mb-1">Previsão</p>
              <p className="text-5xl font-black">{openingTime || "18:00"}</p>
            </div>
            <button onClick={() => setShowClosedModal(false)} className="w-full py-4 bg-primary text-black font-black rounded-2xl text-xs">VER CARDÁPIO</button>
          </div>
        </DialogContent>
      </Dialog>

      <Header search={search} onSearch={setSearch} onOrdersClick={() => setIsOrdersOpen(true)} />
      <Hero onCta={() => menuRef.current?.scrollIntoView({ behavior: "smooth" })} />

      <div ref={menuRef} className="sticky top-20 z-40">
        <CategoryBar active={activeCat} onChange={(cat: any) => setActiveCat(cat)} />
      </div>

      <main className="container flex-1 py-8 overflow-hidden">
        {isProductsLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <Loader2 className="h-8 w-8 text-primary animate-spin" />
             <p className="text-xs font-black uppercase tracking-widest text-white/20">Carregando Cardápio...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold text-white">Nenhum item disponível hoje 🍕</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente outra categoria ou volte mais tarde.</p>
          </div>
        ) : (
          grouped.map((g) => {
            const meta = categories.find((c) => c.id === g.cat)!;
            return (
              <section key={g.cat} className="mb-16">
                <ScrollReveal><h2 className="mb-6 flex items-center gap-2 text-3xl font-black tracking-tight text-white"><span>{meta.emoji}</span> {meta.label}</h2></ScrollReveal>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {g.items.map((b, idx) => (
                    <ScrollReveal key={b.id} delay={idx * 100}>
                      <ProductCard product={b} onQuickAdd={quickAdd} />
                    </ScrollReveal>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      <Footer />
      <ProductDetailDialog product={selected} open={open} onOpenChange={setOpen} dbProducts={dbProducts} />
      <CartSheet />
      <OrdersSheet open={isOrdersOpen} onOpenChange={setIsOrdersOpen} />
    </div>
  );
};

const Index = () => (
  <CartProvider>
    <Storefront />
  </CartProvider>
);

export default Index;
