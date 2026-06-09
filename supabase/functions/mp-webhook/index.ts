import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.searchParams.get("topic");
    const id = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Verifica se é uma notificação de pagamento (payment)
      if (body.type === 'payment' || body.topic === 'payment' || action === 'payment') {
        const paymentId = body.data?.id || body.id || id;

        if (!paymentId) {
          return new Response('No payment ID found', { status: 400 });
        }

        // Buscar detalhes do pagamento no MP de forma segura
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
          }
        });

        if (response.ok) {
          const paymentData = await response.json();
          
          if (paymentData.status === 'approved') {
            const userId = paymentData.metadata?.user_id;
            const planId = paymentData.metadata?.plan_id;

            if (userId && planId) {
              // Inicializa o cliente do Supabase com a chave de serviço (Service Role)
              // Isso garante que ele ignore RLS policies para atualizar o profile do usuário.
              const supabase = createClient(supabaseUrl, supabaseServiceKey);

              // Atualiza o plano do usuário
              const { error } = await supabase
                .from('profiles')
                .update({ 
                  plan_id: planId,
                  subscription_status: 'active'
                })
                .eq('id', userId);

              if (error) {
                console.error("Erro ao atualizar profile do usuário:", error.message);
                return new Response(JSON.stringify({ error: error.message }), { status: 500 });
              }

              console.log(`Assinatura ativada para usuário ${userId} no plano ${planId}`);
            }
          }
        } else {
          console.error("Falha ao consultar API do Mercado Pago", await response.text());
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response('Error processing webhook', { status: 400 })
  }
})
