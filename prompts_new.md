# Prompts Sequenciais — Sistema de Gestão Financeira para Casais

> **Como usar este documento:**
> Cada prompt abaixo é independente e deve ser usado em um **chat novo**.
> Copie o **Prompt 0 (Base)** + o prompt do passo atual.
> Só avance para o próximo quando o anterior estiver funcionando e testado.

---

## PROMPT 0 — BASE DE CONTEXTO (cole sempre no início de cada chat)

```markdown
# CONTEXTO DO PROJETO: "WEE FINANCES"

## O que é
Sistema de gestão financeira que funciona tanto para uso individual (solo)
quanto para casais. O usuário começa sozinho e pode convidar um parceiro
a qualquer momento, desbloqueando funcionalidades colaborativas.
A transição de solo para casal é suave — nenhum dado é perdido, 
tudo que já existia é preservado e passa a ser visível como "Meu" dentro do casal.

## Stack (ajuste conforme sua escolha)
- Frontend: Next.js 14+ (App Router) com TypeScript
- UI: Tailwind CSS + shadcn/ui
- Backend: Next.js API Routes (ou separado em Node/Python se preferir)
- Banco: PostgreSQL com Prisma ORM
- Auth: NextAuth.js (login individual por parceiro)
- Deploy: Vercel

## Modos de Conta
O sistema tem 2 modos. O User é a entidade central, o Couple é opcional.

### Modo Solo
- Usuário usa o app sozinho
- Todas as funcionalidades individuais disponíveis: transações, orçamento,
  metas, dívidas, cartão de crédito, relatórios, educação
- Não existe escopo "Compartilhada" nem "Dele(a)" — só "Meu"
- couple_id = null em todas as entidades
- Pode convidar um parceiro A QUALQUER MOMENTO via configurações
- CTA sutil no dashboard: "Convide seu parceiro para gerenciar juntos"
  (não intrusivo, aparece 1x por semana no máximo)

### Modo Casal
- Ativado quando o parceiro aceita o convite e o Couple é criado
- Desbloqueia: escopo "Compartilhada", toggle "Meu/Nosso/Dele(a)",
  divisão proporcional, check-in mensal, metas conjuntas, score do casal
- Dados pré-existentes do modo solo são preservados como INDIVIDUAL
- O parceiro começa do zero (faz onboarding próprio: quiz + renda)

### Transição Solo → Casal
- Ao convidar parceiro: gerar código de convite
- Parceiro se cadastra com o código → cria Couple → vincula ambos
- Dados do user que convidou: todas as Transactions, Goals, Debts, 
  CreditCards permanecem como estão, agora com couple_id preenchido
- Divisão é configurada após vinculação (ambos informam renda)
- Nenhuma funcionalidade solo é removida, só expandida

### Transição Casal → Solo (desvinculação)
- Qualquer parceiro pode desvincular a qualquer momento
- Dados INDIVIDUAIS de cada um são preservados na conta de cada um
- Dados COMPARTILHADOS: cada um mantém uma cópia read-only no histórico
- Metas conjuntas: pausadas, valor já contribuído permanece no registro
- couple_id volta a null, sistema volta ao modo solo automaticamente

## Princípios de Negócio
1. Cada pessoa tem login próprio e dados individuais protegidos
2. O app funciona 100% no modo solo — casal é um upgrade, não requisito
3. Casais se vinculam por convite (código/email) a qualquer momento
4. No modo casal, existem 3 escopos: "Meu", "Dele(a)", "Nosso"
5. Divisão de despesas compartilhadas é proporcional à renda (configurável)
6. Tom do sistema: colaborativo, nunca acusatório, celebra conquistas
7. Privacidade: cada um controla o que compartilha
8. Transição entre modos é indolor — zero perda de dados

## Planos: Free vs Premium
O sistema tem dois planos. O plano é vinculado ao User (não ao Couple),
então cada pessoa tem seu próprio plano — mas funcionalidades Premium
de casal exigem que pelo menos um dos dois seja Premium.
SEMPRE verificar o plano antes de liberar funcionalidades restritas.
Funcionalidades Premium devem existir na interface com badge "Premium" 
e modal de upgrade ao clicar.

### Free (padrão)
- Modo solo: funcionalidade completa
- Modo casal: funcionalidade completa
- 1 cartão de crédito por conta (solo) ou por casal
- Transações, orçamento, metas, dívidas, check-in — tudo disponível
- Relatórios básicos (mensal)
- Educação financeira completa

### Premium
- Cartões de crédito ilimitados
- Cartão adicional com divisão automática de gastos por parceiro (casal)
- Relatórios avançados (comparativo anual, projeções, exportação)
- Simulador de parcelamento avançado (multi-cartão)
- Detector de assinaturas recorrentes
- Open Finance (importação automática via Belvo)

### Implementação técnica
- User deve ter campo: plano (enum: FREE | PREMIUM)
- Middleware/guard que verifica plano antes de ações restritas
- Telas Premium: mostrar preview do conteúdo + CTA de upgrade
- Nunca bloquear silenciosamente — sempre explicar o que é Premium

## Regra de Certeza
Se você não tiver 90% de certeza sobre como proceder em qualquer etapa,
faça perguntas esclarecedoras antes de gerar código ou plano.

## IDENTIDADE VISUAL — Design System "Wee Finances"

### Conceito
Calor humano + confiança financeira. Diferente de fintechs frias e corporativas,
nosso design diz: "finanças são sobre o relacionamento de vocês, não sobre números."
Background warm (nunca branco hospitalar), fontes com personalidade, cores com
significado funcional.

### Tipografia
- Display (valores, títulos emocionais): Fraunces (serif, italic para ênfase)
  → R$ 12.450 em Fraunces italic transforma número frio em conquista emocional
- Heading + Body (labels, textos): DM Sans (sans-serif, clean e amigável)
- Mono (dados, badges, horários): JetBrains Mono
- Google Fonts: @import Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,400..600
  + DM+Sans:wght@300..700 + JetBrains+Mono:wght@400..600

### Paleta de Cores

#### MODO CLARO (light)
Backgrounds:
- bg-primary: #FAFAF8 (warm off-white, NUNCA branco puro)
- bg-secondary: #F2F0EC (warm sand, áreas recuadas)
- bg-tertiary: #E8E5DF (warm stone, barras vazias)
- bg-card: #FFFFFF (cards e modais)

Brand:
- brand-primary: #1B6B5A (teal profundo — CTAs, links, ações)
- brand-primary-hover: #15574A
- brand-primary-light: #E6F4F0 (teal 10%, backgrounds suaves)
- brand-primary-muted: #B8DDD3 (teal 30%, badges)
- brand-secondary: #C4956A (terracotta — calor, parceiro B)
- brand-secondary-light: #FBF3EC
- brand-accent: #D4A853 (gold — celebrações, metas atingidas)

Semânticas:
- success: #2D8A56 / success-light: #E8F5ED (receita, positivo, metas)
- warning: #C4882D / warning-light: #FFF6E8 (atenção, 70-90% do orçamento)
- danger: #C4453A / danger-light: #FCEAE8 (despesa, estourou, dívida alta)
- info: #3A7FC4 / info-light: #E8F0FB (dicas, educação financeira)

Texto:
- text-primary: #1A1A18
- text-secondary: #5C5A55
- text-tertiary: #8A8780
- text-inverse: #FAFAF8 (sobre fundos escuros/coloridos)
- text-brand: #1B6B5A

Parceiros (diferenciação visual obrigatória):
- partner-a: #1B6B5A (teal — sempre o user logado)
- partner-b: #C4956A (terracotta — sempre o parceiro)
- partner-shared: #7C6DAF (lavender — o "nós", despesas compartilhadas)

Borders:
- border: #E2DFD9 / border-focus: #1B6B5A / divider: #ECE9E3

Shadows:
- shadow-sm: 0 1px 2px rgba(26,26,24,0.05)
- shadow-md: 0 4px 12px rgba(26,26,24,0.08)
- shadow-lg: 0 12px 32px rgba(26,26,24,0.10)

#### MODO ESCURO (dark)
Backgrounds:
- bg-primary: #131311
- bg-secondary: #1C1B18
- bg-tertiary: #252420
- bg-card: #1E1D1A

Brand (versões luminosas para contraste):
- brand-primary: #3DBEA6
- brand-primary-hover: #4DCFB6
- brand-primary-light: #1A2F2A
- brand-primary-muted: #1F3D35
- brand-secondary: #D4A87A
- brand-secondary-light: #2A2218
- brand-accent: #E4BD6D

Semânticas:
- success: #4ABA73 / success-light: #1A2E20
- warning: #D4A24A / warning-light: #2E2515
- danger: #E06B60 / danger-light: #2E1A18
- info: #5A9FE4 / info-light: #1A2530

Texto:
- text-primary: #EDECE8
- text-secondary: #A5A29B
- text-tertiary: #706D66
- text-inverse: #131311
- text-brand: #3DBEA6

Parceiros:
- partner-a: #3DBEA6 / partner-b: #D4A87A / partner-shared: #9B8DD4

Borders:
- border: #2E2D28 / border-focus: #3DBEA6 / divider: #252420

Shadows:
- shadow-sm: 0 1px 2px rgba(0,0,0,0.3)
- shadow-md: 0 4px 12px rgba(0,0,0,0.4)
- shadow-lg: 0 12px 32px rgba(0,0,0,0.5)

### Princípios Visuais (aplicar em TODAS as telas)
1. Border-radius: 12px para cards, 10px para inputs, 20px para badges/pills, 
   50% para avatares
2. Valores financeiros SEMPRE em Fraunces (font-weight: 700, font-style: italic)
3. Parceiro A = teal, Parceiro B = terracotta, Casal = lavender — SEMPRE
4. Barras de progresso: gradiente brand-primary → brand-accent quando perto da meta
5. Celebrações (meta atingida): fundo com gradiente sutil gold+teal, emoji 🎉, 
   animação de confete
6. Mensagens do sistema: tom curioso/encorajador. Frases colaborativas.
   Ex: "Vocês economizaram R$ 340!" e não "Economia de R$ 340"
7. Loading: skeleton com animação shimmer usando bg-tertiary → bg-secondary
8. Estados vazios: ilustração minimalista + frase motivacional
9. Mobile-first: thumb zone respeitada, elementos interativos na metade inferior
10. Dark mode: NUNCA inverter cores diretamente. Usar os tokens dark específicos.
    Manter mesmo "calor" da versão light com tons amarelados nos backgrounds.
```

---

## PROMPT 1 — ARQUITETURA E MODELO DE DADOS
**Objetivo:** Planejar antes de codar. Gerar o scope.md do projeto.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Criar o documento de arquitetura (scope.md)

Antes de qualquer código, preciso que você planeje a arquitetura completa
do sistema. Gere um arquivo scope.md contendo:

### 1. Modelo de Dados (ERD descritivo)
Defina as entidades, campos e relacionamentos para:

- **User**: id, nome, email, senha_hash, perfil_financeiro (enum: POUPADOR | 
  GASTADOR | DESLIGADO | VISIONARIO), plano (enum: FREE | PREMIUM, default FREE),
  couple_id (FK nullable — preenchido quando vinculado a um casal),
  onboarding_completo (boolean default false), created_at
- **Couple**: id, user_a_id (FK), user_b_id (FK nullable — null enquanto
  aguarda aceite do convite), divisao_tipo (enum: PROPORCIONAL | IGUALITARIA | 
  FIXA), invite_code (string 6 chars unique), status (PENDENTE | ATIVO | 
  DESVINCULADO), created_at
- **Income**: id, user_id (FK), valor, tipo (FIXO | VARIAVEL | EXTRAORDINARIO),
  descricao, mes_referencia, created_at
- **Transaction**: id, user_id (FK), couple_id (FK nullable), valor, tipo 
  (RECEITA | DESPESA), escopo (INDIVIDUAL | COMPARTILHADA), categoria_id (FK),
  descricao, data, credit_card_id (FK nullable), installment_id (FK nullable),
  created_at
- **CreditCard**: id, couple_id (FK nullable — null em modo solo), 
  user_id (FK — dono do cartão), apelido,
  bandeira (enum: VISA | MASTERCARD | ELO | AMEX | HIPERCARD | OUTRO),
  ultimos_4_digitos (string 4 chars), limite_total, dia_fechamento (1-31),
  dia_vencimento (1-31), cor_hex (string), ativo (boolean),
  is_adicional (boolean default false), adicional_user_id (FK nullable — 
  parceiro que usa o adicional), belvo_link_id (string nullable — PREMIUM),
  belvo_institution (string nullable), last_sync_at (datetime nullable),
  created_at
- **Installment**: id, credit_card_id (FK), user_id (FK), couple_id (FK nullable),
  descricao, valor_total, valor_parcela, parcelas_total, parcelas_pagas,
  categoria_id (FK), escopo (INDIVIDUAL | COMPARTILHADA), data_compra,
  primeira_parcela_mes (date), created_at
- **Subscription**: id, credit_card_id (FK nullable), couple_id (FK nullable),
  nome, valor, categoria_id (FK), frequencia (MENSAL | ANUAL),
  user_id (FK — quem usa), ativa (boolean), detectada_auto (boolean),
  created_at (PREMIUM)
- **InboxItem**: id, user_id (FK), couple_id (FK nullable), credit_card_id (FK nullable),
  valor, descricao, tipo_transacao (string), app_origem (string),
  package_name (string), categoria_sugerida_id (FK nullable),
  status (enum: PENDENTE | APROVADO | IGNORADO), transaction_id (FK nullable),
  timestamp (datetime), created_at
- **AppLink**: id, user_id (FK), couple_id (FK nullable), 
  package_name (string unique per user),
  credit_card_id (FK), app_nome (string), created_at
- **ImportHistory**: id, couple_id (FK nullable), credit_card_id (FK), user_id (FK),
  tipo (enum: OFX | CSV | NOTIFICATION | OPEN_FINANCE), arquivo_nome (string nullable),
  total_importadas (int), total_duplicadas (int), created_at
- **Category**: id, nome, icone, tipo (PADRAO | CUSTOM), couple_id (FK nullable)
- **Subcategory**: id, categoria_id (FK), nome, icone, ordem
- **MerchantRule**: id, couple_id (FK nullable para regras globais), keyword, 
  categoria_id (FK), subcategoria_id (FK nullable), source (SISTEMA | USUARIO),
  hit_count (int), created_at, updated_at
- **Budget**: id, user_id (FK), couple_id (FK nullable), categoria_id (FK), 
  limite_mensal, mes_referencia
- **Goal**: id, user_id (FK — criador), couple_id (FK nullable), nome, 
  valor_alvo, valor_atual, prazo, 
  tipo (enum: EMERGENCIA | VIAGEM | IMOVEL | CARRO | CASAMENTO | FILHOS | 
  APOSENTADORIA | EDUCACAO | OUTRO), status (ATIVA | ATINGIDA | PAUSADA)
- **GoalContribution**: id, goal_id (FK), user_id (FK), valor, data
- **Debt**: id, user_id (FK), couple_id (FK nullable), nome, valor_total, 
  valor_restante, parcelas_total, parcelas_pagas, taxa_juros, vencimento_dia,
  estrategia (AVALANCHE | BOLA_DE_NEVE)
- **CheckIn**: id, couple_id (FK — só existe em modo casal), user_id (FK nullable
  — preenchido em modo solo para "revisão mensal individual"), data, resumo_json, 
  sentimento_a (1-5), sentimento_b (1-5, nullable — null em modo solo)
- **Asset**: id, user_id (FK), couple_id (FK nullable), nome, tipo (enum: 
  RENDA_FIXA | RENDA_VARIAVEL | FUNDO | IMOVEL | VEICULO | CRIPTO | 
  PREVIDENCIA | POUPANCA | OUTRO), instituicao (string nullable — ex: "XP", 
  "Nubank"), ticker (string nullable — ex: "PETR4", "IVVB11"), 
  valor_atual (decimal), valor_investido (decimal — quanto colocou),
  data_aquisicao (date nullable), notas (string nullable), ativo (boolean),
  created_at, updated_at
- **AssetSnapshot**: id, asset_id (FK), valor (decimal), mes_referencia (date),
  created_at
  (registro mensal do valor de cada ativo — alimenta o gráfico de evolução)
- **DividendEntry**: id, user_id (FK), couple_id (FK nullable), 
  asset_id (FK nullable — vinculado ao ativo que gerou, se aplicável),
  valor (decimal), mes_referencia (date), descricao (string nullable),
  tipo (enum: DIVIDENDO | JCP | RENDIMENTO | ALUGUEL | OUTRO), created_at
- **FixedExpense**: id, user_id (FK), couple_id (FK nullable),
  nome (string — ex: "Gás", "Água", "Luz", "Internet", "Aluguel"),
  valor_medio (decimal), categoria_id (FK), escopo (INDIVIDUAL | COMPARTILHADA),
  prioridade (int — ordem de cobertura pelo freedom tracker),
  ativo (boolean), created_at

### 2. Fluxo do Usuário (User Flow)
Descreva passo a passo:

#### Fluxo de Cadastro (todos)
- Cadastro (nome, email, senha) → Onboarding (quiz perfil financeiro)
  → Escolha: "Usar sozinho" ou "Convidar parceiro(a)"
  
#### Caminho Solo
- Escolhe "Usar sozinho" → Informa renda → Dashboard ativo (modo solo)
- A qualquer momento: Configurações > "Convidar parceiro(a)" → gera código
- Parceiro aceita → Configuração da divisão → Sistema muda para modo casal

#### Caminho Casal (direto do onboarding)
- Escolhe "Convidar parceiro(a)" → Gera código → Aguarda aceite
- Enquanto aguarda: pode usar o app normalmente no modo solo
- Parceiro aceita → Configuração da divisão → Dashboard modo casal

#### Fluxo diário (ambos os modos)
- Registrar transação → categorização automática → atualiza dashboard
- Modo solo: tudo é INDIVIDUAL, sem toggle de escopo
- Modo casal: escolhe INDIVIDUAL ou COMPARTILHADA

#### Fluxo mensal (modo casal)
- Check-in guiado → relatório → ajuste de orçamento

#### Fluxo mensal (modo solo)
- Relatório individual → revisão de orçamento (sem check-in de casal)

### 3. Estrutura de Pastas
Seguindo App Router do Next.js, proponha a árvore de diretórios para:
- /app (rotas)
- /components (UI reutilizável)
- /lib (utils, db, auth)
- /prisma (schema)
- /types (TypeScript)

### 4. APIs Necessárias
Liste todas as rotas de API (REST) com método, path e descrição.
Agrupe por domínio: auth, users, couples, transactions, budgets, goals, debts.

