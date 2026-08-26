import { BankAccount, Category, CompanyProfile, Contact, CostCenter, Transaction } from '../types';

export const initialCompanyProfile: CompanyProfile = {
  name: 'PROSPER Soluções Corporativas Ltda',
  tradeName: 'PROSPER',
  slogan: 'Gestão financeira inteligente para seu negócio',
  document: '34.892.110/0001-95',
  email: 'financeiro@prosper.com.br',
  phone: '(11) 3456-7890',
  address: 'Av. Paulista, 1800 - 14º Andar - Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-200',
  currency: 'BRL',
  fiscalRegime: 'simples',
  logoUrl: '',
};

export const initialBankAccounts: BankAccount[] = [
  {
    id: 'acc-itau',
    name: 'Itaú Unibanco PJ',
    bankCode: '341',
    bankName: 'Banco Itaú',
    accountNumber: '48291-5',
    agency: '0854',
    type: 'checking',
    initialBalance: 125000.0,
    currentBalance: 148350.0,
    color: '#EC7000',
    icon: 'Landmark',
    isDefault: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-08-21',
  },
  {
    id: 'acc-nubank',
    name: 'Nubank PJ (Reserva 100% CDI)',
    bankCode: '260',
    bankName: 'Nu Pagamentos',
    accountNumber: '984512-1',
    agency: '0001',
    type: 'investment',
    initialBalance: 80000.0,
    currentBalance: 96420.0,
    color: '#820AD1',
    icon: 'TrendingUp',
    isDefault: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-08-21',
  },
  {
    id: 'acc-inter',
    name: 'Banco Inter PJ (Cobrança)',
    bankCode: '077',
    bankName: 'Banco Inter',
    accountNumber: '1589302-8',
    agency: '0001',
    type: 'digital',
    initialBalance: 35000.0,
    currentBalance: 42180.0,
    color: '#FF7A00',
    icon: 'Zap',
    isDefault: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-08-21',
  },
  {
    id: 'acc-caixa-sede',
    name: 'Caixa Físico / Fundo Fixo',
    bankName: 'Caixa Interno',
    type: 'cash',
    initialBalance: 3500.0,
    currentBalance: 2450.0,
    color: '#10B981',
    icon: 'Wallet',
    isDefault: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-08-21',
  },
  {
    id: 'acc-card-corp',
    name: 'Mastercard Black Corporativo',
    bankName: 'Itaú Cartões',
    type: 'credit_card',
    initialBalance: 0,
    currentBalance: -14890.0,
    creditLimit: 50000.0,
    closingDay: 25,
    dueDay: 5,
    color: '#1E293B',
    icon: 'CreditCard',
    isDefault: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-08-21',
  },
];

