import { Category, CompanyProfile, DREItem, DREStatement, Transaction } from '../types';

/**
 * Intelligent categorization classifier for standard Brazilian Chart of Accounts (DRE Gerencial)
 */
function classifyDREGroup(groupName: string, categoryName: string, type: 'income' | 'expense'): string {
  const normalized = `${groupName} ${categoryName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip accents

  if (type === 'income') {
    if (
      normalized.includes('financeira') ||
      normalized.includes('rendimento') ||
      normalized.includes('juros ativo') ||
      normalized.includes('aplicacao')
    ) {
      return 'financial_income';
    }
    return 'gross_revenue';
  }

  // Expenses classification
  if (
    normalized.includes('deducao') ||
    normalized.includes('imposto sobre faturamento') ||
    normalized.includes('impostos sobre faturamento') ||
    normalized.includes('imposto sobre venda') ||
    normalized.includes('impostos sobre vendas') ||
    normalized.includes('tributos sobre faturamento') ||
    normalized.includes('das simples') ||
    normalized.includes('issqn') ||
    normalized.includes('icms') ||
    normalized.includes('pis/cofins')
  ) {
    return 'deductions';
  }

  if (
    normalized.includes('custo') ||
    normalized.includes('cpv') ||
    normalized.includes('cmv') ||
    normalized.includes('csp') ||
    normalized.includes('variavel') ||
    normalized.includes('mercadoria') ||
    normalized.includes('servico prestado') ||
    normalized.includes('gateway') ||
    normalized.includes('meios de pagamento') ||
    normalized.includes('infraestrutura') ||
    normalized.includes('servidor')
  ) {
    return 'variable_costs';
  }

  if (
    normalized.includes('pessoal') ||
    normalized.includes('salario') ||
    normalized.includes('folha') ||
    normalized.includes('pro-labore') ||
    normalized.includes('pro labore') ||
    normalized.includes('encargo') ||
    normalized.includes('fgts') ||
    normalized.includes('inss') ||
    normalized.includes('beneficio') ||
    normalized.includes('vale refeicao') ||
    normalized.includes('vale transporte')
  ) {
    return 'operating_personnel';
  }

  if (
    normalized.includes('comercial') ||
    normalized.includes('marketing') ||
    normalized.includes('publicidade') ||
    normalized.includes('anuncio') ||
    normalized.includes('ads') ||
    normalized.includes('comissao') ||
    normalized.includes('comissoes') ||
    normalized.includes('trafego')
  ) {
    return 'operating_commercial';
  }

  if (
    normalized.includes('financeira') ||
    normalized.includes('tarifa') ||
    normalized.includes('taxa bancaria') ||
    normalized.includes('juros passivo') ||
    normalized.includes('juros pago') ||
    normalized.includes('multa') ||
    normalized.includes('iof')
  ) {
    return 'financial_expenses';
  }

  // Default expenses fallback
  return 'operating_admin';
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateDRE(
  transactions: Transaction[],
  categories: Category[],
  periodMonth: string, // YYYY-MM
  regime: 'competence' | 'cash' = 'competence',
  fiscalRegime: CompanyProfile['fiscalRegime'] = 'simples'
): DREStatement {
  // Filter transactions for the period according to the selected accounting regime
  const periodTransactions = transactions.filter((t) => {
    if (t.status === 'cancelled' || t.type === 'transfer') return false;

    if (regime === 'cash') {
      // In Cash accounting (Regime de Caixa), only PAID transactions with a payment date count
      if (t.status !== 'paid' || !t.paymentDate) return false;
      return t.paymentDate.split('T')[0].startsWith(periodMonth);
    } else {
      // In Accrual accounting (Regime de Competência), competenceDate or dueDate is used
      const dateToCompare = (t.competenceDate || t.dueDate).split('T')[0];
      return dateToCompare.startsWith(periodMonth);
    }
  });

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  let grossRevenue = 0;
  let deductions = 0;
  let variableCosts = 0;
  let operatingPersonnel = 0;
  let operatingAdmin = 0;
  let operatingCommercial = 0;
  let financialIncome = 0;
  let financialExpenses = 0;

  periodTransactions.forEach((txn) => {
    const cat = categoryMap.get(txn.categoryId);
    const groupName = cat?.group || '';
    const categoryName = cat?.name || '';
    const amount = Number(txn.amount) || 0;

    const classification = classifyDREGroup(groupName, categoryName, txn.type === 'income' ? 'income' : 'expense');

    if (txn.type === 'income') {
      if (classification === 'financial_income') {
        financialIncome += amount;
      } else {
        grossRevenue += amount;
      }
    } else if (txn.type === 'expense') {
      switch (classification) {
        case 'deductions':
          deductions += amount;
          break;
        case 'variable_costs':
          variableCosts += amount;
          break;
        case 'operating_personnel':
          operatingPersonnel += amount;
          break;
        case 'operating_commercial':
          operatingCommercial += amount;
          break;
        case 'financial_expenses':
          financialExpenses += amount;
          break;
        case 'operating_admin':
        default:
          operatingAdmin += amount;
          break;
      }
    }
  });

  // Calculate strict subtotals
  grossRevenue = round2(grossRevenue);
  deductions = round2(deductions);
  variableCosts = round2(variableCosts);
  operatingPersonnel = round2(operatingPersonnel);
  operatingAdmin = round2(operatingAdmin);
  operatingCommercial = round2(operatingCommercial);
  financialIncome = round2(financialIncome);
  financialExpenses = round2(financialExpenses);

  const netRevenue = round2(grossRevenue - deductions);
  const grossProfit = round2(netRevenue - variableCosts);
  const operatingExpenses = round2(operatingPersonnel + operatingAdmin + operatingCommercial);
  const ebitda = round2(grossProfit - operatingExpenses);
  const depreciation = 0;
  const ebit = round2(ebitda - depreciation);
  const financialResult = round2(financialIncome - financialExpenses);
  const profitBeforeTax = round2(ebit + financialResult);

  // Taxes: for Simples, taxes are already inside deductions. For Lucro Presumido/Real, calculated on net
  let taxes = 0;
  if (fiscalRegime === 'lucro_presumido' && profitBeforeTax > 0) {
    // Estimativa IRPJ + CSLL s/ base presumida
    taxes = round2(profitBeforeTax * 0.15);
  } else if (fiscalRegime === 'lucro_real' && profitBeforeTax > 0) {
    taxes = round2(profitBeforeTax * 0.24); // 15% IRPJ + 9% CSLL
  }

  const netProfit = round2(profitBeforeTax - taxes);
  const netMargin = grossRevenue > 0 ? round2((netProfit / grossRevenue) * 100) : 0;

  const pct = (val: number) => (grossRevenue > 0 ? round2((Math.abs(val) / grossRevenue) * 100) : 0);
  const netPct = (val: number) => (grossRevenue > 0 ? round2((val / grossRevenue) * 100) : 0);

  const items: DREItem[] = [
    {
      code: '1',
      title: '(=) RECEITA OPERACIONAL BRUTA',
      amount: grossRevenue,
      percentage: 100,
      isTotal: true,
    },
    {
      code: '1.1',
      title: '(-) Deduções da Receita Bruta & Impostos sobre Venda',
      amount: -deductions,
      percentage: pct(deductions),
    },
    {
      code: '2',
      title: '(=) RECEITA OPERACIONAL LÍQUIDA',
      amount: netRevenue,
      percentage: netPct(netRevenue),
      isSubtotal: true,
    },
    {
      code: '2.1',
      title: '(-) Custos dos Serviços Prestados & Mercadorias (CPV/CSP/CMV)',
      amount: -variableCosts,
      percentage: pct(variableCosts),
    },
    {
      code: '3',
      title: '(=) LUCRO BRUTO (Margem de Contribuição)',
      amount: grossProfit,
      percentage: netPct(grossProfit),
      isSubtotal: true,
    },
    {
      code: '3.1',
      title: '(-) Despesas com Pessoal & Encargos',
      amount: -operatingPersonnel,
      percentage: pct(operatingPersonnel),
    },
    {
      code: '3.2',
      title: '(-) Despesas Administrativas & Ocupação',
      amount: -operatingAdmin,
      percentage: pct(operatingAdmin),
    },
    {
      code: '3.3',
      title: '(-) Despesas Comerciais & Marketing',
      amount: -operatingCommercial,
      percentage: pct(operatingCommercial),
    },
    {
      code: '4',
      title: '(=) EBITDA / LAJIDA (Resultado Operacional)',
      amount: ebitda,
      percentage: netPct(ebitda),
      isSubtotal: true,
    },
    {
      code: '4.1',
      title: '(+) Receitas Financeiras (Rendimentos de Aplicação)',
      amount: financialIncome,
      percentage: pct(financialIncome),
    },
    {
      code: '4.2',
      title: '(-) Despesas Financeiras & Tarifas Bancárias',
      amount: -financialExpenses,
      percentage: pct(financialExpenses),
    },
    {
      code: '5',
      title: '(=) LUCRO LÍQUIDO DO EXERCÍCIO',
      amount: netProfit,
      percentage: netPct(netProfit),
      isTotal: true,
    },
  ];

  return {
    period: periodMonth,
    grossRevenue,
    deductions,
    netRevenue,
    costs: variableCosts,
    grossProfit,
    operatingExpenses,
    ebitda,
    depreciation,
    ebit,
    financialExpenses,
    financialIncome,
    financialResult,
    profitBeforeTax,
    taxes,
    netProfit,
    netMargin,
    items,
  };
}
