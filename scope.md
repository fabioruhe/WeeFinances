# Wee Finances — Documento de Arquitetura (scope)

## 0) Objetivo e premissas

- Produto financeiro com modo **solo** nativo e modo **casal** como upgrade de colaboração.
- Transições entre estados devem preservar histórico e evitar perda de dados.
- `User` é a entidade central; `Couple` é opcional e contextual.
- Todas as entidades financeiras podem existir sem `couple_id` (solo) e com `couple_id` (casal).
- Escopo de lançamento: backend REST em Next.js App Router (`/app/api`) + PostgreSQL/Prisma.

---

## 1) Modelo de Dados (ERD descritivo)

### 1.1 Convenções gerais

- Chaves primárias: `id` (UUID/CUID).
- FKs nomeadas em snake_case: `user_id`, `couple_id`, etc.
- Campos monetários: `decimal(12,2)` (ou superior em cenários agregados).
- Datas: `timestamp with time zone`.
- Índices recomendados:
  - por FK (`user_id`, `couple_id`, `categoria_id`, `credit_card_id`);
  - por consulta temporal (`mes_referencia`, `data`, `created_at`);
  - compostos para listagem (`user_id + data`, `couple_id + data`).

### 1.2 Entidades e campos

#### User
- `id`
- `nome`
- `email` (unique)
- `senha_hash`
- `perfil_financeiro` (enum: `POUPADOR | GASTADOR | DESLIGADO | VISIONARIO`)
- `plano` (enum: `FREE | PREMIUM`, default `FREE`)
- `couple_id` (FK nullable para `Couple.id`)
- `onboarding_completo` (boolean default `false`)
- `created_at`

#### Couple
- `id`
- `user_a_id` (FK `User.id`)
- `user_b_id` (FK nullable `User.id`; `null` até aceite)
- `divisao_tipo` (enum: `PROPORCIONAL | IGUALITARIA | FIXA`)
- `invite_code` (string 6 chars, unique)
- `status` (enum: `PENDENTE | ATIVO | DESVINCULADO`)
- `created_at`

#### Income
- `id`
- `user_id` (FK)
- `valor`
- `tipo` (enum: `FIXO | VARIAVEL | EXTRAORDINARIO`)
- `descricao`
- `mes_referencia`
- `created_at`

#### Transaction
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `valor`
- `tipo` (enum: `RECEITA | DESPESA`)
- `escopo` (enum: `INDIVIDUAL | COMPARTILHADA`)
- `categoria_id` (FK)
- `descricao`
- `data`
- `credit_card_id` (FK nullable)
- `installment_id` (FK nullable)
- `created_at`

#### CreditCard
- `id`
- `couple_id` (FK nullable)
- `user_id` (FK — dono do cartão)
- `apelido`
- `bandeira` (enum: `VISA | MASTERCARD | ELO | AMEX | HIPERCARD | OUTRO`)
- `ultimos_4_digitos` (string 4 chars)
- `limite_total`
- `dia_fechamento` (1-31)
- `dia_vencimento` (1-31)
- `cor_hex`
- `ativo` (boolean)
- `is_adicional` (boolean default `false`)
- `adicional_user_id` (FK nullable — parceiro usuário do adicional)
- `belvo_link_id` (nullable, premium)
- `belvo_institution` (nullable)
- `last_sync_at` (datetime nullable)
- `created_at`

#### Installment
- `id`
- `credit_card_id` (FK)
- `user_id` (FK)
- `couple_id` (FK nullable)
- `descricao`
- `valor_total`
- `valor_parcela`
- `parcelas_total`
- `parcelas_pagas`
- `categoria_id` (FK)
- `escopo` (enum: `INDIVIDUAL | COMPARTILHADA`)
- `data_compra`
- `primeira_parcela_mes` (date)
- `created_at`

#### Subscription (premium)
- `id`
- `credit_card_id` (FK nullable)
- `couple_id` (FK nullable)
- `nome`
- `valor`
- `categoria_id` (FK)
- `frequencia` (enum: `MENSAL | ANUAL`)
- `user_id` (FK)
- `ativa` (boolean)
- `detectada_auto` (boolean)
- `created_at`

#### InboxItem
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `credit_card_id` (FK nullable)
- `valor`
- `descricao`
- `tipo_transacao` (string)
- `app_origem` (string)
- `package_name` (string)
- `categoria_sugerida_id` (FK nullable)
- `status` (enum: `PENDENTE | APROVADO | IGNORADO`)
- `transaction_id` (FK nullable)
- `timestamp` (datetime)
- `created_at`

#### AppLink
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `package_name` (unique por usuário)
- `credit_card_id` (FK)
- `app_nome` (string)
- `created_at`

