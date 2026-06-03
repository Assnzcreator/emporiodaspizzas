import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, total, email = "cliente@emporioburguer.com" } = await req.json()

    // O Token do Mercado Pago deve ser configurado como Secret no Supabase
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')

    if (!mpAccessToken) {
      throw new Error('Token do Mercado Pago não configurado (MP_ACCESS_TOKEN)')
    }

    // Configurando a requisição para o Mercado Pago
    const paymentData = {
      transaction_amount: total,
      description: `Empório Burguer - Pedido #${order_id.slice(0, 8)}`,
      payment_method_id: 'pix',
      payer: {
        email: email
      },
      external_reference: order_id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/pix-webhook`
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order_id // Evita pagamentos duplicados
      },
      body: JSON.stringify(paymentData)
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
       console.error("Erro no MP:", mpData);
       throw new Error('Falha ao gerar PIX no Mercado Pago')
    }

    const qr_code = mpData.point_of_interaction.transaction_data.qr_code
    const qr_code_base64 = mpData.point_of_interaction.transaction_data.qr_code_base64
    const payment_id = mpData.id

    return new Response(
      JSON.stringify({ qr_code, qr_code_base64, payment_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
