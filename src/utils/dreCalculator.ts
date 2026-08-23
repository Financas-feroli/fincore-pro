import { Category, DREItem, DREStatement, Transaction } from '../types';

export function calculateDRE(
  transactions: Transaction[],
  categories: Category[],
  periodMonth: string, // YYYY-MM
  regime: 'competence' | 'cash' = 'competence'
): DREStatement {
  // Filter transactions for the period according to the selected regime
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

  const categoryTotals = new Map<string, number>();

  periodTransactions.forEach((txn) => {
    const cat = categoryMap.get(txn.categoryId);
    const group = cat?.group || 'Outras';
    const amount = txn.amount;

    categoryTotals.set(txn.categoryId, (categoryTotals.get(txn.categoryId) || 0) + amount);

    if (txn.type === 'income') {
      if (group === 'Receitas Financeiras') {
        financialIncome += amount;
      } else {
        grossRevenue += amount;
      }
    } else if (txn.type === 'expense') {
      if (group === 'Deduções da Receita Bruta') {
        deductions += amount;
      } else if (group === 'Custos Variáveis' || group === 'Custos dos Serviços Prestados') {
        variableCosts += amount;
      } else if (group === 'Despesas com Pessoal') {
        operatingPersonnel += amount;
      } else if (group === 'Despesas Administrativas') {
        operatingAdmin += amount;
      } else if (group === 'Despesas Comerciais') {
        operatingCommercial += amount;
      } else if (group === 'Despesas Financeiras') {
        financialExpenses += amount;
      } else {
        operatingAdmin += amount;
      }
    }
  });

  const netRevenue = grossRevenue - deductions;
  const grossProfit = netRevenue - variableCosts;
  const operatingExpenses = operatingPersonnel + operatingAdmin + operatingCommercial;
  const ebitda = grossProfit - operatingExpenses;
  const depreciation = 0; // Simplified
  const ebit = ebitda - depreciation;
  const financialResult = financialIncome - financialExpenses;
  const profitBeforeTax = ebit + financialResult;
  const taxes = 0; // Handled in deductions for Simples Nacional
  const netProfit = profitBeforeTax - taxes;
  const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  const pct = (val: number) => (grossRevenue > 0 ? (Math.abs(val) / grossRevenue) * 100 : 0);
  const netPct = (val: number) => (grossRevenue > 0 ? (val / grossRevenue) * 100 : 0);

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
      title: '(-) Custos dos Serviços Prestados & Mercadorias (CPV/CSP)',
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
      title: '(+) Receitas Financeiras (Rendimentos)',
      amount: financialIncome,
      percentage: pct(financialIncome),
    },
    {
      code: '4.2',
      title: '(-) Despesas Financeiras & Tarifas',
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
