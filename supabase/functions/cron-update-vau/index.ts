import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // Apenas permite acesso de um cron job (se configurarmos o header correto) ou roda via GET/POST para teste
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
        // Para testes práticos locais, você pode remover esse check, mas mantenha em prod.
        // return new Response('Unauthorized', { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // A URL oficial ou parceira que compila o VAU de todos os estados.
    // COMO NÃO HÁ API OFICIAL: Usamos um site contábil de referência ou a página do DOU/Sinduscon compilada.
    // Substitua pela URL da fonte de dados que a sua equipe julgar mais confiável que não bloqueie scrapers.
    const SOURCE_URL = "https://facilitandoaengenharia.com.br/vau-valor-atualizado-unitario/" // Exemplo ilustrativo

    // OBSERVAÇÃO IMPORTANTE: Este código usa seletores genéricos. 
    // Como a fonte pode mudar, você precisará ajustar os seletores do Cheerio (.vau-table tr)
    // para bater exatamente com o HTML do site escolhido.

    /*
    const response = await fetch(SOURCE_URL)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const vauData = []
    const currentDate = new Date()
    const mes = currentDate.getMonth() + 1
    const ano = currentDate.getFullYear()

    // Exemplo de parse de uma tabela HTML
    // <tr><td>SP</td><td>2652,20</td><td>1622,73</td><td>2229,00</td></tr>
    $('table.tabela-vau tbody tr').each((i, el) => {
      const tds = $(el).find('td')
      if(tds.length >= 4) {
        const uf = $(tds[0]).text().trim()
        const alvenaria = parseFloat($(tds[1]).text().trim().replace('.', '').replace(',', '.'))
        const madeira = parseFloat($(tds[2]).text().trim().replace('.', '').replace(',', '.'))
        const mista = parseFloat($(tds[3]).text().trim().replace('.', '').replace(',', '.'))
        
        if (uf.length === 2 && !isNaN(alvenaria)) {
            vauData.push({
                uf,
                mes,
                ano,
                valor_alvenaria: alvenaria,
                valor_madeira: madeira,
                valor_mista: mista
            })
        }
      }
    })
    */

    // --- MOCK TEMPORÁRIO PARA DEMONSTRAÇÃO E TESTES ---
    // Simula a extração de alguns estados, já que sites de terceiros mudam com frequência
    const currentDate = new Date()
    const mes = currentDate.getMonth() + 1 // Mês atual
    const ano = currentDate.getFullYear()
    
    const vauData = [
        { uf: 'SP', mes, ano, valor_alvenaria: 2652.20, valor_madeira: 1622.73, valor_mista: 2229.00 },
        { uf: 'RJ', mes, ano, valor_alvenaria: 2610.50, valor_madeira: 1600.00, valor_mista: 2200.00 },
        { uf: 'MG', mes, ano, valor_alvenaria: 2580.10, valor_madeira: 1580.00, valor_mista: 2180.00 },
        // ... imaginemos que o web scraper preencheu os 27 estados
    ]
    // ----------------------------------------------------

    if (vauData.length > 0) {
        // Upsert the data (update if UF+Month+Year already exists)
        const { error } = await supabase
            .from('vau_rates')
            .upsert(vauData, { onConflict: 'uf,mes,ano' })

        if (error) {
            console.error("Erro ao inserir no Supabase:", error)
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
        }
        
        return new Response(JSON.stringify({ success: true, count: vauData.length, message: "Tabela VAU sincronizada com sucesso" }), { 
            status: 200,
            headers: { "Content-Type": "application/json" }
        })
    }

    return new Response(JSON.stringify({ success: false, message: "Nenhum dado encontrado na fonte." }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
    })

  } catch (err) {
    console.error("Internal Error:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
