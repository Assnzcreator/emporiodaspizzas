import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useOrders } from "@/context/OrderContext";
import { formatBRL } from "@/context/CartContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, LayoutGrid } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrdersSheet = ({ open, onOpenChange }: Props) => {
  const { orders } = useOrders();
  const [profilePhone, setProfilePhone] = useState<string | null>(null);

  useEffect(() => {
    const prof = localStorage.getItem("pizzaria_profile");
    if (prof) {
      try {
        const parsed = JSON.parse(prof);
        if (parsed.phone) {
          setProfilePhone(parsed.phone);
        }
      } catch (e) {}
    }
  }, [open]); // re-check when opened

  const myOrders = useMemo(() => {
    if (!profilePhone) return [];
    const cleanProfilePhone = profilePhone.replace(/\D/g, "");
    return orders.filter(o => {
       const cleanOrderPhone = o.customer_phone ? o.customer_phone.replace(/\D/g, "") : "";
       return cleanOrderPhone === cleanProfilePhone;
    });
  }, [orders, profilePhone]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md bg-black/80 backdrop-blur-2xl border-l border-white/10 text-white overflow-hidden">
        <SheetHeader className="border-b border-white/10 p-6 text-left">
          <div className="flex items-center gap-3">
            <SheetTitle className="flex items-center gap-2 text-lg text-white">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Meus Pedidos
            </SheetTitle>
          </div>
          <SheetDescription className="text-muted-foreground text-sm mt-1">
            Acompanhe o status e o histórico das suas pizzas.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {myOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-60">
              <History className="h-12 w-12 mb-4" />
              <p>Nenhum pedido encontrado neste dispositivo.</p>
            </div>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                    <p className="font-bold text-lg mt-1">{formatBRL(order.total)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${order.status === 'ENTREGUE' ? 'bg-green-500/20 text-green-400' : order.status === 'PRONTO' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'}`}>
                    {order.status}
                  </span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  {order.items?.map(item => (
                    <li key={item.id}>
                      {item.quantity}x {item.product_name}
                      {item.notes && <span className="block text-[10px] text-primary/70 italic ml-4">Obs: {item.notes}</span>}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="bg-black/40 px-2 py-1 rounded">
                    {String(order.delivery_type || "").toUpperCase().includes('DELIVERY') ? 'Entrega' : 'Retirada'}
                  </span>
                  <span className="bg-black/40 px-2 py-1 rounded">
                    {order.payment_method === 'CARTAO' ? 'Cartão' : order.payment_method === 'PIX' ? 'Pix' : 'Dinheiro'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