### 5. Regras de Acesso
- User só vê seus dados individuais + dados compartilhados do casal
- User A não pode editar transações de User B
- Dados marcados como "individual-privado" são invisíveis ao parceiro
- Desvinculação mantém histórico individual, remove acesso cruzado

NÃO gere código. Apenas o plano em markdown.
Formate como um documento scope.md completo e organizado.
```

---

## PROMPT 2 — SETUP DO PROJETO + SCHEMA DO BANCO
**Objetivo:** Criar a fundação técnica.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Setup inicial do projeto e schema Prisma

Com base na arquitetura definida, execute:

### Passo 1: Inicializar o projeto
- Next.js 14+ com App Router e TypeScript
- Instalar dependências: prisma, @prisma/client, next-auth, bcryptjs, zod
- Configurar Tailwind + shadcn/ui
- Instalar: next-themes (dark mode toggle)

### Passo 1.5: Configurar Design System no Tailwind
Estender tailwind.config.ts com TODOS os tokens de cor do Design System:
- Usar CSS variables para permitir troca light/dark via classe .dark no <html>
- Registrar todas as cores em globals.css como variáveis CSS:
  :root { --brand-primary: #1B6B5A; --bg-primary: #FAFAF8; ... }
  .dark { --brand-primary: #3DBEA6; --bg-primary: #131311; ... }
- No tailwind.config.ts, mapear: colors.brand.primary → 'var(--brand-primary)'
- Importar Google Fonts: Fraunces (display), DM Sans (body), JetBrains Mono (mono)
- Configurar fontFamily no Tailwind:
  display: ['Fraunces', 'serif']
  sans: ['DM Sans', 'sans-serif']
  mono: ['JetBrains Mono', 'monospace']
- Configurar border-radius padrão: cards=12px, inputs=10px, pills=20px
- Configurar shadows customizados: sm, md, lg conforme Design System
- Usar next-themes com attribute="class" e defaultTheme="light"

Referência completa dos tokens: ver seção "IDENTIDADE VISUAL" no Prompt 0.

### Passo 2: Criar o schema.prisma
Implemente TODAS as entidades do modelo de dados:
User, Couple, Income, Transaction, Category, Subcategory, MerchantRule, 
Budget, Goal, GoalContribution, Debt, CheckIn, CreditCard, Installment,
Subscription, InboxItem, AppLink, ImportHistory, Asset, AssetSnapshot,
DividendEntry, FixedExpense.

Requisitos do schema:
- Usar UUID como id padrão
- Campos created_at e updated_at em todas as tabelas
- Enums para: PerfilFinanceiro, DivisaoTipo, CoupleStatus (PENDENTE|ATIVO|DESVINCULADO),
  UserPlan (FREE|PREMIUM), TransactionTipo, TransactionEscopo, GoalTipo, GoalStatus, 
  DebtEstrategia, MerchantRuleSource, CardBrand (VISA|MASTERCARD|ELO|AMEX|HIPERCARD|OUTRO),
  SubscriptionFrequency (MENSAL|ANUAL), InboxStatus (PENDENTE|APROVADO|IGNORADO),
  ImportType (OFX|CSV|NOTIFICATION|OPEN_FINANCE),
  AssetType (RENDA_FIXA|RENDA_VARIAVEL|FUNDO|IMOVEL|VEICULO|CRIPTO|PREVIDENCIA|POUPANCA|OUTRO),
  DividendType (DIVIDENDO|JCP|RENDIMENTO|ALUGUEL|OUTRO)
- User deve ter campos: plano (enum UserPlan, default FREE), couple_id (FK nullable),
  onboarding_completo (boolean default false)
- Couple: user_b_id nullable (null enquanto aguarda aceite), invite_code unique
- couple_id é NULLABLE em TODAS as entidades exceto Couple e CheckIn
  → Isso permite que tudo funcione sem casal (modo solo)
  → Queries devem filtrar por user_id (solo) OU couple_id (casal)
- Transaction deve ter: subcategoria_id (FK nullable), reviewed (boolean default false),
  anomalia (boolean default false), credit_card_id (FK nullable), 
  installment_id (FK nullable)
- CreditCard: validar que FREE permite max 1 cartão por couple_id
- Installment: gerar Transactions automáticas para cada parcela futura
- Subscription: campo detectada_auto para identificação automática
- Relações bidirecionais corretas
- Índices em: user_id, couple_id, data, mes_referencia, keyword (em MerchantRule),
  credit_card_id, dia_fechamento, dia_vencimento
- Seed com categorias padrão: Moradia, Transporte, Alimentação, Saúde, 
  Educação, Lazer, Vestuário, Pets, Filhos, Investimentos, Dívidas, Pessoal
- Seed com subcategorias padrão (ver Prompt 5 para lista completa)
- Seed com MerchantRules globais (source=SISTEMA) para: iFood, Uber, Netflix,
  Shell, Carrefour, Drogasil, Enel, Sabesp, etc. (ver Prompt 5 para lista)

### Passo 3: Configurar NextAuth
- Provider de credenciais (email + senha)
- Session com JWT contendo: userId, coupleId (nullable), nome, plano
- coupleId na session: null se modo solo, preenchido se vinculado
- Middleware protegendo rotas /dashboard/*
- Helper function: isCoupleMode(session) → boolean

### Validação
Após gerar, rode mentalmente:
- O schema compila sem erros?
- As relações fazem sentido? (ex: Transaction pertence a User E opcionalmente a Couple)
- couple_id é nullable em todas as entidades que precisam funcionar no modo solo?
- O auth retorna coupleId como null quando o user não tem casal?
- O helper isCoupleMode funciona corretamente?

Se algo não passar na validação, corrija antes de entregar.
```

---

## PROMPT 3 — AUTENTICAÇÃO + ONBOARDING
**Objetivo:** Cadastro, login, quiz de perfil, escolha de modo (solo/casal) e vinculação.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Fluxo de autenticação e onboarding

O onboarding deve funcionar para DOIS cenários: quem quer usar sozinho
e quem quer convidar o parceiro. O convite pode acontecer no onboarding
OU depois, a qualquer momento, via configurações.

Implemente as seguintes telas e lógica:

### Tela 1: Cadastro (/register)
- Campos: nome, email, senha, confirmar senha
- Validação com Zod (email válido, senha min 8 chars)
- Hash da senha com bcryptjs
- Criar User no banco (couple_id = null, plano = FREE)
- Redirecionar para onboarding

### Tela 2: Quiz de Perfil Financeiro (/onboarding/perfil)
- 8 perguntas de múltipla escolha (4 opções cada)
- Cada opção pontua para um dos 4 perfis: POUPADOR, GASTADOR, DESLIGADO, VISIONARIO
- No final, mostrar o perfil dominante com descrição curta
- Salvar no campo perfil_financeiro do User
- Tom: leve e divertido, sem julgamento

Perguntas sugeridas (adaptadas para funcionar solo E em casal):
1. "Sobrou dinheiro no fim do mês. Você..." 
   → Guarda tudo / Compra algo que queria / Nem percebeu que sobrou / Investe em algo planejado
2. "Você recebe um presente de R$1.000. Primeira reação?"
   → Coloca na poupança / Jantar especial / Tanto faz / Pesquisa o melhor investimento
3. "Como você se sente ao ver o extrato bancário?"
   → Tranquilo, confiro sempre / Prefiro não olhar / Que extrato? / Analiso cada linha
4. "Alguém te sugere comprar uma TV nova. Você..."
   → Sugere esperar a promoção / Vamos comprar! / Decide você / Faz planilha comparativa
5. "Fim do ano, hora de planejar o próximo. Você..."
   → Define quanto vai poupar / Pensa nas viagens / Deixa rolar / Monta metas com prazos
6. "Conta inesperada de R$500 chega. Você..."
   → Paga com reserva / Parcela no cartão / Deixa pra depois / Negocia desconto à vista
7. "Investimentos. Qual sua postura?"
   → Poupança é seguro / Nunca pensei nisso / Não entendo / Diversifico entre renda fixa e variável
8. "O que mais te estressa sobre dinheiro?"
   → Gastar demais / Não poder gastar / Ter que pensar nisso / Não ter controle dos números

### Tela 3: Escolha do Modo (/onboarding/modo)  ⬅ NOVA
Após o quiz, tela com 2 opções claras:

#### Opção A: "Quero usar sozinho" (ícone de 1 pessoa)
- Subtítulo: "Gerencie suas finanças pessoais. Você pode convidar 
  alguém a qualquer momento."
- Ao clicar: pula para Tela 4 (Renda), sem criar Couple

#### Opção B: "Quero usar com meu parceiro(a)" (ícone de 2 pessoas)
- Subtítulo: "Organizem as finanças juntos. Cada um tem seu login."
- Ao clicar: vai para Tela 5 (Convite)

Design: cards grandes lado a lado (desktop) ou empilhados (mobile).
Tom acolhedor: "Como você quer começar?"
Nota sutil abaixo: "Não se preocupe, você pode mudar isso depois."

### Tela 4: Informar Renda (/onboarding/renda)
- Input: "Qual sua renda líquida mensal?" (valor em R$)
- Toggle: "Renda fixa" / "Renda variável" 
  (se variável: "Informe uma estimativa média")
- Criar registro Income para o User
- Ao salvar:
  - Se veio do modo solo → marcar onboarding_completo = true → Dashboard
  - Se veio do modo casal (após parceiro aceitar) → ir para Tela 6 (Divisão)

### Tela 5: Convite ao Parceiro (/onboarding/convite)
- Criar Couple com: user_a_id = user logado, user_b_id = null, 
  status = PENDENTE, invite_code = código único (6 chars alfanuméricos)
- Atualizar user.couple_id com o id do Couple criado
- Mostrar código de convite com botão de copiar
- Opção de enviar por email ou compartilhar link (deep link: /join/[code])
- Tela de espera: "Aguardando seu parceiro(a) aceitar o convite"
- IMPORTANTE: botão "Pular por enquanto — usar sozinho" visível
  - Ao clicar: ir para Tela 4 (Renda) no modo solo
  - O Couple fica com status PENDENTE, convite continua válido
  - Parceiro pode aceitar depois, mesmo após o user já estar usando

### Tela 5.1: Aceitar Convite (/join/[code])
- Pessoa recebe o link ou digita o código na tela de cadastro
- Se já tem conta: fazer login e vincular
- Se não tem conta: cadastro rápido → quiz → vincular
- Ao aceitar:
  1. Atualizar Couple: user_b_id = novo user, status = ATIVO
  2. Atualizar user_b.couple_id = couple.id
  3. Redirecionar user_b para Tela 4 (Renda)
  4. Após renda → Tela 6 (Divisão) — que agora tem ambas as rendas
  5. Notificar user_a: "Seu parceiro(a) [nome] aceitou o convite!"

### Tela 6: Configuração da Divisão (/onboarding/divisao)
- Só acessível quando ambos os parceiros têm renda cadastrada
- Mostra renda de ambos lado a lado
- 3 opções com simulação visual:
  a) Proporcional: "A contribui X% e B contribui Y% das despesas comuns"
  b) Igualitária: "Cada um contribui 50%"
  c) Fixa: "A contribui R$X e B contribui R$Y"
- Salvar escolha no Couple (divisao_tipo)
- Redirecionar ambos para Dashboard (modo casal)

### Convite posterior (via Configurações — NÃO é onboarding)
Acessível em: /dashboard/config/parceiro

#### Se modo solo (sem Couple):
- Card: "Convide seu parceiro(a)" com CTA
- Mesmo fluxo da Tela 5: gera código, espera aceite
- Ao aceitar: migração suave para modo casal
  - Dados existentes permanecem como INDIVIDUAL do user
  - couple_id é preenchido em todas as entidades do user
  - Parceiro faz seu onboarding (quiz + renda)
  - Tela de divisão aparece para ambos

#### Se modo casal (Couple ATIVO):
- Card: "Conta vinculada com [nome]"
- Opção "Desvincular conta" com modal de confirmação
  - Confirmar: Couple.status = DESVINCULADO
  - Ambos voltam ao modo solo
  - Dados INDIVIDUAIS preservados, COMPARTILHADOS viram cópia read-only

#### Se convite pendente (Couple PENDENTE):
- Card: "Convite pendente — código: [XXXXXX]"
- Botão "Reenviar convite" / "Copiar link"
- Botão "Cancelar convite" → deleta Couple, volta ao solo puro

### Regras de Modo no Sistema Inteiro
TODAS as telas e APIs devem respeitar:

#### Helper: getAccountContext(session)
Retorna: { 
  mode: 'solo' | 'couple',
  userId, 
  coupleId: string | null,
  partnerId: string | null,
  partnerName: string | null
}

#### Adaptações por modo:
- **Toggle "Meu/Nosso/Dele(a)"**: só aparece no modo casal. Modo solo: não renderizar
- **Escopo COMPARTILHADA**: só disponível no modo casal. Modo solo: tudo é INDIVIDUAL
- **Divisão proporcional**: só no modo casal. Modo solo: não aplicável
- **Check-in mensal**: só no modo casal. Modo solo: substituir por "Revisão mensal" 
  individual (mesmas etapas, sem sentimento lado a lado, sem "dele(a)")
- **Score de saúde**: no modo solo, calcular sem "alinhamento de metas" e "frequência 
  de check-ins" — esses pesos são redistribuídos para os outros critérios
- **Metas**: no modo solo, sem GoalContribution por parceiro — só do user
- **Relatório de divisão**: só no modo casal
- **CTA de convite**: no dashboard solo, mostrar card sutil 1x/semana
  "Gerencie a dois: convide seu parceiro(a)" — dismissável

### Regras
- Nenhuma tela deve ter mais de 3 ações por vez
- Progresso visual (stepper: 1/4 a 4/4 solo, 1/5 a 5/5 casal)
- Mobile-first
- Após gerar cada componente, revise: acessibilidade, validação de input, loading states

