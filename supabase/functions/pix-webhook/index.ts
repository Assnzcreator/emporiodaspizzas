import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get("type") || url.searchParams.get("topic")
    const id = url.searchParams.get("data.id") || url.searchParams.get("id")

    // O Mercado Pago manda vários eventos, só ligamos para pagamentos
    if (type !== 'payment') {
        return new Response("Not a payment event", { status: 200 });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpAccessToken) throw new Error('Token do Mercado Pago não configurado')

    // Bater no Mercado Pago para confirmar se realmente foi pago (Segurança)
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    })
    
    const paymentInfo = await mpResponse.json()

    // Se o pagamento estiver aprovado (approved)
    if (paymentInfo.status === 'approved') {
       const order_id = paymentInfo.external_reference

       // Iniciar o cliente Supabase com chave de SERVIDOR (bypassa RLS)
       const supabaseClient = createClient(
         Deno.env.get('SUPABASE_URL') ?? '',
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
       )

       // Atualiza o pedido para "PREPARANDO" indicando que o Pix caiu!
       await supabaseClient
         .from('orders')
         .update({ status: 'PREPARANDO' })
         .eq('id', order_id)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
