# Google Flights Dashboard

Dashboard analítico que monitora dados do Google Flights via SerpAPI, armazenados no Neon (PostgreSQL serverless) e hospedado na Vercel.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Banco**: Neon (PostgreSQL serverless) com `@neondatabase/serverless`
- **Coleta**: SerpAPI (Google Flights engine)
- **Gráficos**: Recharts
- **Deploy**: Vercel
- **CI**: GitHub Actions (cron diário 03:01 UTC)

## Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `DASHBOARD_PIN` | PIN de acesso ao dashboard |
| `JWT_SECRET` | Chave para assinar tokens JWT (mínimo 32 chars) |
| `DATABASE_URL` | Connection string do Neon |
| `SERPAPI_KEY` | Chave da API SerpAPI |
| `CRON_SECRET` | Secret para proteger endpoint de coleta |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação |

### 3. Criar tabelas no Neon

Execute o conteúdo de `src/lib/schema.sql` no console SQL do Neon.

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` e faça login com o PIN configurado.

## Deploy na Vercel

1. Conecte o repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático a cada push

## GitHub Actions (Coleta Diária)

Configure os seguintes **Secrets** no repositório GitHub:

- `APP_URL` — URL da aplicação na Vercel (ex: `https://seu-app.vercel.app`)
- `CRON_SECRET` — Mesmo valor configurado na Vercel

O workflow roda diariamente às 03:01 UTC (00:01 BRT) e também pode ser disparado manualmente.

## Cloudflare (WAF/DDoS/CDN)

### Configuração

1. **Adicionar domínio** no Cloudflare (plano Free)
2. **Alterar nameservers** no registrador para os do Cloudflare
3. **Configurar DNS**: criar registro CNAME apontando para `cname.vercel-dns.com`
4. **SSL/TLS**: modo "Full (strict)"
5. **WAF**: ativar "Managed Rules" (OWASP Core Ruleset)
6. **DDoS**: proteção automática habilitada no plano Free
7. **Page Rules** (opcional):
   - `*seu-dominio.com/api/*` → Cache Level: Bypass
   - `*seu-dominio.com/*` → Browser Cache TTL: 4 hours

### Na Vercel

1. Adicionar o domínio customizado no projeto Vercel
2. Verificar que o DNS está apontando corretamente via Cloudflare

## Testes

```bash
npm test              # rodar testes
npm run test:coverage # rodar com cobertura
```

## Segurança

- Autenticação via PIN + JWT (cookie HTTP-only)
- Rate limiting em todas as API routes (10 req/min para auth, 60 req/min para demais)
- Headers de segurança: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Endpoint de coleta protegido com `CRON_SECRET`
- Queries SQL parametrizadas (proteção contra injection)
- Nenhuma chave exposta no client-side

## Estrutura

```
src/
├── app/
│   ├── api/          # API routes (auth, rotas, config, coleta, dados)
│   ├── dashboard/    # Páginas do dashboard
│   └── login/        # Página de login
├── components/
│   ├── charts/       # Gráficos Recharts
│   ├── layout/       # Sidebar, navegação
│   └── ui/           # Componentes reutilizáveis
├── lib/              # Lógica de negócio (auth, db, coleta, serpapi)
└── __tests__/        # Testes unitários
```
