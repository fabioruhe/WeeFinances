import { PrismaClient, MerchantRuleSource } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ─── Categorias padrão ───────────────────────────────────────────────────────

const categorias = [
  {
    nome: "Moradia",
    icone: "home",
    subcategorias: [
      { nome: "Aluguel", icone: "key", ordem: 1 },
      { nome: "Condomínio", icone: "building", ordem: 2 },
      { nome: "IPTU", icone: "file-text", ordem: 3 },
      { nome: "Água", icone: "droplets", ordem: 4 },
      { nome: "Luz / Energia", icone: "zap", ordem: 5 },
      { nome: "Gás", icone: "flame", ordem: 6 },
      { nome: "Internet", icone: "wifi", ordem: 7 },
      { nome: "Limpeza", icone: "sparkles", ordem: 8 },
      { nome: "Manutenção", icone: "wrench", ordem: 9 },
      { nome: "Decoração", icone: "sofa", ordem: 10 },
    ],
  },
  {
    nome: "Transporte",
    icone: "car",
    subcategorias: [
      { nome: "Combustível", icone: "fuel", ordem: 1 },
      { nome: "Estacionamento", icone: "parking-square", ordem: 2 },
      { nome: "Pedágio", icone: "road", ordem: 3 },
      { nome: "Transporte Público", icone: "bus", ordem: 4 },
      { nome: "Uber / 99", icone: "navigation", ordem: 5 },
      { nome: "Manutenção do Carro", icone: "wrench", ordem: 6 },
      { nome: "IPVA", icone: "file-text", ordem: 7 },
      { nome: "Seguro Auto", icone: "shield", ordem: 8 },
    ],
  },
  {
    nome: "Alimentação",
    icone: "utensils",
    subcategorias: [
      { nome: "Supermercado", icone: "shopping-cart", ordem: 1 },
      { nome: "Restaurante", icone: "chef-hat", ordem: 2 },
      { nome: "Lanche / Fast Food", icone: "sandwich", ordem: 3 },
      { nome: "Delivery", icone: "bike", ordem: 4 },
      { nome: "Padaria", icone: "croissant", ordem: 5 },
      { nome: "Feira / Hortifruti", icone: "apple", ordem: 6 },
      { nome: "Bar", icone: "beer", ordem: 7 },
    ],
  },
  {
    nome: "Saúde",
    icone: "heart-pulse",
    subcategorias: [
      { nome: "Plano de Saúde", icone: "shield-plus", ordem: 1 },
      { nome: "Consulta Médica", icone: "stethoscope", ordem: 2 },
      { nome: "Exames", icone: "microscope", ordem: 3 },
      { nome: "Farmácia", icone: "pill", ordem: 4 },
      { nome: "Academia / Esportes", icone: "dumbbell", ordem: 5 },
      { nome: "Terapia / Psicólogo", icone: "brain", ordem: 6 },
      { nome: "Odontológico", icone: "smile", ordem: 7 },
    ],
  },
  {
    nome: "Educação",
    icone: "graduation-cap",
    subcategorias: [
      { nome: "Mensalidade Faculdade", icone: "university", ordem: 1 },
      { nome: "Curso / Certificação", icone: "book-open", ordem: 2 },
      { nome: "Material Escolar", icone: "pencil", ordem: 3 },
      { nome: "Livros", icone: "book", ordem: 4 },
      { nome: "Escola dos Filhos", icone: "school", ordem: 5 },
    ],
  },
  {
    nome: "Lazer",
    icone: "party-popper",
    subcategorias: [
      { nome: "Cinema / Teatro", icone: "film", ordem: 1 },
      { nome: "Show / Evento", icone: "music", ordem: 2 },
      { nome: "Viagem", icone: "plane", ordem: 3 },
      { nome: "Streaming", icone: "tv", ordem: 4 },
      { nome: "Jogos", icone: "gamepad-2", ordem: 5 },
      { nome: "Hobbies", icone: "palette", ordem: 6 },
    ],
  },
  {
    nome: "Vestuário",
    icone: "shirt",
    subcategorias: [
      { nome: "Roupas", icone: "shirt", ordem: 1 },
      { nome: "Calçados", icone: "footprints", ordem: 2 },
      { nome: "Acessórios", icone: "watch", ordem: 3 },
    ],
  },
  {
    nome: "Pets",
    icone: "paw-print",
    subcategorias: [
      { nome: "Ração", icone: "bone", ordem: 1 },
      { nome: "Veterinário", icone: "stethoscope", ordem: 2 },
      { nome: "Banho / Tosa", icone: "scissors", ordem: 3 },
      { nome: "Medicamentos", icone: "pill", ordem: 4 },
      { nome: "Acessórios", icone: "shopping-bag", ordem: 5 },
    ],
  },
  {
    nome: "Filhos",
    icone: "baby",
    subcategorias: [
      { nome: "Escola / Creche", icone: "school", ordem: 1 },
      { nome: "Material Escolar", icone: "pencil", ordem: 2 },
      { nome: "Atividades Extracurriculares", icone: "music", ordem: 3 },
      { nome: "Vestuário", icone: "shirt", ordem: 4 },
      { nome: "Saúde", icone: "heart-pulse", ordem: 5 },
      { nome: "Brinquedos", icone: "toy-brick", ordem: 6 },
    ],
  },
  {
    nome: "Investimentos",
    icone: "trending-up",
    subcategorias: [
      { nome: "CDB / LCI / LCA", icone: "piggy-bank", ordem: 1 },
      { nome: "Ações", icone: "bar-chart", ordem: 2 },
      { nome: "Fundos", icone: "briefcase", ordem: 3 },
      { nome: "Tesouro Direto", icone: "landmark", ordem: 4 },
      { nome: "Cripto", icone: "bitcoin", ordem: 5 },
      { nome: "Previdência", icone: "shield", ordem: 6 },
      { nome: "Poupança", icone: "piggy-bank", ordem: 7 },
    ],
  },
  {
    nome: "Dívidas",
    icone: "credit-card",
    subcategorias: [
      { nome: "Cartão de Crédito", icone: "credit-card", ordem: 1 },
      { nome: "Empréstimo Pessoal", icone: "hand-coins", ordem: 2 },
      { nome: "Financiamento", icone: "home", ordem: 3 },
      { nome: "Cheque Especial", icone: "alert-circle", ordem: 4 },
    ],
  },
  {
    nome: "Pessoal",
    icone: "user",
    subcategorias: [
      { nome: "Cabeleireiro / Estética", icone: "scissors", ordem: 1 },
      { nome: "Cosméticos", icone: "sparkles", ordem: 2 },
      { nome: "Assinaturas", icone: "repeat", ordem: 3 },
      { nome: "Presentes", icone: "gift", ordem: 4 },
      { nome: "Serviços / Freelance", icone: "briefcase", ordem: 5 },
    ],
  },
];

