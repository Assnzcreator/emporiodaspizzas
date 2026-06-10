import { useOrders } from "@/context/OrderContext";
import { categories } from "@/data/products";
import { formatBRL } from "@/context/CartContext";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart3, TrendingUp, ShoppingBag, ArrowLeft, Power, Users, Trash2, Plus, 
  Calendar, DollarSign, CreditCard, Wallet, Percent, ChevronRight, Filter,
  UtensilsCrossed, Edit3, Save, X, Eye, EyeOff, Image as ImageIcon, Bike, Package
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

type TimeRange = 'today' | '7days' | 'all' | 'custom';

const DAYS_OF_WEEK = [
  { id: 0, label: "Dom", full: "Domingo" },
  { id: 1, label: "Seg", full: "Segunda-feira" },
  { id: 2, label: "Ter", full: "Terça-feira" },
  { id: 3, label: "Qua", full: "Quarta-feira" },
  { id: 4, label: "Qui", full: "Quinta-feira" },
  { id: 5, label: "Sex", full: "Sexta-feira" },
  { id: 6, label: "Sáb", full: "Sábado" },
];

const Admin = () => {
  const { orders, loading, deleteOrder } = useOrders();
  const [activeTab, setActiveTab] = useState<"stats" | "menu">("stats");
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [customStart, setCustomStart] = useState<string>(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  // Store States
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [openingTime, setOpeningTime] = useState("18:00");
  
  // Menu States
  const [products, setProducts] = useState<any[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState<any | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    category: "classicos",
    image: "",
    available: true,
    available_days: [0, 1, 2, 3, 4, 5, 6]
  });

  useEffect(() => {
    fetchStoreStatus();
    fetchProducts();
  }, []);

  const fetchStoreStatus = async () => {
    const { data, error } = await supabase.from("store_settings").select("is_open, opening_time").eq("id", 1).single();
    if (data && !error) {
      setIsStoreOpen(data.is_open);
      setOpeningTime(data.opening_time || "18:00");
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return;
    }
    if (data) setProducts(data);
  };

  const handleToggleProduct = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("products").update({ available: !currentStatus }).eq("id", id);
    if (error) {
      toast.error("Erro ao mudar status: " + error.message);
    } else {
      toast.success("Status atualizado!");
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Deseja realmente excluir este item?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Item removido!");
      fetchProducts();
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (isEditingProduct) {
        const { error } = await supabase.from("products").update(isEditingProduct).eq("id", isEditingProduct.id);
        if (error) throw error;
        toast.success("Atualizado!");
        setIsEditingProduct(null);
      } else {
        const { error } = await supabase.from("products").insert([newProduct]);
        if (error) throw error;
        toast.success("Cadastrado com sucesso!");
        setIsAddingProduct(false);
        setNewProduct({ name: "", description: "", price: 0, category: "classicos", image: "", available: true, available_days: [0, 1, 2, 3, 4, 5, 6] });
      }
      fetchProducts();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const toggleDay = (dayId: number, productState: any, setProductState: any) => {
    const currentDays = [...(productState.available_days || [])];
    const index = currentDays.indexOf(dayId);
    if (index > -1) currentDays.splice(index, 1);
    else currentDays.push(dayId);
    setProductState({ ...productState, available_days: currentDays });
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) return toast.error("Sem dados para exportar.");
    const headers = ["ID", "Dia_Ped", "Cliente", "Data", "Status", "Metodo Pagamento", "Total"];
    const rows = filteredOrders.map(o => [o.id.slice(0, 8).toUpperCase(), o.daily_number || "-", o.customer_name, format(new Date(o.created_at), "dd/MM/yyyy HH:mm"), o.status, o.payment_method, o.total.toFixed(2)]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `relatorio_pedidos_${format(new Date(), "dd-MM-yyyy")}.csv`);
    link.click();
    toast.success("Relatório exportado!");
  };

  const toggleStore = async () => {
    const newState = !isStoreOpen;
    let newTime = openingTime;
    if (newState === false) {
      const time = prompt("A que horas a loja vai abrir novamente?", openingTime);
      if (time) newTime = time;
    }
    setIsStoreOpen(newState);
    setOpeningTime(newTime);
    const { error } = await supabase.from("store_settings").update({ is_open: newState, opening_time: newTime }).eq("id", 1);
    if (error) toast.error("Erro ao atualizar loja.");
    else toast.success(newState ? "Loja aberta!" : `Loja fechada até às ${newTime}!`);
  };

  // Filtered Data based on timeRange
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (timeRange) {
      case 'today': start = startOfDay(now); break;
      case '7days': start = startOfDay(subDays(now, 7)); break;
      case '30days': start = startOfDay(subDays(now, 30)); break;
      case 'custom': 
        start = startOfDay(new Date(customStart + 'T00:00:00'));
        end = endOfDay(new Date(customEnd + 'T23:59:59'));
        break;
      default: return orders;
    }
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start, end });
    });
  }, [orders, timeRange, customStart, customEnd]);

  const metrics = useMemo(() => {
    const delivered = filteredOrders.filter(o => o.status === 'ENTREGUE');
    const canceled = filteredOrders.filter(o => o.status === 'CANCELADO');
    const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
    const count = filteredOrders.length;
    const avgTicket = delivered.length > 0 ? revenue / delivered.length : 0;
    
    // Sucesso vs Cancelamento (Real)
    const successRate = count > 0 ? (delivered.length / count) * 100 : 0;

    const payments = {
      PIX: filteredOrders.filter(o => o.payment_method === 'PIX').length,
      CARTAO: filteredOrders.filter(o => o.payment_method === 'CARTAO').length,
      DINHEIRO: filteredOrders.filter(o => o.payment_method === 'DINHEIRO').length,
    };

    // Ranking de Produtos (Top 5)
    const itemMap: Record<string, { name: string, qty: number, total: number }> = {};
    filteredOrders.forEach(order => {
      if (order.status !== 'ENTREGUE') return;
      order.items?.forEach((item: any) => {
        if (!itemMap[item.product_name]) {
          itemMap[item.product_name] = { name: item.product_name, qty: 0, total: 0 };
        }
        itemMap[item.product_name].qty += item.quantity;
        itemMap[item.product_name].total += (item.quantity * (order.total / (order.items?.length || 1)));
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { revenue, count, avgTicket, payments, successRate, topItems };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    if (timeRange === 'today') {
      // Gráfico por hora para visualização Enterprise do dia
      return Array.from({ length: 12 }).map((_, i) => {
        const hour = i + 12; // Das 12h às 23h
        const hourRevenue = filteredOrders
          .filter(o => o.status === 'ENTREGUE' && new Date(o.created_at).getHours() === hour)
          .reduce((sum, o) => sum + o.total, 0);
        return { name: `${hour}h`, faturamento: hourRevenue };
      });
    }

    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStr = format(date, "dd/MM");
      const dayRevenue = filteredOrders
        .filter(o => o.status === 'ENTREGUE' && format(new Date(o.created_at), "dd/MM") === dayStr)
        .reduce((sum, o) => sum + o.total, 0);
      return { name: dayStr, faturamento: dayRevenue };
    });
  }, [filteredOrders, timeRange]);

  const pieData = [
    { name: 'Pix', value: metrics.payments.PIX, color: '#00D1FF' },
    { name: 'Cartão', value: metrics.payments.CARTAO, color: '#FFD700' },
    { name: 'Dinheiro', value: metrics.payments.DINHEIRO, color: '#4ADE80' },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary selection:text-black">
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <h1 className="text-lg sm:text-xl font-black tracking-tighter flex items-center gap-2 shrink-0">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center"><BarChart3 className="h-5 w-5 text-black" /></div>
              <span className="hidden xs:block">EMP�RIO<span className="text-primary"> DAS PIZZAS</span></span>
            </h1>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-[200px] sm:max-w-none">
              <button onClick={() => setActiveTab("stats")} className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all shrink-0 ${activeTab === "stats" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}>Dashboard</button>
              <button onClick={() => setActiveTab("menu")} className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all shrink-0 ${activeTab === "menu" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}>Menu</button>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={toggleStore} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${isStoreOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
              <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isStoreOpen ? "bg-green-500" : "bg-red-500"}`} />
              <span className="hidden sm:inline">{isStoreOpen ? "LOJA ABERTA" : `ABRE ìS ${openingTime}`}</span>
              <span className="sm:hidden">{isStoreOpen ? "ON" : "OFF"}</span>
            </button>
            <a href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white"><ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /></a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {activeTab === "stats" && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                <h2 className="text-3xl font-black">Visão Geral</h2>
                <p className="text-muted-foreground text-sm">Acompanhe o desempenho financeiro em tempo real.</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  {(['today', '7days', 'all', 'custom'] as TimeRange[]).map((range) => (
                    <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${timeRange === range ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"}`}>
                      {range === 'today' ? 'Hoje' : range === '7days' ? '7 dias' : range === 'custom' ? 'Custom' : 'Tudo'}
                    </button>
                  ))}
                </div>
                
                {timeRange === 'custom' && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                      <Calendar className="h-3 w-3 text-primary" />
                      <input 
                        type="date" 
                        value={customStart} 
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="bg-transparent border-none text-[10px] font-bold text-white focus:outline-none [color-scheme:dark]"
                      />
                      <span className="text-white/20 text-[10px]">até</span>
                      <input 
                        type="date" 
                        value={customEnd} 
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="bg-transparent border-none text-[10px] font-bold text-white focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-primary/20 transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl"><DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-primary" /></div>
                  <span className="hidden sm:flex text-[8px] sm:text-xs text-green-500 font-bold items-center gap-1"><TrendingUp className="h-3 w-3" /> Real-time</span>
                </div>
                <h3 className="text-muted-foreground text-[8px] sm:text-xs font-bold uppercase tracking-widest mb-1">Faturamento</h3>
                <p className="text-lg sm:text-3xl font-black text-white">{formatBRL(metrics.revenue)}</p>
              </div>
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-blue-500/20 transition-all group">
                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl sm:rounded-2xl w-fit mb-2 sm:mb-4"><ShoppingBag className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" /></div>
                <h3 className="text-muted-foreground text-[8px] sm:text-xs font-bold uppercase tracking-widest mb-1">Pedidos</h3>
                <p className="text-lg sm:text-3xl font-black text-white">{metrics.count}</p>
              </div>
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-yellow-500/20 transition-all group">
                <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-xl sm:rounded-2xl w-fit mb-2 sm:mb-4"><Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500" /></div>
                <h3 className="text-muted-foreground text-[8px] sm:text-xs font-bold uppercase tracking-widest mb-1">Tkt Médio</h3>
                <p className="text-lg sm:text-3xl font-black text-white">{formatBRL(metrics.avgTicket)}</p>
              </div>
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-purple-500/20 transition-all group">
                <div className="p-2 sm:p-3 bg-purple-500/10 rounded-xl sm:rounded-2xl w-fit mb-2 sm:mb-4"><Percent className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" /></div>
                <h3 className="text-muted-foreground text-[8px] sm:text-xs font-bold uppercase tracking-widest mb-1">Sucesso</h3>
                <p className="text-lg sm:text-3xl font-black text-white">{metrics.successRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-3xl p-5 sm:p-8">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-bold">Fluxo de Vendas</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-primary" />
                    <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">R$ Bruto</span>
                  </div>
                </div>
                <div className="h-[200px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }} itemStyle={{ color: '#FFD700', fontWeight: 'bold' }} />
                      <Bar dataKey="faturamento" fill="#FFD700" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-8">Top 5 Produtos</h3>
                <div className="space-y-6">
                  {metrics.topItems.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground text-xs border-2 border-dashed border-white/5 rounded-3xl">Aguardando dados...</div>
                  ) : metrics.topItems.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-primary border border-white/10">{idx + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-black text-white truncate">{item.name}</p>
                          <p className="text-xs font-black text-primary">{item.qty} un</p>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${(item.qty / metrics.topItems[0].qty) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 flex flex-col lg:col-span-1">
                <h3 className="text-lg font-bold mb-8">Métodos de Pagamento</h3>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}</Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-6">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="font-bold text-muted-foreground">{item.name}</span></div>
                        <span className="font-black">{item.value} pedidos</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div><h3 className="text-lg font-bold">�altimas Transações</h3><p className="text-xs text-muted-foreground">Listagem detalhada dos pedidos filtrados.</p></div>
                  <button onClick={exportToCSV} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <Filter className="h-3 w-3" /> EXPORTAR CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      <tr>
                        <th className="px-4 sm:px-8 py-5 hidden sm:table-cell">Referência</th>
                        <th className="px-4 sm:px-8 py-5 text-center">Origem</th>
                        <th className="px-4 sm:px-8 py-5">Cliente</th>
                        <th className="px-4 sm:px-8 py-5 text-center hidden md:table-cell">Data/Hora</th>
                        <th className="px-4 sm:px-8 py-5 text-center hidden sm:table-cell">Tipo</th>
                        <th className="px-4 sm:px-8 py-5 text-center">Status</th>
                        <th className="px-4 sm:px-8 py-5 text-right">Total</th>
                        <th className="px-4 sm:px-8 py-5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/[0.03]">
                      {filteredOrders.slice(0, 10).map((order) => (
                        <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-muted-foreground font-mono text-[10px] hidden sm:table-cell">
                            {order.daily_number ? `Ped #${order.daily_number} (` : '#'}
                            {order.id.slice(0, 8).toUpperCase()}
                            {order.daily_number ? ')' : ''}
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-center">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              String(order.delivery_type || "").startsWith('WHATSAPP') 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                : String(order.delivery_type || "").startsWith('BALCAO') 
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                                : 'bg-primary/10 text-primary border border-primary/20'
                            }`}>
                              {String(order.delivery_type || "").startsWith('WHATSAPP') 
                                ? 'WHATSAPP' 
                                : String(order.delivery_type || "").startsWith('BALCAO') 
                                ? 'BALCÒO' 
                                : 'SITE'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 font-bold text-xs sm:text-sm">{order.customer_name}</td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-center text-muted-foreground text-[10px] hidden md:table-cell">{format(new Date(order.created_at), "dd/MM · HH:mm", { locale: ptBR })}</td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-center text-[10px] font-bold text-muted-foreground hidden sm:table-cell">
                             {String(order.delivery_type || "").toUpperCase().includes('DELIVERY') ? 'ENTREGA' : 
                              String(order.delivery_type || "").toUpperCase().includes('PICKUP') ? 'RETIRADA' : 'BALCÒO'}
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-center">
                            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${order.status === 'ENTREGUE' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                              {order.status === 'ENTREGUE' ? 'OK' : order.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-right font-black text-xs sm:text-sm">{formatBRL(order.total)}</td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                             <button 
                               onClick={() => {
                                 if (confirm("Deseja realmente remover este pedido permanentemente?")) {
                                   deleteOrder(order.id);
                                 }
                               }} 
                               className="p-2 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-colors"
                             >
                                <Trash2 className="h-4 w-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "menu" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">Cardápio Digital</h2>
                  <p className="text-muted-foreground text-sm">Gerencie produtos, preços e disponibilidade semanal.</p>
                </div>
                <button 
                  onClick={() => {
                    setNewProduct({ name: "", description: "", price: 0, category: "classicos", image: "", available: true, available_days: [0, 1, 2, 3, 4, 5, 6] });
                    setIsAddingProduct(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black rounded-2xl text-xs hover:bg-primary/90 transition-all shadow-xl shadow-primary/10"
                >
                  <Plus className="h-4 w-4" /> NOVO ITEM
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                   <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] text-muted-foreground">
                      Nenhum produto cadastrado no banco. Use o botão "Novo Item".
                   </div>
                ) : products.map(product => (
                  <div key={product.id} className={`bg-[#0f0f0f] border rounded-[2.5rem] p-6 flex flex-col transition-all ${product.available ? 'border-white/5' : 'border-red-500/20 opacity-60'}`}>
                     <div className="flex gap-4 mb-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center">
                           {product.image ? <img src={product.image} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-white/10" />}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start">
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest">{product.category}</span>
                              <div className="flex gap-1">
                                 <button onClick={() => setIsEditingProduct(product)} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground transition-colors"><Edit3 className="h-4 w-4" /></button>
                                 <button onClick={() => handleDeleteProduct(product.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                              </div>
                           </div>
                           <h3 className="font-black text-white text-lg leading-tight mt-1">{product.name}</h3>
                           <p className="text-primary font-black text-lg mt-1">{formatBRL(product.price)}</p>
                        </div>
                     </div>
                     <div className="mb-6 space-y-3 flex-1">
                        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                        <div className="flex flex-wrap gap-1">
                           {DAYS_OF_WEEK.map(day => (
                             <span key={day.id} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${product.available_days?.includes(day.id) ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-white/5 text-white/20 border border-white/5'}`}>
                               {day.label}
                             </span>
                           ))}
                        </div>
                     </div>
                     <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${product.available ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{product.available ? 'Visível' : 'Oculto'}</span>
                        </div>
                        <button onClick={() => handleToggleProduct(product.id, product.available)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${product.available ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                           {product.available ? 'Desativar' : 'Ativar'}
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

      </main>

      {/* MODAL DE PRODUTO */}
      {(isAddingProduct || isEditingProduct) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-xl rounded-[3rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">{isEditingProduct ? 'Editar Pizza' : 'Nova Pizza'}</h3>
                 <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }} className="p-2 hover:bg-white/5 rounded-full"><X className="h-6 w-6" /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Nome do Item</label>
                    <input 
                      value={isEditingProduct ? isEditingProduct.name : newProduct.name} 
                      onChange={(e) => isEditingProduct ? setIsEditingProduct({...isEditingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Descrição</label>
                    <textarea 
                      value={isEditingProduct ? isEditingProduct.description : newProduct.description} 
                      onChange={(e) => isEditingProduct ? setIsEditingProduct({...isEditingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary h-24 resize-none" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Preço (R$)</label>
                       <input 
                         type="number" 
                         step="0.01"
                         value={isEditingProduct ? isEditingProduct.price : newProduct.price} 
                         onChange={(e) => isEditingProduct ? setIsEditingProduct({...isEditingProduct, price: parseFloat(e.target.value)}) : setNewProduct({...newProduct, price: parseFloat(e.target.value)})} 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary" 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Categoria</label>
                       <select 
                         value={isEditingProduct ? isEditingProduct.category : newProduct.category} 
                         onChange={(e) => isEditingProduct ? setIsEditingProduct({...isEditingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})} 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary text-xs font-bold uppercase"
                       >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3 p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-white/70">Disponibilidade Semanal</span></div>
                    <div className="flex flex-wrap gap-2">
                       {DAYS_OF_WEEK.map(day => {
                         const productState = isEditingProduct || newProduct;
                         const setProductState = isEditingProduct ? setIsEditingProduct : setNewProduct;
                         const isSelected = productState.available_days?.includes(day.id);
                         return (
                           <button 
                             key={day.id} 
                             type="button"
                             onClick={() => toggleDay(day.id, productState, setProductState)} 
                             className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${isSelected ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}
                           >
                             {day.label}
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">URL da Imagem</label>
                    <input 
                      value={isEditingProduct ? isEditingProduct.image : newProduct.image} 
                      onChange={(e) => isEditingProduct ? setIsEditingProduct({...isEditingProduct, image: e.target.value}) : setNewProduct({...newProduct, image: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary" 
                      placeholder="https://..."
                    />
                 </div>
              </div>
              <div className="flex gap-3 pt-4">
                 <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }} className="flex-1 py-4 border border-white/10 rounded-2xl font-black text-xs uppercase hover:bg-white/5">CANCELAR</button>
                 <button onClick={handleSaveProduct} className="flex-[2] py-4 bg-primary text-black rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/10">SALVAR NO CARDÁPIO</button>
              </div>
           </div>
        </div>
      )}
      {/* MODAL DE MOTOBOY REMOVIDO */}
    </div>
  );
};

export default Admin;