export const initialCategories: Category[] = [
  // RECEITAS
  {
    id: 'cat-rec-servicos',
    name: 'Prestação de Serviços & Contratos',
    type: 'income',
    color: '#10B981',
    icon: 'Briefcase',
    group: 'Receita Operacional Bruta',
    isSystem: true,
    budgetMonthly: 120000,
  },
  {
    id: 'cat-rec-saas',
    name: 'Mensalidades / SaaS Recorrente',
    type: 'income',
    color: '#059669',
    icon: 'Repeat',
    group: 'Receita Operacional Bruta',
    isSystem: true,
    budgetMonthly: 65000,
  },
  {
    id: 'cat-rec-consultoria',
    name: 'Consultoria e Projetos Especiais',
    type: 'income',
    color: '#34D399',
    icon: 'Award',
    group: 'Receita Operacional Bruta',
    isSystem: true,
    budgetMonthly: 30000,
  },
  {
    id: 'cat-rec-financeira',
    name: 'Rendimentos de Aplicações Financeiras',
    type: 'income',
    color: '#6EE7B7',
    icon: 'Percent',
    group: 'Receitas Financeiras',
    isSystem: true,
    budgetMonthly: 3500,
  },
  {
    id: 'cat-rec-outras',
    name: 'Outras Receitas e Reembolsos',
    type: 'income',
    color: '#A7F3D0',
    icon: 'PlusCircle',
    group: 'Outras Receitas',
    isSystem: false,
    budgetMonthly: 2000,
  },

  // CUSTOS VARIÁVEIS / DEDUÇÕES
  {
    id: 'cat-desp-impostos-vendas',
    name: 'Impostos sobre Faturamento (Simples/ISS)',
    type: 'expense',
    color: '#F43F5E',
    icon: 'Receipt',
    group: 'Deduções da Receita Bruta',
    isSystem: true,
    budgetMonthly: 16000,
  },
  {
    id: 'cat-desp-gateway',
    name: 'Taxas de Meios de Pagamento & Gateway',
    type: 'expense',
    color: '#FB7185',
    icon: 'CreditCard',
    group: 'Custos Variáveis',
    isSystem: true,
    budgetMonthly: 3500,
  },
  {
    id: 'cat-desp-cloud',
    name: 'Servidores em Nuvem & Infra (AWS/GCP)',
    type: 'expense',
    color: '#E11D48',
    icon: 'Server',
    group: 'Custos dos Serviços Prestados',
    isSystem: true,
    budgetMonthly: 9000,
  },

  // DESPESAS OPERACIONAIS / FIXAS
  {
    id: 'cat-desp-salarios',
    name: 'Folha de Pagamento & Salários',
    type: 'expense',
    color: '#EF4444',
    icon: 'Users',
    group: 'Despesas com Pessoal',
    isSystem: true,
    budgetMonthly: 55000,
  },
  {
    id: 'cat-desp-pro-labore',
    name: 'Pró-Labore da Diretoria',
    type: 'expense',
    color: '#DC2626',
    icon: 'UserCheck',
    group: 'Despesas com Pessoal',
    isSystem: true,
    budgetMonthly: 25000,
  },
  {
    id: 'cat-desp-beneficios',
    name: 'Benefícios (VR, VT, Plano de Saúde)',
    type: 'expense',
    color: '#B91C1C',
    icon: 'HeartPulse',
    group: 'Despesas com Pessoal',
    isSystem: true,
    budgetMonthly: 12000,
  },
  {
    id: 'cat-desp-aluguel',
    name: 'Aluguel & Condomínio Comercial',
    type: 'expense',
    color: '#F97316',
    icon: 'Building2',
    group: 'Despesas Administrativas',
    isSystem: true,
    budgetMonthly: 8500,
  },
  {
    id: 'cat-desp-utilidades',
    name: 'Energia, Água, Internet & Telefonia',
    type: 'expense',
    color: '#EA580C',
    icon: 'Zap',
    group: 'Despesas Administrativas',
    isSystem: true,
    budgetMonthly: 2200,
  },
  {
    id: 'cat-desp-marketing',
    name: 'Marketing Digital, Tráfego Pago & Eventos',
    type: 'expense',
    color: '#8B5CF6',
    icon: 'Megaphone',
    group: 'Despesas Comerciais',
    isSystem: true,
    budgetMonthly: 15000,
  },
  {
    id: 'cat-desp-softwares',
    name: 'Softwares, Ferramentas & Licenças',
    type: 'expense',
    color: '#6366F1',
    icon: 'Laptop',
    group: 'Despesas Administrativas',
    isSystem: true,
    budgetMonthly: 6000,
  },
  {
    id: 'cat-desp-contabilidade',
    name: 'Honorários Contábeis e Jurídicos',
    type: 'expense',
    color: '#3B82F6',
    icon: 'Scale',
    group: 'Despesas Administrativas',
    isSystem: true,
    budgetMonthly: 3800,
  },
  {
    id: 'cat-desp-bancarias',
    name: 'Tarifas Bancárias e Juros',
    type: 'expense',
    color: '#64748B',
    icon: 'Landmark',
    group: 'Despesas Financeiras',
    isSystem: true,
    budgetMonthly: 800,
  },
];

export const initialCostCenters: CostCenter[] = [
  {
    id: 'cc-100',
    code: '100',
    name: 'Administrativo & Diretoria',
    description: 'Gestão geral, RH, jurídico e financeiro',
    budgetMonthly: 35000,
    isActive: true,
  },
  {
    id: 'cc-200',
    code: '200',
    name: 'Tecnologia & Produto',
    description: 'Engenharia de software, design, infra e IA',
    budgetMonthly: 70000,
    isActive: true,
  },
  {
    id: 'cc-300',
    code: '300',
    name: 'Comercial & Marketing',
    description: 'Aquisição de clientes, campanhas e branding',
    budgetMonthly: 30000,
    isActive: true,
  },
  {
    id: 'cc-400',
    code: '400',
    name: 'Sucesso do Cliente (CS)',
    description: 'Suporte, implantação e retenção',
    budgetMonthly: 18000,
    isActive: true,
  },
];