#### ImportHistory
- `id`
- `couple_id` (FK nullable)
- `credit_card_id` (FK)
- `user_id` (FK)
- `tipo` (enum: `OFX | CSV | NOTIFICATION | OPEN_FINANCE`)
- `arquivo_nome` (string nullable)
- `total_importadas` (int)
- `total_duplicadas` (int)
- `created_at`

#### Category
- `id`
- `nome`
- `icone`
- `tipo` (enum: `PADRAO | CUSTOM`)
- `couple_id` (FK nullable)

#### Subcategory
- `id`
- `categoria_id` (FK)
- `nome`
- `icone`
- `ordem`

#### MerchantRule
- `id`
- `couple_id` (FK nullable)
- `keyword`
- `categoria_id` (FK)
- `subcategoria_id` (FK nullable)
- `source` (enum: `SISTEMA | USUARIO`)
- `hit_count` (int)
- `created_at`
- `updated_at`

#### Budget
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `categoria_id` (FK)
- `limite_mensal`
- `mes_referencia`

#### Goal
- `id`
- `user_id` (FK — criador)
- `couple_id` (FK nullable)
- `nome`
- `valor_alvo`
- `valor_atual`
- `prazo`
- `tipo` (enum: `EMERGENCIA | VIAGEM | IMOVEL | CARRO | CASAMENTO | FILHOS | APOSENTADORIA | EDUCACAO | OUTRO`)
- `status` (enum: `ATIVA | ATINGIDA | PAUSADA`)

#### GoalContribution
- `id`
- `goal_id` (FK)
- `user_id` (FK)
- `valor`
- `data`

#### Debt
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `nome`
- `valor_total`
- `valor_restante`
- `parcelas_total`
- `parcelas_pagas`
- `taxa_juros`
- `vencimento_dia`
- `estrategia` (enum: `AVALANCHE | BOLA_DE_NEVE`)

#### CheckIn
- `id`
- `couple_id` (FK — obrigatório no casal; nullable no solo)
- `user_id` (FK nullable; preenchido em revisão individual)
- `data`
- `resumo_json`
- `sentimento_a` (1-5)
- `sentimento_b` (1-5 nullable)

#### Asset
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `nome`
- `tipo` (enum: `RENDA_FIXA | RENDA_VARIAVEL | FUNDO | IMOVEL | VEICULO | CRIPTO | PREVIDENCIA | POUPANCA | OUTRO`)
- `instituicao` (nullable)
- `ticker` (nullable)
- `valor_atual`
- `valor_investido`
- `data_aquisicao` (date nullable)
- `notas` (nullable)
- `ativo` (boolean)
- `created_at`
- `updated_at`

#### AssetSnapshot
- `id`
- `asset_id` (FK)
- `valor`
- `mes_referencia` (date)
- `created_at`

#### DividendEntry
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `asset_id` (FK nullable)
- `valor`
- `mes_referencia` (date)
- `descricao` (nullable)
- `tipo` (enum: `DIVIDENDO | JCP | RENDIMENTO | ALUGUEL | OUTRO`)
- `created_at`

#### FixedExpense
- `id`
- `user_id` (FK)
- `couple_id` (FK nullable)
- `nome`
- `valor_medio`
- `categoria_id` (FK)
- `escopo` (enum: `INDIVIDUAL | COMPARTILHADA`)
- `prioridade` (int)
- `ativo` (boolean)
- `created_at`

### 1.3 Relacionamentos principais

- `User 1:N Income`
- `User 1:N Transaction`
- `User 1:N CreditCard` (dono)
- `User 1:N Installment`
- `User 1:N Subscription`
- `User 1:N InboxItem`
- `User 1:N AppLink`
- `User 1:N ImportHistory`
- `User 1:N Budget`
- `User 1:N Goal`
- `User 1:N GoalContribution`
- `User 1:N Debt`
- `User 1:N CheckIn` (solo/revisão individual)
- `User 1:N Asset`
- `User 1:N DividendEntry`
- `User 1:N FixedExpense`

- `Couple 1:N Transaction | CreditCard | Installment | Subscription | InboxItem | AppLink | ImportHistory | Budget | Goal | Debt | CheckIn | Asset | DividendEntry | FixedExpense`
- `Category 1:N Subcategory`
- `Category 1:N Transaction | Budget | Installment | Subscription | FixedExpense | MerchantRule`
- `Goal 1:N GoalContribution`
- `Asset 1:N AssetSnapshot`
- `CreditCard 1:N Installment | Transaction | Subscription | ImportHistory | InboxItem | AppLink`
- `Installment 1:N Transaction` (via `installment_id`)

### 1.4 Regras de integridade e transição

- `invite_code` único para `Couple` em estado `PENDENTE`.
- Em modo solo, `user.couple_id = null`.
- Em modo casal ativo, `user.couple_id = couple.id` para ambos parceiros.
- Ao aceitar convite:
  - `Couple.status` muda para `ATIVO`;
  - `user_b_id` é preenchido;
  - dados existentes do convidador recebem `couple_id`, mantendo `escopo = INDIVIDUAL`.