### Regras Visuais (aplicar o Design System do Prompt 0)
- Background de todas as telas: bg-primary (#FAFAF8 / #131311)
- Cards de etapa: bg-card, border, border-radius 16px, shadow-md
- Stepper: dots usando brand-primary (ativo) e bg-tertiary (inativo)
- Quiz: opções como cards com border, ao selecionar → border-brand-primary + bg-brand-primary-light
- Código de convite: usar fonte JetBrains Mono, tamanho grande (24px), letter-spacing wide
- Botões primários: bg-brand-primary, text-inverse, border-radius 12px
- Simulação da divisão: usar cores partner-a (teal) e partner-b (terracotta) lado a lado
- Resultado do quiz: mostrar perfil com emoji grande + título em Fraunces italic
- Tela de escolha de modo: card "Solo" com border neutro, card "Casal" com 
  gradiente sutil brand-primary-light → brand-secondary-light
- Suportar dark mode via classe .dark (next-themes)
```

---

## PROMPT 4 — DASHBOARD DO CASAL
**Objetivo:** Tela principal com visão "Meu / Seu / Nosso".
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Dashboard principal do casal

### Componente: DashboardPage (/dashboard)

Layout com cards informativos. Adaptar ao modo da conta:

#### Modo Casal: Toggle no topo com 3 abas: "Meu" | "Nosso" | "Dele(a)"
#### Modo Solo: SEM toggle — mostrar dados diretos do user (sem filtro de escopo)
  - No lugar do toggle, mostrar CTA sutil (1x/semana, dismissável):
    "Gerencie a dois → Convide seu parceiro(a)"

#### Card 1: Saldo do Mês
- Receitas - Despesas = Saldo
- Modo casal: filtrado pelo escopo selecionado (meu/nosso/dele)
- Modo solo: total do user, sem filtro
- Cor verde se positivo, vermelho se negativo

#### Card 2: Score de Saúde Financeira
- Valor de 0 a 100 com indicador visual (gauge/barra colorida)
- Modo casal — cálculo completo:
  - Reserva emergência: (valor_atual / (despesas_mensais * 6)) * 25, max 25
  - Taxa poupança: (poupança_mensal / renda_total) * 100 → se >=20% = 20pts, proporcional abaixo
  - Endividamento: se dívidas < 30% renda = 20pts, proporcional acima
  - Alinhamento metas: (metas com contribuição no mês / total metas) * 15
  - Check-ins: se fez check-in no mês = 10pts, senão 0
  - Diversificação: se tem > 1 tipo de ativo = 10pts
- Modo solo — sem check-ins e sem alinhamento de metas (redistribuir pesos):
  - Reserva emergência: 30pts
  - Taxa poupança: 25pts
  - Endividamento: 25pts
  - Progresso das metas: 10pts
  - Diversificação: 10pts

#### Card 3: Próximas Contas (5 dias)
- Lista das próximas contas/dívidas a vencer
- Ícone de alerta se vence em 1 dia

#### Card 4: Metas Ativas
- Top 3 metas com barra de progresso (valor_atual / valor_alvo * 100%)
- Link "ver todas"

#### Card 5: Gastos por Categoria (mês atual)
- Gráfico de rosca (donut chart) com top 5 categorias
- Usar recharts
- Legenda com valor e % do total

#### Card 6: Evolução Mensal
- Gráfico de linhas: Receita vs Despesa vs Poupança (últimos 6 meses)
- Usar recharts

### Regras de Dados
#### Modo Casal:
- Aba "Meu": só transações do user logado (individuais + sua parte das compartilhadas)
- Aba "Nosso": todas as transações compartilhadas do casal
- Aba "Dele(a)": transações do parceiro que ele marcou como visíveis
  (transações "individual-privado" NÃO aparecem aqui)

#### Modo Solo:
- Todas as transações do user, sem filtro de escopo
- Campo "escopo" nem aparece nos formulários (tudo é INDIVIDUAL)
- Queries filtram por user_id, não por couple_id

### Navegação
- Sidebar (desktop) / Bottom tab bar (mobile) com:
  Dashboard | Transações | Orçamento | Metas | Dívidas | Relatórios | Config

### Performance
- Server components para dados estáticos
- Client components apenas para interatividade (toggle, gráficos)
- Loading skeletons em cada card
- Dados via React Query com cache de 5 min

### Regras Visuais (aplicar o Design System do Prompt 0)
- Layout: bg-primary como fundo, cards com bg-card + border + shadow-md + border-radius 16px
- Toggle "Meu/Nosso/Dele(a)": pills com border-radius 20px
  - "Meu" ativo = bg partner-a (teal) + text-inverse
  - "Nosso" ativo = bg partner-shared (lavender) + text branco
  - "Dele(a)" ativo = bg partner-b (terracotta) + text-inverse
  - Inativos = bg-tertiary + text-secondary
- Valores financeiros: font Fraunces, weight 700, italic
  - Positivos: cor success
  - Negativos: cor danger
- Score gauge: arco SVG com cor dinâmica (success >=70, warning >=40, danger <40)
- Barras de progresso: height 6px, border-radius 3px, bg-tertiary como trilho
  - Normal: brand-primary
  - Atenção (>70%): warning
  - Estourado (>100%): danger
- Gráficos recharts: usar cores brand-primary, brand-secondary, brand-accent
  - Tooltip com bg-card, border, shadow-sm, font DM Sans
- Loading skeleton: shimmer animation com bg-tertiary → bg-secondary
- Bottom tab bar (mobile): bg-card, shadow-lg invertido, ícones text-tertiary, 
  ativo = text-brand-primary
- Dark mode: usar todos os tokens dark. Manter calor visual.

Após gerar, valide:
- [ ] Toggle muda os dados de todos os cards?
- [ ] Score calcula corretamente com dados de exemplo?
- [ ] Gráficos renderizam sem erro com dados vazios?
- [ ] Layout responsivo funciona em 375px de largura?
```

---

## PROMPT 5 — REGISTRO DE TRANSAÇÕES + CATEGORIZAÇÃO INTELIGENTE
**Objetivo:** CRUD de transações com sistema anti-erro de categorização.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Sistema de registro de transações com categorização inteligente

### CONTEXTO DO PROBLEMA
A categorização imprecisa é o erro nº1 que invalida a gestão financeira.
Usuários colocam "iFood" como "mercado", misturam "conta fixa" com "emergência",
e jogam tudo em "outros". Relatórios viram ficção e o casal perde confiança no app.

Nosso sistema resolve isso com 6 estratégias anti-erro que devem ser implementadas
como parte integral do fluxo de transações, não como módulo separado.

---

### MODELO DE DADOS ADICIONAL

#### Tabela: MerchantRule (regras por estabelecimento)
- id: UUID
- couple_id: FK (nullable — regras globais têm couple_id null)
- keyword: string (ex: "ifood", "shell", "netflix", "uber", "drogaria")
- categoria_id: FK
- subcategoria_id: FK (nullable)
- source: enum (SISTEMA | USUARIO) — se foi criada pelo sistema ou corrigida pelo user
- hit_count: int (quantas vezes essa regra foi usada)
- created_at, updated_at

#### Tabela: Subcategory (subcategorias vinculadas a categorias)
- id: UUID
- categoria_id: FK
- nome: string
- icone: string
- ordem: int

#### Seed de subcategorias padrão:
- Alimentação → Mercado, Delivery, Restaurante, Padaria, Feira, Lanchonete
- Transporte → Combustível, App de corrida, Transporte público, Estacionamento, Manutenção
- Moradia → Aluguel, Condomínio, Luz, Água, Gás, Internet, Manutenção
- Saúde → Plano de saúde, Farmácia, Consulta, Exame, Academia
- Lazer → Streaming, Cinema, Viagem, Bar, Hobby, Jogos
- Educação → Mensalidade, Curso, Livro, Material
- Pessoal → Roupa, Beleza, Acessório, Presente

#### Seed de MerchantRules globais (source=SISTEMA):
- "ifood" | "rappi" | "zé delivery" → Alimentação > Delivery
- "uber" | "99" | "cabify" → Transporte > App de corrida
- "shell" | "ipiranga" | "br distribuidora" → Transporte > Combustível
- "netflix" | "spotify" | "disney" | "hbo" | "prime video" → Lazer > Streaming
- "drogaria" | "droga raia" | "drogasil" | "farmácia" → Saúde > Farmácia
- "carrefour" | "pão de açúcar" | "assaí" | "extra" → Alimentação > Mercado
- "enel" | "cpfl" | "light" | "energisa" → Moradia > Luz
- "sabesp" | "copasa" | "sanepar" → Moradia > Água
- "comgás" | "naturgy" → Moradia > Gás

---

### 6 ESTRATÉGIAS DE CATEGORIZAÇÃO INTELIGENTE

#### ESTRATÉGIA 1: Auto-categorização por estabelecimento
Quando o usuário digita a descrição da transação:
1. Normalizar texto (lowercase, remover acentos, trim)
2. Buscar match na tabela MerchantRule (primeiro couple_id do casal, depois globais)
3. Se encontrou match → preencher categoria e subcategoria automaticamente
4. Mostrar sugestão com badge "sugerido" e opção de alterar com 1 toque
5. Se o usuário aceitar, incrementar hit_count da regra

Lógica de matching:
- Exact match primeiro: "ifood" na descrição
- Partial match depois: "IFOOD*1234" contém "ifood"
- Usar: descricao.toLowerCase().includes(rule.keyword.toLowerCase())

Quando o usuário CORRIGE uma sugestão:
- Criar nova MerchantRule com source=USUARIO para aquele couple_id
- Na próxima vez, a regra do casal tem prioridade sobre a global
- Log: console.log("[CAT] Regra corrigida:", { keyword, categoriaAnterior, categoriaNova })

#### ESTRATÉGIA 2: Subcategorias com hierarquia clara
- Ao selecionar uma categoria, expandir as subcategorias abaixo (accordion)
- Subcategoria é OPCIONAL — se não selecionar, fica só a categoria-mãe
- Melhor categorizar como "Alimentação" genérico do que como "Outros" errado
- Subcategorias aparecem como chips/tags dentro do card da categoria
- O casal pode criar subcategorias personalizadas (max 10 por categoria)

#### ESTRATÉGIA 3: Eliminar a categoria "Outros"
- NÃO incluir "Outros" como categoria padrão
- Se o usuário tenta salvar sem categoria, mostrar:
  "Que tipo de gasto foi esse? Escolha a categoria que mais se aproxima,
  ou crie uma nova personalizada."
- Botão "Criar categoria" inline no seletor
- Nova categoria criada pelo casal recebe icone genérico editável

#### ESTRATÉGIA 4: Regras automáticas por palavra-chave
- No POST /api/transactions, ANTES de salvar:
  1. Rodar o matching da Estratégia 1
  2. Se não encontrou match e o usuário categorizou manualmente:
     extrair palavras-chave da descrição (ignorar artigos, preposições)
  3. Sugerir criar regra: "Sempre categorizar '[keyword]' como [categoria]?"
  4. Se aceitar → criar MerchantRule com source=USUARIO
  5. Se recusar → não criar, mas guardar a categorização manual

Regras do casal acumulam inteligência com o tempo:
- Após 3 transações com mesma keyword + mesma categoria manual → 
  sugerir automaticamente criar a regra
- Mensagem: "Você já categorizou '[keyword]' como [categoria] 3 vezes. 
  Quer que eu faça isso automaticamente?"

#### ESTRATÉGIA 5: Micro-revisão semanal
- Todo domingo às 20h (configurável), notificação:
  "Revisão rápida: 2 minutos para conferir suas transações da semana"
- Tela especial (/dashboard/transacoes/revisao):
  - Lista SOMENTE transações da semana que foram auto-categorizadas
  - Cada item mostra: descrição | valor | categoria sugerida
  - Ações por item: ✅ Confirmar | ✏️ Corrigir | (swipe)
  - Botão "Tudo certo" para confirmar todas de uma vez
  - Progresso: "5 de 12 conferidas"
- Transações confirmadas ganham flag reviewed=true
- Transações NÃO revisadas continuam funcionando, mas com badge sutil "não conferido"
- Gamificação leve: "Sequência: 4 semanas seguidas revisando!"

#### ESTRATÉGIA 6: Detecção de anomalias
- No POST /api/transactions, APÓS salvar:
  1. Calcular média e desvio padrão dos últimos 3 meses para aquela categoria
  2. Se valor da transação > média + 2x desvio padrão → marcar como anomalia
  3. Se soma do mês na categoria > 150% da média mensal → marcar categoria como anomalia
- Transações anômalas recebem badge "⚠️ verificar" na lista
- No dashboard, card de alerta: "O gasto em [categoria] está 40% acima do habitual. 
  Quer verificar as transações recentes?"
- Tom: curioso, não acusatório. "Algo diferente este mês?" em vez de "Vocês gastaram demais"

---

### API Routes

#### POST /api/transactions
Body: { valor, tipo (RECEITA|DESPESA), escopo (INDIVIDUAL|COMPARTILHADA),
categoria_id, subcategoria_id (nullable), descricao, data }
- Validação Zod
- Se escopo = COMPARTILHADA, associar couple_id da session
- ANTES de salvar: rodar matching de MerchantRule (Estratégia 1)
- APÓS salvar: rodar detecção de anomalia (Estratégia 6)
- Se keyword nova sem regra e categorização manual: sugerir criação de regra (Estratégia 4)
- Retornar: transação criada + { sugestao_regra?: boolean, anomalia?: boolean }

#### GET /api/transactions
Query params: ?mes=2026-04&escopo=todos&categoria=uuid&reviewed=false
- Filtros: mês, escopo, categoria, user, reviewed (para micro-revisão)
- Se pedindo dados do parceiro, excluir transações marcadas como privadas
- Paginação: limit + offset
- Ordenar por data DESC
- Incluir flag: anomalia, reviewed, sugestao_fonte (SISTEMA|USUARIO|MANUAL)

#### PUT /api/transactions/:id
- Só o dono pode editar
- Se categoria mudou: oferecer criação de MerchantRule
- Mesma validação do POST

#### DELETE /api/transactions/:id
- Só o dono pode deletar
- Soft delete (campo deleted_at)

#### GET /api/transactions/suggest-category
Query params: ?descricao=ifood+açaí
- Buscar match na MerchantRule
- Retornar: { categoria_id, subcategoria_id, confianca: "alta"|"media"|"nenhuma", fonte: "regra"|"historico" }
- Usar em tempo real enquanto o usuário digita a descrição (debounce 300ms)

#### GET /api/transactions/review
Query params: ?semana=2026-04-06
- Retornar transações da semana com auto-categorização não revisada
- Incluir: sugestao original, categoria aplicada, confiança

#### POST /api/transactions/review/confirm
Body: { transaction_ids: UUID[] }
- Marcar todas como reviewed=true em batch

#### CRUD /api/merchant-rules
- GET: listar regras do casal (para tela de configuração)
- POST: criar regra manual
- DELETE: remover regra (voltar a pedir categorização)

---

### Tela: Lista de Transações (/dashboard/transacoes)
- Lista com scroll infinito
- Cada item: ícone da categoria | descrição | valor | data | badge (Meu/Nosso)
- Badges adicionais:
  - 🤖 "auto" se categorizado por regra (tooltip: "Categorizado automaticamente")
  - ⚠️ "verificar" se anomalia detectada
  - 👁️ "não conferido" se reviewed=false (sutil, cor cinza)
- Filtros no topo: mês (seletor), escopo (toggle), categoria (dropdown)
- Filtro extra: "Pendentes de revisão" (atalho para micro-revisão)
- FAB (botão flutuante) "+" para nova transação

### Tela: Nova Transação (/dashboard/transacoes/nova)
- Modal ou tela dedicada (mobile-first)
- Campos (nesta ordem de interação):
  1. Valor (input numérico grande, destaque visual, foco automático)
  2. Tipo: toggle RECEITA (verde) / DESPESA (vermelho)
  3. Descrição: input texto livre
     → Enquanto digita (debounce 300ms), chamar GET /api/transactions/suggest-category
     → Se encontrou sugestão: preencher categoria automaticamente com badge "sugerido ✨"
     → Se não encontrou: categoria fica vazia para seleção manual
  4. Categoria: grid de ícones (scroll horizontal)
     → Se já preenchida pela sugestão, mostrar selecionada com opção de alterar
     → Ao selecionar, expandir subcategorias como chips abaixo (accordion)
     → Último item do grid: "+ Nova categoria"
  5. Subcategoria: chips horizontais (opcional)
  6. Escopo: toggle INDIVIDUAL / COMPARTILHADA
     → Modo solo: NÃO renderizar este toggle (tudo é INDIVIDUAL automaticamente)
     → Modo casal: mostrar toggle normalmente
  7. Data: date picker (default: hoje)
- Ao salvar:
  - Se descrição contém keyword nova (sem regra) e categoria foi manual:
    Toast sutil: "Sempre categorizar '[keyword]' como [categoria]? Sim / Não"
  - Fechar modal e atualizar lista com animação
  - Se anomalia detectada: toast informativo (não bloqueante)

### Tela: Micro-Revisão Semanal (/dashboard/transacoes/revisao)
- Acessível por: notificação semanal OU botão "Revisar" na lista de transações
- Layout: card stack (uma transação por vez, swipe ou botões)
- Cada card mostra:
  - Descrição + valor + data
  - Categoria aplicada (com badge da fonte: auto/manual)
  - Botões: ✅ Confirmar | ✏️ Corrigir categoria
  - Se corrigir: abrir seletor de categoria inline
- Ao corrigir: oferecer criação de MerchantRule
- Barra de progresso no topo: "5 de 12"
- Botão "Confirmar todas as restantes" (para quem confia na auto-categorização)
- Mensagem final: "Pronto! Suas transações da semana estão revisadas. 🎯"
- Se 4+ semanas seguidas revisando: "Sequência de 4 semanas! Seus relatórios agradecem."

### Tela: Configuração de Regras (/dashboard/config/regras)
- Acessível pelas configurações do casal
- Lista de MerchantRules do casal:
  - Keyword | Categoria | Subcategoria | Fonte (Sistema/Vocês) | Usos
  - Ações: editar categoria | excluir regra
- Botão "Adicionar regra manual"
- Info: "Essas regras categorizam automaticamente suas transações. 
  Quanto mais regras, menos trabalho manual."

---

### Lógica de Divisão
Quando transação é COMPARTILHADA:
- Buscar divisao_tipo do Couple
- Se PROPORCIONAL: calcular % de cada um baseado na renda
- Mostrar no detalhe da transação: "Sua parte: R$X | Parte dele(a): R$Y"
- No dashboard individual, mostrar apenas a "sua parte"

### Validações
- Valor > 0
- Categoria obrigatória (sem "Outros" como escape)
- Data não pode ser futura (máx: hoje)
- Descrição: max 200 caracteres, min 2 caracteres
- Subcategoria: opcional

### Métricas de Saúde da Categorização (para relatórios futuros)
Computar e armazenar mensalmente:
- % de transações auto-categorizadas (meta: >70% após 3 meses)
- % de transações revisadas na micro-revisão semanal
- % de correções na micro-revisão (indica qualidade da auto-categorização)
- Número de regras ativas do casal
- % de gasto em categorias genéricas vs específicas (subcategorias)

Expor no módulo de relatórios como:
"Neste mês, 78% das transações foram categorizadas automaticamente.
Vocês corrigiram apenas 3 de 45 sugestões — o sistema está aprendendo!"

---

### Logs de Debug (inserir nos pontos críticos)
- console.log("[TX] Criando transação:", body)
- console.log("[TX] Divisão calculada:", { parteA, parteB })
- console.log("[TX] Filtros aplicados:", filters)
- console.log("[CAT] Match encontrado:", { keyword, regra, confianca })
- console.log("[CAT] Sem match para:", descricao)
- console.log("[CAT] Regra criada pelo usuário:", { keyword, categoria })
- console.log("[CAT] Correção de sugestão:", { de: categoriaAnterior, para: categoriaNova })
- console.log("[ANOMALIA] Detectada:", { categoria, valor, media, desvio })
- console.log("[REVISAO] Batch confirmado:", { count, correcoes })
```

---

## PROMPT 6 — ORÇAMENTO INTELIGENTE
**Objetivo:** Definir limites por categoria com alertas.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Sistema de orçamento mensal

### Lógica de Negócio
O orçamento segue a regra 50/30/20 como sugestão inicial:
- 50% Necessidades: Moradia, Transporte, Alimentação, Saúde
- 30% Desejos: Lazer, Vestuário, Pets, Pessoal
- 20% Futuro: Investimentos, reserva, metas

O casal pode aceitar a sugestão ou personalizar cada valor.

### API Routes

#### POST /api/budgets/generate
- Recebe: mes_referencia
- Calcula renda total do casal no mês
- Gera sugestão 50/30/20 distribuída nas categorias
- Retorna array de { categoria_id, limite_sugerido }

#### PUT /api/budgets
- Body: array de { categoria_id, limite_mensal, mes_referencia }
- Upsert: cria ou atualiza o budget de cada categoria

#### GET /api/budgets?mes=2026-04
- Retorna budgets do mês com gasto atual computado
- Para cada categoria: { categoria, limite, gasto_atual, percentual, status }
- Status: NORMAL (<70%), ATENCAO (70-90%), CRITICO (90-100%), ESTOURADO (>100%)

### Tela: Orçamento (/dashboard/orcamento)

#### Seção 1: Resumo
- Barra de progresso geral: total gasto / total orçado
- Cards: "Necessidades X/Y" | "Desejos X/Y" | "Futuro X/Y"

#### Seção 2: Por Categoria
- Lista de categorias com:
  - Nome + ícone
  - Barra de progresso colorida (verde → amarelo → vermelho)
  - "R$ gasto / R$ limite"
  - Botão editar limite
- Ordenar: estouradas primeiro, depois por % consumido DESC

#### Seção 3: Dinheiro Livre
- Card especial: "Gasto pessoal sem justificativa"
- Cada parceiro tem um valor mensal que não precisa categorizar
- Configurável nas preferências do casal

### Notificações (lógica, não implementar push agora)
- 70% do limite: badge amarelo na categoria
- 90%: badge vermelho + mensagem no dashboard
- 100%: mensagem "O orçamento de [categoria] foi atingido. Querem realocar de outra categoria?"
  (tom colaborativo, sem culpa)

Após gerar, valide:
- [ ] Sugestão 50/30/20 soma 100% da renda?
- [ ] Barra de progresso reflete dados reais?
- [ ] Categorias sem orçamento definido aparecem como "sem limite"?
- [ ] Editar um limite atualiza a view imediatamente?
```

---

## PROMPT 7 — METAS E SONHOS
**Objetivo:** CRUD de metas com simulador e celebração.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Sistema de metas financeiras do casal

### API Routes

#### POST /api/goals
Body: { nome, valor_alvo, prazo (date), tipo (enum), contribuicao_a, contribuicao_b }
- contribuicao_a e _b = valor mensal que cada um pretende aportar
- Calcular: meses_restantes, valor_mensal_necessario

#### GET /api/goals
- Listar todas as metas do casal
- Incluir: progresso (%), valor_faltante, projecao_conclusao
- Ordenar por prioridade e prazo

#### POST /api/goals/:id/contribute
Body: { user_id, valor }
- Criar GoalContribution
- Atualizar goal.valor_atual += valor
- Se valor_atual >= valor_alvo → marcar status = ATINGIDA

### Tela: Metas (/dashboard/metas)

#### Lista de Metas
- Card por meta com:
  - Ícone do tipo (🏠 Imóvel, ✈️ Viagem, 🚗 Carro, etc.)
  - Nome
  - Barra de progresso: "R$ atual / R$ alvo (X%)"
  - Contribuição de cada parceiro (mini barras lado a lado)
  - Projeção: "No ritmo atual, vocês atingem em [data]"
  - Botão "Contribuir"

#### Modal: Nova Meta
- Nome (texto livre)
- Tipo (select com ícones)
- Valor alvo (input numérico)
- Prazo (date picker)
- Contribuição mensal de cada um (2 inputs lado a lado)
- Simulador ao vivo: conforme preenche, mostra "Vocês atingem em X meses"

#### Celebração
Quando uma meta é atingida:
- Animação de confete (usar canvas-confetti ou CSS)
- Mensagem: "🎉 Vocês conquistaram [nome da meta]! O trabalho em equipe valeu a pena!"
- Card da meta muda para estado "Conquistada" com selo visual
- Registrar no histórico de conquistas do casal

### Regras Visuais (aplicar o Design System do Prompt 0)
- Cards de meta: bg com gradiente sutil (brand-primary-light → brand-secondary-light)
  + border + border-radius 16px
- Ícones de tipo: emoji grande (24px) em círculo bg-brand-primary-light
- Barra de progresso da meta: gradiente brand-primary → brand-accent conforme avança
- Contribuição por parceiro: mini barras lado a lado, partner-a (teal) + partner-b (terracotta)
- Slider do simulador: track bg-tertiary, thumb brand-primary, valor em Fraunces italic
- Celebração: fundo com gradiente sutil brand-accent (15% opacity) + brand-primary (15%),
  border brand-accent (30% opacity), emoji 🎉 grande, título em Fraunces italic + cor brand-accent
- Meta vencida não atingida: border danger, badge warning
- Valores financeiros: Fraunces 700 italic, cor brand-primary

### Simulador de Cenários
Dentro do detalhe da meta, permitir simular:
- "Se vocês aumentarem R$100/mês, atingem X meses antes"
- "Se vocês reduzirem para R$Y/mês, o prazo estica para Z meses"
- Slider interativo que recalcula em tempo real

Após gerar, valide:
- [ ] Projeção calcula corretamente com valores de exemplo?
- [ ] Celebração dispara apenas 1 vez ao atingir a meta?
- [ ] Simulador atualiza em tempo real ao mover slider?
- [ ] Meta com prazo vencido e não atingida mostra alerta?
```

---

## PROMPT 8 — DÍVIDAS E COMPROMISSOS
**Objetivo:** Gestão de dívidas com estratégias de quitação.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Módulo de gestão de dívidas

### API Routes

#### CRUD padrão /api/debts (POST, GET, PUT, DELETE)
Campos: nome, valor_total, valor_restante, parcelas_total, parcelas_pagas,
taxa_juros_mensal, dia_vencimento, escopo (INDIVIDUAL|COMPARTILHADA)

#### GET /api/debts/strategy
- Recebe: valor_extra_mensal (quanto o casal pode pagar a mais por mês)
- Retorna 2 simulações:
  a) Avalanche: ordena por maior taxa de juros primeiro
  b) Bola de neve: ordena por menor saldo devedor primeiro
- Para cada: { ordem_de_quitacao[], economia_total_juros, meses_para_quitar }

#### POST /api/debts/:id/pay
Body: { valor_pago, data }
- Atualiza valor_restante e parcelas_pagas
- Se valor_restante <= 0, marcar como QUITADA

### Tela: Dívidas (/dashboard/dividas)

#### Resumo
- Total de dívidas do casal
- Comprometimento: total de parcelas / renda mensal (%)
- Alerta se > 30% da renda comprometida

#### Lista
- Card por dívida: nome, valor restante, parcela mensal, progresso (parcelas pagas/total)
- Badge: Individual ou Compartilhada
- Cor do card muda conforme taxa de juros (vermelho = alto)

#### Simulador de Antecipação
- Input: "Quanto a mais vocês podem pagar por mês?"
- Exibe lado a lado: Avalanche vs Bola de Neve
- Para cada: ordem de quitação, economia de juros, meses economizados
- Botão "Adotar esta estratégia" → define a ordem de prioridade

#### Alertas
- 3 dias antes do vencimento: lembrete
- 1 dia antes: lembrete urgente
- No dia: "Hoje vence [dívida]. Valor: R$X"

Após gerar, valide:
- [ ] Simulação avalanche realmente ordena por maior juros?
- [ ] Simulação bola de neve ordena por menor saldo?
- [ ] Economia de juros calculada é realista?
- [ ] Dívida quitada sai da lista ativa e vai pro histórico?
```

---

## PROMPT 9 — CHECK-IN MENSAL (CASAL) / REVISÃO MENSAL (SOLO)
**Objetivo:** Sessão guiada mensal — colaborativa em casal, individual no modo solo.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Check-in financeiro mensal guiado

### Conceito
Uma vez por mês (dia configurável), o sistema conduz uma revisão
de 15 minutos. O tom é SEMPRE positivo e colaborativo.
Nunca acusatório. Nunca "vocês gastaram demais". Sempre "o gasto ficou
acima do planejado — quer ajustar?"

O fluxo adapta-se automaticamente ao modo da conta:
- **Modo Casal**: check-in de casal completo (5 etapas, ambos participam)
- **Modo Solo**: revisão individual simplificada (4 etapas, sem sentimento lado a lado)

### Fluxo (/dashboard/checkin)

#### Etapa 1/5: Revisão do Mês
- Mostrar: receita total, despesa total, saldo
- Top 3 categorias que mais gastaram vs orçado
- Categorias que ficaram abaixo do orçamento (celebrar!)
- Frase: "Esse mês, vocês ficaram [dentro/fora] do orçamento em X de Y categorias"

#### Etapa 2/5: Celebração
- Metas que avançaram no mês (mostrar progresso)
- Dívidas que tiveram parcela paga
- Qualquer conquista: "Vocês pouparam R$X este mês!" ou 
  "A meta [nome] avançou Y%!"
- Se não houver conquista: "Todo mês é uma chance de recomeçar. 
  Vamos planejar o próximo?"

#### Etapa 3/5: Ajustes
- Para cada categoria estourada: 
  "O orçamento de [cat] ficou R$X acima. Opções:
   a) Aumentar o limite (realocando de outra categoria)
   b) Reduzir gastos nessa categoria no próximo mês
   c) Manter como está (foi um mês atípico)"
