import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { categories, products, type Product } from "@/data/products";
import { formatBRL } from "@/context/CartContext";
import { useOrders, type OrderStatus } from "@/context/OrderContext";
import { connectToPrinter, type BTConnection } from "@/lib/bluetooth-native";
import {
  Search, ShoppingCart, Plus, Minus, CheckCircle2,
  User, CreditCard, Banknote, QrCode, X, Loader2,
  Utensils, ChevronLeft, BluetoothIcon, ChefHat,
  Flame, Clock, Printer, History, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { encodeOrderForPrinter } from "@/lib/printer";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";

/*                     tipos                     */
interface BalcaoExtra { name: string; price: number; }
interface BalcaoItem { 
  product: Product; 
  quantity: number; 
  size: string; 
  notes: string; 
  extras: BalcaoExtra[]; 
}
type Pay = "PIX" | "CARTAO" | "DINHEIRO";
type Tab = "menu" | "cart" | "kitchen";

interface MenuProps {
  loading: boolean; filtered: Product[]; availableToday: Product[]; search: string; activeCat: string;
  btOn: boolean; btConnecting: boolean;
  setSearch: (v: string) => void; setCat: (v: string) => void;
  addToCart: (b: Product) => void; connectBT: () => void; disconnectBT: () => void;
}

interface CartProps {
  cart: BalcaoItem[]; customerName: string; customerPhone: string; deliveryType: "BALCAO" | "DELIVERY";
  deliveryAddress: string; deliveryFee: string; pay: Pay;
  finalizing: boolean; total: number; totalItems: number;
  setCustomerName: (v: string) => void; setCustomerPhone: (v: string) => void;
  setDeliveryType: (v: "BALCAO" | "DELIVERY") => void; setDeliveryAddress: (v: string) => void;
  setDeliveryFee: (v: string) => void; setPay: (v: Pay) => void;
  updateQty: (id: number, d: number) => void;
  updateNotes: (index: number, notes: string) => void;
  removeItem: (index: number) => void;
  addExtra: (index: number, name: string, price: number) => void;
  removeExtra: (itemIndex: number, extraIndex: number) => void;
  finalize: () => void; goBack: () => void;
  activeExtra: { idx: number; name: string; price: string } | null;
  setActiveExtra: (val: { idx: number; name: string; price: string } | null) => void;
  isWhatsApp: boolean;
  setIsWhatsApp: (v: boolean) => void;
}

/*                     MenuSection                     */
const MenuSection = ({
  loading, filtered, availableToday, search, activeCat, btOn, btConnecting,
  setSearch, setCat, addToCart, connectBT, disconnectBT,
}: MenuProps) => (
  <div className="flex flex-col h-full min-h-0">
    <div className="shrink-0 bg-[#0a0a0a] border-b border-white/5 px-3 pt-3 pb-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-black shrink-0">
            <Utensils className="h-4 w-4" />
          </div>
          <span className="text-sm font-black uppercase tracking-tight truncate">Balcão</span>
        </div>
        <button
          onClick={btOn ? disconnectBT : connectBT}
          disabled={btConnecting}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black border shrink-0 transition-all ${
            btOn ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-white/5 text-white/40 border-white/10"
          }`}
        >
          <BluetoothIcon className="h-3 w-3" />
          {btConnecting ? "..." : btOn ? "BT ON" : "BT"}
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        <input
          type="search"
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60 transition-colors placeholder:text-white/25"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {["todos", ...categories.filter(c => c.id !== "adicionais" && availableToday.some(p => p.category === c.id)).map(c => c.id)].map(id => (
          <button
            key={id}
            onClick={() => setCat(id)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 border transition-all ${
              activeCat === id ? "bg-primary text-black border-primary" : "bg-white/5 text-white/40 border-white/10"
            }`}
          >
            {id === "todos" ? "Todos" : categories.find(c => c.id === id)?.label}
          </button>
        ))}
      </div>
    </div>
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-2 opacity-30">
          <Search className="h-8 w-8" />
          <p className="text-[10px] font-black uppercase">Sem resultados</p>
        </div>
      ) : activeCat === "todos" && !search ? (
        <div className="space-y-6 pb-6">
          {categories.filter(c => c.id !== "adicionais" && availableToday.some(p => p.category === c.id)).map(cat => {
            const groupProducts = filtered.filter(p => p.category === cat.id);
            if (groupProducts.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest">{cat.label}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {groupProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-[#111] border border-white/5 rounded-2xl flex flex-col items-center text-center p-2.5 gap-2 hover:border-primary/40 hover:bg-primary/5 active:scale-95 transition-all"
                    >
                      <div className="w-full aspect-square rounded-xl bg-white/5 overflow-hidden border border-white/5">
                        {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="w-full">
                        <p className="text-[10px] font-black uppercase leading-tight line-clamp-2">{product.name}</p>
                        <p className="text-xs font-black text-primary">{formatBRL(product.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-[#111] border border-white/5 rounded-2xl flex flex-col items-center text-center p-2.5 gap-2 hover:border-primary/40 hover:bg-primary/5 active:scale-95 transition-all"
            >
              <div className="w-full aspect-square rounded-xl bg-white/5 overflow-hidden border border-white/5">
                {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
              </div>
              <div className="w-full">
                <p className="text-[10px] font-black uppercase leading-tight line-clamp-2">{product.name}</p>
                <p className="text-xs font-black text-primary">{formatBRL(product.price)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

/*                     CartSection                     */
const PAY_OPTS: { value: Pay; icon: React.ReactNode; label: string }[] = [
  { value: "PIX",      icon: <QrCode className="h-4 w-4" />,    label: "PIX"     },
  { value: "CARTAO",   icon: <CreditCard className="h-4 w-4" />, label: "Cartão"  },
  { value: "DINHEIRO", icon: <Banknote className="h-4 w-4" />,   label: "Dinheiro"},
];

const CartSection = (props: CartProps) => {
  const {
    cart, customerName, customerPhone, deliveryType, deliveryAddress, deliveryFee, pay, finalizing, total, totalItems,
    setCustomerName, setCustomerPhone, setDeliveryType, setDeliveryAddress, setDeliveryFee, setPay,
    updateQty, updateNotes, removeItem, addExtra, removeExtra, finalize, goBack,
    activeExtra, setActiveExtra, isWhatsApp, setIsWhatsApp
  } = props;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0a0a0a]">
      <div className="shrink-0 px-3 pt-3 pb-3 border-b border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="md:hidden p-2 -ml-1 rounded-xl hover:bg-white/5"><ChevronLeft className="h-5 w-5" /></button>
          <ShoppingCart className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-black uppercase tracking-tight">Carrinho</span>
          {totalItems > 0 && (
            <span className="ml-auto bg-primary text-black text-[9px] font-black px-2 py-0.5 rounded-full">{totalItems}</span>
          )}
        </div>

        {/* Toggle Local/Entrega */}
        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 gap-1">
          <button 
            onClick={() => setDeliveryType("BALCAO")}
            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${deliveryType === "BALCAO" ? "bg-primary text-black" : "text-white/30 hover:bg-white/5"}`}
          >
            Local
          </button>
          <button 
            onClick={() => setDeliveryType("DELIVERY")}
            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${deliveryType === "DELIVERY" ? "bg-primary text-black" : "text-white/30 hover:bg-white/5"}`}
          >
            Entrega
          </button>
        </div>


        <div className="space-y-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Nome do cliente..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60"
            />
          </div>

          {deliveryType === "DELIVERY" && (
            <>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-bold">TEL</div>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length > 11) value = value.slice(0, 11);
                    
                    let formatted = value;
                    if (value.length > 2) {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                    }
                    if (value.length > 7) {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                    }
                    setCustomerPhone(formatted);
                  }}
                  placeholder="Telefone..."
                  maxLength={15}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60 font-mono"
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-bold">END</div>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Endereço completo..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-bold">TAXA</div>
                <input
                  type="text"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(e.target.value)}
                  placeholder="Taxa de Entrega (R$)..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-3 text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20 py-12">
            <ShoppingCart className="h-10 w-10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center">Carrinho Vazio</p>
          </div>
        ) : cart.map((item, idx) => (
          <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase truncate leading-tight">{item.product.name}</p>
                <p className="text-[11px] font-black text-primary">{formatBRL(item.product.price * item.quantity)}</p>
              </div>
              <div className="flex items-center bg-black/50 rounded-lg border border-white/10">
                <button onClick={() => updateQty(idx, -1)} className="p-2"><Minus className="h-3 w-3" /></button>
                <span className="text-[11px] font-black w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(idx, 1)} className="p-2"><Plus className="h-3 w-3" /></button>
              </div>
              <button onClick={() => removeItem(idx)} className="p-2 text-white/20 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            
            <input
              type="text"
              value={item.notes}
              onChange={e => updateNotes(idx, e.target.value)}
              placeholder="Observações..."
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white/80 focus:border-primary/50 outline-none"
            />

            <div className="space-y-1">
              {item.extras.map((ex, exIdx) => (
                <div key={exIdx} className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-lg px-2 py-1">
                  <span className="text-[9px] font-bold uppercase text-primary-glow">+{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black">{formatBRL(ex.price)}</span>
                    <button onClick={() => removeExtra(idx, exIdx)} className="text-white/20 hover:text-red-500"><X className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setActiveExtra({ idx, name: "", price: "" })}
                className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[9px] font-black uppercase text-white/30 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-3 w-3" /> Adicionar Adicional
              </button>
            </div>

            {activeExtra?.idx === idx && (
              <div className="p-2 bg-white/5 rounded-lg border border-primary/20 space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome (ex: Bacon)"
                  value={activeExtra.name}
                  onChange={e => setActiveExtra({ ...activeExtra, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Preço"
                    value={activeExtra.price}
                    onChange={e => setActiveExtra({ ...activeExtra, price: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] outline-none"
                  />
                  <button
                    onClick={() => {
                      const p = parseFloat(activeExtra.price.replace(",", "."));
                      if (!activeExtra.name || isNaN(p)) return toast.error("Dados inválidos!");
                      addExtra(idx, activeExtra.name, p);
                      setActiveExtra(null);
                    }}
                    className="bg-primary text-black px-3 rounded text-[9px] font-black"
                  >
                    OK
                  </button>
                  <button onClick={() => setActiveExtra(null)} className="bg-white/10 text-white px-3 rounded text-[9px] font-black">X</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#080808] p-3 space-y-3 pb-safe">
        <div className="grid grid-cols-3 gap-2">
          {PAY_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPay(opt.value)}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                pay === opt.value ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 text-white/30"
              }`}
            >
              {opt.icon}
              <span className="text-[8px] font-black uppercase">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase text-white/60">Total</span>
          <span className="text-2xl font-black text-primary tracking-tighter">{formatBRL(total)}</span>
        </div>
        <button
          onClick={finalize}
          disabled={finalizing || cart.length === 0}
          className="w-full py-4 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-primary/20"
        >
          {finalizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /><span className="text-sm uppercase tracking-widest">Finalizar e Imprimir</span></>}
        </button>
      </div>
    </div>
  );
};

/*                     KitchenSection                     */
const KitchenSection = ({ 
  orders, loading, kitchenSearch, setKitchenSearch, onAdvance, onPrint, onDelete, isAudioUnlocked, unlockAudio, goBack,
  activeSubTab, setActiveSubTab
}: { 
  orders: any[], loading: boolean, kitchenSearch: string, setKitchenSearch: (v: string) => void, 
  onAdvance: (id: string, s: any) => void, onPrint: (o: any) => void, onDelete: (id: string) => void,
  isAudioUnlocked: boolean, unlockAudio: () => void, goBack: () => void,
  activeSubTab: "novos" | "historico", setActiveSubTab: (v: "novos" | "historico") => void
}) => {
  const filtered = orders.filter(o => {
    const customerName = String(o.customer_name || "");
    const orderId = String(o.id || "");
    const search = String(kitchenSearch || "").toLowerCase();

    const matchSearch = customerName.toLowerCase().includes(search) || 
                        orderId.toLowerCase().includes(search);
    
    if (activeSubTab === "novos") return o.status === "PENDENTE" && matchSearch;
    return (o.status === "ENTREGUE" || o.status === "CANCELADO") && matchSearch;
  });

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#080808]">
      {/* Header */}
      <div className="shrink-0 px-3 pt-3 pb-3 border-b border-white/5 space-y-3 bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goBack} className="md:hidden p-2 -ml-1 rounded-xl hover:bg-white/5"><ChevronLeft className="h-5 w-5" /></button>
            <ChefHat className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-black uppercase tracking-tight">Cozinha</span>
          </div>
          <button 
            onClick={unlockAudio}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${isAudioUnlocked ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary text-black border-primary animate-pulse"}`}
          >
            {isAudioUnlocked ? "SOM ON" : "ATIVAR SOM"}
          </button>
        </div>

        {/* Toggles Novos / Histórico */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveSubTab("novos")}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === "novos" ? "bg-primary text-black shadow-lg" : "text-white/30 hover:bg-white/5"}`}
          >
            Novos ({orders.filter(o => o.status === 'PENDENTE').length})
          </button>
          <button 
            onClick={() => setActiveSubTab("historico")}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === "historico" ? "bg-primary text-black shadow-lg" : "text-white/30 hover:bg-white/5"}`}
          >
            Histórico
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            value={kitchenSearch}
            onChange={e => setKitchenSearch(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60 placeholder:text-white/25"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20 py-12">
            {activeSubTab === "novos" ? <Clock className="h-10 w-10" /> : <History className="h-10 w-10" />}
            <p className="text-[10px] font-black uppercase tracking-widest text-center">
              {activeSubTab === "novos" ? "Nenhum pedido novo" : "Histórico vazio"}
            </p>
          </div>
        ) : [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(order => (
          <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    String(order.delivery_type || "").startsWith('WHATSAPP') 
                      ? 'bg-green-500 text-white font-black' 
                      : String(order.delivery_type || "").startsWith('BALCAO') 
                      ? 'bg-cyan-500 text-black' 
                      : 'bg-primary text-black'
                  }`}>
                    {String(order.delivery_type || "").startsWith('WHATSAPP') 
                      ? 'WHATSAPP' 
                      : String(order.delivery_type || "").startsWith('BALCAO') 
                      ? 'BALCÒO' 
                      : 'SITE'}
                  </span>

                  {/* Badge de Tipo */}
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    order.status === 'CANCELADO' ? 'bg-red-500 text-white' :
                    String(order.delivery_type || "").toUpperCase().includes('DELIVERY') ? 'bg-blue-500 text-white' : 
                    String(order.delivery_type || "").toUpperCase().includes('PICKUP') ? 'bg-orange-500 text-white' : 'bg-green-500 text-black'
                  }`}>
                    {order.status === 'CANCELADO' ? 'NEGADO' : 
                     String(order.delivery_type || "").toUpperCase().includes('DELIVERY') ? 'ENTREGA' : 
                     String(order.delivery_type || "").toUpperCase().includes('PICKUP') ? 'RETIRADA' : 'BALCÒO'}
                  </span>
                  
                  <span className="text-[9px] font-bold text-white/30">#{order.id.slice(0, 5).toUpperCase()}</span>
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight">{order.customer_name}</h3>
                {order.customer_phone && order.customer_phone !== "00000000000" && (
                  <p className="text-[10px] font-bold text-primary/70">{order.customer_phone}</p>
                )}
                {order.delivery_address && String(order.delivery_type || "").toUpperCase().includes("DELIVERY") && (
                  <p className="text-[9px] text-white/40 line-clamp-1">{order.delivery_address}</p>
                )}
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-white/40">{new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-[11px] font-black text-primary">{formatBRL(order.total)}</span>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-2 text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <span className="text-primary font-black">{item.quantity}x</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black uppercase text-[11px] leading-tight">{item.product_name}</p>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{item.size}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onPrint(order)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button 
                onClick={() => {
                  if (confirm("Deseja realmente remover este pedido permanentemente?")) {
                    onDelete(order.id);
                  }
                }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                title="Excluir Pedido"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {order.status === "PENDENTE" && (
                <button 
                  onClick={() => onAdvance(order.id, "ENTREGUE")}
                  className="flex-[2] py-3 bg-primary text-black rounded-xl text-[10px] font-black uppercase shadow-lg shadow-primary/10"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Balcao = () => {
  const { orders, placeOrder, updateOrderStatus, deleteOrder, fetchOrders, loading: ordersLoading } = useOrders();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [activeCat, setActiveCat] = useState("todos");
  const [cart, setCart]           = useState<BalcaoItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"BALCAO" | "DELIVERY">("BALCAO");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [pay, setPay]             = useState<Pay>("PIX");
  const [finalizing, setFinalizing] = useState(false);
  const [tab, setTab]             = useState<Tab>("menu");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isWhatsApp, setIsWhatsApp] = useState(false);
  const [btConn, setBtConn]       = useState<BTConnection | null>(null);
  const [btConnecting, setBtConnecting] = useState(false);
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [activeExtra, setActiveExtra] = useState<{ idx: number; name: string; price: string } | null>(null);

  // Estados Cozinha
  const [kitchenSearch, setKitchenSearch] = useState("");
  const [kitchenTab, setKitchenTab] = useState<"novos" | "historico">("novos");
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(() => localStorage.getItem("pizzaria_audio_unlocked") === "true");
  
  const autoPrintedIds = useMemo(() => new Set<string>(), []);
  const [pageLoadTime] = useState(() => new Date());
  const isProcessingQueue = useRef(false);
  const [printQueue, setPrintQueue] = useState<any[]>([]);

  // Inicializa o autoPrintedIds com os pedidos que já existem ao carregar a página
  useEffect(() => {
    if (orders.length > 0 && autoPrintedIds.size === 0) {
      orders.forEach(o => autoPrintedIds.add(o.id));
    }
  }, [orders]);

  useEffect(() => { 
    fetchProducts();
    
    // Real-time e refresh ao voltar para a aba
    const channel = supabase
      .channel('balcao-kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => { 
      supabase.removeChannel(channel); 
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("pizzaria_audio_unlocked", isAudioUnlocked.toString());
  }, [isAudioUnlocked]);

  // 1. Alimenta a fila com pedidos novos (Site ou outros dispositivos)
  useEffect(() => {
    const newPending = orders.filter(o => {
      const notPrinted = !autoPrintedIds.has(o.id);
      const isNewType = o.status === 'PENDENTE' || (o.status === 'ENTREGUE' && (String(o.delivery_type || "").startsWith('BALCAO') || String(o.delivery_type || "").startsWith('WHATSAPP')));
      return notPrinted && isNewType;
    });

    if (newPending.length > 0) {
      newPending.forEach(o => {
        autoPrintedIds.add(o.id);
        setPrintQueue(prev => {
          if (prev.find(p => p.id === o.id)) return prev;
          return [...prev, o];
        });
      });
    }
  }, [orders]);

  // 2. Processador da Fila �anica (Manual + Automático)
  useEffect(() => {
    const process = async () => {
      if (isProcessingQueue.current || printQueue.length === 0) return;
      isProcessingQueue.current = true;

      try {
        const order = printQueue[0];
        
        if (isAudioUnlocked) {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play().catch(() => {});
        }

        toast.info(`Imprimindo: ${order.customer_name}`, {
          description: `Fila: ${printQueue.length} pedido(s) restante(s)`,
          duration: 3000
        });

        await executePhysicalPrint(order);
        
        // Espera 4 segundos de segurança
        await new Promise(r => setTimeout(r, 4000));

        // Remove o pedido processado da fila
        setPrintQueue(prev => prev.slice(1));
      } finally {
        isProcessingQueue.current = false;
      }
    };

    process();
  }, [printQueue]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("products").select("*").eq("available", true);
      const dbList = (data as any) || [];
      
      const merged = [...dbList];
      products.forEach(sb => {
        if (!merged.find(db => db.id === sb.id)) {
          merged.push(sb);
        }
      });
      
      setDbProducts(merged);
    } catch (e) { 
      setDbProducts(products); 
    }
    setLoading(false);
  };

  const availableToday = useMemo(() => {
    const currentDay = new Date().getDay();
    return dbProducts.filter(b => {
      if (b.category === "adicionais") return false;
      if (b.available_days && !b.available_days.includes(currentDay)) return false;
      return true;
    });
  }, [dbProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = availableToday.filter(b => {
      return (activeCat === "todos" || b.category === activeCat) &&
             (!q || b.name.toLowerCase().includes(q));
    });
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableToday, search, activeCat]);


  const addToCart = (product: Product) => {
    const isPizza = ["classicos", "artesanais", "premium"].includes(product.category);
    if (isPizza || product.category === "promocao") {
      setSelectedProduct(product);
      setModalOpen(true);
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.product.id === product.id && i.notes === "");
        if (existing) {
          return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { product, quantity: 1, size: "M", notes: "", extras: [] }];
      });
      toast.success(`${product.name} adicionado!`);
    }
  };

  const handleCustomAdd = (product: Product, size: any, qty: number, notes: string, extras: any[], customPrice?: number) => {
    const finalProduct = customPrice !== undefined ? { ...product, price: customPrice } : product;
    setCart(prev => {
      const existing = prev.find(i => i.product.id === finalProduct.id && i.notes === notes && i.product.price === finalProduct.price);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { product: finalProduct, quantity: qty, size, notes, extras }];
    });
    setModalOpen(false);
  };

  const updateQty = (index: number, d: number) =>
    setCart(prev => prev.map((i, idx) => idx === index ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  
  const updateNotes = (index: number, notes: string) =>
    setCart(prev => prev.map((i, idx) => idx === index ? { ...i, notes } : i));
  
  const removeItem = (index: number) =>
    setCart(prev => prev.filter((_, idx) => idx !== index));

  const addExtra = (index: number, name: string, price: number) =>
    setCart(prev => prev.map((i, idx) => idx === index ? { ...i, extras: [...i.extras, { name, price }] } : i));

  const removeExtra = (itemIdx: number, extraIdx: number) =>
    setCart(prev => prev.map((i, idx) => idx === itemIdx ? { ...i, extras: i.extras.filter((_, eIdx) => eIdx !== extraIdx) } : i));

  const total      = useMemo(() => {
    const itemsTotal = cart.reduce((a, i) => {
      const extrasTotal = i.extras.reduce((sum, ex) => sum + ex.price, 0);
      return a + (i.product.price + extrasTotal) * i.quantity;
    }, 0);
    const fee = parseFloat(deliveryFee.replace(",", ".")) || 0;
    return itemsTotal + fee;
  }, [cart, deliveryFee]);
  const totalItems = useMemo(() => cart.reduce((a, i) => a + i.quantity, 0), [cart]);

  const connectBT = async () => {
    setBtConnecting(true);
    try {
      const conn = await connectToPrinter();
      setBtConn(conn);
      toast.success(`${conn.deviceName} conectada!`);
    } catch (e: any) {
      toast.error("Falha BT: " + (e.message || "Cancelado"));
    } finally { setBtConnecting(false); }
  };

  const executePhysicalPrint = (order: any) => {
    return new Promise<void>((resolve) => {
      if (!order.id) return resolve();
      autoPrintedIds.add(order.id);
      setPrintOrder(order);

      // Pequeno delay apenas para o React atualizar o componente de impressão do navegador se necessário
      setTimeout(async () => {
        if (btConn) {
          try { 
            await btConn.write(encodeOrderForPrinter(order)); 
            toast.success("Impresso BT!"); 
            resolve();
          } catch (err) { 
            console.error("Erro BT Balcao:", err);
            window.print(); 
            resolve();
          }
        } else { 
          window.print(); 
          resolve();
        }
      }, 500);
    });
  };

  const doPrint = (order: any) => {
    setPrintQueue(prev => {
      if (prev.find(p => p.id === order.id)) return prev;
      return [...prev, order];
    });
  };

  const finalize = async () => {
    if (!cart.length) return toast.error("Adicione itens!");
    if (deliveryType === "DELIVERY" && (!customerPhone || !deliveryAddress)) return toast.error("Telefone e Endereço obrigatórios para entrega!");
    
    setFinalizing(true);
    try {
      const feeNum = parseFloat(deliveryFee.replace(",", ".")) || 0;
      const order = await placeOrder(
        customerName || "Cliente Balcão", 
        customerPhone || "00000000000", 
        deliveryType, 
        deliveryType === "BALCAO" ? "Atendimento Local" : deliveryAddress, 
        pay, 
        feeNum,
        cart.map(i => ({ 
          key: `${i.product.id}-${i.size}`, 
          product: i.product, 
          quantity: i.quantity, 
          size: i.size as any, 
          unitPrice: i.product.price, 
          notes: i.notes,
          extras: i.extras 
        })),
        total,
        isWhatsApp ? "WHATSAPP" : "BALCAO"
      );
      if (order) {
        if (deliveryType === "BALCAO") {
          await updateOrderStatus(order.id, "ENTREGUE" as OrderStatus);
        }
        
        const itemsToPrint = cart.map(i => {
          const extrasStr = i.extras.map(e => `+ ${e.name} ${formatBRL(e.price)}`).join("\n");
          const extrasPrice = i.extras.reduce((s, e) => s + e.price, 0);
          return { 
            product_name: extrasStr ? `${i.product.name}\n${extrasStr}` : i.product.name,
            quantity: i.quantity, 
            unitPrice: i.product.price + extrasPrice, 
            notes: i.notes 
          };
        });
        setCart([]); setCustomerName(""); setCustomerPhone(""); setDeliveryAddress(""); setDeliveryFee("0"); setPay("PIX"); setTab("menu"); setIsWhatsApp(false);
        doPrint({ ...order, items: itemsToPrint, total, delivery_fee: feeNum });
        toast.success("Pedido finalizado!");
      }
    } catch (e) { console.error(e); }
    finally { setFinalizing(false); }
  };

  const unlockAudio = () => {
    const audio = new Audio("/sounds/notificacao.mp3");
    audio.volume = 0;
    audio.play().then(() => {
      setIsAudioUnlocked(true);
      toast.success("Som ativado! �x");
    }).catch(() => toast.error("Clique para ativar o som."));
  };

  const commonProps = {
    loading, filtered, availableToday, search, activeCat, btOn: !!btConn, btConnecting,
    setSearch, setCat: setActiveCat, addToCart, connectBT,
    disconnectBT: () => { btConn?.disconnect(); setBtConn(null); },
    cart, customerName, customerPhone, deliveryType, deliveryAddress, deliveryFee, pay, finalizing, total, totalItems,
    setCustomerName, setCustomerPhone, setDeliveryType, setDeliveryAddress, setDeliveryFee, setPay,
    updateQty, updateNotes, removeItem, addExtra, removeExtra, finalize,
    goBack: () => setTab("menu"),
    activeExtra, setActiveExtra,
    orders, ordersLoading, kitchenSearch, setKitchenSearch, 
    onAdvance: updateOrderStatus, onPrint: doPrint, onDelete: deleteOrder,
    isAudioUnlocked, unlockAudio,
    isWhatsApp, setIsWhatsApp,
  };

  return (
    <>
      <div className="hidden md:flex h-screen bg-[#050505] text-white overflow-hidden">
        <div className="w-20 shrink-0 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-6 gap-6">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-black mb-4">
            <Utensils className="h-5 w-5" />
          </div>
          <button onClick={() => setTab("menu")} className={`p-3 rounded-xl transition-all ${tab === "menu" ? "bg-primary text-black" : "text-white/40 hover:bg-white/5"}`} title="Cardápio">
            <Search className="h-6 w-6" />
          </button>
          <button onClick={() => setTab("kitchen")} className={`p-3 rounded-xl transition-all relative ${tab === "kitchen" ? "bg-primary text-black" : "text-white/40 hover:bg-white/5"}`} title="Cozinha">
            <ChefHat className="h-6 w-6" />
            {orders.filter(o => o.status === 'PENDENTE').length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
          {tab === "kitchen" ? (
            <KitchenSection 
              {...commonProps}
              activeSubTab={kitchenTab} setActiveSubTab={setKitchenTab}
            />
          ) : (
            <MenuSection {...commonProps} />
          )}
        </div>
        <div className="w-[380px] flex flex-col overflow-hidden">
          <CartSection {...commonProps} />
        </div>
      </div>

      <ProductDetailDialog
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        dbProducts={dbProducts}
        customOnAdd={handleCustomAdd}
      />

      {/* MOBILE */}
      <div className="flex md:hidden flex-col bg-[#050505] text-white" style={{ height: "100dvh" }}>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {tab === "menu" ? <MenuSection {...commonProps} /> : 
           tab === "cart" ? <CartSection {...commonProps} /> :
           <KitchenSection 
              {...commonProps}
              activeSubTab={kitchenTab} setActiveSubTab={setKitchenTab}
            />
          }
        </div>
        <div className="shrink-0 bg-[#0a0a0a] border-t border-white/10 px-1 py-2 pb-safe grid grid-cols-3 gap-1">
          <button onClick={() => setTab("menu")} className={`flex flex-col items-center py-2 rounded-xl transition-all ${tab === "menu" ? "text-primary" : "text-white/40"}`}>
            <Search className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase mt-1">Menu</span>
          </button>
          <button onClick={() => setTab("kitchen")} className={`flex flex-col items-center py-2 rounded-xl transition-all relative ${tab === "kitchen" ? "text-primary" : "text-white/40"}`}>
            <ChefHat className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase mt-1">Cozinha</span>
            {orders.filter(o => o.status === 'PENDENTE').length > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-4 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button onClick={() => setTab("cart")} className={`flex flex-col items-center py-2 rounded-xl transition-all relative ${tab === "cart" ? "text-primary" : "text-white/40"}`}>
            <ShoppingCart className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase mt-1">Carrinho</span>
            {totalItems > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-4 bg-primary text-black text-[8px] font-black px-1 rounded-full">{totalItems}</span>
            )}
          </button>
        </div>
      </div>

      {printOrder && (
        <div id="print-receipt" className="hidden print:block">
          <div className="text-center font-bold mb-2">--- VIA ESTABELECIMENTO ---</div>
          <div className="text-center text-xl font-bold mb-1">EMP�RIO DAS PIZZAS</div>
          <div className="mb-2 border-b border-black/10 pb-2">
            <div className="font-bold uppercase text-lg border-y border-black/10 py-1 my-1">
              ORIGEM: {String(printOrder.delivery_type || "").includes(":") ? printOrder.delivery_type.split(":")[0] : "SITE"}
            </div>
            <div>PEDIDO: #{printOrder.id?.slice(0, 5).toUpperCase()}</div>
            <div>DATA: {new Date(printOrder.created_at).toLocaleString("pt-BR")}</div>
            <div className="font-bold">CLIENTE: {printOrder.customer_name}</div>
            {printOrder.customer_phone && printOrder.customer_phone !== "00000000000" && (
              <div>TEL: {printOrder.customer_phone}</div>
            )}
            <div className="font-bold uppercase">
              TIPO: {String(printOrder.delivery_type || "").toUpperCase().includes("DELIVERY") ? "ENTREGA" : 
                     String(printOrder.delivery_type || "").toUpperCase().includes("PICKUP") ? "RETIRADA" : "BALCÒO"}
            </div>
            {String(printOrder.delivery_type || "").toUpperCase().includes("DELIVERY") && printOrder.delivery_address && (
              <div className="bg-black/5 p-1 mt-1 text-[11px]">ENDERE�!O: {printOrder.delivery_address}</div>
            )}
          </div>

          <div className="font-bold mb-1">ITENS:</div>
          {printOrder.items?.map((item: any, idx: number) => (
            <div key={idx} className="mb-2 border-b border-black/10 pb-1">
              <div className="flex justify-between font-bold whitespace-pre-wrap text-sm">
                <span className="flex-1">{item.quantity}x {item.product_name}</span>
                <span className="shrink-0 ml-2">{formatBRL(Number(item.unitPrice || item.unit_price || 0) * Number(item.quantity || 1))}</span>
              </div>
              {item.notes && <div className="pl-4 text-[10px] italic">�a� {item.notes}</div>}
            </div>
          ))}

          <div className="space-y-0.5 border-t border-black pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatBRL(printOrder.total - (printOrder.delivery_fee || 0))}</span>
            </div>
            {printOrder.delivery_type === "DELIVERY" && (
              <div className="flex justify-between text-sm">
                <span>Taxa de Entrega:</span>
                <span>{formatBRL(printOrder.delivery_fee || 0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>TOTAL:</span>
              <span>{formatBRL(printOrder.total)}</span>
            </div>
            <div className="text-xs font-bold mt-1">PAGAMENTO: {printOrder.payment_method}</div>
          </div>
          <div className="text-center mt-6 italic text-[10px]">
            Obrigado pela preferência!<br />Siga-nos: @emporiodaspizzas
          </div>
          <div className="h-20" />
        </div>
      )}
    </>
  );
};

export default Balcao;