export const initialContacts: Contact[] = [
  // Clientes
  {
    id: 'cont-cli-1',
    name: 'TechSolvers Brasil Sistemas Ltda',
    tradeName: 'TechSolvers',
    type: 'customer',
    document: '18.492.301/0001-80',
    email: 'financeiro@techsolvers.com.br',
    phone: '(11) 98765-4321',
    pixKey: '18492301000180',
    address: 'Rua Funchal, 418 - Vila Olímpia',
    city: 'São Paulo',
    state: 'SP',
    creditLimit: 100000,
    createdAt: '2026-01-10',
  },
  {
    id: 'cont-cli-2',
    name: 'Alpha Logística Integrada S.A.',
    tradeName: 'Alpha Log',
    type: 'customer',
    document: '05.213.987/0001-12',
    email: 'contasapagar@alphalog.com.br',
    phone: '(19) 3210-9988',
    pixKey: 'contasapagar@alphalog.com.br',
    address: 'Av. John Boyd Dunlop, 1500',
    city: 'Campinas',
    state: 'SP',
    creditLimit: 80000,
    createdAt: '2026-01-15',
  },
  {
    id: 'cont-cli-3',
    name: 'Nexus Varejo Digital Eireli',
    tradeName: 'Nexus Store',
    type: 'customer',
    document: '29.384.102/0001-44',
    email: 'pagamentos@nexusvarejo.com.br',
    phone: '(21) 97654-1122',
    pixKey: '29384102000144',
    address: 'Praça Mauá, 1 - Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
    creditLimit: 60000,
    createdAt: '2026-02-01',
  },
  {
    id: 'cont-cli-4',
    name: 'Construtora Horizonte Nobre Ltda',
    tradeName: 'Horizonte Engenharia',
    type: 'customer',
    document: '12.876.543/0001-90',
    email: 'tesouraria@horizonte.eng.br',
    phone: '(31) 3344-5566',
    pixKey: '12876543000190',
    address: 'Rua da Bahia, 1200 - Lourdes',
    city: 'Belo Horizonte',
    state: 'MG',
    creditLimit: 120000,
    createdAt: '2026-02-15',
  },

  // Fornecedores
  {
    id: 'cont-forn-1',
    name: 'Amazon Web Services do Brasil Ltda',
    tradeName: 'AWS Cloud',
    type: 'supplier',
    document: '15.419.093/0001-03',
    email: 'billing-br@amazon.com',
    phone: '(11) 3958-5200',
    address: 'Av. Presidente Juscelino Kubitschek, 2041',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2026-01-05',
  },
  {
    id: 'cont-forn-2',
    name: 'Escritório Paulista de Contabilidade S/S',
    tradeName: 'Paulista Contábil',
    type: 'supplier',
    document: '60.872.190/0001-33',
    email: 'atendimento@paulistacontabil.com.br',
    phone: '(11) 3284-9000',
    pixKey: '60872190000133',
    address: 'Rua Augusta, 1500 - Consolação',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2026-01-05',
  },
  {
    id: 'cont-forn-3',
    name: 'Paulista Prime Empreendimentos Imobiliários S.A.',
    tradeName: 'Paulista Tower Condomínio',
    type: 'supplier',
    document: '51.902.341/0001-77',
    email: 'administracao@paulistaprime.com.br',
    phone: '(11) 3140-5000',
    pixKey: '51902341000177',
    address: 'Av. Paulista, 1800 - Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2026-01-05',
  },
  {
    id: 'cont-forn-4',
    name: 'Meta Platforms Inc & Google Ads Brasil',
    tradeName: 'Tráfego Pago (Google & Meta)',
    type: 'supplier',
    document: '06.990.590/0001-23',
    email: 'invoices@googleads.com',
    phone: '(11) 2395-8400',
    address: 'Av. Brigadeiro Faria Lima, 3477',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2026-01-05',
  },
];

