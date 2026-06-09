import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

serve(async (req) => {
  // Tratamento de CORS para requisições do browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan_id } = await req.json()
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Inicializar cliente do Supabase para pegar o usuário logado
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!MP_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured in environment variables.")
    }

    // Determinar valores com base no plano escolhido
    let title = "Plano START";
    let unit_price = 49.90;

    switch(plan_id.toLowerCase()) {
      case 'start':
        title = "Plano START - 360Pro";
        unit_price = 49.90;
        break;
      case 'pro':
        title = "Plano PRO - 360Pro";
        unit_price = 149.90;
        break;
      case 'elite':
        title = "Plano ELITE - 360Pro";
        unit_price = 349.90;
        break;
      case 'inss':
        title = "Plano INSS - 360Pro";
        unit_price = 99.90;
        break;
      default:
        title = "Plano 360Pro";
        unit_price = 49.90;
    }

    // Criar a preferência de pagamento no Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: title,
            quantity: 1,
            currency_id: "BRL",
            unit_price: unit_price,
          }
        ],
        metadata: {
          user_id: user.id,
          plan_id: plan_id
        },
        // Mudar de acordo com o domínio final
        back_urls: {
          success: "http://localhost:5173/plans",
          failure: "http://localhost:5173/plans",
          pending: "http://localhost:5173/plans"
        },
        auto_return: "approved",
      })
    });

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Mercado Pago API error: ${errorData}`)
    }

    const data = await response.json();

    // Retorna a URL de checkout
    return new Response(
      JSON.stringify({ init_point: data.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error creating checkout:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