- Ao desvincular:
  - `Couple.status = DESVINCULADO`;
  - `user.couple_id = null` para ambos;
  - dados compartilhados permanecem como snapshot/histórico read-only;
  - metas conjuntas passam para `PAUSADA`.

---

## 2) Fluxo do Usuário (User Flow)

### 2.1 Fluxo de cadastro (todos)

1. Usuário informa `nome`, `email`, `senha`.
2. Sistema cria conta e sessão autenticada.
3. Onboarding de perfil financeiro (quiz).
4. Usuário escolhe:
   - **Usar sozinho**
   - **Convidar parceiro(a)**

### 2.2 Caminho solo

1. Escolha: **Usar sozinho**.
2. Informar renda (módulo `Income`).
3. Dashboard liberado em modo solo.
4. Em qualquer momento: Configurações -> Convidar parceiro(a).
5. Sistema gera código de convite.
6. Parceiro aceita.
7. Configuração de divisão.
8. Conta muda para modo casal sem perder histórico.

### 2.3 Caminho casal direto do onboarding

1. Escolha: **Convidar parceiro(a)**.
2. Código de convite é gerado.
3. Convidador já pode usar app em solo enquanto aguarda.
4. Parceiro aceita convite.
5. Configuram divisão (`PROPORCIONAL/IGUALITARIA/FIXA`).
6. Dashboard passa a operar em modo casal.

### 2.4 Fluxo diário (ambos modos)

1. Registrar transação (manual/importação/inbox).
2. Sistema aplica categorização automática por regra (`MerchantRule`).
3. Usuário revisa/ajusta categoria.
4. Dashboard e relatórios atualizam.
5. Solo: somente `INDIVIDUAL`.
6. Casal: seleção de `INDIVIDUAL` ou `COMPARTILHADA`.

### 2.5 Fluxo mensal (casal)

1. Check-in guiado.
2. Geração de relatório do mês.
3. Ajuste de orçamento por categoria.
4. Revisão de metas conjuntas e dívidas.

### 2.6 Fluxo mensal (solo)

1. Relatório individual mensal.
2. Revisão de orçamento.
3. Ajuste de metas e dívidas individuais.

---

## 3) Estrutura de Pastas (Next.js App Router)

- `app/`
  - `(public)/`
    - `auth/login`
    - `auth/register`
    - `onboarding`
  - `(protected)/`
    - `dashboard`
    - `transactions`
    - `budgets`
    - `goals`
    - `debts`
    - `cards`
    - `investments`
    - `reports`
    - `settings/relationship`
    - `settings/history`
  - `api/`
    - `auth/*`
    - `users/*`
    - `couples/*`
    - `transactions/*`
    - `budgets/*`
    - `goals/*`
    - `debts/*`
    - `cards/*`
    - `imports/*`
    - `premium/*`

- `components/`
  - `ui/` (botões, inputs, modal, toast, badges)
  - `layout/` (header, sidebar, shell)
  - `dashboard/`
  - `transactions/`
  - `budgets/`
  - `goals/`
  - `debts/`
  - `couples/`

- `lib/`
  - `auth.ts`
  - `db.ts` / `prisma.ts`
  - `api-client.ts`
  - `guards/`
  - `clients/`
  - `services/` (regras de negócio por domínio)
  - `validators/` (schemas Zod)
  - `utils.ts`

- `prisma/`
  - `schema.prisma`
  - `migrations/`
  - `seed.ts`

- `types/`
  - `auth.ts`
  - `api.ts`
  - `domain/` (`transaction.ts`, `goal.ts`, `couple.ts`, etc.)

---

## 4) APIs Necessárias (REST)

### 4.1 Auth

- `POST /api/auth/register` — cria conta e senha.
- `POST /api/auth/login` — autenticação por credenciais.
- `POST /api/auth/logout` — encerra sessão.
- `GET /api/auth/session` — retorna sessão atual.
- `POST /api/auth/forgot-password` — inicia recuperação.
- `POST /api/auth/reset-password` — redefine senha.

### 4.2 Users

- `GET /api/users/me` — perfil do usuário logado.
- `PATCH /api/users/me` — atualiza nome/preferências.
- `PATCH /api/users/me/plan` — upgrade/downgrade de plano.
- `PATCH /api/users/me/profile` — atualiza `perfil_financeiro`.
- `PATCH /api/users/me/onboarding` — marca onboarding concluído.
- `GET /api/users/me/incomes` — lista rendas.
- `POST /api/users/me/incomes` — cria renda.
- `PATCH /api/users/me/incomes/:id` — atualiza renda.
- `DELETE /api/users/me/incomes/:id` — remove renda.

