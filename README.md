# Wee Finances

Base do projeto em `Next.js + TypeScript + Tailwind + Prisma + NextAuth`, preparada para:

- modo solo e modo casal sem perda de dados
- escopos financeiros `MINE`, `PARTNER` e `SHARED`
- plano por usuario (`FREE` e `PREMIUM`)
- guarda de recurso Premium com resposta explicativa (sem bloqueio silencioso)
- design system com tokens light/dark e tipografia da marca

## Stack

- Next.js (App Router)
- Tailwind CSS v4
- Prisma ORM + PostgreSQL
- NextAuth.js (login individual por parceiro)
- shadcn/ui ready (config manual no `components.json`)

## Como rodar

1. Copie variaveis de ambiente:

```bash
cp .env.example .env
```

2. Ajuste o `DATABASE_URL` para seu Postgres.
3. Gere o client Prisma e rode migracao:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Inicie o projeto:

```bash
npm run dev
```

App em `http://localhost:3000`.

## Estrutura inicial relevante

- `prisma/schema.prisma`: modelos de negocio (solo/casal/convites/transicao/planos)
- `src/lib/auth.ts`: configuracao NextAuth + credenciais
- `src/proxy.ts`: bloqueio de rotas Premium (`/api/premium/*`)
- `src/lib/guards/require-plan.ts`: guard reutilizavel de plano
- `src/app/api/premium/reports/route.ts`: exemplo de endpoint Premium
- `src/app/globals.css`: tokens do Design System Wee Finances (light/dark)
- `src/lib/api-client.ts`: helper unico de cliente HTTP (`apiRequest` + `parseApiError`)
- `src/lib/clients/transactions-client.ts`: client padrao para transacoes
- `src/lib/clients/goals-client.ts`: client padrao para metas
- `src/lib/clients/debts-client.ts`: client padrao para dividas

## Fluxo Solo -> Casal implementado

- `POST /api/couple/invites`: cria convite para parceiro (gera codigo, valida modo solo)
- `GET /api/couple/invites/:code`: valida codigo de convite
- `POST /api/couple/invites/accept`: aceita convite, cria `Couple`, vincula ambos e migra dados solo do convidador para `coupleId`
- `POST /api/couple/division`: define renda mensal do parceiro logado e calcula divisao proporcional quando ambos preencherem

## Fluxo Casal -> Solo implementado

- `POST /api/couple/unlink`: desvincula casal com transacao atomica
  - preserva dados individuais de cada usuario
  - pausa metas conjuntas (`scope = SHARED`)
  - remove `coupleId` de transacoes, metas, dividas e cartoes
  - salva snapshot read-only dos dados compartilhados para cada parceiro
- `GET /api/couple/history`: retorna historico read-only dos snapshots de dados compartilhados apos desvinculacao
