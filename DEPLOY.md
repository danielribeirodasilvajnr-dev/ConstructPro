# Guia de Deploy ConstructPro na Vercel 🚀

Este guia ensina como hospedar seu projeto na Vercel de forma profissional.

## Passo 1: Preparar o Repositório
Certifique-se de que todas as alterações (incluindo o novo `vercel.json`) foram enviadas para o seu repositório Git (GitHub, GitLab ou Bitbucket).

## Passo 2: Importar na Vercel
1.  Acesse [vercel.com](https://vercel.com) e faça login.
2.  Clique em **"Add New..."** > **"Project"**.
3.  Importe o seu repositório `constructpro`.

## Passo 3: Configurar Variáveis de Ambiente (CRÍTICO) 🔑
Antes de clicar em Deploy, expanda a seção **"Environment Variables"** e adicione as seguintes chaves:

| Key | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Sua URL do Supabase (ex: https://xxx.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Sua Anon Key (chave pública do Supabase) |

> [!IMPORTANT]
> Sem essas variáveis, o aplicativo não conseguirá se conectar ao banco de dados e mostrará erros de conexão.

## Passo 4: Configurações de Build
A Vercel deve detectar automaticamente as configurações de Vite. Caso contrário, use:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## Passo 5: Deploy
Clique em **"Deploy"**. Após alguns segundos, seu site estará no ar!

---

### Verificação de Erros Comuns
- **404 ao atualizar a página:** O arquivo `vercel.json` que criamos resolve isso. Ele redireciona as rotas para o `index.html`.
- **Erro de Conexão com Supabase:** Verifique se as variáveis de ambiente no passo 3 foram digitadas corretamente e se não há espaços em branco.
