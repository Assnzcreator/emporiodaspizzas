import { Minus, Plus, ShoppingBag, Trash2, User, Phone, MapPin, Store, ChevronLeft, Navigation, QrCode, CreditCard, Banknote, Copy, CheckCircle2, Gift } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, formatBRL } from "@/context/CartContext";
import { useOrders, DeliveryType, PaymentMethod } from "@/context/OrderContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const DELIVERY_FEE = 5.0;

export const CartSheet = () => {
  const { items, isOpen, setIsOpen, updateQty, removeItem, totalPrice, clear } = useCart();
  const { placeOrder } = useOrders();
  
  const [step, setStep] = useState<"CART" | "PROFILE" | "DELIVERY" | "PAYMENT" | "WAITING_PAYMENT">("CART");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [paymentChange, setPaymentChange] = useState("");
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const [pixQrCodeBase64, setPixQrCodeBase64] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixOrderId, setPixOrderId] = useState<string | null>(null);

  const [showCrustReminder, setShowCrustReminder] = useState(false);
  const isFreeCrustDay = [1, 3].includes(new Date().getDay()); // 1 = Segunda, 3 = Quarta (para testes)

  const finalTotal = items.length > 0 ? totalPrice + (deliveryType === "DELIVERY" ? DELIVERY_FEE : 0) : 0;

  useEffect(() => {
    const savedProfile = localStorage.getItem("pizzaria_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setName(parsed.name || "");
        setPhone(parsed.phone || "");
      } catch (e) {}
    }
    const savedStreet = localStorage.getItem("pizzaria_street");
    if (savedStreet) setStreet(savedStreet);
    const savedNumber = localStorage.getItem("pizzaria_number");
    if (savedNumber) setNumber(savedNumber);
    const savedComp = localStorage.getItem("pizzaria_complement");
    if (savedComp) setComplement(savedComp);
  }, []);

  useEffect(() => {
    if (step === "WAITING_PAYMENT" && pixOrderId) {
       const channel = supabase
         .channel(`order-${pixOrderId}`)
         .on(
           "postgres_changes",
           { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${pixOrderId}` },
           (payload) => {
             if (payload.new.status === "PREPARANDO" || payload.new.status === "PAGO") {
                toast.success("Pagamento PIX Aprovado! �x}0", {
                  description: "Seu pedido já está em preparação!"
                });
                 clear();
                 setIsOpen(false);
                 // Reset states for next order
                 setStep("CART");
                 setPixOrderId(null);
                 setPixQrCodeBase64(null);
                 setPixCopiaCola(null);
                 setIsGeneratingPix(false);
             }
           }
         )
         .subscribe();
         
       return () => {
         supabase.removeChannel(channel);
       }
    }
  }, [step, pixOrderId]);

  const handleCopyPix = () => {
    if (pixCopiaCola) {
      navigator.clipboard.writeText(pixCopiaCola);
      toast.success("Código PIX copiado para a área de transferência!");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    let formatted = value;
    if (value.length > 2) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 7) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    }

    setPhone(formatted);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocarização.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          if (data && data.address) {
            const a = data.address;
            const road = a.road || a.pedestrian || a.path || a.suburb || "";
            const neighborhood = a.neighbourhood || a.suburb || a.city_district || a.town || a.village || "";
            const city = a.city || a.municipality || "";
            
            const parts = [road, neighborhood, city].filter(p => p.length > 0);
            setStreet(parts.join(", ") || data.display_name || "");
            toast.success("Localização encontrada com sucesso!");
          } else {
            toast.error("Não conseguimos identificar seu endereço.");
          }
        } catch (error) {
          toast.error("Erro ao buscar endereço.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error("Não foi possível acessar sua localização.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleInitialCheckout = () => {
    if (isFreeCrustDay && !showCrustReminder) {
      setShowCrustReminder(true);
      return;
    }

    if (!name || !phone) {
      setStep("PROFILE");
    } else {
      setStep("DELIVERY");
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = phone.replace(/\D/g, "");
    if (!name.trim() || digitsOnly.length < 10) {
      toast.error("Preencha um nome e um WhatsApp válido com DDD.");
      return;
    }
    localStorage.setItem("pizzaria_profile", JSON.stringify({ name, phone }));
    setStep("DELIVERY");
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryType === "DELIVERY" && (!street.trim() || !number.trim())) {
      toast.error("Por favor, preencha a rua e o número da entrega.");
      return;
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      toast.error("Por favor, confirme seu WhatsApp.");
      return;
    }
    
    setStep("PAYMENT");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAddress = null;
    if (deliveryType === "DELIVERY") {
      finalAddress = `${street}, Nº ${number}`;
      if (complement.trim()) finalAddress += ` - ${complement}`;
      
      localStorage.setItem("pizzaria_street", street);
      localStorage.setItem("pizzaria_number", number);
      localStorage.setItem("pizzaria_complement", complement);
    }
    localStorage.setItem("pizzaria_profile", JSON.stringify({ name, phone }));

    let changeValue = null;
    if (paymentMethod === "DINHEIRO" && paymentChange.trim()) {
      changeValue = parseFloat(paymentChange.replace(",", "."));
      if (isNaN(changeValue) || changeValue < finalTotal) {
         toast.error("Valor do troco inválido.");
         return;
      }
    }

    executeCheckout(finalAddress, changeValue);
  };

  const executeCheckout = async (finalAddress: string | null, changeValue: number | null) => {
    setIsGeneratingPix(true);
    const order = await placeOrder(
      name, 
      phone, 
      deliveryType, 
      finalAddress, 
      paymentMethod,
      changeValue,
      items, 
      finalTotal,
      "SITE"
    );
    
    if (order) {
      if (paymentMethod === "PIX") {
        toast.success("Pedido Confirmado! �xa�", {
          description: "Seu pedido já foi confirmado e enviado para o preparo! Pague via PIX na entrega ou envie o comprovante.",
        });
        clear();
        setIsOpen(false);
        setStep("CART");
        setIsGeneratingPix(false);
      } else {
        toast.success("Pedido Confirmado! �x}0", {
          description: `Total: ${formatBRL(finalTotal)} · Enviamos os detalhes de confirmação no seu WhatsApp!`,
        });
        clear();
        setIsOpen(false);
        setStep("CART");
        setIsGeneratingPix(false);
      }
    } else {
      toast.error("Erro ao enviar pedido.", {
        description: "Verifique sua conexão e tente novamente.",
      });
      setIsGeneratingPix(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setStep("CART");
    }}>
      <SheetContent aria-describedby="cart-description" className="flex w-full flex-col gap-0 p-0 sm:max-w-md bg-black/80 backdrop-blur-2xl border-l border-white/10 text-white">
        <SheetHeader className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            {step !== "CART" && (
              <button 
                onClick={() => {
                  if (step === "PAYMENT") setStep("DELIVERY");
                  else if (step === "DELIVERY") setStep("PROFILE");
                  else if (step === "PROFILE") setStep("CART");
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <SheetTitle className="flex items-center gap-2 text-lg text-white">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {step === "CART" ? "Seu Carrinho" : step === "PROFILE" ? "Identificação" : step === "DELIVERY" ? "Entrega" : step === "WAITING_PAYMENT" ? "Pagamento PIX" : "Pagamento"}
            </SheetTitle>
          </div>
          <SheetDescription id="cart-description" className="sr-only">
            Revise os itens do seu pedido e prossiga para o pagamento.
          </SheetDescription>
        </SheetHeader>

        {showCrustReminder ? (
          <div className="flex flex-1 flex-col p-6 animate-fade-in items-center justify-center text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black mb-2">Psiu! Tem Borda Grátis Hoje!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Hoje é segunda-feira, dia de borda grátis! Se você ainda não adicionou, volte ao cardápio e escolha a sua borda recheada antes de finalizar o pedido.
            </p>

            <div className="flex flex-col gap-3 w-full mt-auto pt-6">
              <Button onClick={() => {
                setShowCrustReminder(false);
                setIsOpen(false);
              }} size="lg" className="w-full rounded-full btn-glass-primary font-bold shadow-xl shadow-primary/20">
                Adicionar Borda
              </Button>
              <Button onClick={() => {
                setShowCrustReminder(false);
                if (!name || !phone) setStep("PROFILE");
                else setStep("DELIVERY");
              }} size="lg" variant="ghost" className="w-full rounded-full font-bold">
                Continuar sem adicionar / Já adicionei
              </Button>
            </div>
          </div>
        ) : step === "PROFILE" ? (
          <div className="flex flex-1 flex-col p-6 animate-fade-in overflow-y-auto">
            <h3 className="text-xl font-bold mb-2">Quase lá!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Como vamos te chamar quando o pedido estiver pronto?
            </p>
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Seu Nome
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> WhatsApp (com DDD)
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Ex: (81) 99999-9999"
                  maxLength={15}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  required
                />
              </div>
              <div className="mt-auto pt-6">
                <Button type="submit" size="lg" className="w-full rounded-full btn-glass-primary font-bold">
                  Continuar
                </Button>
              </div>
            </form>
          </div>
        ) : step === "DELIVERY" ? (
          <div className="flex flex-1 flex-col p-6 animate-fade-in overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Como deseja receber?</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setDeliveryType("DELIVERY")}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                  deliveryType === "DELIVERY" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <MapPin className="h-6 w-6" />
                <span className="font-semibold text-sm">Entrega</span>
              </button>
              
              <button
                type="button"
                onClick={() => setDeliveryType("PICKUP")}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                  deliveryType === "PICKUP" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <Store className="h-6 w-6" />
                <span className="font-semibold text-sm">Retirada</span>
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="flex flex-col gap-4 flex-1">
              {deliveryType === "DELIVERY" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Endereço de Entrega</label>
                    <button 
                      type="button" 
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="text-xs font-bold flex items-center gap-1.5 text-primary hover:text-primary-glow transition-colors bg-primary/10 px-2.5 py-1.5 rounded-md disabled:opacity-50"
                    >
                      {isLocating ? (
                         <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                         <Navigation className="h-3 w-3" />
                      )}
                      Buscar minha localização
                    </button>
                  </div>
                  
                  <input 
                    type="text" 
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua e Bairro"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="Número"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      required
                    />
                    <input 
                      type="text" 
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto, Bloco..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-2">
                <label className="text-sm font-semibold flex justify-between items-center">
                  <span>Confirme seu WhatsApp</span>
                  <button type="button" onClick={() => setStep("PROFILE")} className="text-xs text-primary underline">Editar Nome</button>
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Ex: (81) 99999-9999"
                  maxLength={15}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-primary"
                  required
                />
              </div>

              <div className="mt-auto pt-6 space-y-4">
                <Button type="submit" size="lg" className="w-full rounded-full btn-glass-primary font-bold shadow-xl shadow-primary/20">
                  Continuar
                </Button>
              </div>
            </form>
          </div>
        ) : step === "PAYMENT" ? (
          <div className="flex flex-1 flex-col p-6 animate-fade-in overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Como deseja pagar?</h3>
            
            <div className="flex flex-col gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod("PIX")}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  paymentMethod === "PIX" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <QrCode className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold text-sm">Pix</p>
                  <p className="text-xs opacity-80">Na entrega ou via WhatsApp</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod("CARTAO")}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  paymentMethod === "CARTAO" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold text-sm">Cartão</p>
                  <p className="text-xs opacity-80">Levamos a maquininha</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("DINHEIRO")}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  paymentMethod === "DINHEIRO" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <Banknote className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold text-sm">Dinheiro</p>
                  <p className="text-xs opacity-80">Pagamento na entrega</p>
                </div>
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4 flex-1">
              {paymentMethod === "DINHEIRO" && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-semibold text-white">Precisa de troco para quanto?</label>
                  <input 
                    type="number"
                    step="0.01" 
                    value={paymentChange}
                    onChange={(e) => setPaymentChange(e.target.value)}
                    placeholder="Ex: 50,00 (Deixe em branco se não precisar)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white"
                  />
                </div>
              )}

              <div className="mt-auto pt-6 space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatBRL(totalPrice)}</span>
                  </div>
                  {deliveryType === "DELIVERY" && (
                    <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                      <span>Taxa de Entrega</span>
                      <span>{formatBRL(DELIVERY_FEE)}</span>
                    </div>
                  )}
                  <Separator className="my-2 bg-white/10" />
                  <div className="flex justify-between font-bold text-lg text-white">
                    <span>Total</span>
                    <span className="text-primary">{formatBRL(finalTotal)}</span>
                  </div>
                </div>

                <Button disabled={isGeneratingPix} type="submit" size="lg" className="w-full rounded-full btn-glass-primary font-bold shadow-xl shadow-primary/20">
                  {isGeneratingPix ? (
                     <span className="flex items-center gap-2">
                       <div className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                       Gerando PIX...
                     </span>
                  ) : "Enviar Pedido para Cozinha"}
                </Button>
              </div>
            </form>
          </div>
        ) : step === "WAITING_PAYMENT" ? (
          <div className="flex flex-1 flex-col p-6 animate-fade-in overflow-y-auto items-center justify-center text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black mb-2">Pague via PIX</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Escaneie o QR Code ou copie o código para finalizar. O pedido será confirmado automaticamente!
            </p>

            <div className="bg-white p-4 rounded-2xl w-48 h-48 mb-6 flex items-center justify-center">
              {pixQrCodeBase64 === "MOCK" ? (
                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mockpix" alt="QR Code PIX" className="w-full h-full object-contain" />
              ) : pixQrCodeBase64 ? (
                 <img src={`data:image/jpeg;base64,${pixQrCodeBase64}`} alt="QR Code PIX" className="w-full h-full object-contain" />
              ) : (
                 <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
              )}
            </div>

            <Button onClick={handleCopyPix} size="lg" variant="outline" className="w-full rounded-full border-primary/50 text-primary hover:bg-primary/10 mb-4 font-bold flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copiar Código PIX
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse mt-4">
               <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
               Aguardando a confirmação do pagamento...
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <ShoppingBag className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="font-semibold">Seu carrinho está vazio</p>
            <span className="text-lg sm:text-2xl font-black tracking-tighter text-foreground leading-none">
              EMP�RIO<span className="text-primary"> DAS PIZZAS</span>
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none mt-0.5">
              Pizzaria Artesanal
            </span>
            <Button onClick={() => setIsOpen(false)} className="mt-4 rounded-full btn-glass-primary">
              Ver cardápio
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-3 animate-fade-in bg-white/5 p-3 rounded-2xl border border-white/5">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h4 className="font-bold leading-tight">{item.product.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.size === "P" ? "Individual" : item.size === "M" ? "Combo" : "Super Combo"}
                          </p>
                          {item.notes && (
                            <p className="text-[10px] text-primary/80 italic mt-1 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 w-fit">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="text-muted-foreground transition-smooth hover:text-red-400 h-fit p-1 bg-white/5 rounded-md"
                          aria-label="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full bg-black/50 border border-white/10 p-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-white hover:bg-white/10 hover:text-white"
                            onClick={() => updateQty(item.key, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold text-white">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-white hover:bg-white/10 hover:text-white"
                            onClick={() => updateQty(item.key, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-primary">
                          {formatBRL(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/10 bg-[#0a0a0a] p-5">
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-white">{formatBRL(totalPrice)}</span>
                </div>
              </div>
              <Button
                onClick={handleInitialCheckout}
                size="lg"
                className="w-full rounded-full text-base btn-glass-primary font-bold shadow-xl shadow-primary/20"
              >
                Avançar
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