- Interface de arrastar valor entre categorias (opcional, pode ser inputs)

#### Etapa 4/5: Sonhos
- Progresso visual de cada meta ativa
- Simulação: "No ritmo atual, [meta] será atingida em [data]"
- Pergunta: "Querem ajustar a contribuição de alguma meta?"

#### Etapa 5/5: Sentimento
- Cada parceiro responde individualmente (sem ver a resposta do outro até ambos responderem):
  "De 1 a 5, como você se sente sobre as finanças do casal este mês?"
  1 ⭐ Preocupado → 5 ⭐⭐⭐⭐⭐ Tranquilo
- Após ambos responderem, mostrar lado a lado
- Se diferença >= 2 pontos: "Parece que vocês estão em momentos diferentes.
  Que tal conversar sobre o que está preocupando?"
- Salvar no CheckIn (resumo_json + sentimentos)

### API

#### POST /api/checkins
- Gera o check-in do mês com dados computados
- Salva resumo em JSON (para histórico)

#### GET /api/checkins
- Histórico de check-ins com sentimentos ao longo do tempo
- Gráfico de evolução dos sentimentos (linha dupla, um por parceiro)

### Regra
#### Modo Casal:
- Check-in só pode ser feito quando ambos os parceiros estão online/disponíveis
- Se um já respondeu, aguardar o outro antes de mostrar resultado final
- Nunca mostrar ranking de quem gastou mais/menos

#### Modo Solo:
- Revisão mensal individual — mesmas etapas de revisão, ajuste e sonhos
- Etapa de Sentimento: só 1 resposta (sem lado a lado)
  - "De 1 a 5, como você se sente sobre suas finanças este mês?"
- Sem referências a parceiro, sem "vocês" — usar "você"
- Linguagem adaptada: "O gasto ficou acima do planejado — quer ajustar?"
  em vez de "Querem ajustar?"

### Regras Visuais (aplicar o Design System do Prompt 0)
- Wizard: fundo bg-primary, card central bg-card, border-radius 16px, shadow-lg
- Stepper no topo: 5 dots, ativo = brand-primary, inativo = bg-tertiary
- Etapa de Celebração: fundo gradiente sutil gold, tom festivo
- Etapa de Sentimento: estrelas usando brand-accent (gold), tamanho touch-friendly (44px)
  - Resultado lado a lado: barra partner-a (teal) e partner-b (terracotta)
  - Se diferença >=2: card com bg warning-light + border warning, tom acolhedor
- Botões de navegação: "Anterior" outline brand-primary, "Próximo" filled brand-primary
- Categorias estouradas: card bg danger-light, border danger sutil
- Gráfico de sentimentos (histórico): recharts com linhas partner-a e partner-b

Após gerar, valide:
- [ ] Etapas funcionam como wizard (próximo/anterior)?
- [ ] Sentimentos ficam ocultos até ambos responderem?
- [ ] Frases são colaborativas e nunca acusatórias?
- [ ] Check-in é salvo e aparece no histórico?
```

---

## PROMPT 10 — RELATÓRIOS E INSIGHTS
**Objetivo:** Relatórios visuais + insights inteligentes.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Módulo de relatórios e insights

### Tela: Relatórios (/dashboard/relatorios)

#### Relatório 1: Mensal
- Período: seletor de mês
- Receitas vs Despesas (barras lado a lado)
- Gastos por categoria (donut chart)
- Comparativo com mês anterior: "Vocês gastaram X% [mais/menos] que em [mês anterior]"
- Top 5 maiores gastos individuais

#### Relatório 2: Evolução (6-12 meses)
- Gráfico de linhas: Receita, Despesa, Poupança ao longo do tempo
- Patrimônio líquido ao longo do tempo
- Evolução do score de saúde financeira

#### Relatório 3: Divisão do Casal
- Quanto cada parceiro contribuiu vs quanto deveria (proporcional)
- Saldo entre parceiros: "A pagou R$X a mais de despesas compartilhadas"
- Botão "Acertar contas" (informativo, não faz transação bancária)

### Insights com IA (lógica baseada em regras, não precisa de LLM)
Gerar insights automáticos baseados em padrões:

- Se delivery > 30% de Alimentação: "Vocês gastaram X% em delivery. 
  Cozinhar 2x por semana poderia economizar ~R$Y/mês"
- Se assinaturas > R$200: "Vocês têm R$X em assinaturas mensais. 
  Todas estão sendo usadas?"
- Se poupança = 0: "Este mês não sobrou para poupança. 
  Que tal revisar [categoria com maior gasto]?"
- Se gasto com Lazer caiu 50%+: "O gasto com lazer diminuiu bastante. 
  Lembrem-se: equilíbrio é importante para o bem-estar do casal"
- Se meta está à frente do cronograma: "A meta [nome] está acelerada! 
  Vocês podem atingi-la X meses antes do previsto"

### Regras
- Insights são sugestões, nunca ordens
- Máximo 3 insights por mês (não sobrecarregar)
- Tom: curioso e encorajador, nunca crítico
- Todos os gráficos devem funcionar com dados vazios (mostrar estado vazio bonito)
- Usar recharts para todos os gráficos

Após gerar, valide:
- [ ] Relatórios carregam com dados de exemplo?
- [ ] Gráficos renderizam corretamente em mobile?
- [ ] Insights fazem sentido com os dados mockados?
- [ ] Comparativo mês a mês calcula diferença corretamente?
```

---

## PROMPT 11 — EDUCAÇÃO FINANCEIRA
**Objetivo:** Trilha de conteúdo personalizada ao perfil do casal.
**Chat:** Novo (ou integrar ao dashboard)

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Módulo de educação financeira

### Conceito
Cards curtos (2 min de leitura) desbloqueados progressivamente conforme o
casal avança no uso do sistema. Não é um blog — é uma trilha contextual.

### Estrutura de Conteúdo

#### Nível 1 — Fundamentos (desbloqueado no cadastro)
- "O que é o 50/30/20 e por que funciona"
- "3 tipos de conta do casal: tudo junto, tudo separado, ou híbrido"
- "O que é reserva de emergência e quanto vocês precisam"

#### Nível 2 — Após 1 mês de uso
- "Como ler seus relatórios e tomar decisões"
- "Perfis financeiros: como a combinação de vocês afeta as finanças"
- "Dívidas: avalanche vs bola de neve, qual escolher?"

#### Nível 3 — Após 3 meses de uso
- "Investimentos para iniciantes: CDB, Tesouro, Fundos"
- "Regime de bens: como ele afeta suas finanças"
- "Planejamento para filhos: quanto custa e como se preparar"

#### Nível 4 — Após 6 meses de uso
- "Aposentadoria: comece agora, agradeça depois"
- "Proteção patrimonial: seguros que vocês precisam"
- "Independência financeira: o que é e como planejar"

### Implementação
- Modelo: EducationCard { id, titulo, conteudo_md, nivel, ordem, icone }
- Seed com todos os cards pré-escritos
- Seção no dashboard: "Aprender" com cards disponíveis
- Card lido = marcado como concluído por cada parceiro individualmente
- Progresso da trilha: barra "X de Y concluídos"