### 4.3 Couples

- `POST /api/couples/invites` — cria convite.
- `GET /api/couples/invites/:code` — valida convite.
- `POST /api/couples/invites/accept` — aceita convite e ativa casal.
- `PATCH /api/couples/:id/division` — define tipo de divisão e pesos.
- `GET /api/couples/:id` — dados do casal ativo.
- `POST /api/couples/:id/unlink` — desvincula casal.
- `GET /api/couples/history` — histórico read-only pós-desvinculação.
- `POST /api/couples/:id/checkins` — cria check-in mensal.
- `GET /api/couples/:id/checkins` — lista check-ins.

### 4.4 Transactions

- `GET /api/transactions` — lista transações (com filtros).
- `POST /api/transactions` — cria transação.
- `GET /api/transactions/:id` — detalhe.
- `PATCH /api/transactions/:id` — atualiza.
- `DELETE /api/transactions/:id` — remove.
- `POST /api/transactions/import/csv` — importa CSV.
- `POST /api/transactions/import/ofx` — importa OFX.
- `GET /api/transactions/inbox` — lista inbox de notificações.
- `PATCH /api/transactions/inbox/:id/approve` — aprova inbox item.
- `PATCH /api/transactions/inbox/:id/ignore` — ignora inbox item.

### 4.5 Budgets

- `GET /api/budgets` — lista orçamentos por mês.
- `POST /api/budgets` — cria orçamento.
- `PATCH /api/budgets/:id` — atualiza limite.
- `DELETE /api/budgets/:id` — remove.
- `GET /api/budgets/summary` — resumo de consumo por categoria.

### 4.6 Goals

- `GET /api/goals` — lista metas.
- `POST /api/goals` — cria meta.
- `GET /api/goals/:id` — detalhe da meta.
- `PATCH /api/goals/:id` — atualiza meta.
- `DELETE /api/goals/:id` — remove meta.
- `POST /api/goals/:id/contributions` — adiciona aporte.
- `GET /api/goals/:id/contributions` — lista aportes.

### 4.7 Debts

- `GET /api/debts` — lista dívidas.
- `POST /api/debts` — cria dívida.
- `GET /api/debts/:id` — detalhe.
- `PATCH /api/debts/:id` — atualiza dívida.
- `DELETE /api/debts/:id` — remove dívida.
- `POST /api/debts/:id/payments` — registra pagamento/parcela.
- `GET /api/debts/strategy` — simulação avalanche/bola de neve.

### 4.8 Domínios complementares (necessários no produto)

- **Cards**: `/api/cards/*` para cartões, adicionais, parcelamentos.
- **Categories**: `/api/categories/*`, `/api/subcategories/*`, `/api/merchant-rules/*`.
- **Assets**: `/api/assets/*`, `/api/assets/:id/snapshots`, `/api/dividends/*`.
- **Imports**: `/api/imports/history`, `/api/open-finance/sync`.
- **Premium**: endpoints protegidos (`reports/advanced`, `subscriptions/detector`, etc.).

---

## 5) Regras de Acesso

### 5.1 Visibilidade base

- Usuário visualiza:
  - seus dados individuais;
  - dados compartilhados do casal ativo.
- Usuário **não** visualiza dados individuais privados do parceiro.

### 5.2 Edição e ownership

- `User A` não edita transações individuais de `User B`.
- Em `escopo = COMPARTILHADA`, ambos podem editar conforme política de colaboração (auditável).
- Exclusões críticas devem manter trilha de auditoria lógica.

### 5.3 Privacidade por escopo

- `INDIVIDUAL` -> dono apenas.
- `COMPARTILHADA` -> ambos parceiros.
- Campos “individual-privado” nunca entram em respostas do parceiro.

### 5.4 Regras em desvinculação

- Manter histórico individual de cada usuário.
- Remover acesso cruzado entre parceiros.
- Persistir snapshot read-only dos compartilhados para ambos.
- Pausar metas conjuntas e preservar contribuições já registradas.

### 5.5 Regras de plano

- Recursos premium exigem checagem explícita de plano.
- Nunca bloquear silenciosamente:
  - retornar erro explicativo;
  - frontend exibe badge premium + modal de upgrade.
- No casal, recurso premium de casal é liberado se ao menos um parceiro for `PREMIUM`.

---

## 6) Decisões de arquitetura (resumo executivo)

- Modelo híbrido solo/casal por FK opcional (`couple_id`) em entidades financeiras.
- APIs por domínio e escopo explícito (`INDIVIDUAL`/`COMPARTILHADA`).
- Guards de acesso em camada de serviço + validação no endpoint.
- Estratégia “sem perda” em transições com operações atômicas.
- Frontend com clients tipados e tratamento unificado de erro.