// ─── MerchantRules globais ────────────────────────────────────────────────────

type MerchantRuleInput = {
  keyword: string;
  categoriaNome: string;
  subcategoriaNome?: string;
};

const merchantRuleInputs: MerchantRuleInput[] = [
  { keyword: "ifood", categoriaNome: "Alimentação", subcategoriaNome: "Delivery" },
  { keyword: "rappi", categoriaNome: "Alimentação", subcategoriaNome: "Delivery" },
  { keyword: "uber eats", categoriaNome: "Alimentação", subcategoriaNome: "Delivery" },
  { keyword: "uber", categoriaNome: "Transporte", subcategoriaNome: "Uber / 99" },
  { keyword: "99 app", categoriaNome: "Transporte", subcategoriaNome: "Uber / 99" },
  { keyword: "shell", categoriaNome: "Transporte", subcategoriaNome: "Combustível" },
  { keyword: "petrobras", categoriaNome: "Transporte", subcategoriaNome: "Combustível" },
  { keyword: "ipiranga", categoriaNome: "Transporte", subcategoriaNome: "Combustível" },
  { keyword: "carrefour", categoriaNome: "Alimentação", subcategoriaNome: "Supermercado" },
  { keyword: "extra", categoriaNome: "Alimentação", subcategoriaNome: "Supermercado" },
  { keyword: "pao de acucar", categoriaNome: "Alimentação", subcategoriaNome: "Supermercado" },
  { keyword: "hortifruti", categoriaNome: "Alimentação", subcategoriaNome: "Feira / Hortifruti" },
  { keyword: "drogasil", categoriaNome: "Saúde", subcategoriaNome: "Farmácia" },
  { keyword: "droga raia", categoriaNome: "Saúde", subcategoriaNome: "Farmácia" },
  { keyword: "netflix", categoriaNome: "Lazer", subcategoriaNome: "Streaming" },
  { keyword: "spotify", categoriaNome: "Lazer", subcategoriaNome: "Streaming" },
  { keyword: "disney+", categoriaNome: "Lazer", subcategoriaNome: "Streaming" },
  { keyword: "amazon prime", categoriaNome: "Lazer", subcategoriaNome: "Streaming" },
  { keyword: "enel", categoriaNome: "Moradia", subcategoriaNome: "Luz / Energia" },
  { keyword: "cemig", categoriaNome: "Moradia", subcategoriaNome: "Luz / Energia" },
  { keyword: "sabesp", categoriaNome: "Moradia", subcategoriaNome: "Água" },
  { keyword: "smart fit", categoriaNome: "Saúde", subcategoriaNome: "Academia / Esportes" },
  { keyword: "gympass", categoriaNome: "Saúde", subcategoriaNome: "Academia / Esportes" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

function thisMonth(day: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day);
}

function monthsAgo(n: number, day = 1) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, day);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // ── 1. Categorias ──────────────────────────────────────────────────────────
  const categoriaMap: Record<string, { id: string; subcategorias: Record<string, string> }> = {};

  for (const cat of categorias) {
    const catId = `seed-cat-${cat.nome.toLowerCase().replace(/\s/g, "-")}`;
    const categoria = await prisma.category.upsert({
      where: { id: catId },
      update: { nome: cat.nome, icone: cat.icone },
      create: { id: catId, nome: cat.nome, icone: cat.icone, tipo: "PADRAO" },
    });

    categoriaMap[cat.nome] = { id: categoria.id, subcategorias: {} };

    for (const sub of cat.subcategorias) {
      const subId = `seed-sub-${cat.nome.toLowerCase().replace(/\s/g, "-")}-${sub.nome.toLowerCase().replace(/[\s/]/g, "-")}`;
      const subcategoria = await prisma.subcategory.upsert({
        where: { id: subId },
        update: { nome: sub.nome, icone: sub.icone, ordem: sub.ordem },
        create: { id: subId, categoriaId: categoria.id, nome: sub.nome, icone: sub.icone, ordem: sub.ordem },
      });
      categoriaMap[cat.nome].subcategorias[sub.nome] = subcategoria.id;
    }

    console.log(`  ✅ ${cat.nome}`);
  }

  // ── 2. MerchantRules ───────────────────────────────────────────────────────
  let rulesCreated = 0;
  for (const rule of merchantRuleInputs) {
    const catEntry = categoriaMap[rule.categoriaNome];
    if (!catEntry) continue;
    const subId = rule.subcategoriaNome ? catEntry.subcategorias[rule.subcategoriaNome] : undefined;
    const ruleId = `seed-rule-${rule.keyword.replace(/[\s/+]/g, "-")}`;
    await prisma.merchantRule.upsert({
      where: { id: ruleId },
      update: { categoriaId: catEntry.id, subcategoriaId: subId ?? null },
      create: { id: ruleId, keyword: rule.keyword, categoriaId: catEntry.id, subcategoriaId: subId ?? null, source: MerchantRuleSource.SISTEMA },
    });
    rulesCreated++;
  }
  console.log(`\n  ✅ ${rulesCreated} MerchantRules criadas`);

  // ── 3. Usuários de teste ───────────────────────────────────────────────────
  console.log("\n👤 Criando usuários de teste...");

  const senhaAdmin = await hash("admin123456", 10);
  const senhaComum = await hash("senha123456", 10);

  // Admin — Premium, Solo
  const admin = await prisma.user.upsert({
    where: { email: "admin@wee.dev" },
    update: {},
    create: {
      id: "seed-user-admin",
      nome: "Admin",
      email: "admin@wee.dev",
      senhaHash: senhaAdmin,
      plano: "PREMIUM",
      perfilFinanceiro: "POUPADOR",
      onboardingCompleto: true,
    },
  });

  // João — FREE, Casal (userA)
  const joao = await prisma.user.upsert({
    where: { email: "joao@wee.dev" },
    update: {},
    create: {
      id: "seed-user-joao",
      nome: "João Silva",
      email: "joao@wee.dev",
      senhaHash: senhaComum,
      plano: "FREE",
      perfilFinanceiro: "VISIONARIO",
      onboardingCompleto: true,
    },
  });

  // Ana — FREE, Casal (userB)
  const ana = await prisma.user.upsert({
    where: { email: "ana@wee.dev" },
    update: {},
    create: {
      id: "seed-user-ana",
      nome: "Ana Costa",
      email: "ana@wee.dev",
      senhaHash: senhaComum,
      plano: "FREE",
      perfilFinanceiro: "POUPADOR",
      onboardingCompleto: true,
    },
  });

  // Casal João + Ana
  const couple = await prisma.couple.upsert({
    where: { id: "seed-couple-joao-ana" },
    update: {},
    create: {
      id: "seed-couple-joao-ana",
      userAId: joao.id,
      userBId: ana.id,
      divisaoTipo: "PROPORCIONAL",
      inviteCode: "WEETEST2026",
      status: "ATIVO",
    },
  });

  // Vincular coupleId nos usuários
  await prisma.user.update({ where: { id: joao.id }, data: { coupleId: couple.id } });
  await prisma.user.update({ where: { id: ana.id }, data: { coupleId: couple.id } });

  console.log("  ✅ admin@wee.dev (Premium · Solo)        senha: admin123456");
  console.log("  ✅ joao@wee.dev  (Free · Casal)          senha: senha123456");
  console.log("  ✅ ana@wee.dev   (Free · Casal)          senha: senha123456");

  // ── 4. Rendas ──────────────────────────────────────────────────────────────
  console.log("\n💰 Criando rendas...");

  const mesRef = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  await prisma.income.createMany({
    skipDuplicates: true,
    data: [
      // Admin
      { id: "seed-income-admin-1", userId: admin.id, valor: 12000, tipo: "FIXO", descricao: "Salário", mesReferencia: mesRef },
      // João
      { id: "seed-income-joao-1", userId: joao.id, valor: 7500, tipo: "FIXO", descricao: "Salário CLT", mesReferencia: mesRef },
      { id: "seed-income-joao-2", userId: joao.id, valor: 1200, tipo: "VARIAVEL", descricao: "Freelance", mesReferencia: mesRef },
      // Ana
      { id: "seed-income-ana-1", userId: ana.id, valor: 5800, tipo: "FIXO", descricao: "Salário", mesReferencia: mesRef },
    ],
  });

  // ── 5. Transações (mês atual + últimos 5 meses) ────────────────────────────
  console.log("💳 Criando transações...");

  const catAlim = categoriaMap["Alimentação"].id;
  const catMor  = categoriaMap["Moradia"].id;
  const catTrans = categoriaMap["Transporte"].id;
  const catSaude = categoriaMap["Saúde"].id;
  const catLazer = categoriaMap["Lazer"].id;
  const catPes  = categoriaMap["Pessoal"].id;

  const subSuper = categoriaMap["Alimentação"].subcategorias["Supermercado"];
  const subAlug  = categoriaMap["Moradia"].subcategorias["Aluguel"];
  const subCond  = categoriaMap["Moradia"].subcategorias["Condomínio"];
  const subUber  = categoriaMap["Transporte"].subcategorias["Uber / 99"];
  const subComb  = categoriaMap["Transporte"].subcategorias["Combustível"];
  const subAcad  = categoriaMap["Saúde"].subcategorias["Academia / Esportes"];
  const subStream = categoriaMap["Lazer"].subcategorias["Streaming"];
  const subRest  = categoriaMap["Alimentação"].subcategorias["Restaurante"];
  const subDel   = categoriaMap["Alimentação"].subcategorias["Delivery"];

  // Transações Admin (solo) — mês atual
  await prisma.transaction.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-tx-admin-01", userId: admin.id, valor: 12000, tipo: "RECEITA", escopo: "INDIVIDUAL", categoriaId: null, descricao: "Salário", data: thisMonth(5) },
      { id: "seed-tx-admin-02", userId: admin.id, valor: 2800, tipo: "DESPESA", escopo: "INDIVIDUAL", categoriaId: catMor, subcategoriaId: subAlug, descricao: "Aluguel", data: thisMonth(10) },
      { id: "seed-tx-admin-03", userId: admin.id, valor: 680, tipo: "DESPESA", escopo: "INDIVIDUAL", categoriaId: catAlim, subcategoriaId: subSuper, descricao: "Supermercado", data: thisMonth(8) },
      { id: "seed-tx-admin-04", userId: admin.id, valor: 420, tipo: "DESPESA", escopo: "INDIVIDUAL", categoriaId: catAlim, subcategoriaId: subRest, descricao: "Almoço de negócios", data: thisMonth(12) },
      { id: "seed-tx-admin-05", userId: admin.id, valor: 180, tipo: "DESPESA", escopo: "INDIVIDUAL", categoriaId: catTrans, subcategoriaId: subUber, descricao: "Uber semana", data: thisMonth(14) },
      { id: "seed-tx-admin-06", userId: admin.id, valor: 120, tipo: "DESPESA", escopo: "INDIVIDUAL", categoriaId: catLazer, subcategoriaId: subStream, descricao: "Netflix + Spotify", data: thisMonth(6) },
      { id: "seed-tx-admin-07", userId: admin.id, valor: 320, tipo: "DESPESA", escopo: "INDIVIDUAL", categoriaId: catSaude, subcategoriaId: subAcad, descricao: "Academia", data: thisMonth(1) },
    ],
  });

  // Transações casal — 6 meses (incluindo mês atual)
  const txCasal = [];
  for (let m = 5; m >= 0; m--) {
    const base = monthsAgo(m);
    const yr = base.getFullYear();
    const mo = base.getMonth() + 1;

    // Receita João
    txCasal.push({ id: `seed-tx-joao-sal-${m}`, userId: joao.id, coupleId: couple.id, valor: 7500, tipo: "RECEITA" as const, escopo: "INDIVIDUAL" as const, descricao: "Salário", data: d(yr, mo, 5) });
    if (m <= 1) txCasal.push({ id: `seed-tx-joao-free-${m}`, userId: joao.id, coupleId: couple.id, valor: 1200, tipo: "RECEITA" as const, escopo: "INDIVIDUAL" as const, descricao: "Freelance", data: d(yr, mo, 15) });

    // Receita Ana
    txCasal.push({ id: `seed-tx-ana-sal-${m}`, userId: ana.id, coupleId: couple.id, valor: 5800, tipo: "RECEITA" as const, escopo: "INDIVIDUAL" as const, descricao: "Salário", data: d(yr, mo, 5) });

    // Despesas compartilhadas
    txCasal.push({ id: `seed-tx-comp-alug-${m}`, userId: joao.id, coupleId: couple.id, valor: 2200, tipo: "DESPESA" as const, escopo: "COMPARTILHADA" as const, categoriaId: catMor, subcategoriaId: subAlug, descricao: "Aluguel", data: d(yr, mo, 10) });
    txCasal.push({ id: `seed-tx-comp-cond-${m}`, userId: joao.id, coupleId: couple.id, valor: 480, tipo: "DESPESA" as const, escopo: "COMPARTILHADA" as const, categoriaId: catMor, subcategoriaId: subCond, descricao: "Condomínio", data: d(yr, mo, 10) });
    txCasal.push({ id: `seed-tx-comp-super-${m}`, userId: ana.id, coupleId: couple.id, valor: 620 + m * 30, tipo: "DESPESA" as const, escopo: "COMPARTILHADA" as const, categoriaId: catAlim, subcategoriaId: subSuper, descricao: "Supermercado", data: d(yr, mo, 15) });
    txCasal.push({ id: `seed-tx-comp-del-${m}`, userId: joao.id, coupleId: couple.id, valor: 180 + m * 10, tipo: "DESPESA" as const, escopo: "COMPARTILHADA" as const, categoriaId: catAlim, subcategoriaId: subDel, descricao: "iFood semana", data: d(yr, mo, 20) });

    // Despesas individuais João
    txCasal.push({ id: `seed-tx-joao-comb-${m}`, userId: joao.id, coupleId: couple.id, valor: 350, tipo: "DESPESA" as const, escopo: "INDIVIDUAL" as const, categoriaId: catTrans, subcategoriaId: subComb, descricao: "Combustível", data: d(yr, mo, 12) });
    txCasal.push({ id: `seed-tx-joao-acad-${m}`, userId: joao.id, coupleId: couple.id, valor: 99, tipo: "DESPESA" as const, escopo: "INDIVIDUAL" as const, categoriaId: catSaude, subcategoriaId: subAcad, descricao: "Academia", data: d(yr, mo, 1) });

    // Despesas individuais Ana
    txCasal.push({ id: `seed-tx-ana-est-${m}`, userId: ana.id, coupleId: couple.id, valor: 280, tipo: "DESPESA" as const, escopo: "INDIVIDUAL" as const, categoriaId: catPes, descricao: "Cabeleireiro / Estética", data: d(yr, mo, 18) });
    txCasal.push({ id: `seed-tx-ana-uber-${m}`, userId: ana.id, coupleId: couple.id, valor: 120, tipo: "DESPESA" as const, escopo: "INDIVIDUAL" as const, categoriaId: catTrans, subcategoriaId: subUber, descricao: "Uber", data: d(yr, mo, 22) });
  }

  await prisma.transaction.createMany({ skipDuplicates: true, data: txCasal });

  // ── 6. Metas ───────────────────────────────────────────────────────────────
  console.log("🎯 Criando metas...");

  const goalEmergAdmin = await prisma.goal.upsert({
    where: { id: "seed-goal-admin-emerg" },
    update: {},
    create: { id: "seed-goal-admin-emerg", userId: admin.id, nome: "Reserva de Emergência", tipo: "EMERGENCIA", valorAlvo: 72000, valorAtual: 28000, status: "ATIVA", prazo: d(2026, 12, 31) },
  });
  await prisma.goal.upsert({
    where: { id: "seed-goal-admin-apto" },
    update: {},
    create: { id: "seed-goal-admin-apto", userId: admin.id, nome: "Entrada do Apartamento", tipo: "IMOVEL", valorAlvo: 120000, valorAtual: 45000, status: "ATIVA", prazo: d(2028, 6, 1) },
  });
  await prisma.goal.upsert({
    where: { id: "seed-goal-admin-viagem" },
    update: {},
    create: { id: "seed-goal-admin-viagem", userId: admin.id, nome: "Viagem Europa", tipo: "VIAGEM", valorAlvo: 25000, valorAtual: 18500, status: "ATIVA", prazo: d(2026, 11, 1) },
  });

  const goalEmergCouple = await prisma.goal.upsert({
    where: { id: "seed-goal-casal-emerg" },
    update: {},
    create: { id: "seed-goal-casal-emerg", userId: joao.id, coupleId: couple.id, nome: "Reserva de Emergência", tipo: "EMERGENCIA", valorAlvo: 50000, valorAtual: 12000, status: "ATIVA" },
  });
  await prisma.goal.upsert({
    where: { id: "seed-goal-casal-casa" },
    update: {},
    create: { id: "seed-goal-casal-casa", userId: joao.id, coupleId: couple.id, nome: "Casa Própria", tipo: "IMOVEL", valorAlvo: 200000, valorAtual: 35000, status: "ATIVA", prazo: d(2030, 1, 1) },
  });
  await prisma.goal.upsert({
    where: { id: "seed-goal-casal-casamento" },
    update: {},
    create: { id: "seed-goal-casal-casamento", userId: ana.id, coupleId: couple.id, nome: "Casamento", tipo: "CASAMENTO", valorAlvo: 40000, valorAtual: 8200, status: "ATIVA", prazo: d(2027, 6, 1) },
  });

  // Contribuições de metas neste mês
  const hoje = new Date();
  await prisma.goalContribution.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-contrib-admin-1", goalId: goalEmergAdmin.id, userId: admin.id, valor: 2000, data: thisMonth(5) },
      { id: "seed-contrib-casal-1", goalId: goalEmergCouple.id, userId: joao.id, valor: 800, data: thisMonth(5) },
      { id: "seed-contrib-casal-2", goalId: goalEmergCouple.id, userId: ana.id, valor: 500, data: thisMonth(5) },
    ],
  });

  // ── 7. Dívidas ─────────────────────────────────────────────────────────────
  console.log("📋 Criando dívidas...");

  const today = new Date();
  const diaVenc3 = ((today.getDate() + 3) % 28) || 28;
  const diaVenc5 = ((today.getDate() + 5) % 28) || 28;

  await prisma.debt.createMany({
    skipDuplicates: true,
    data: [
      // Admin
      { id: "seed-debt-admin-1", userId: admin.id, nome: "Cartão Nubank", valorTotal: 8500, valorRestante: 8500, taxaJuros: 2.49, vencimentoDia: diaVenc3, estrategia: "AVALANCHE" },
      { id: "seed-debt-admin-2", userId: admin.id, nome: "Empréstimo Carro", valorTotal: 45000, valorRestante: 28000, parcelasTotal: 48, parcelasPagas: 20, taxaJuros: 1.29, vencimentoDia: diaVenc5, estrategia: "AVALANCHE" },
      // Casal
      { id: "seed-debt-casal-1", userId: joao.id, coupleId: couple.id, nome: "Cartão Itaú", valorTotal: 4200, valorRestante: 4200, taxaJuros: 2.99, vencimentoDia: diaVenc3, estrategia: "AVALANCHE" },
      { id: "seed-debt-casal-2", userId: joao.id, coupleId: couple.id, nome: "Financiamento Moto", valorTotal: 18000, valorRestante: 11500, parcelasTotal: 36, parcelasPagas: 14, taxaJuros: 1.59, vencimentoDia: diaVenc5, estrategia: "BOLA_DE_NEVE" },
    ],
  });

  // ── 8. Assets (para score de diversificação) ───────────────────────────────
  console.log("📈 Criando ativos...");

  await prisma.asset.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-asset-admin-1", userId: admin.id, nome: "Tesouro Selic 2029", tipo: "RENDA_FIXA", valorAtual: 32000, valorInvestido: 28000, ativo: true },
      { id: "seed-asset-admin-2", userId: admin.id, nome: "BOVA11", tipo: "RENDA_VARIAVEL", valorAtual: 8500, valorInvestido: 7000, ativo: true },
      { id: "seed-asset-admin-3", userId: admin.id, nome: "Poupança Itaú", tipo: "POUPANCA", valorAtual: 4200, valorInvestido: 4200, ativo: true },
      { id: "seed-asset-casal-1", userId: joao.id, coupleId: couple.id, nome: "CDB 120% CDI", tipo: "RENDA_FIXA", valorAtual: 9800, valorInvestido: 9000, ativo: true },
      { id: "seed-asset-casal-2", userId: joao.id, coupleId: couple.id, nome: "PETR4", tipo: "RENDA_VARIAVEL", valorAtual: 3200, valorInvestido: 2800, ativo: true },
    ],
  });

  // ── 9. Check-in do casal no mês atual ──────────────────────────────────────
  await prisma.checkIn.upsert({
    where: { id: "seed-checkin-casal-1" },
    update: {},
    create: { id: "seed-checkin-casal-1", coupleId: couple.id, data: thisMonth(1), sentimentoA: 4, sentimentoB: 5 },
  });

  console.log("\n✨ Seed concluído com sucesso!");
  console.log("\n┌─────────────────────────────────────────────────────────┐");
  console.log("│  USUÁRIOS DE TESTE                                      │");
  console.log("├──────────────────────┬────────────────┬─────────────────┤");
  console.log("│  Email               │  Senha         │  Perfil         │");
  console.log("├──────────────────────┼────────────────┼─────────────────┤");
  console.log("│  admin@wee.dev       │  admin123456   │  Premium · Solo │");
  console.log("│  joao@wee.dev        │  senha123456   │  Free · Casal ♂ │");
  console.log("│  ana@wee.dev         │  senha123456   │  Free · Casal ♀ │");
  console.log("└──────────────────────┴────────────────┴─────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