### Regras
- Conteúdo desbloqueado por tempo de uso, não por pagamento
- Cada card é autocontido (não depende de outro)
- Linguagem simples, sem jargão financeiro desnecessário
- Se usar um termo técnico, explicar entre parênteses
- Tom: mentor amigável, não professor
```

---

## PROMPT 12 — CARTÃO DE CRÉDITO + PARCELAS
**Objetivo:** Gestão completa de cartões de crédito, compras parceladas, fatura e comprometimento futuro.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Módulo de cartão de crédito com controle de parcelas

### CONTEXTO DO PROBLEMA
O cartão de crédito é o principal vilão financeiro dos casais brasileiros.
Os apps concorrentes falham porque: (1) não mostram comprometimento futuro
com parcelas, (2) não consolidam múltiplos cartões, (3) não distinguem
fatura aberta de fechada, (4) não simulam impacto de novo parcelamento,
(5) não dividem gastos de cartão adicional entre parceiros.

Nosso sistema resolve tudo isso, respeitando a regra de planos:
- FREE: 1 cartão de crédito por casal, sem cartão adicional
- PREMIUM: cartões ilimitados + cartão adicional com divisão automática

---

### MODELO DE DADOS (já definido no schema, referência rápida)

#### CreditCard
- id, couple_id (FK), user_id (FK — dono)
- apelido (ex: "Nubank Ana"), bandeira (enum), ultimos_4_digitos
- limite_total (decimal), dia_fechamento (int 1-31), dia_vencimento (int 1-31)
- cor_hex (string — personalização visual do card)
- ativo (boolean)
- is_adicional (boolean — PREMIUM only)
- adicional_user_id (FK nullable — parceiro que usa o adicional, PREMIUM only)

#### Installment (Parcelamento)
- id, credit_card_id (FK), user_id (FK), couple_id (FK nullable)
- descricao, valor_total, valor_parcela, parcelas_total, parcelas_pagas
- categoria_id (FK), escopo (INDIVIDUAL | COMPARTILHADA)
- data_compra, primeira_parcela_mes (date)

#### Subscription (Assinatura Recorrente — PREMIUM)
- id, credit_card_id (FK nullable), couple_id (FK)
- nome, valor, categoria_id (FK), frequencia (MENSAL | ANUAL)
- user_id (FK), ativa (boolean), detectada_auto (boolean)

---

### CONCEITOS FINANCEIROS IMPORTANTES (implementar na lógica)

#### Ciclo de Fatura
- O cartão tem dia_fechamento (ex: dia 10) e dia_vencimento (ex: dia 17)
- Fatura FECHADA: período já encerrado, valor fixo, deve ser paga
- Fatura ABERTA: período atual, valor vai crescendo conforme novas compras
- Compra feita ANTES do fechamento → entra na fatura atual
- Compra feita APÓS o fechamento → entra na fatura do MÊS SEGUINTE

Implementar função: getInvoicePeriod(card, date) → {
  fatura_atual: { inicio, fim, status: ABERTA|FECHADA },
  fatura_anterior: { inicio, fim, vencimento, status: FECHADA },
  proxima_fatura: { inicio, fim, vencimento }
}

#### Melhor Data de Compra
- A melhor data é 1 dia APÓS o fechamento → dá ~40 dias para pagar
- A pior data é 1 dia ANTES do fechamento → dá ~10 dias para pagar
- Calcular: diasParaPagar = (dia_vencimento_proximo - hoje)
  Se compra após fechamento: diasParaPagar += 30 (aproximado)

#### Parcelas e Comprometimento Futuro
- Cada Installment gera N parcelas ao longo de N meses
- A parcela 1 entra na fatura do mês seguinte à compra (ou do mês atual, 
  dependendo de se a compra foi antes ou depois do fechamento)
- O sistema deve projetar TODOS os meses futuros que têm parcelas ativas
- Comprometimento = soma de todas as parcelas futuras do mês / renda mensal

---

### API Routes

#### CRUD /api/credit-cards

##### POST /api/credit-cards
Body: { apelido, bandeira, ultimos_4_digitos, limite_total, 
dia_fechamento, dia_vencimento, cor_hex }
- ANTES de criar: verificar plano do casal
  - Se FREE e já existe 1 cartão → retornar 403 com 
    { error: "PLAN_LIMIT", message: "Plano Free permite 1 cartão", upgrade: true }
  - Se FREE e is_adicional=true → retornar 403 com 
    { error: "PREMIUM_FEATURE", message: "Cartão adicional é Premium" }
- Validações: dia_fechamento e dia_vencimento entre 1-31
- Retornar cartão criado

##### GET /api/credit-cards
- Listar todos os cartões ativos do casal
- Incluir em cada: { limite_usado_atual, fatura_aberta_valor, 
  fatura_fechada_valor, fatura_fechada_vencimento, total_parcelas_futuras }

##### PUT /api/credit-cards/:id
- Só o dono pode editar
- Atualizar campos editáveis (apelido, limite, dias, cor)

##### DELETE /api/credit-cards/:id
- Soft delete (ativo = false)
- Manter histórico de transações e parcelas

#### Faturas /api/credit-cards/:id/invoices

##### GET /api/credit-cards/:id/invoices?mes=2026-04
- Retornar fatura do mês especificado:
  { status (ABERTA|FECHADA|PAGA), periodo_inicio, periodo_fim,
    vencimento, total, transacoes[], parcelas_ativas[] }
- Transações: lista de compras à vista do período
- Parcelas ativas: lista de Installments que têm parcela caindo nesse mês
  (com campo parcela_numero: "3 de 10")
- Se cartão adicional (PREMIUM): incluir campo gasto_titular e gasto_adicional

##### GET /api/credit-cards/:id/invoices/timeline
- Retornar próximos 12 meses com valor projetado da fatura de cada mês
- Considerar: parcelas futuras + recorrências estimadas (média dos últimos 3 meses)
- Formato: [{ mes: "2026-05", parcelas: 1200, estimativa_compras: 800, total: 2000 }, ...]

#### Parcelamentos /api/installments

##### POST /api/installments
Body: { credit_card_id, descricao, valor_total, parcelas_total,
categoria_id, escopo, data_compra }
- Calcular valor_parcela = valor_total / parcelas_total (arredondamento na última)
- Determinar primeira_parcela_mes baseado em data_compra vs dia_fechamento:
  Se data_compra <= dia_fechamento → primeira parcela = mês atual
  Se data_compra > dia_fechamento → primeira parcela = mês seguinte
- Criar Transaction para cada parcela (tipo DESPESA, com installment_id)
  - Descrição: "[desc] (parcela N/total)"
  - Data: dia do vencimento do cartão no mês correspondente
  - Marcar como credit_card_id para vincular ao cartão
- ANTES de criar: rodar simulação de impacto (ver Simulador abaixo)

##### GET /api/installments?status=ATIVO
- Listar parcelamentos ativos do casal
- Incluir: parcelas_restantes, valor_restante, projecao_fim

##### DELETE /api/installments/:id
- Quitar antecipadamente: marcar parcelas restantes como pagas
- Recalcular comprometimento futuro

#### Comprometimento /api/credit-cards/commitment

##### GET /api/credit-cards/commitment
- Retornar visão consolidada de TODOS os cartões do casal:
  { limite_total_casal, limite_usado_casal, limite_disponivel_casal,
    comprometimento_percentual (parcelas_mensal / renda),
    parcelas_mensal_atual, parcelas_por_mes: [próximos 12 meses],
    alerta: string|null }
- Alerta se comprometimento > 30%: "Atenção: X% da renda está comprometida 
  com parcelas de cartão"
- Alerta se comprometimento > 50%: "Cuidado: mais da metade da renda está 
  comprometida. Evitem novos parcelamentos"

#### Simulador /api/installments/simulate

##### POST /api/installments/simulate
Body: { valor_total, parcelas_total, credit_card_id }
- NÃO cria nada — apenas simula
- Retornar: {
    valor_parcela,
    comprometimento_atual: { valor, percentual },
    comprometimento_com_nova: { valor, percentual },
    impacto_por_mes: [{ mes, parcelas_atuais, nova_parcela, total }],
    alerta: string|null,
    melhor_data_compra: date,
    primeira_parcela_em: string (ex: "fatura de Junho/2026")
  }

#### Assinaturas /api/subscriptions (PREMIUM)

##### GET /api/subscriptions
- Listar assinaturas detectadas + cadastradas manualmente
- Total mensal: soma de todas as assinaturas ativas

##### POST /api/subscriptions/detect
- Analisar transações dos últimos 3 meses
- Identificar padrão: mesma descrição/merchant + mesmo valor + frequência mensal
- Retornar sugestões: [{ nome, valor, frequencia, confianca, transacoes_ids }]
- Usuário confirma quais são assinaturas reais

---

### TELAS

#### Tela: Lista de Cartões (/dashboard/cartoes)

##### Header
- Consolidado do casal:
  - "Limite total: R$ X | Usado: R$ Y | Disponível: R$ Z"
  - Barra de uso do limite (brand-primary, warning >70%, danger >90%)
  - Comprometimento mensal com parcelas: "R$ X/mês (Y% da renda)"

##### Cards dos Cartões
- Cada cartão renderizado como um "cartão de crédito" visual:
  - Cor personalizada (cor_hex do cadastro)
  - Bandeira (ícone), apelido, últimos 4 dígitos
  - Fatura aberta: "R$ X acumulado" (text-secondary)
  - Fatura fechada (se houver): "R$ Y vence dia Z" (text-primary, bold)
  - Mini barra de limite
  - Se is_adicional: badge "Adicional" com ícone de 2 pessoas
- Botão "+" para adicionar cartão
  - Se FREE e já tem 1: mostrar modal de upgrade Premium
  - Se FREE: desabilitar toggle "cartão adicional" com badge Premium

##### Comprometimento Futuro (Mapa de Calor)
- Grid horizontal com próximos 6 meses
- Cada mês mostra: valor projetado da fatura + cor (verde/amarelo/vermelho)
- Baseado em: parcelas ativas + estimativa de compras recorrentes
- Tom: "Nos próximos 6 meses, vocês já têm R$ X comprometido em parcelas"

#### Tela: Detalhe do Cartão (/dashboard/cartoes/:id)

##### Aba: Fatura Atual
- Status: ABERTA (período em andamento) ou FECHADA (aguardando pagamento)
- Lista de transações do período, agrupadas por data
- Cada transação: descrição, valor, categoria, badge auto/manual
- Se parcelada: "(parcela N de X)"
- Subtotal: compras à vista + parcelas do mês
- Se cartão adicional (PREMIUM): toggle "Todos | Titular | Adicional"
  com divisão visual por parceiro (teal / terracotta)

##### Aba: Parcelas Ativas
- Lista de parcelamentos em andamento nesse cartão
- Cada item: descrição, valor total, parcela atual (ex: "5 de 12"),
  valor parcela, término previsto
- Barra de progresso: parcelas pagas / total
- Botão "Quitar antecipado" (simula economia de tempo)

##### Aba: Timeline (12 meses)
- Gráfico de barras horizontais (recharts) com próximos 12 meses
- Cada barra dividida em: parcelas (brand-secondary) + estimativa (brand-primary-muted)
- Linha de referência: renda mensal (tracejada)
- Destaque visual se barra > 30% da renda

##### Aba: Assinaturas (PREMIUM)
- Lista de assinaturas vinculadas ao cartão
- Cada item: nome, valor, frequência, badge "detectada" ou "manual"
- Total mensal
- Botão "Detectar assinaturas" → roda /api/subscriptions/detect
- Pergunta: "Todas essas assinaturas estão sendo usadas?"

#### Tela: Novo Parcelamento (/dashboard/cartoes/:id/parcelar)
- Modal ou tela dedicada
- Campos:
  1. Descrição (texto)
  2. Valor total (input grande, Fraunces italic)
  3. Número de parcelas (seletor: 2x, 3x, 4x, 6x, 8x, 10x, 12x)
  4. Categoria (grid de ícones, com auto-sugestão pela descrição)
  5. Escopo: Individual / Compartilhada
  6. Data da compra (default: hoje)

- **Simulação em tempo real** (atualiza conforme preenche):
  - Card de simulação abaixo dos campos:
    - "Parcela: R$ X/mês durante Y meses"
    - "Primeira parcela na fatura de [mês/ano]"
    - "Última parcela: [mês/ano]"
    - Barra de comprometimento: antes vs depois
      - "Hoje: R$ A/mês (B%)" → "Com essa compra: R$ C/mês (D%)"
      - Cor muda: verde (<30%), amarelo (30-50%), vermelho (>50%)
    - Se comprometimento passa de 30%: alerta amarelo
    - Se passa de 50%: alerta vermelho com frase:
      "Essa compra elevaria o comprometimento para X%. 
      Considere reduzir o número de parcelas ou aguardar para comprar."
    - Melhor data de compra: "Comprando após dia [fechamento], 
      a primeira parcela só entra em [mês]. Faltam N dias."

- Botão "Confirmar" (só se simulação foi vista — prevenir compra impulsiva)

#### Tela: Cadastro de Cartão (/dashboard/cartoes/novo)
- Formulário com preview visual do cartão sendo montado em tempo real
- Campos:
  1. Apelido (ex: "Nubank Ana")
  2. Bandeira (select com ícones das bandeiras)
  3. Últimos 4 dígitos
  4. Limite total
  5. Dia de fechamento (select 1-31)
  6. Dia de vencimento (select 1-31)
  7. Cor do cartão (color picker com 8 opções predefinidas)
  8. É cartão adicional? (toggle — PREMIUM only)
     - Se sim: "Quem usa o adicional?" (select com parceiro)
     - Se FREE: toggle desabilitado + badge "Premium" + tooltip

- Preview: renderiza o cartão visual ao lado/acima enquanto preenche

#### Componente: Card de Melhor Data de Compra (no Dashboard principal)
- Pequeno card informativo no dashboard:
  "Seu cartão [apelido] fecha dia [X]. 
  Compras feitas a partir de amanhã só entram na fatura de [mês]."
- Ou: "Faltam [N] dias para o fechamento. Compras feitas hoje 
  entram na fatura com vencimento em [data]."
- Atualiza diariamente
- Se múltiplos cartões (PREMIUM): mostrar o mais relevante 
  (o que fecha mais próximo)

---

### LÓGICA DE CARTÃO ADICIONAL (PREMIUM)

Quando o cartão tem is_adicional = true e adicional_user_id definido:
- Toda Transaction nesse cartão deve registrar qual user fez a compra
- Na fatura, separar gastos: "Titular: R$ X | Adicional: R$ Y"
- A divisão respeita a regra de divisão do casal (proporcional/igualitária/fixa)
- Se a compra do adicional é compartilhada (ex: mercado), 
  segue a divisão normal
- Se é individual (ex: roupa pessoal), vai 100% para quem comprou
- No relatório: "Neste mês, [parceiro A] usou R$ X do cartão 
  e [parceiro B] usou R$ Y"

---

### INTEGRAÇÃO COM MÓDULOS EXISTENTES

#### Dashboard (Prompt 4)
- Novo card: "Cartão de Crédito" com:
  - Próxima fatura a vencer: cartão, valor, data
  - Comprometimento mensal com parcelas
  - Mini mapa de calor (3 meses)
  - Link "Ver cartões"

#### Transações (Prompt 5)
- Ao registrar transação, novo toggle: "Paguei com cartão"
  - Se sim: selecionar cartão + opção de parcelar
  - Transação vinculada ao credit_card_id
  - Entra na fatura correta conforme ciclo

#### Orçamento (Prompt 6)
- Parcelas de cartão devem contar como despesa no orçamento
  da categoria correspondente
- Alerta: "R$ X do orçamento de [categoria] são parcelas do cartão"

#### Check-in (Prompt 9)
- Nova etapa opcional: Revisão de Cartões
  - "Vocês têm R$ X comprometido em parcelas pelos próximos Y meses"
  - "A fatura de [mês] será de ~R$ Z"
  - "Alguma assinatura pode ser cancelada?" (PREMIUM)

#### Relatórios (Prompt 10)
- Novo relatório: "Cartão de Crédito"
  - Evolução da fatura mês a mês
  - Parcelas ativas vs quitadas
  - Comprometimento futuro (timeline 12 meses)
  - Se adicional (PREMIUM): divisão de uso por parceiro

---

### REGRAS VISUAIS (aplicar o Design System do Prompt 0)

- Card do cartão: renderizado como cartão real com cantos arredondados (16px),
  cor personalizada, bandeira, apelido e últimos 4 dígitos
  - Em Fraunces italic: valor da fatura atual
  - Badge "Adicional" em partner-shared (lavender) se is_adicional
- Mapa de calor de comprometimento: grid de cards mini
  - Verde (success): < 30% da renda
  - Amarelo (warning): 30-50%
  - Vermelho (danger): > 50%
- Simulador de parcelamento: card com borda esquerda colorida
  - Verde se comprometimento OK, vermelho se perigoso
  - Barra "antes vs depois" com animação de transição
- Timeline de faturas: gráfico de barras recharts
  - Parcelas: brand-secondary (terracotta)
  - Estimativa: brand-primary-muted
  - Linha de renda: tracejada text-tertiary
- Funcionalidades Premium: mostrar com badge dourado (brand-accent)
  - Ao clicar: modal com fundo gradiente brand-accent (10% opacity)
  - CTA: botão brand-accent com "Desbloquear Premium"
  - Preview do que o casal teria acesso (cards com blur + ícone cadeado)

---

### LOGS DE DEBUG
- console.log("[CC] Criando cartão:", { coupleId, plano, totalCartoes })
- console.log("[CC] Plano FREE - limite atingido:", { coupleId })
- console.log("[CC] Fatura calculada:", { cardId, periodo, total })
- console.log("[CC] Ciclo de fatura:", { fechamento, vencimento, status })
- console.log("[PARCELA] Criando parcelamento:", { valorTotal, parcelas, primeiraParcela })
- console.log("[PARCELA] Simulação:", { comprometimentoAtual, comprometimentoNovo })
- console.log("[PARCELA] Transactions geradas:", { count, mesesAfetados })
- console.log("[ASSINATURA] Detectadas:", { count, totalMensal })

---

### VALIDAÇÕES E CHECKLIST

Após gerar, valide:
- [ ] FREE permite exatamente 1 cartão? Tentar criar 2º retorna 403?
- [ ] FREE bloqueia cartão adicional com mensagem clara?
- [ ] Funcionalidades Premium mostram preview + CTA de upgrade (nunca bloqueio silencioso)?
- [ ] Ciclo de fatura calcula corretamente: compra antes/depois do fechamento?
- [ ] Parcelas geram Transactions nos meses corretos?
- [ ] Simulador mostra comprometimento antes vs depois em tempo real?
- [ ] Timeline 12 meses projeta parcelas futuras corretamente?
- [ ] Melhor data de compra calcula dias corretamente?
- [ ] Comprometimento > 30% gera alerta amarelo?
- [ ] Comprometimento > 50% gera alerta vermelho?
- [ ] Quitar antecipado remove parcelas futuras do comprometimento?
- [ ] Cartão adicional (PREMIUM) divide gastos por titular vs adicional?
- [ ] Transações de cartão aparecem na categoria correta do orçamento?
- [ ] Card de cartão visual renderiza com cor customizada e bandeira?
- [ ] Dark mode: cards de cartão mantêm contraste adequado com cores personalizadas?
```

---

## PROMPT 13 — IMPORTAÇÃO DE FATURAS DE CARTÃO
**Objetivo:** Importar transações de faturas via OFX/CSV (Free), notificações push (Free/Android), e Open Finance (Premium).
**Chat:** Novo (depende do Prompt 12)

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Sistema de importação de faturas de cartão de crédito

### CONTEXTO DO PROBLEMA
Registrar transações manualmente é o principal motivo de abandono dos apps
financeiros. Pesquisas mostram que tarefas que exigem mais de 30 segundos
para serem iniciadas têm 73% menos chance de serem completadas.

Nosso sistema oferece 3 camadas de importação, do manual ao automático:

| Método                    | Plano   | Plataforma      | Automação |
|---------------------------|---------|-----------------|-----------|
| Upload OFX/CSV            | FREE    | Web + Mobile    | Semi      |
| Notificações push         | FREE    | Android only    | Alta      |
| Open Finance (Belvo)      | PREMIUM | Web + Mobile    | Total     |

Todas as camadas convergem para o mesmo destino: Transactions no banco,
vinculadas ao CreditCard correspondente, com categorização via MerchantRules.

---

### CAMADA 1: UPLOAD DE ARQUIVO OFX/CSV (FREE)

#### Conceito
O usuário baixa a fatura do internet banking do banco (OFX ou CSV)
e faz upload no Wee Finances. O sistema faz parsing, extrai transações,
sugere categorias e cria tudo automaticamente.

#### Formato OFX (Open Financial Exchange)
Arquivo XML-like com tags padronizadas. Campos relevantes:
- <STMTTRN>: bloco de transação
  - <TRNTYPE>: DEBIT, CREDIT, PAYMENT
  - <DTPOSTED>: data (formato YYYYMMDD ou YYYYMMDDHHMMSS)
  - <TRNAMT>: valor (negativo = despesa, positivo = crédito)
  - <FITID>: ID único da transação no banco (usar para deduplicação)
  - <NAME> ou <MEMO>: descrição / nome do estabelecimento
- <CCSTMTRS>: bloco específico de cartão de crédito
  - <ACCTID>: últimos dígitos do cartão

Usar lib de parsing: ofx-js (npm) ou implementar parser custom com regex.

#### Formato CSV
Cada banco exporta CSV com colunas diferentes. Estratégia:
- Aceitar CSV genérico com detecção automática de colunas
- Heurística: buscar colunas com nomes como "data", "date", "valor", 
  "value", "amount", "descrição", "description", "estabelecimento"
- Se não detectar automaticamente: mostrar tela de mapeamento manual
  onde o usuário indica qual coluna é data, valor, descrição
- Salvar o mapeamento por banco para reutilizar no próximo upload

#### API Routes

##### POST /api/import/upload
Content-Type: multipart/form-data
Body: { file (OFX ou CSV), credit_card_id }
- Detectar tipo de arquivo pela extensão e conteúdo
- Fazer parsing conforme tipo
- Para cada transação extraída:
  1. Verificar deduplicação: buscar por FITID (OFX) ou combo
     data+valor+descrição (CSV) em Transactions existentes
  2. Normalizar descrição (trim, lowercase para matching)
  3. Rodar MerchantRule matching para sugerir categoria
  4. Determinar em qual fatura a transação cai (baseado no ciclo do cartão)
  5. Detectar possíveis parcelas: padrão "PARCELA N/X" ou "N DE X" na descrição
- Retornar: {
    total_encontradas: number,
    novas: ImportPreview[],       // transações ainda não existem
    duplicadas: number,            // já existem, serão ignoradas
    parcelas_detectadas: InstallmentPreview[],
    mapeamento_csv?: ColumnMapping  // se CSV precisou de mapeamento
  }
- NÃO criar transactions ainda — só retornar preview

##### POST /api/import/confirm
Body: { 
  transactions: ImportPreview[],   // array editado pelo usuário
  installments: InstallmentPreview[],
  credit_card_id 
}
- Criar Transactions em batch (todas de uma vez)
- Para parcelas confirmadas: criar Installment + Transactions futuras
- Rodar detecção de anomalias
- Retornar: { criadas: number, parcelas_criadas: number }

##### GET /api/import/history
- Histórico de importações do casal
- Cada item: data, arquivo, cartão, total importado, duplicadas ignoradas