// Helper to generate seed transactions with realistic timeline
export function generateSeedTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const today = '2026-08-21';

  // Months 2026-03 to 2026-08 (and future projections to 2026-09)
  const months = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

  let idCounter = 1;
  const nextId = () => `txn-${String(idCounter++).padStart(5, '0')}`;

  months.forEach((month, mIndex) => {
    const isPast = mIndex < 5; // Mar, Apr, May, Jun, Jul are fully past
    const isCurrent = mIndex === 5; // Aug is current
    const isFuture = mIndex === 6; // Sep is future

    // 1. Receita Recorrente TechSolvers
    const techDue = `${month}-05`;
    const techPaid = isPast || (isCurrent && techDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Mensalidade Suporte & Plataforma — TechSolvers',
      amount: 28500.0,
      originalAmount: 28500.0,
      type: 'income',
      status: techPaid ? 'paid' : (isCurrent && techDue < today ? 'overdue' : 'pending'),
      categoryId: 'cat-rec-saas',
      accountId: 'acc-itau',
      contactId: 'cont-cli-1',
      costCenterId: 'cc-200',
      dueDate: techDue,
      paymentDate: techPaid ? techDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'pix',
      documentNumber: `NF-${202600 + mIndex * 10 + 1}`,
      tags: ['Contrato', 'Mensalidade', 'Recorrente'],
      reconciled: techPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 2. Receita Alpha Logística
    const alphaDue = `${month}-10`;
    const alphaPaid = isPast || (isCurrent && alphaDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Desenvolvimento e Manutenção de API — Alpha Log',
      amount: 22400.0,
      originalAmount: 22400.0,
      type: 'income',
      status: alphaPaid ? 'paid' : 'pending',
      categoryId: 'cat-rec-servicos',
      accountId: 'acc-inter',
      contactId: 'cont-cli-2',
      costCenterId: 'cc-200',
      dueDate: alphaDue,
      paymentDate: alphaPaid ? alphaDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'boleto',
      documentNumber: `NF-${202600 + mIndex * 10 + 2}`,
      tags: ['Serviços', 'Contrato'],
      reconciled: alphaPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 3. Receita Nexus Varejo
    const nexusDue = `${month}-15`;
    const nexusPaid = isPast || (isCurrent && nexusDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Licenciamento Enterprise Nexus Store',
      amount: 19800.0,
      originalAmount: 19800.0,
      type: 'income',
      status: nexusPaid ? 'paid' : 'pending',
      categoryId: 'cat-rec-saas',
      accountId: 'acc-itau',
      contactId: 'cont-cli-3',
      costCenterId: 'cc-300',
      dueDate: nexusDue,
      paymentDate: nexusPaid ? nexusDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'bank_transfer',
      documentNumber: `NF-${202600 + mIndex * 10 + 3}`,
      tags: ['Enterprise', 'SaaS'],
      reconciled: nexusPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 4. Receita Consultoria Horizonte (Meses pares)
    if (mIndex % 2 === 0) {
      const horizDue = `${month}-22`;
      const horizPaid = isPast || (isCurrent && horizDue <= today);
      transactions.push({
        id: nextId(),
        description: 'Consultoria de Transformação Digital — Horizonte',
        amount: 32000.0,
        originalAmount: 32000.0,
        type: 'income',
        status: horizPaid ? 'paid' : (isCurrent && horizDue < today ? 'overdue' : 'pending'),
        categoryId: 'cat-rec-consultoria',
        accountId: 'acc-itau',
        contactId: 'cont-cli-4',
        costCenterId: 'cc-100',
        dueDate: horizDue,
        paymentDate: horizPaid ? horizDue : undefined,
        competenceDate: `${month}-01`,
        paymentMethod: 'pix',
        documentNumber: `NF-${202600 + mIndex * 10 + 4}`,
        tags: ['Consultoria', 'Projeto'],
        reconciled: horizPaid,
        createdAt: `${month}-01T08:00:00Z`,
        updatedAt: `${month}-01T08:00:00Z`,
      });
    }

    // 5. Rendimentos de Aplicação NuBank
    if (!isFuture) {
      transactions.push({
        id: nextId(),
        description: 'Rendimento Automático 100% CDI Nubank PJ',
        amount: 890.50 + mIndex * 45,
        originalAmount: 890.50 + mIndex * 45,
        type: 'income',
        status: 'paid',
        categoryId: 'cat-rec-financeira',
        accountId: 'acc-nubank',
        costCenterId: 'cc-100',
        dueDate: `${month}-28`,
        paymentDate: `${month}-28`,
        competenceDate: `${month}-01`,
        paymentMethod: 'other',
        tags: ['CDI', 'Rendimento'],
        reconciled: true,
        createdAt: `${month}-01T08:00:00Z`,
        updatedAt: `${month}-01T08:00:00Z`,
      });
    }

    // --- DESPESAS MENSAIS ---

    // 6. Folha de Pagamento (Quinto dia útil - dia 05)
    const salDue = `${month}-05`;
    const salPaid = isPast || (isCurrent && salDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Folha de Pagamento dos Colaboradores & Encargos',
      amount: 48500.0,
      originalAmount: 48500.0,
      type: 'expense',
      status: salPaid ? 'paid' : 'pending',
      categoryId: 'cat-desp-salarios',
      accountId: 'acc-itau',
      costCenterId: 'cc-200',
      dueDate: salDue,
      paymentDate: salPaid ? salDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'bank_transfer',
      documentNumber: `FOLHA-${month}`,
      tags: ['Folha', 'Equipe', 'Salários'],
      reconciled: salPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 7. Pró-Labore Sócios (dia 10)
    const proDue = `${month}-10`;
    const proPaid = isPast || (isCurrent && proDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Pró-Labore Diretoria Executiva',
      amount: 22000.0,
      originalAmount: 22000.0,
      type: 'expense',
      status: proPaid ? 'paid' : 'pending',
      categoryId: 'cat-desp-pro-labore',
      accountId: 'acc-itau',
      costCenterId: 'cc-100',
      dueDate: proDue,
      paymentDate: proPaid ? proDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'pix',
      documentNumber: `PL-${month}`,
      tags: ['Diretoria', 'Pró-Labore'],
      reconciled: proPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 8. Aluguel & Condomínio Comercial (dia 10)
    const aluguelDue = `${month}-10`;
    const aluguelPaid = isPast || (isCurrent && aluguelDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Aluguel Sede Paulista & Condomínio Edifício',
      amount: 8250.0,
      originalAmount: 8250.0,
      type: 'expense',
      status: aluguelPaid ? 'paid' : 'pending',
      categoryId: 'cat-desp-aluguel',
      accountId: 'acc-itau',
      contactId: 'cont-forn-3',
      costCenterId: 'cc-100',
      dueDate: aluguelDue,
      paymentDate: aluguelPaid ? aluguelDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'boleto',
      documentNumber: `BOL-${month}-ALUG`,
      tags: ['Sede', 'Fixo', 'Aluguel'],
      reconciled: aluguelPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 9. AWS Cloud Servers (dia 15)
    const awsDue = `${month}-15`;
    const awsPaid = isPast || (isCurrent && awsDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Amazon Web Services — Clusters & Database Cloud',
      amount: 7840.20,
      originalAmount: 7840.20,
      type: 'expense',
      status: awsPaid ? 'paid' : 'pending',
      categoryId: 'cat-desp-cloud',
      accountId: 'acc-card-corp',
      contactId: 'cont-forn-1',
      costCenterId: 'cc-200',
      dueDate: awsDue,
      paymentDate: awsPaid ? awsDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'credit_card',
      documentNumber: `AWS-INV-${mIndex + 100}`,
      tags: ['Cloud', 'DevOps', 'Infra'],
      reconciled: awsPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 10. Tráfego Pago & Marketing Digital (dia 18)
    const mktDue = `${month}-18`;
    const mktPaid = isPast || (isCurrent && mktDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Campanhas de Anúncios Google Ads & LinkedIn Ads',
      amount: 11500.0,
      originalAmount: 11500.0,
      type: 'expense',
      status: mktPaid ? 'paid' : 'pending',
      categoryId: 'cat-desp-marketing',
      accountId: 'acc-card-corp',
      contactId: 'cont-forn-4',
      costCenterId: 'cc-300',
      dueDate: mktDue,
      paymentDate: mktPaid ? mktDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'credit_card',
      documentNumber: `ADS-${month}`,
      tags: ['Growth', 'Ads', 'Marketing'],
      reconciled: mktPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 11. Impostos Simples Nacional / DAS (dia 20)
    const dasDue = `${month}-20`;
    const dasPaid = isPast || (isCurrent && dasDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Guia DAS Simples Nacional — Faturamento Anterior',
      amount: 12450.0,
      originalAmount: 12450.0,
      type: 'expense',
      status: dasPaid ? 'paid' : (isCurrent && dasDue < today ? 'overdue' : 'pending'),
      categoryId: 'cat-desp-impostos-vendas',
      accountId: 'acc-itau',
      costCenterId: 'cc-100',
      dueDate: dasDue,
      paymentDate: dasPaid ? dasDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'boleto',
      documentNumber: `DAS-${month}`,
      tags: ['Tributos', 'DAS', 'Governo'],
      reconciled: dasPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 12. Contabilidade Paulista (dia 25)
    const contDue = `${month}-25`;
    const contPaid = isPast || (isCurrent && contDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Honorários Mensais Contabilidade e BPO Fiscal',
      amount: 3500.0,
      originalAmount: 3500.0,
      type: 'expense',
      status: contPaid ? 'paid' : 'pending',
      categoryId: 'cat-desp-contabilidade',
      accountId: 'acc-itau',
      contactId: 'cont-forn-2',
      costCenterId: 'cc-100',
      dueDate: contDue,
      paymentDate: contPaid ? contDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'pix',
      documentNumber: `NF-CONT-${mIndex + 1}`,
      tags: ['BPO', 'Contabilidade'],
      reconciled: contPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });

    // 13. Softwares & Ferramentas SaaS (Slack, Figma, GitHub, Notion) - dia 28
    const saasDue = `${month}-28`;
    const saasPaid = isPast || (isCurrent && saasDue <= today);
    transactions.push({
      id: nextId(),
      description: 'Licenças de Softwares (GitHub Enterprise, Slack, Figma)',
      amount: 4280.0,
      originalAmount: 4280.0,
      type: 'expense',
      status: saasPaid ? 'paid' : 'pending',
      categoryId: 'cat-desp-softwares',
      accountId: 'acc-card-corp',
      costCenterId: 'cc-200',
      dueDate: saasDue,
      paymentDate: saasPaid ? saasDue : undefined,
      competenceDate: `${month}-01`,
      paymentMethod: 'credit_card',
      tags: ['SaaS', 'Licenças'],
      reconciled: saasPaid,
      createdAt: `${month}-01T08:00:00Z`,
      updatedAt: `${month}-01T08:00:00Z`,
    });
  });

  // Add 1 pending overdue payment in current month for realistic alerting
  transactions.push({
    id: nextId(),
    description: 'Manutenção Preventiva de Ar Condicionado da Sede',
    amount: 1650.0,
    originalAmount: 1650.0,
    type: 'expense',
    status: 'pending',
    categoryId: 'cat-desp-utilidades',
    accountId: 'acc-itau',
    costCenterId: 'cc-100',
    dueDate: '2026-08-15', // Overdue
    competenceDate: '2026-08-01',
    paymentMethod: 'pix',
    documentNumber: 'NF-SERV-842',
    tags: ['Manutenção', 'Predial'],
    notes: 'Aguardando validação técnica do laudo antes do pagamento',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  });

  // Add 1 pending receivable today
  transactions.push({
    id: nextId(),
    description: 'Setup e Treinamento In-Company — Alpha Log',
    amount: 14500.0,
    originalAmount: 14500.0,
    type: 'income',
    status: 'pending',
    categoryId: 'cat-rec-servicos',
    accountId: 'acc-inter',
    contactId: 'cont-cli-2',
    costCenterId: 'cc-400',
    dueDate: today, // Vence hoje
    competenceDate: '2026-08-01',
    paymentMethod: 'pix',
    documentNumber: 'NF-202685',
    tags: ['Onboarding', 'Treinamento'],
    createdAt: '2026-08-12T14:30:00Z',
    updatedAt: '2026-08-12T14:30:00Z',
  });

  return transactions;
}
