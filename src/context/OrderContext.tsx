// Refresh HMR
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem } from "./CartContext";
import { toast } from "sonner";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export type OrderStatus = "PENDENTE" | "PREPARANDO" | "PRONTO" | "SAIU_PARA_ENTREGA" | "ENTREGUE" | "CANCELADO";
export type DeliveryType = "DELIVERY" | "PICKUP" | "BALCAO";
export type PaymentMethod = "PIX" | "CARTAO" | "DINHEIRO";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: string;
  delivery_address: string | null;
  payment_method: PaymentMethod;
  payment_change: number | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  confirmation_code: string | null;
  motoboy_id: string | null;
  motoboy_name?: string | null;
  items?: OrderItem[];
}

interface OrderContextValue {
  orders: Order[];
  placeOrder: (customerName: string, customerPhone: string, deliveryType: DeliveryType, deliveryAddress: string | null, paymentMethod: PaymentMethod, paymentChange: number | null, items: CartItem[], total: number, source: "SITE" | "BALCAO") => Promise<Order | null>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, motoboyId?: string | null) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  loading: boolean;
  fetchOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, motoboys(name)")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, product_name, size, quantity, unit_price");

      if (itemsError) throw itemsError;

      const fullOrders = (ordersData as any[]).map((order) => ({
        ...order,
        motoboy_name: order.motoboys?.name,
        items: (itemsData as OrderItem[]).filter((item) => item.order_id === order.id),
      }));

      setOrders(fullOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // First delete order_items due to foreign key constraint
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Then delete the order itself
      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderError) throw orderError;

      toast.success("Pedido removido com sucesso!");
      fetchOrders();
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error(`Erro ao remover pedido: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const playNotificationSound = (type: 'new' | 'ready' = 'new') => {
      // S� TOCA SOM SE ESTIVER NAS ÁREAS DE TRABALHO
      const isStaffArea = window.location.pathname.includes('/admin') || 
                          window.location.pathname.includes('/balcao');
      
      if (!isStaffArea) return;

      const url = type === 'new' 
        ? "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" 
        : "https://assets.mixkit.co/active_storage/sfx/2501/2501-preview.mp3";
      
      const audio = new Audio(url);
      audio.play().catch(e => console.log("Erro ao tocar som:", e));
      
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    };

    // Supabase Realtime Subscription
    const ordersSubscription = supabase
      .channel("public:orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const isStaffArea = window.location.pathname.includes('/admin') || 
                             window.location.pathname.includes('/balcao');

          // 1. NOVO PEDIDO (S� PARA ADMIN/COZINHA)
          if (payload.eventType === "INSERT" && isStaffArea) {
            playNotificationSound('new');
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("�x� NOVO PEDIDO!", { body: `Cliente: ${payload.new.customer_name}` });
            }
            toast.success(`�x� NOVO PEDIDO: ${payload.new.customer_name}`, { duration: 8000 });
          }

          // 2. PEDIDO PRONTO PARA COLETA (S� PARA ADMIN/COZINHA)
          if (payload.eventType === "UPDATE" && payload.new.status === "PRONTO" && payload.old?.status !== "PRONTO" && isStaffArea) {
            playNotificationSound('ready');
            toast.info(`�x� PRONTO PARA ENTREGA: ${payload.new.customer_name}`, { 
              duration: 10000,
              icon: '�S&'
            });
          }

          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  const placeOrder = async (customerName: string, customerPhone: string, deliveryType: DeliveryType, deliveryAddress: string | null, paymentMethod: PaymentMethod, paymentChange: number | null, items: CartItem[], total: number, source: "SITE" | "BALCAO"): Promise<Order | null> => {
    try {
      // Usamos um prefixo no delivery_type para rastrear a origem (VIA)
      const formattedDeliveryType = `${source}:${deliveryType}`;
      
      // 1. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{ 
          customer_name: customerName, 
          customer_phone: customerPhone, 
          delivery_type: formattedDeliveryType as any, 
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_change: paymentChange,
          total,
          confirmation_code: Math.floor(1000 + Math.random() * 9000).toString()
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert Order Items
      const orderItems = items.map((item) => {
        const extrasStr = item.extras?.map(e => `+${e.name}`).join(", ");
        const notesStr = item.notes ? `(${item.notes})` : "";
        const fullName = `${item.product.name}${extrasStr ? ` [${extrasStr}]` : ""}${notesStr ? ` ${notesStr}` : ""}`;
        
        return {
          order_id: orderData.id,
          product_id: item.product.id,
          product_name: fullName,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.unitPrice + (item.extras?.reduce((s, e) => s + e.price, 0) || 0),
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      const formatBRL = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
      const itemsSummary = items.map(item => `⬢ ${item.quantity}x ${item.product.name}`).join('\n');

      // Não envia WhatsApp para pedidos do Balcão (sem telefone real)
      if (deliveryType !== "BALCAO") {
        const message = `�S& *Pedido Confirmado! - Empório das Pizzas*\n\nOlá, *${customerName}*! Seu pedido foi confirmado com sucesso.\n\nNossa equipe já está preparando tudo com muito carinho! Assim que o seu pedido sair para entrega ou estiver pronto para retirada, avisaremos você por aqui! �x�"\n\n�x� *Resumo do Pedido:* \n${itemsSummary}\n\n�x� *Total:* ${formatBRL(total)}`;
        await sendWhatsAppMessage(customerPhone, message);
      }

      return orderData as Order;
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(`Erro no Banco: ${error.message || "Erro desconhecido"}`);
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, motoboyId?: string | null) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          ...(motoboyId ? { motoboy_id: motoboyId } : {})
        })
        .eq("id", orderId);

      if (error) {
        if (error.code === '23503') {
          toast.error("Sessão expirada ou Motoboy não encontrado. Por favor, SAIA e ENTRE novamente no painel.");
        }
        throw error;
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateOrderStatus, deleteOrder, loading, fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