#### Detecção de Parcelas no OFX/CSV
Ao extrair descrições, buscar padrões de texto:
- Regex: /parcela\s*(\d+)\s*[\/de]\s*(\d+)/i
- Regex: /(\d+)\s*[\/de]\s*(\d+)/  (ex: "3/10")
- Regex: /(\d+)x\s*de\s*R?\$?\s*([\d.,]+)/i  (ex: "10x de R$ 50,00")
- Se encontrar padrão: agrupar transações com mesma descrição-base 
  e sugerir como Installment único
- Preview: "Detectamos que 'Magazine Luiza' tem 3 parcelas. 
  Registrar como parcelamento de 10x?"

#### Tela: Importar Fatura (/dashboard/cartoes/:id/importar)

##### Passo 1: Upload
- Área de drag & drop + botão "Selecionar arquivo"
- Aceitar: .ofx, .csv, .xlsx
- Abaixo: links de ajuda "Como baixar OFX no [Nubank/Itaú/BB/Bradesco/Inter]"
  com mini tutorial por banco (modal ou accordion)
- Ao fazer upload: spinner + "Analisando fatura..."

##### Passo 2: Mapeamento CSV (só se necessário)
- Se CSV e colunas não foram auto-detectadas:
  - Mostrar preview das primeiras 5 linhas do CSV
  - Dropdowns acima de cada coluna: "Data", "Valor", "Descrição", "Ignorar"
  - Botão "Confirmar mapeamento"
  - Salvar mapeamento para reutilizar (vinculado ao apelido do cartão)

##### Passo 3: Revisão de Transações
- Lista editável de transações extraídas
- Cada item: checkbox (incluir/excluir) | data | descrição | valor | 
  categoria sugerida (dropdown para alterar) | badge "nova" ou "duplicada"
- Duplicadas: riscadas (strikethrough), desmarcadas por padrão, 
  tooltip: "Essa transação já existe no sistema"
- Parcelas detectadas: card especial no topo
  - "Detectamos parcelamento: [descrição] — [N] parcelas de R$ [X]"
  - Opções: "Registrar como parcelamento" / "Manter como transações avulsas"
- Resumo no rodapé: "X novas transações | Y duplicadas ignoradas | Z parcelas"
- Botão "Importar X transações"

##### Passo 4: Confirmação
- Animação de sucesso (checkmark animado)
- Resumo: "Importadas X transações para o cartão [apelido]"
- Se parcelas criadas: "Registrados Y parcelamentos"
- Botão "Ver fatura" → redireciona para o detalhe do cartão

---

### CAMADA 2: CAPTURA DE NOTIFICAÇÕES PUSH (FREE — Android only)

#### Conceito
App companion para Android que monitora notificações de apps bancários.
Quando detecta uma compra no cartão, extrai valor e descrição e envia
para o Wee Finances como "pré-lançamento" para revisão.

#### Arquitetura
- App Android separado (React Native ou Kotlin)
- Usa NotificationListenerService do Android
- Filtra notificações por package name dos apps bancários:
  - com.nu.production (Nubank)
  - com.bradesco (Bradesco)
  - com.itau (Itaú)
  - br.com.bb.android (Banco do Brasil)
  - br.com.intermedium (Inter)
  - com.c6bank.app (C6 Bank)
  - com.santander.app (Santander)
  - (configurável: usuário pode adicionar outros)
- Extrai de cada notificação:
  - Valor: regex para R$ X.XXX,XX ou R$X,XX
  - Descrição: texto da notificação após o valor
  - Tipo: "compra aprovada", "Pix recebido", etc.
  - App de origem (para identificar o cartão)
- Envia para API: POST /api/import/notification

#### API Routes

##### POST /api/import/notification
Body: { 
  valor, descricao, tipo_transacao, app_origem, 
  package_name, timestamp, device_id, user_id
}
- Criar InboxItem (pré-lançamento) com status PENDENTE
- Tentar vincular ao CreditCard correto pelo package_name / apelido
- Rodar MerchantRule matching para sugerir categoria
- NÃO criar Transaction automaticamente — vai para a Caixa de Entrada

##### GET /api/import/inbox
- Listar pré-lançamentos pendentes do usuário
- Ordenar por timestamp DESC

##### POST /api/import/inbox/:id/approve
Body: { credit_card_id, categoria_id, escopo, descricao_editada }
- Converter InboxItem em Transaction vinculada ao cartão
- Marcar InboxItem como APROVADO
- Oferecer criação de MerchantRule se categoria foi editada

##### POST /api/import/inbox/:id/dismiss
- Marcar como IGNORADO (não criar transação)

##### POST /api/import/inbox/approve-batch
Body: { ids: UUID[] }
- Aprovar múltiplos pré-lançamentos de uma vez (com categorias sugeridas)

#### Modelo de Dados Adicional

##### InboxItem (Pré-lançamento)
- id: UUID
- user_id: FK
- couple_id: FK
- credit_card_id: FK (nullable — pode não ter sido vinculado)
- valor: decimal
- descricao: string
- tipo_transacao: string
- app_origem: string
- package_name: string
- categoria_sugerida_id: FK (nullable)
- status: enum (PENDENTE | APROVADO | IGNORADO)
- transaction_id: FK (nullable — preenchido após aprovação)
- timestamp: datetime
- created_at

#### Tela: Caixa de Entrada (/dashboard/inbox)
- Badge no menu lateral com contagem de pendentes (ex: "3")
- Lista de pré-lançamentos com swipe actions:
  - Swipe direita: Aprovar (com categoria sugerida)
  - Swipe esquerda: Ignorar
  - Toque: abrir para editar categoria/descrição/escopo antes de aprovar
- Cada item: ícone do banco | descrição | valor | categoria sugerida | horário
- Ação em massa: "Aprovar todos" (para quem confia nas sugestões)
- Vazio: "Nenhum lançamento pendente. Seus gastos estão em dia!"

#### Vinculação App → Cartão
- Na primeira notificação de um app novo, perguntar:
  "Recebemos uma notificação do [Nubank]. Qual cartão corresponde?"
  - Dropdown com cartões cadastrados
  - Salvar vinculação: AppLink { package_name, credit_card_id }
  - Próximas notificações do mesmo app já vinculam automaticamente

#### Tela: Configuração de Apps (/dashboard/config/apps-bancarios)
- Lista de apps vinculados: nome do app | cartão vinculado | total capturado
- Botão "Adicionar app" com lista de apps bancários conhecidos
- Toggle por app: ativar/desativar captura
- Info: "O companion app precisa de permissão para ler notificações. 
  Seus dados nunca saem do seu celular sem sua aprovação."

---

### CAMADA 3: OPEN FINANCE VIA BELVO (PREMIUM)

#### Conceito
Integração direta com os bancos via Open Finance. O usuário autoriza
acesso uma vez e o sistema sincroniza transações do cartão automaticamente,
incluindo dados ricos como nome do estabelecimento, CNPJ e CNAE.

#### Arquitetura
- Integrar com Belvo API (belvo.com)
- Usar Belvo Connect Widget para fluxo de autorização do usuário
- Webhooks para receber transações em tempo real
- Endpoints relevantes da Belvo:
  - /api/links/ → criar conexão com banco
  - /api/accounts/ → listar contas e cartões
  - /api/transactions/ → listar transações
  - /api/bills/ → faturas de cartão (totalAmount, dueDate, minimumPayment)

#### Fluxo do Usuário
1. Usuário clica "Conectar banco" na tela do cartão
2. Abre Belvo Connect Widget (iframe/modal)
3. Usuário seleciona banco e autoriza com credenciais
4. Belvo retorna link_id → salvar no CreditCard
5. Sistema sincroniza transações automaticamente via webhook
6. Transações aparecem no cartão já categorizadas (via CNAE + MerchantRules)

#### API Routes

##### POST /api/import/openfinance/connect
Body: { credit_card_id }
- Verificar plano PREMIUM
- Retornar URL/config do Belvo Connect Widget

##### POST /api/import/openfinance/callback
Body: { link_id, institution, credit_card_id }
- Salvar belvo_link_id no CreditCard
- Disparar primeira sincronização

##### POST /api/import/openfinance/sync
Body: { credit_card_id }
- Chamar Belvo /api/transactions/ com filtro de data
- Para cada transação:
  1. Deduplicar por belvo_transaction_id
  2. Extrair: valor, data, descrição, merchant_name, cnpj, cnae
  3. Categorizar: CNAE → mapeamento para categorias do sistema
     (ex: CNAE 5611 "Restaurantes" → Alimentação > Restaurante)
  4. Criar Transaction vinculada ao cartão
  5. Detectar parcelas pelo campo installment da Belvo
- Retornar: { sincronizadas: number, novas: number, duplicadas: number }

##### POST /api/import/openfinance/webhook (recebe do Belvo)
- Belvo envia novas transações automaticamente
- Processar igual ao sync, mas em background

##### DELETE /api/import/openfinance/disconnect
Body: { credit_card_id }
- Revogar acesso no Belvo
- Remover belvo_link_id do CreditCard
- Manter transações já importadas

#### Modelo de Dados (adicionar ao CreditCard)
- belvo_link_id: string (nullable) — ID da conexão Belvo
- belvo_institution: string (nullable) — nome do banco conectado
- last_sync_at: datetime (nullable) — última sincronização

#### Tela: Conexão Open Finance (dentro do detalhe do cartão)
- Se não conectado: card com CTA
  - Ícone de banco + "Conectar automaticamente"
  - "Importe transações direto do banco, sem upload manual"
  - Badge "Premium" (brand-accent)
  - Botão "Conectar banco" → abre Belvo Widget
- Se conectado: card de status
  - "Conectado ao [banco] · Última sincronização: [data/hora]"
  - Botão "Sincronizar agora"
  - Botão "Desconectar" (text-danger, secundário)
- Se FREE: card com preview blur + CTA upgrade

#### Mapeamento CNAE → Categorias
Seed com mapeamento dos CNAEs mais comuns:
- 4711 (Supermercado) → Alimentação > Mercado
- 4721 (Padaria) → Alimentação > Padaria
- 4761 (Livraria) → Educação > Livro
- 4781 (Vestuário) → Vestuário > Roupa
- 5611 (Restaurante) → Alimentação > Restaurante
- 5612 (Lanchonete) → Alimentação > Lanchonete
- 4731 (Combustível) → Transporte > Combustível
- 4771 (Farmácia) → Saúde > Farmácia
- 7911 (Agência de viagem) → Lazer > Viagem
- 9312 (Clubes/academia) → Saúde > Academia
- Mapeamento complementa (não substitui) MerchantRules

---

### INTEGRAÇÃO ENTRE AS 3 CAMADAS

#### Deduplicação cross-camada
Um mesmo gasto pode chegar por 2 ou 3 caminhos (notificação push + OFX upload
+ Open Finance). O sistema DEVE deduplicar:
- Chave de deduplicação: data + valor + cartão (com margem de ±1 dia na data)
- Se candidata a duplicata encontrada: NÃO criar, marcar no log
- Na revisão (upload OFX): mostrar "Essa transação já foi importada 
  via [notificação/Open Finance]"

#### Prioridade de dados
Quando a mesma transação existe em múltiplas fontes:
1. Open Finance (dados mais ricos: CNPJ, CNAE, merchant name)
2. Upload OFX (dados bancários padronizados)
3. Notificação push (dados mais limitados: valor + descrição curta)
4. Manual (dados inseridos pelo usuário)

Se uma transação veio por notificação (dados pobres) e depois veio por
Open Finance (dados ricos): enriquecer a transação existente com os dados
da fonte mais rica, sem criar duplicata.

#### Status de importação no card do cartão
Mostrar no card do cartão o método de importação ativo:
- 🔄 "Sincronizado via Open Finance" (verde, PREMIUM)
- 📲 "Captura de notificações ativa" (verde, Android)
- 📁 "Última importação: [data]" (neutro, upload manual)
- ⚠️ "Nenhuma importação configurada" (amarelo, sugerir setup)

---

### REGRAS VISUAIS (aplicar o Design System do Prompt 0)

- Upload drag & drop: área tracejada com border brand-primary (dashed), 
  bg brand-primary-light, ícone de upload centralizado
  - Ao arrastar arquivo sobre: border sólido brand-primary, escala 1.02
- Caixa de Entrada (inbox): badge vermelho com contagem no menu lateral
  - Cards swipeable: swipe right = success (verde), swipe left = danger (vermelho)
- Pré-lançamentos: ícone do banco (imagem) + descrição + valor em JetBrains Mono
- Revisão de importação: tabela com alternância de cores bg-card / bg-secondary
  - Duplicadas: text-tertiary, strikethrough, opacidade 50%
  - Parcelas detectadas: card especial com borda brand-accent (gold), 
    ícone de parcelas, fundo brand-accent-light
- Open Finance: Belvo Connect Widget com estilo customizado (cores do brand)
  - Card de status de conexão: borda esquerda success (verde) se conectado
  - Badge "Premium": brand-accent com ícone de coroa/estrela
- Tutoriais "Como baixar OFX": accordion com ícones dos bancos (logos)
  - Screenshots em cards com shadow-sm e border-radius 8px

---

### LOGS DE DEBUG
- console.log("[IMPORT] Upload recebido:", { tipo, tamanho, cardId })
- console.log("[IMPORT] OFX parsed:", { totalTransacoes, periodoInicio, periodoFim })
- console.log("[IMPORT] CSV colunas detectadas:", { mapeamento })
- console.log("[IMPORT] Deduplicação:", { novas, duplicadas })
- console.log("[IMPORT] Parcelas detectadas:", { count, padroes })
- console.log("[IMPORT] Transações criadas em batch:", { count })
- console.log("[NOTIF] Recebida:", { app, valor, descricao })
- console.log("[NOTIF] Vinculada ao cartão:", { packageName, cardId })
- console.log("[NOTIF] Aprovada → Transaction:", { inboxId, transactionId })
- console.log("[OF] Belvo connect:", { institution, linkId })
- console.log("[OF] Sync:", { cardId, novas, duplicadas, enriquecidas })
- console.log("[OF] Webhook recebido:", { eventType, transactionCount })
- console.log("[DEDUP] Cross-camada:", { fonte1, fonte2, acao })

---

### VALIDAÇÕES E CHECKLIST

Após gerar, valide:
- [ ] Upload OFX: parser extrai corretamente data, valor, descrição, FITID?
- [ ] Upload CSV: detecção automática de colunas funciona com Nubank e Itaú?
- [ ] CSV com colunas não detectadas: tela de mapeamento aparece?
- [ ] Mapeamento CSV é salvo e reutilizado no próximo upload do mesmo cartão?
- [ ] Deduplicação por FITID (OFX) funciona? Não cria duplicatas?
- [ ] Deduplicação por data+valor+descrição (CSV) funciona?
- [ ] Parcelas são detectadas por regex na descrição?
- [ ] Parcelas detectadas geram Installment corretamente?
- [ ] Preview mostra duplicadas como riscadas/desmarcadas?
- [ ] Importação em batch cria todas as Transactions de uma vez?
- [ ] Notificação push: InboxItem é criado com status PENDENTE?
- [ ] Aprovar InboxItem cria Transaction vinculada ao cartão?
- [ ] Vinculação app→cartão funciona e persiste?
- [ ] Open Finance: Belvo Widget abre corretamente? (PREMIUM only)
- [ ] Open Finance: webhook cria transações sem duplicar?
- [ ] Deduplicação cross-camada: mesma compra por 2 fontes não duplica?
- [ ] Enriquecimento: transação pobre (notificação) é atualizada com dados ricos (OF)?
- [ ] Card do cartão mostra status correto do método de importação?
- [ ] FREE: Open Finance mostra preview + CTA upgrade?
```

---

## PROMPT 14 — INVESTIMENTOS, PATRIMÔNIO E LIBERDADE FINANCEIRA
**Objetivo:** Gestão de ativos, dividendos/proventos, patrimônio líquido e tracker de liberdade financeira por conta fixa.
**Chat:** Novo

```markdown
[COLE O PROMPT 0 AQUI]

## TAREFA: Módulo de investimentos, patrimônio e liberdade financeira

### CONTEXTO DO PROBLEMA
Apps financeiros focam em gastos e dívidas, mas ignoram o outro lado da equação:
patrimônio e renda passiva. O usuário sabe quanto gasta, mas não sabe quanto tem,
quanto cresceu, e — mais importante — quão perto está de ter liberdade financeira.

Nosso sistema resolve isso com 3 pilares:
1. **Patrimônio**: quanto o usuário/casal tem (ativos - dívidas)
2. **Dividendos/Proventos**: quanto recebe de renda passiva por mês
3. **Freedom Tracker**: quanto falta para a renda passiva cobrir os gastos fixos
   — com gamificação por conta individual para reforço positivo constante

---

### PILAR 1: PATRIMÔNIO E ATIVOS

#### API Routes

##### CRUD /api/assets

###### POST /api/assets
Body: { nome, tipo (enum), instituicao, ticker, valor_atual, 
valor_investido, data_aquisicao, notas }
- Criar Asset vinculado ao user_id
- Se modo casal: associar couple_id
- Retornar ativo criado

###### GET /api/assets
Query: ?tipo=RENDA_VARIAVEL&ativo=true
- Listar ativos do usuário (ou casal, conforme modo)
- Incluir em cada: rentabilidade (valor_atual - valor_investido / valor_investido * 100)
- Agrupar por tipo se solicitado

###### PUT /api/assets/:id
- Atualizar valor_atual (atualização manual de saldo)
- Ao atualizar: criar AssetSnapshot automático se mudou de mês

###### DELETE /api/assets/:id
- Soft delete (ativo = false)
- Manter no histórico de patrimônio

##### GET /api/patrimonio
- Retornar visão consolidada:
  { 
    total_ativos: decimal,
    total_dividas: decimal (soma de Debts + cartão),
    patrimonio_liquido: decimal (ativos - dívidas),
    por_tipo: [{ tipo, valor, percentual }],
    por_pessoa: [{ user, valor }] (modo casal),
    evolucao_12_meses: [{ mes, valor }]
  }
- Gráfico de evolução: usa AssetSnapshots + Debts históricos

##### POST /api/assets/snapshot
- Gerar snapshot mensal de todos os ativos (rodar 1x/mês via cron ou manual)
- Para cada ativo ativo: criar AssetSnapshot { asset_id, valor, mes_referencia }
- Usado para montar o gráfico de evolução patrimonial

#### Tela: Patrimônio (/dashboard/patrimonio)

##### Header
- Patrimônio Líquido em Fraunces italic grande (destaque principal)
- Subtítulo: "Ativos: R$ X — Dívidas: R$ Y"
- Variação em relação ao mês anterior: "+R$ Z (+W%)" em success ou danger

##### Seção: Composição por Tipo
- Gráfico de rosca (recharts) com cores por tipo:
  - Renda Fixa: brand-primary (teal)
  - Renda Variável: brand-secondary (terracotta)
  - Fundos: partner-shared (lavender)
  - Imóveis: brand-accent (gold)
  - Cripto: info (azul)
  - Outros: text-tertiary
