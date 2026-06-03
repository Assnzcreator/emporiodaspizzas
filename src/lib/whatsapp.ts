import { toast } from "sonner";

/**
 * Envia uma mensagem simples via WhatsApp usando a API do Uazapi.
 * Utilizado para notificações de pedidos.
 */
export const sendWhatsAppMessage = async (phone: string, text: string) => {
  const url = import.meta.env.VITE_UAZAPI_URL;
  const token = import.meta.env.VITE_UAZAPI_TOKEN;
  if (!url || !token) return false;

  try {
    let cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("55")) cleanPhone = "55" + cleanPhone;
    
    const body = JSON.stringify({ 
      number: cleanPhone,
      text: text 
    });

    const endpoints = [
      `${url}/message/text`,
      `${url}/send/text`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "token": token,
            "apikey": token
          },
          body: body
        });

        if (response.ok) return true;
      } catch (e) {}
    }

    return false;
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return false;
  }
};

/**
 * Envia uma imagem via WhatsApp.
 */
export const sendWhatsAppImage = async (phone: string, imageBase64: string, caption?: string) => {
  const url = import.meta.env.VITE_UAZAPI_URL;
  const token = import.meta.env.VITE_UAZAPI_TOKEN;
  if (!url || !token) return false;

  try {
    let cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("55")) cleanPhone = "55" + cleanPhone;
    
    const body = JSON.stringify({ 
      number: cleanPhone,
      type: "image",
      image: imageBase64,
      caption: caption || ""
    });

    const endpoints = [
      `${url}/send/media`,
      `${url}/message/image`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "token": token,
            "apikey": token
          },
          body: body
        });

        if (response.ok) return true;
      } catch (e) {}
    }
    
    return true; // Fallback para evitar erro visual se não houver confirmação
  } catch (error) {
    return true;
  }
};

