import { Order } from "@/context/OrderContext";

// Comandos básicos ESC/POS
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

export const encodeOrderForPrinter = (order: Order) => {
  const encoder = new TextEncoder();
  let chunks: Uint8Array[] = [];

  const addLine = (text: string = "") => {
    chunks.push(encoder.encode(text + "\n"));
  };

  const addCommand = (cmds: number[]) => {
    chunks.push(new Uint8Array(cmds));
  };

  const generateReceipt = (title: string) => {
    // Inicializar impressora e dar espaço no topo
    addCommand([ESC, 0x40]);
    addLine("\n"); // Espaço extra para não cortar no topo
    
    // Identificação da Via e Origem
    addCommand([ESC, 0x61, 1]); // Centro
    addCommand([ESC, 0x45, 1]); // Negrito ON
    addLine(`--- ${title} ---`);
    
    const origin = String(order.delivery_type || "").startsWith('BALCAO') 
      ? 'BALCAO' 
      : String(order.delivery_type || "").startsWith('WHATSAPP') 
      ? 'WHATSAPP' 
      : 'SITE';
    addLine(`ORIGEM: ${origin}`);
    addCommand([ESC, 0x45, 0]); // Negrito OFF
    addLine("\n");

    // Alinhamento centralizado e Negrito para o Título do Estabelecimento
    addCommand([GS, 0x21, 0x11]); // Tamanho duplo
    addLine("EMP�RIO DAS PIZZAS");
    addCommand([GS, 0x21, 0x00]); // Tamanho normal
    addLine("--------------------------------");
    
    // Detalhes do Pedido
    addCommand([ESC, 0x61, 0]); // Esquerda
    addLine(`PEDIDO: #${order.id.slice(0, 5).toUpperCase()}`);
    addLine(`DATA: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
    addLine(`CLIENTE: ${order.customer_name}`);
    if (order.customer_phone && order.customer_phone !== "00000000000") {
      addLine(`TEL: ${order.customer_phone}`);
    }
    
    const typeLabel = String(order.delivery_type || "").toUpperCase().includes('DELIVERY') ? 'ENTREGA' : 
                     String(order.delivery_type || "").toUpperCase().includes('PICKUP') ? 'RETIRADA' : 'BALCÒO';
    
    addLine(`TIPO: ${typeLabel}`);
    
    if (String(order.delivery_type || "").toUpperCase().includes('DELIVERY')) {
      addLine(`END: ${order.delivery_address}`);
    }
    addLine("--------------------------------");

    // Itens
    addCommand([ESC, 0x45, 1]); // Negrito ON
    addLine("ITENS:");
    addCommand([ESC, 0x45, 0]); // Negrito OFF
    
    order.items?.forEach(item => {
      // Tenta pegar o preço de várias formas para evitar NaN
      const uPrice = Number(item.unitPrice || item.price || item.unit_price || 0);
      const qty = Number(item.quantity || 1);
      const priceTotal = uPrice * qty;
      const priceStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceTotal);
      
      // Se o nome tiver várias linhas (nome + extras), imprime cada uma
      const lines = item.product_name.split("\n");
      addLine(`${item.quantity}x ${lines[0]}`); // Primeira linha com a quantidade
      
      if (lines.length > 1) {
        for (let i = 1; i < lines.length; i++) {
          addLine(`   ${lines[i]}`); // Extras com recuo
        }
      }
      
      addLine(`Subtotal: ${priceStr}`);
      
      if (item.notes && item.notes.trim()) {
        addCommand([ESC, 0x45, 1]); // Negrito ON
        addLine(`>> OBS: ${item.notes.trim().toUpperCase()}`);
        addCommand([ESC, 0x45, 0]); // Negrito OFF
      }
      addLine("--------------------------------");
    });
    
    addLine("--------------------------------");

    // Totais e Pagamento
    addLine(`PAGAMENTO: ${order.payment_method}`);
    if (order.payment_method === 'DINHEIRO' && order.payment_change) {
      addLine(`TROCO PARA: R$ ${order.payment_change.toFixed(2)}`);
    }
    
    addCommand([ESC, 0x45, 1]); // Negrito ON
    addLine(`TOTAL: R$ ${order.total.toFixed(2)}`);
    addCommand([ESC, 0x45, 0]); // Negrito OFF
    
    addLine("\n");
    addCommand([ESC, 0x61, 1]); // Centro
    addLine("OBRIGADO PELA PREFERENCIA!");
    addLine("\n\n\n\n"); // Espaço para o corte
    
    // COMANDO DE CORTE (Partial Cut)
    addCommand([GS, 0x56, 66, 0]);
  };

  // Gerar a Via do Estabelecimento e Cortar
  generateReceipt("VIA ESTABELECIMENTO");
  
  // Gerar a Via do Cliente e Cortar
  generateReceipt("VIA CLIENTE");

  // Juntar tudo em um único Uint8Array
  let totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  let result = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach(chunk => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
};