- Legenda com valor e % de cada tipo

##### Seção: Lista de Ativos
- Agrupado por tipo (accordion)
- Cada ativo: nome | instituição | valor atual | rentabilidade (% e R$)
- Badge de rentabilidade: verde se positiva, vermelho se negativa
- Botão "Atualizar valor" inline (input rápido)
- Se tem ticker (ações/fundos): mostrar ticker em JetBrains Mono

##### Seção: Evolução Patrimonial
- Gráfico de linha (recharts) — últimos 12 meses
- Linha: patrimônio líquido (brand-primary)
- Área sombreada: ativos (acima) vs dívidas (abaixo)
- Modo casal: toggle para ver total / por parceiro

##### Seção: Distribuição do Casal (modo casal)
- Barra horizontal dividida em partner-a (teal) e partner-b (terracotta)
- "Parceiro A: R$ X (Y%) | Parceiro B: R$ W (Z%)"
- Tom neutro: informativo, sem julgamento

---

### PILAR 2: DIVIDENDOS E PROVENTOS

#### Conceito
O usuário registra quanto recebeu de renda passiva por mês. Tipos:
- **Dividendo**: distribuição de lucro de ações
- **JCP** (Juros sobre Capital Próprio): similar a dividendo, tributado diferente
- **Rendimento**: CDB, Tesouro, poupança, fundos
- **Aluguel**: renda de imóveis
- **Outro**: qualquer outra renda passiva

O registro pode ser vinculado a um Asset específico (ex: "Dividendo da PETR4")
ou avulso (ex: "Rendimento CDB Nubank" sem ativo cadastrado).

#### API Routes

##### CRUD /api/dividends

###### POST /api/dividends
Body: { valor, mes_referencia, tipo (enum), asset_id (nullable), descricao }
- Criar DividendEntry
- Se asset_id fornecido: vincular ao ativo

###### GET /api/dividends
Query: ?periodo=2026&tipo=DIVIDENDO
- Listar proventos do usuário/casal
- Filtros: período (mês ou ano), tipo, asset_id
- Incluir totais: { total_mes, total_ano, media_mensal_12m }

###### GET /api/dividends/summary
- Resumo mensal consolidado:
  { 
    mes_atual: decimal,
    media_12_meses: decimal,
    melhor_mes: { mes, valor },
    evolucao_12_meses: [{ mes, valor, por_tipo: {} }],
    por_ativo: [{ asset, total, percentual }],
    projecao_anual: decimal (media * 12)
  }

#### Tela: Dividendos (/dashboard/patrimonio/dividendos)

##### Header
- "Renda passiva deste mês" em Fraunces italic: R$ X
- Subtítulo: "Média últimos 12 meses: R$ Y/mês"
- Badge: "Projeção anual: R$ Z"

##### Seção: Evolução Mensal
- Gráfico de barras (recharts) — últimos 12 meses
- Barras empilhadas por tipo (cores diferentes):
  Dividendos | JCP | Rendimentos | Aluguéis | Outros
- Linha de média sobreposta (tracejada)

##### Seção: Registros do Mês
- Lista de entradas do mês selecionado
- Cada item: data | descrição | tipo (badge colorido) | ativo vinculado | valor
- FAB "+" para registrar novo provento

##### Seção: Por Ativo
- Ranking: quais ativos geraram mais renda passiva
- Card por ativo: nome | tipo | total recebido | % do total
- Insight: "PETR4 representa 40% da sua renda passiva. 
  Diversificar reduz o risco."

---

### PILAR 3: FREEDOM TRACKER (Liberdade Financeira)

#### Conceito Principal
O Freedom Tracker responde a pergunta: "Quanto da minha vida já é paga 
pela minha renda passiva?"

Funciona em DOIS NÍVEIS simultâneos:

##### Nível 1: Visão Geral (o "grande número")
- Total de despesas fixas mensais vs total de dividendos/proventos mensais
- Ex: "Suas despesas fixas são R$ 5.000/mês. Seus proventos cobrem R$ 350/mês.
  Liberdade financeira: 7%"
- Projeção: "No ritmo atual de crescimento, você atinge 100% em X anos"
- Esse número sozinho é desmotivador no início — por isso existe o Nível 2

##### Nível 2: Liberdade por Conta (o "game changer")
O sistema ordena as despesas fixas por valor (da menor para a maior) e vai
"cobrindo" cada uma com os proventos disponíveis. Exemplo:

Despesas fixas (ordenadas por prioridade configurável):
1. Gás: R$ 25/mês
2. Internet: R$ 100/mês
3. Água: R$ 80/mês
4. Luz: R$ 200/mês
5. Aluguel: R$ 2.500/mês

Proventos do mês: R$ 180/mês

Resultado visual:
- ✅ Gás (R$ 25): 100% coberto — PAGO PELOS PROVENTOS!
- ✅ Internet (R$ 100): 100% coberto — PAGO PELOS PROVENTOS!
- 🟡 Água (R$ 80): 68% coberto (R$ 55 de R$ 80) — QUASE LÁ!
- ⬜ Luz (R$ 200): 0% coberto — próxima conquista
- ⬜ Aluguel (R$ 2.500): 0% coberto

A cada conquista (100% de uma conta coberta), o sistema celebra.

#### Lógica de Cálculo do Freedom Tracker

```
function calculateFreedom(fixedExpenses, monthlyDividends) {
  // Ordenar despesas por prioridade (configurável pelo usuário)
  const sorted = fixedExpenses.sort((a, b) => a.prioridade - b.prioridade);
  
  let remaining = monthlyDividends; // proventos disponíveis
  const result = [];
  
  for (const expense of sorted) {
    if (remaining >= expense.valor_medio) {
      // Conta 100% coberta
      result.push({ 
        ...expense, 
        coberto: expense.valor_medio, 
        percentual: 100, 
        status: 'COBERTA' 
      });
      remaining -= expense.valor_medio;
    } else if (remaining > 0) {
      // Conta parcialmente coberta
      result.push({ 
        ...expense, 
        coberto: remaining, 
        percentual: (remaining / expense.valor_medio) * 100, 
        status: 'PARCIAL' 
      });
      remaining = 0;
    } else {
      // Conta não coberta
      result.push({ 
        ...expense, 
        coberto: 0, 
        percentual: 0, 
        status: 'PENDENTE' 
      });
    }
  }
  
  const totalFixed = fixedExpenses.reduce((s, e) => s + e.valor_medio, 0);
  const overallPercent = (monthlyDividends / totalFixed) * 100;
  
  return { expenses: result, overallPercent, remaining };
}
```

#### API Routes

##### CRUD /api/fixed-expenses

###### POST /api/fixed-expenses
Body: { nome, valor_medio, categoria_id, escopo, prioridade }
- Criar FixedExpense
- Prioridade: número inteiro (1 = primeira a ser coberta)
- O usuário pode reordenar arrastando (drag & drop)

###### GET /api/fixed-expenses
- Listar despesas fixas do usuário/casal, ordenadas por prioridade
- Modo solo: todas do user
- Modo casal: individuais + compartilhadas (divididas conforme regra)

###### PUT /api/fixed-expenses/:id
- Atualizar valor, nome, prioridade

###### PUT /api/fixed-expenses/reorder
Body: { order: [{ id, prioridade }] }
- Atualizar prioridades em batch (após drag & drop)

##### GET /api/freedom
- Retornar cálculo completo do Freedom Tracker:
  {
    // Nível 1: Visão Geral
    total_despesas_fixas: decimal,
    total_proventos_mensal: decimal (média 3 meses ou último mês, o que for maior),
    percentual_geral: decimal,
    projecao_100_percent: string (ex: "Dez/2035"),
    
    // Nível 2: Por Conta
    contas: [{
      id, nome, valor_medio, coberto, percentual, status,
      meses_para_cobrir: number (projeção individual)
    }],
    
    // Conquistas
    contas_cobertas: number,
    contas_total: number,
    proxima_conquista: { nome, falta: decimal, percentual_atual },
    
    // Histórico
    evolucao_6_meses: [{ mes, percentual_geral, contas_cobertas }]
  }

##### GET /api/freedom/milestones
- Histórico de conquistas (quando cada conta foi coberta pela 1ª vez)
- Cada milestone: { fixed_expense_nome, data_conquista, valor }

#### Tela: Liberdade Financeira (/dashboard/patrimonio/liberdade)

##### Header — O Grande Número
- Gauge circular grande (SVG): percentual geral de liberdade
- Centro: "X%" em Fraunces italic, tamanho 48px
- Abaixo: "R$ [proventos] de R$ [despesas fixas]"
- Projeção: "No ritmo atual, liberdade total em [mês/ano]"
- Cor do gauge: 
  - 0-25%: brand-primary (teal, início da jornada)
  - 25-50%: info (azul, progredindo)
  - 50-75%: warning (amarelo, quase lá)
  - 75-100%: brand-accent (gold, quase livre)
  - 100%: success com animação especial

##### Seção: Contas por Cobertura (O Coração da Feature)
- Lista ordenada por prioridade (drag & drop para reordenar)
- Cada conta é um card com:
  - Nome da conta (ex: "Gás Natural")
  - Valor mensal (ex: "R$ 25/mês")
  - Barra de progresso: coberto / total
  - Percentual: "100%" ou "68% coberto"
  - Status visual:
    - ✅ COBERTA: fundo success-light, borda success, ícone checkmark
      - Texto: "Pago pelos seus proventos!" (brand-accent, celebratório)
    - 🟡 PARCIAL: fundo warning-light, borda warning
      - Texto: "Faltam R$ X/mês — próximo alvo!"
    - ⬜ PENDENTE: fundo bg-secondary, borda border
      - Texto: "Aguardando sua vez" (text-tertiary)
  - Se PARCIAL: mostrar "Se seus proventos crescerem R$ X/mês, 
    você cobre esta conta em [N] meses"

##### Seção: Conquistas
- Timeline horizontal de milestones conquistados
- Cada milestone: ícone ✅ + nome da conta + data + emoji 🎉
- Ex: "🎉 Jan/2026 — Gás coberto!" → "🎉 Mar/2026 — Internet coberta!"
- Se nenhuma conquista ainda: 
  "Sua primeira conquista está a R$ X de distância. Cada real investido conta!"

##### Seção: Simulador "E se..."
- Input: "Se você investisse R$ X a mais por mês (yield estimado: Y%)"
- Resultado:
  - "Em 6 meses, seus proventos subiriam de R$ A para ~R$ B"
  - "Isso cobriria: [lista de contas que passariam a ser cobertas]"
  - Timeline visual: quando cada conta seria coberta

##### Card de Resumo no Dashboard Principal (Prompt 4)
- Novo card "Liberdade Financeira" no dashboard:
  - Mini gauge com percentual
  - "X de Y contas cobertas"
  - Nome da próxima conquista: "[conta] — faltam R$ Z"
  - Link "Ver detalhes"

---

### CELEBRAÇÕES E GAMIFICAÇÃO

#### Quando uma conta é coberta pela 1ª vez:
- Animação de confete (canvas-confetti)
- Modal celebratório:
  "🎉 Conquista desbloqueada!
  Seus proventos agora cobrem a conta de [nome]!
  [nome] nunca mais sai do seu bolso."
- Registrar milestone com data

#### Quando percentual geral cruza marcos:
- 10%: "Você já é 10% livre! A jornada começou."
- 25%: "Um quarto do caminho. Seus investimentos estão trabalhando."
- 50%: "Metade das suas contas fixas já são pagas por renda passiva!"
- 75%: "Quase lá! A liberdade financeira está ao alcance."
- 100%: Celebração especial (animação gold, confete dourado):
  "🏆 LIBERDADE FINANCEIRA ATINGIDA!
  Todas as suas despesas fixas são cobertas por renda passiva.
  Seu trabalho agora é opcional."

#### Modo Casal
- Conquistas são do casal: "Os proventos de vocês agora cobrem o gás!"
- Tracker combina proventos de ambos vs despesas fixas de ambos
- Cada parceiro pode ver sua contribuição individual para o tracker

---

### PILAR 4: PROJEÇÃO PATRIMONIAL (Simulador de Juros Compostos)

#### Conceito
O usuário vê quanto terá no futuro se continuar investindo.
O sistema usa dados reais (patrimônio atual + aportes históricos) e projeta
mês a mês, considerando juros compostos com taxa configurável.

A mágica visual: separar o gráfico em "o que você colocou" vs "o que os 
juros geraram". Conforme os anos passam, a fatia de juros cresce e 
ultrapassa os aportes — é o momento em que o dinheiro trabalha mais 
que a pessoa. Esse momento merece destaque visual.

#### Lógica de Cálculo

```
function projectPatrimony(params) {
  const {
    valorInicial,         // patrimônio de partida (real ou hipotético)
    aporteMensal,         // quanto pretende aportar/mês
    taxaAnual = 8,        // taxa de juros anual (% — default 8%)
    anosProjecao = 10     // horizonte (anos)
  } = params;
  
  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
  const totalMeses = anosProjecao * 12;
  
  let saldo = valorInicial;
  let totalAportado = valorInicial;
  let jurosAcumuladoAno = 0;
  let aportesAcumuladoAno = 0;
  const projecaoMensal = [];
  const projecaoAnual = [];
  
  for (let mes = 1; mes <= totalMeses; mes++) {
    // Juros do mês sobre o saldo existente
    const jurosDoMes = saldo * taxaMensal;
    
    // Novo saldo = anterior + juros + aporte
    saldo += jurosDoMes + aporteMensal;
    totalAportado += aporteMensal;
    jurosAcumuladoAno += jurosDoMes;
    aportesAcumuladoAno += aporteMensal;
    
    const totalJuros = saldo - totalAportado;
    const percentualJuros = saldo > 0 ? (totalJuros / saldo) * 100 : 0;
    
    projecaoMensal.push({
      mes,
      ano: Math.ceil(mes / 12),
      data: addMonths(today, mes),
      aporteMes: aporteMensal,
      jurosMes: round(jurosDoMes, 2),
      saldo: round(saldo, 2),
      totalAportado: round(totalAportado, 2),
      totalJuros: round(totalJuros, 2),
      percentualJuros: round(percentualJuros, 1),
      jurosUltrapassaramAportes: totalJuros > (totalAportado - valorInicial)
    });
    
    // Agregar por ano (a cada 12 meses)
    if (mes % 12 === 0) {
      projecaoAnual.push({
        ano: mes / 12,
        anoCalendario: today.getFullYear() + mes / 12,
        aportesNoAno: round(aportesAcumuladoAno, 2),
        jurosNoAno: round(jurosAcumuladoAno, 2),
        saldoFinal: round(saldo, 2),
        totalAportado: round(totalAportado, 2),
        totalJuros: round(totalJuros, 2),
        percentualJuros: round(percentualJuros, 1)
      });
      jurosAcumuladoAno = 0;
      aportesAcumuladoAno = 0;
    }
  }
  
  // Crossover: juros acumulados > aportes acumulados (excluindo valor inicial)
  const crossover = projecaoMensal.find(p => p.jurosUltrapassaramAportes);
  
  return {
    projecaoMensal,
    projecaoAnual,
    resumo: {
      valorFinal: projecaoMensal[projecaoMensal.length - 1].saldo,
      totalAportado: projecaoMensal[projecaoMensal.length - 1].totalAportado,
      totalJuros: projecaoMensal[projecaoMensal.length - 1].totalJuros,
      multiplicador: round(
        projecaoMensal[projecaoMensal.length - 1].saldo / totalAportado, 1
      ),
      crossoverMes: crossover?.mes || null,
      crossoverData: crossover?.data || null
    }
  };
}
```

#### Dados de Entrada
O simulador usa 2 fontes de dados:

##### Dados Reais (preenchidos automaticamente)
- **Valor atual**: soma de todos os Assets ativos do usuário/casal
- **Aporte médio**: média dos aportes dos últimos 6 meses
  (calculado pela diferença de AssetSnapshots + DividendEntries reinvestidos)
- Se não houver histórico suficiente: pedir input manual

##### Dados Configuráveis (inputs do simulador)
- **Aporte mensal**: slider + input numérico (default: média real ou R$ 500)
- **Taxa anual**: slider + input (default: 8%, range: 1-20%)
  - Sugestões rápidas como chips: "6% (conservador)" | "8% (moderado)" | "12% (arrojado)"
  - Tooltip: "A taxa Selic histórica média é ~10%. Renda fixa paga ~CDI. 
    Renda variável tem mais risco mas potencial maior."
- **Horizonte**: slider (default: 10 anos, range: 1-40 anos)
  - Sugestões rápidas: "5 anos" | "10 anos" | "20 anos" | "Aposentadoria"
  - Se escolher "Aposentadoria": calcular anos até 65 (precisa da idade do usuário,
    adicionar campo data_nascimento no User se não existir)

#### API Routes

##### POST /api/patrimonio/projecao
Body: { valor_inicial, aporte_mensal, taxa_anual, anos_projecao, 
modo: 'real' | 'livre', granularidade: 'mensal' | 'anual' }
- Rodar cálculo de projeção
- Se granularidade = 'anual': agregar projecao por ano
  (somar aportes e juros de cada 12 meses, saldo = último mês do ano)
- Retornar: { projecao[], resumo }

##### GET /api/patrimonio/projecao/auto
- Preencher automaticamente com dados reais do usuário:
  - valor_inicial: soma dos Assets
  - aporte_mensal: média dos últimos 6 meses
  - taxa_anual: 8 (default)
  - anos_projecao: 10 (default)
- Retornar os params + projeção calculada
- Se user não tem Assets: retornar params com valor_inicial = 0
  e flag sugerindo modo "Simulação livre"

##### POST /api/patrimonio/projecao/comparar
Body: { cenarios: [{ nome, valor_inicial, aporte_mensal, taxa_anual }], 
anos_projecao }
- Calcular projeção para múltiplos cenários lado a lado
- Retornar: { cenarios: [{ nome, projecao[], resumo }] }
- Máximo 3 cenários simultâneos

##### GET /api/patrimonio/projecao/export?formato=csv
Query: { valor_inicial, aporte_mensal, taxa_anual, anos_projecao, 
granularidade }
- Gerar CSV da tabela de projeção
- Retornar arquivo para download
- Colunas: Mês/Ano, Aporte, Juros, Saldo, Total Aportado, Total Juros, % Juros

#### Tela: Projeção Patrimonial (/dashboard/patrimonio/projecao)

##### Header
- Título: "Quanto você terá no futuro?"
- Subtítulo dinâmico que atualiza conforme mexe nos inputs:
  "Com R$ [atual] hoje + R$ [aporte]/mês a [taxa]% ao ano..."

##### Toggle de Modo (no topo, abaixo do header)
Dois modos de uso — toggle como pills:

**"Minha projeção"** (default se tem dados reais)
- Puxa valor atual dos Assets e aporte médio automaticamente
- Inputs vêm preenchidos com dados reais
- Badge sutil: "Baseado nos seus dados reais"
- O usuário pode ajustar qualquer valor — ao alterar, badge muda para
  "Baseado nos seus dados com ajustes"

**"Simulação livre"**
- Todos os campos começam vazios (ou com defaults genéricos)
- Sem vínculo com dados reais — é uma calculadora pura
- Ideal para: "E se eu tivesse R$ 50k e aportasse R$ 2k/mês?"
- Sem badge de dados reais
- Pode ser usado mesmo sem nenhum Asset cadastrado

##### Seção: Controles (inputs interativos)
- Layout: controles empilhados em 2 linhas (desktop) ou 1 coluna (mobile)

0. **Valor inicial** (patrimônio de partida)
   - Modo "Minha projeção": preenchido com soma dos Assets, editável
   - Modo "Simulação livre": vazio, placeholder "R$ 0,00"
   - Input numérico com máscara BRL
   - Label: "Quanto você tem investido hoje?"

1. **Aporte mensal**
   - Slider: R$ 0 a R$ 10.000 (step R$ 100)
   - Input numérico ao lado para valor exato
   - Modo "Minha projeção": abaixo do slider, texto informativo
     "Seu aporte médio real: R$ X/mês" (text-tertiary)
   - Modo "Simulação livre": sem texto informativo

2. **Taxa anual**
   - Slider: 1% a 20% (step 0.5%)
   - Chips rápidos: 6% | 8% | 10% | 12%
   - Tooltip com explicação

3. **Horizonte**
   - Slider: 1 a 40 anos (step 1)
   - Chips rápidos: 5a | 10a | 20a | 30a
   - Se idade cadastrada: chip "Aposentadoria (X anos)"

- Todos os controles atualizam gráfico E tabela em TEMPO REAL (sem botão "calcular")

##### Seção: O Grande Número
- Card destaque com o valor final projetado
- Valor em Fraunces italic, tamanho 36px, cor brand-accent (gold)
- Ex: "R$ 1.247.832"
- Subtítulo: "em [mês/ano]" (data final da projeção)
- Abaixo, 3 mini cards:
  - "Você investiu: R$ X" (total aportado, text-primary)
  - "Juros geraram: R$ Y" (total de juros, success)
  - "Seu dinheiro multiplicou: Z.Xx" (multiplicador, brand-accent)

##### Seção: Gráfico de Evolução (visão emocional)
- Gráfico de área empilhada (recharts AreaChart)
- Eixo X: meses/anos
- Eixo Y: valor em R$
- 2 áreas empilhadas:
  - Área inferior (brand-primary, 40% opacity): "Seus aportes" (totalAportado)
  - Área superior (brand-accent, 40% opacity): "Juros compostos" (totalJuros)
- Linha do topo (saldo total): brand-primary sólida

- **Crossover point** (momento em que juros > aportes):
  - Marcador vertical especial no gráfico (linha tracejada brand-accent)
  - Tooltip: "A partir daqui, seu dinheiro rende mais do que você aporta"
  - Annotation: estrela ou ícone ✨ no ponto
  - Se crossover acontece dentro do horizonte: destacar com callout
  - Se não acontece: "Aumente o horizonte ou a taxa para ver o crossover"

- Tooltip do gráfico (ao hover/touch em qualquer ponto):
  - "Mês X (Jan/2030)"
  - "Saldo: R$ X"
  - "Você investiu: R$ Y"
  - "Juros geraram: R$ Z (W% do saldo)"

- Toggle acima do gráfico: "Mensal" | "Anual"
  - Mensal: mostra todos os meses (pode ficar denso em 20+ anos)
  - Anual: agrupa por ano (mais limpo para horizontes longos, default se > 5 anos)

##### Seção: Tabela Detalhada (visão analítica)
- Abaixo do gráfico, tabela expandível (colapsada por padrão com 
  botão "Ver tabela detalhada ▼")
- Toggle: "Mensal" | "Anual" (sincronizado com o toggle do gráfico)

###### Tabela Mensal (colunas):
| Mês/Ano | Aporte do mês | Juros do mês | Saldo acumulado | Total aportado | Total juros | % Juros |
|---------|--------------|-------------|----------------|---------------|------------|---------|
| Jul/2026 | R$ 1.000 | R$ 6,43 | R$ 2.006,43 | R$ 2.000 | R$ 6,43 | 0,3% |
| Ago/2026 | R$ 1.000 | R$ 12,92 | R$ 3.019,35 | R$ 3.000 | R$ 19,35 | 0,6% |
| ... | ... | ... | ... | ... | ... | ... |
| Jun/2036 | R$ 1.000 | R$ 821,04 | R$ 189.432,10 | R$ 121.000 | R$ 68.432,10 | 36,1% |

###### Tabela Anual (colunas):
| Ano | Aportes no ano | Juros no ano | Saldo final | Total aportado | Total juros | % Juros |
|-----|---------------|-------------|------------|---------------|------------|---------|
| 2027 | R$ 12.000 | R$ 956 | R$ 13.956 | R$ 13.000 | R$ 956 | 6,9% |
| 2028 | R$ 12.000 | R$ 2.072 | R$ 28.028 | R$ 25.000 | R$ 3.028 | 10,8% |
| ... | ... | ... | ... | ... | ... | ... |

- Formatar valores em JetBrains Mono
- Coluna "% Juros": com badge colorido
  - < 20%: text-tertiary (juros ainda são pequenos)
  - 20-50%: brand-primary (crescendo)
  - > 50%: brand-accent gold (dinheiro trabalhando mais que você!)
  - Crossover row: highlight com bg brand-accent-light + badge ✨
- Linha de totais no final: bold, bg-secondary
- Botão "Exportar CSV" no canto da tabela (download do .csv)
- Botão "Copiar tabela" (para colar em planilha)

##### Seção: Marcos Temporais
- Cards horizontais com marcos ao longo da projeção:
  - "1º R$ 100k": em [data] (se aplicável)
  - "1º R$ 500k": em [data]
  - "1º R$ 1M": em [data] (com emoji 🎯)
  - Personalizado: valor de uma meta ativa do usuário
    "Meta [nome]: R$ X — atingida em [data] só com juros compostos"
- Marcos que ficam dentro do horizonte: badge success
- Marcos fora do horizonte: badge text-tertiary + "Aumente o prazo"

##### Seção: Comparador de Cenários
- Botão "Comparar cenários" — expande painel com até 3 cenários
- Cada cenário: nome editável + aporte + taxa
- Cenários default sugeridos:
  - "Conservador": aporte atual, 6%
  - "Atual": aporte atual, 8%
  - "Agressivo": aporte +50%, 12%
- Gráfico de linhas sobrepostas (sem área, só linhas) com cores distintas
- Tabela comparativa abaixo:
  | Cenário | Aporte/mês | Taxa | Valor em 10a | Juros ganhos |
- Destaque visual no melhor cenário

##### Card no Dashboard Principal (Prompt 4)
- Novo card "Projeção" no dashboard:
  - "Em [horizonte], você terá ~R$ X"
  - Mini gráfico sparkline (linha simples, sem eixos)
  - Link "Simular cenários"

#### Modo Casal
- Valor atual: soma dos Assets de ambos
- Aporte mensal: soma dos aportes de ambos (ou configurável separado)
- Toggle: "Projeção do casal" | "Minha projeção"
- Na projeção do casal: mostrar contribuição de cada parceiro no gráfico
  (3 áreas: aportes A + aportes B + juros)

#### Integração com Metas (Prompt 7)
- Se o usuário tem metas ativas com valor alvo:
  - Marcar no gráfico de projeção: "Meta [viagem]: R$ 18.000"
  - Linha horizontal tracejada no valor da meta
  - Onde a curva de projeção cruza a meta: "Atingida em [data] 
    considerando juros compostos"
  - Insight: "Sua meta de viagem seria atingida X meses antes se 
    você contar com os rendimentos"

---

### INTEGRAÇÃO COM MÓDULOS EXISTENTES

#### Dashboard (Prompt 4)
- Novo card: "Patrimônio Líquido" — valor + variação mensal
- Novo card: "Liberdade Financeira" — gauge + próxima conquista
- Novo card: "Projeção" — "Em [X] anos, ~R$ [Y]" + sparkline + link "Simular"

#### Score de Saúde (Prompt 4)
- Critério "Diversificação" agora usa dados reais:
  - Se tem > 1 tipo de ativo = 10pts (ou redistribuído no modo solo)
  - Se todos os ativos são do mesmo tipo: sugestão de diversificação

#### Relatórios (Prompt 10)
- Novo relatório: "Patrimônio e Investimentos"
  - Evolução patrimonial 12 meses
  - Rentabilidade por ativo
  - Evolução de dividendos
  - Progresso do Freedom Tracker

#### Check-in/Revisão Mensal (Prompt 9)
- Nova etapa opcional: "Patrimônio"
  - "Seu patrimônio é R$ X (+Y% este mês)"
  - "Proventos recebidos: R$ Z"
  - "Contas cobertas: N de M"
  - Se nova conquista no mês: celebrar no check-in

#### Educação (Prompt 11)
- Conteúdos desbloqueados ao ativar o módulo:
  - "O que são dividendos e como recebê-los"
  - "Renda fixa vs renda variável: onde investir primeiro"
  - "O poder dos juros compostos na liberdade financeira"
  - "Como diversificar com pouco dinheiro"

---

### REGRAS VISUAIS (aplicar o Design System do Prompt 0)

- Patrimônio Líquido: valor grande em Fraunces italic, brand-primary
  - Positivo: success / Negativo: danger
- Gauge de Liberdade: SVG circular com gradiente por faixa (teal → gold)
- Cards de conta coberta: borda success, fundo success-light, 
  ícone checkmark em success, texto celebratório em brand-accent
- Cards parciais: borda warning, fundo warning-light, 
  barra de progresso com gradiente brand-primary → brand-accent
- Cards pendentes: borda border, fundo bg-secondary, text-tertiary
- Gráfico de evolução patrimonial: área preenchida brand-primary (20% opacity)
  com linha sólida brand-primary
- Barras de dividendos: empilhadas com cores por tipo
- Timeline de conquistas: dots brand-accent (gold) conectados por linha
- Simulador: card com borda brand-primary, fundo brand-primary-light
- Celebração 100%: fundo gradiente gold intenso, confete dourado, 
  ícone troféu 🏆, Fraunces italic bold
- Projeção — gráfico de área empilhada:
  - Área "Aportes": brand-primary (40% opacity)
  - Área "Juros": brand-accent gold (40% opacity)
  - Linha do saldo total: brand-primary sólida (2px)
  - Crossover point: linha vertical tracejada brand-accent + ícone ✨
  - Tooltip: bg-card, shadow-md, font DM Sans, valores em JetBrains Mono
- Grande número projetado: Fraunces italic 36px, brand-accent (gold)
- Sliders: track bg-tertiary, thumb brand-primary, label em DM Sans
- Chips de taxa/horizonte: pills border-radius 20px, bg-tertiary, 
  ativo = bg-brand-primary + text-inverse
- Marcos temporais: cards com borda brand-accent se dentro do horizonte,
  borda border se fora
- Comparador: linhas sobrepostas com cores brand-primary, brand-secondary, 
  partner-shared para os 3 cenários
- Tabela de projeção: 
  - Valores em JetBrains Mono, alinhados à direita
  - Headers: bg-secondary, font DM Sans 600, text-secondary
  - Rows alternadas: bg-card / bg-primary
  - Row do crossover: bg brand-accent-light, badge ✨ na coluna % Juros
  - Coluna % Juros: badge colorido (tertiary < 20%, primary 20-50%, gold > 50%)
  - Linha de totais: bg-secondary, font-weight bold
  - Botões "Exportar CSV" e "Copiar": text-brand, ícones sutis, canto superior direito
  - Mobile: scroll horizontal com primeira coluna (Mês/Ano) sticky
- Toggle "Minha projeção" / "Simulação livre": pills no topo
  - "Minha projeção" ativo: bg brand-primary + text-inverse
  - "Simulação livre" ativo: bg brand-accent + text-inverse
  - Badge "Dados reais" em success-light + text success (só em "Minha projeção")

---

### LOGS DE DEBUG
- console.log("[ASSET] Criado:", { tipo, valor, instituicao })
- console.log("[ASSET] Snapshot mensal:", { assetId, valor, mes })
- console.log("[PATRIMONIO] Calculado:", { ativos, dividas, liquido })
- console.log("[DIVIDENDO] Registrado:", { valor, tipo, assetId, mes })
- console.log("[DIVIDENDO] Resumo:", { mesAtual, media12m, projecaoAnual })
- console.log("[FREEDOM] Calculado:", { percentualGeral, contasCobertas, proximaConquista })
- console.log("[FREEDOM] Conquista!", { conta, data, valorProventos })
- console.log("[FREEDOM] Marco atingido:", { percentual })
- console.log("[FIXED] Reordenado:", { novaOrdem })
- console.log("[PROJECAO] Calculada:", { valorAtual, aporte, taxa, anos, valorFinal })
- console.log("[PROJECAO] Crossover:", { mes, data, juros, aportes })
- console.log("[PROJECAO] Comparação:", { cenarios: count })
- console.log("[PROJECAO] Auto-preenchido:", { valorAtual, aporteMedio })

---

### VALIDAÇÕES E CHECKLIST

Após gerar, valide:
- [ ] Asset CRUD funciona com todos os tipos?
- [ ] AssetSnapshot é criado ao atualizar valor de ativo em novo mês?
- [ ] Patrimônio líquido calcula corretamente (ativos - dívidas)?
- [ ] Evolução patrimonial usa snapshots e mostra 12 meses?
- [ ] Gráfico de composição por tipo renderiza com cores corretas?
- [ ] DividendEntry vincula corretamente a Asset quando fornecido?
- [ ] Resumo de dividendos calcula média 12 meses e projeção anual?
- [ ] FixedExpense aceita reordenação por drag & drop?
- [ ] Freedom Tracker distribui proventos na ordem de prioridade correta?
- [ ] Conta 100% coberta mostra status COBERTA com visual celebratório?
- [ ] Conta parcial mostra percentual e "faltam R$ X"?
- [ ] Celebração dispara quando conta é coberta pela 1ª vez?
- [ ] Milestone é registrado e aparece na timeline?
- [ ] Marcos de percentual (10/25/50/75/100%) geram celebração?
- [ ] Simulador "E se" calcula projeção corretamente?
- [ ] Modo solo: funciona sem couple_id?
- [ ] Modo casal: combina proventos e despesas de ambos?
- [ ] Dashboard mostra cards de patrimônio e liberdade?
- [ ] Dark mode: gauge e cards mantêm contraste e legibilidade?
- [ ] Projeção: modo "Minha projeção" preenche com dados reais dos Assets?
- [ ] Projeção: modo "Simulação livre" funciona sem nenhum Asset cadastrado?
- [ ] Projeção: campo valor inicial aceita input manual nos dois modos?
- [ ] Projeção: cálculo de juros compostos bate com calculadora financeira?
- [ ] Projeção: sliders atualizam gráfico E tabela em tempo real sem lag?
- [ ] Projeção: crossover point aparece no mês correto?
- [ ] Projeção: tabela mensal mostra aporte, juros e saldo por mês?
- [ ] Projeção: tabela anual agrupa corretamente (soma aportes e juros do ano)?
- [ ] Projeção: toggle mensal/anual sincroniza gráfico e tabela?
- [ ] Projeção: coluna % Juros muda de cor conforme o percentual?
- [ ] Projeção: row do crossover é destacada na tabela?
- [ ] Projeção: exportar CSV gera arquivo com dados corretos?
- [ ] Projeção: tabela funciona em mobile com scroll horizontal + coluna sticky?
- [ ] Projeção: comparador mostra até 3 cenários sobrepostos?
- [ ] Projeção: marcos temporais (100k, 500k, 1M) calculam corretamente?
- [ ] Projeção: metas ativas aparecem como linhas horizontais no gráfico?
- [ ] Projeção: modo casal combina aportes de ambos?
- [ ] Projeção: gráfico de área empilhada renderiza sem erros em mobile?
```

---

## 🗺️ Mapa de Execução (Ordem Recomendada)

```
Prompt 1  → Arquitetura (scope.md)           ⬅ COMECE AQUI
Prompt 2  → Setup + Schema do Banco
Prompt 3  → Auth + Onboarding + Quiz
Prompt 4  → Dashboard do Casal
Prompt 5  → Transações (CRUD + Categorização Inteligente)
Prompt 6  → Orçamento Inteligente
Prompt 7  → Metas e Sonhos
Prompt 8  → Dívidas
Prompt 9  → Check-in Mensal
Prompt 10 → Relatórios e Insights
Prompt 11 → Educação Financeira              ⏸️ ADIADO (implementar depois)
Prompt 12 → Cartão de Crédito + Parcelas   (depende dos Prompts 4, 5, 6)
Prompt 13 → Importação de Faturas          (depende do Prompt 12)
             ├─ Camada 1: Upload OFX/CSV    (MVP, Free)
             ├─ Camada 2: Notificações Push  (v2, Free, Android)
             └─ Camada 3: Open Finance       (v3, Premium)
Prompt 14 → Investimentos + Liberdade Financeira  (depende dos Prompts 4, 8)
             ├─ Pilar 1: Patrimônio e Ativos
             ├─ Pilar 2: Dividendos/Proventos
             ├─ Pilar 3: Freedom Tracker
             └─ Pilar 4: Projeção Patrimonial (juros compostos)
```

> **Nota:** O Prompt 11 (Educação Financeira) foi adiado. Nenhum outro módulo
> depende dele para funcionar. Quando for implementar, basta usar o prompt
> normalmente — ele é autocontido.

### Dicas de Uso

1. **Um chat por prompt.** Nunca misture módulos no mesmo chat — polui o contexto.
2. **Sempre cole o Prompt 0** no início de cada chat novo.
3. **Teste antes de avançar.** Cada prompt tem checklist de validação no final.
4. **Se der erro**, use o Método do Castor: cole o log exato + descreva o que funciona vs o que não funciona.
5. **Se a IA entrar em loop**, use: "Tente uma abordagem radicalmente diferente".
6. **Adapte a stack.** Os prompts usam Next.js como exemplo, mas a lógica vale para React Native, Flutter, ou qualquer framework.
