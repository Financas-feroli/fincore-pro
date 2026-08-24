import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  Edit2,
  PieChart as PieIcon,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  Activity,
  Gauge,
  Hourglass,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateDRE } from '../../utils/dreCalculator';

export const DashboardView: React.FC = () => {
  const {
    summary,
    accounts,
    transactions,
    categories,
    companyProfile,
    openQuickEntry,
    openEditTransaction,
    openSettlementModal,
    setActiveTab,
    theme,
  } = useFinance();

  const [hideBalances, setHideBalances] = useState(false);

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const dre = calculateDRE(
    transactions,
    categories,
    currentMonthStr,
    'competence',
    companyProfile.fiscalRegime
  );

  // Managerial Health Metrics (Auditoria Gerencial)
  const managerialKPIs = useMemo(() => {
    const totalLiquidity = summary.totalBalance;
    const totalMonthPayables = summary.monthExpense + summary.expectedExpense;

    // 1. Immediate Liquidity Ratio (Capacidade de honrar compromissos imediatos)
    const liquidityRatio = totalMonthPayables > 0 ? Number((totalLiquidity / totalMonthPayables).toFixed(2)) : 99.9;

    // 2. Default / Overdue Receivables Rate (% de inadimplência sobre a carteira)
    const totalReceivables = summary.overdueReceivables + summary.todayReceivables + summary.expectedIncome;
    const overdueRate = totalReceivables > 0 ? Number(((summary.overdueReceivables / totalReceivables) * 100).toFixed(1)) : 0;

    // 3. Cash Runway (Meses de sobrevivência com o caixa atual)
    const avgMonthlyExpense = Math.max(1000, summary.monthExpense + summary.expectedExpense);
    const runwayMonths = totalLiquidity > 0 ? Number((totalLiquidity / avgMonthlyExpense).toFixed(1)) : 0;

    // 4. Operational Margin (Margem Bruta)
    const grossMargin = dre.grossRevenue > 0 ? Number(((dre.grossProfit / dre.grossRevenue) * 100).toFixed(1)) : 0;

    return {
      liquidityRatio,
      overdueRate,
      runwayMonths,
      grossMargin,
    };
  }, [summary, dre]);

  // Expense distribution data for Pie Chart
  const expenseByCategoryMap = new Map<string, { name: string; value: number; color: string }>();
  const catMap = new Map(categories.map((c) => [c.id, c]));

  transactions.forEach((txn) => {
    const effectiveDate = (txn.paymentDate || txn.dueDate || '').split('T')[0];
    if (
      txn.type === 'expense' &&
      txn.status === 'paid' &&
      effectiveDate.startsWith(currentMonthStr)
    ) {
      const cat = catMap.get(txn.categoryId);
      const name = cat?.name || 'Outras';
      const color = cat?.color || '#94a3b8';
      const current = expenseByCategoryMap.get(txn.categoryId) || { name, value: 0, color };
      current.value = Math.round((current.value + txn.amount) * 100) / 100;
      expenseByCategoryMap.set(txn.categoryId, current);
    }
  });

  const pieData = Array.from(expenseByCategoryMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const totalPieExpense = pieData.reduce((acc, curr) => acc + curr.value, 0);

  // Critical next 5 pending transactions
  const upcomingTransactions = transactions
    .filter((t) => t.status === 'pending')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const isDark = theme === 'dark';

  const maskValue = (formattedVal: string) => (hideBalances ? 'R$ ••••••' : formattedVal);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Cockpit Executivo & Controladoria</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-semibold">
              Live Data
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhamento em tempo real de disponibilidades, liquidez imediata e saúde financeira.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Privacy Toggle */}
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            title={hideBalances ? 'Exibir valores' : 'Ocultar valores (Modo Privacidade)'}
          >
            {hideBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{hideBalances ? 'Mostrar Saldos' : 'Ocultar'}</span>
          </button>

          {/* Quick Transfer */}
          <button
            onClick={() => openQuickEntry('transfer')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Transferir</span>
          </button>

          {/* New Transaction */}
          <button
            onClick={() => openQuickEntry('expense')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Top Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Consolidado */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Disponibilidade Líquida
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
              {maskValue(formatCurrency(summary.totalBalance))}
            </h3>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>{accounts.length} contas bancárias</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Conciliado
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>

        {/* 2. Receitas do Mês */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Receitas Realizadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {maskValue(formatCurrency(summary.monthIncome))}
            </h3>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Prev: {maskValue(formatCurrency(summary.monthIncome + summary.expectedIncome))}</span>
              <span className="text-emerald-500 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Recebido
              </span>
            </div>
          </div>
        </div>

        {/* 3. Despesas do Mês */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Despesas Realizadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {maskValue(formatCurrency(summary.monthExpense))}
            </h3>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Prev: {maskValue(formatCurrency(summary.monthExpense + summary.expectedExpense))}</span>
              <span className="text-rose-500 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
                Pago
              </span>
            </div>
          </div>
        </div>

        {/* 4. Resultado Líquido & Margem */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Resultado Líquido do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl font-extrabold font-mono tracking-tight ${
                summary.monthNet >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {maskValue(formatCurrency(summary.monthNet))}
            </h3>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="text-slate-400">Margem Líquida</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                  summary.monthNet >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {summary.monthIncome > 0
                  ? `${((summary.monthNet / summary.monthIncome) * 100).toFixed(1)}%`
                  : '0.0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Managerial Health Bar (Auditoria Gerencial CFO KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        {/* Índice de Liquidez */}
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Liquidez Imediata
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {managerialKPIs.liquidityRatio >= 99 ? '∞' : `${managerialKPIs.liquidityRatio.toFixed(2)}x`}
              <span className="text-[10px] font-normal text-slate-400 ml-1">
                {managerialKPIs.liquidityRatio >= 1.5 ? '(Confortável)' : managerialKPIs.liquidityRatio >= 1.0 ? '(Adequado)' : '(Alerta)'}
              </span>
            </div>
          </div>
        </div>

        {/* Runway de Caixa */}
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
            <Hourglass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Runway de Caixa
            </div>
            <div className="text-sm font-bold font-mono text-blue-400">
              {managerialKPIs.runwayMonths.toFixed(1)} meses
              <span className="text-[10px] font-normal text-slate-400 ml-1">cobertura</span>
            </div>
          </div>
        </div>

        {/* Taxa de Inadimplência */}
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Inadimplência de Clientes
            </div>
            <div className="text-sm font-bold font-mono text-purple-400">
              {managerialKPIs.overdueRate.toFixed(1)}%
              <span className="text-[10px] font-normal text-slate-400 ml-1">em atraso</span>
            </div>
          </div>
        </div>

        {/* Margem Bruta */}
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Margem de Contribuição
            </div>
            <div className="text-sm font-bold font-mono text-amber-400">
              {managerialKPIs.grossMargin.toFixed(1)}%
              <span className="text-[10px] font-normal text-slate-400 ml-1">operacional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert Bar if Overdue / Due Today exists */}
      {(summary.overduePayables > 0 || summary.todayPayables > 0) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-300">Atenção ao Contas a Pagar: </span>
              <span className="text-slate-700 dark:text-slate-300">
                Você possui{' '}
                <strong className="text-rose-600 dark:text-rose-400">
                  {maskValue(formatCurrency(summary.overduePayables))}
                </strong>{' '}
                em contas vencidas e{' '}
                <strong className="text-amber-600 dark:text-amber-400">
                  {maskValue(formatCurrency(summary.todayPayables))}
                </strong>{' '}
                vencendo na data de hoje.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('payables')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 flex-shrink-0 shadow-sm"
          >
            <span>Gerenciar e Liquidar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Charts Section: Daily Cash Flow + Expense Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Cash Flow Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Fluxo de Caixa & Evolução de Saldo
              </h3>
              <p className="text-xs text-slate-400">
                Histórico de 14 dias e projeção diária acumulada dos próximos 15 dias
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Receitas
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Despesas
              </span>
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Saldo
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.cashFlow30Days}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1e293b' : '#f1f5f9'}
                  vertical={false}
                />
                <XAxis
                  dataKey="dayLabel"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-900/95 border border-slate-800 text-white rounded-xl shadow-xl text-xs backdrop-blur-md">
                          <p className="font-bold text-slate-300 mb-1 flex items-center justify-between gap-4">
                            <span>Data: {formatDate(data.date)}</span>
                            {data.isProjected && (
                              <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded font-normal">
                                Projeção
                              </span>
                            )}
                          </p>
                          <div className="space-y-1 font-mono">
                            <p className="text-emerald-400">
                              Receitas: {maskValue(formatCurrency(data.income))}
                            </p>
                            <p className="text-rose-400">
                              Despesas: {maskValue(formatCurrency(data.expense))}
                            </p>
                            <p className="text-blue-400 font-bold border-t border-slate-800 pt-1">
                              Saldo Projetado: {maskValue(formatCurrency(data.accumulatedBalance))}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="accumulatedBalance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#balanceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Donut Chart (1 col) */}
        <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-emerald-500" />
                  Despesas por Categoria
                </h3>
                <p className="text-xs text-slate-400">
                  Distribuição no mês corrente
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {maskValue(formatCurrency(totalPieExpense))}
              </span>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [maskValue(formatCurrency(val)), 'Valor']}
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend breakdown */}
            <div className="space-y-1.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 truncate text-[11px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {maskValue(formatCurrency(item.value))}
                    </span>
                    <span className="text-slate-400 text-[10px] w-8 text-right">
                      {totalPieExpense > 0
                        ? `${((item.value / totalPieExpense) * 100).toFixed(0)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Bills + DRE Executive Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Urgent Payables / Receivables (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Próximos Vencimentos & Contas Críticas
              </h3>
              <p className="text-xs text-slate-400">
                Lançamentos pendentes organizados por prioridade de data
              </p>
            </div>
            <button
              onClick={() => setActiveTab('payables')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {upcomingTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Parabéns! Não existem contas pendentes no momento.
              </div>
            ) : (
              upcomingTransactions.map((txn) => {
                const isIncome = txn.type === 'income';
                return (
                  <div
                    key={txn.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {txn.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {formatDate(txn.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`font-mono font-bold text-xs mr-1 ${
                          isIncome ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {maskValue(formatCurrency(txn.amount))}
                      </span>
                      <button
                        onClick={() => openEditTransaction(txn)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        title="Editar Lançamento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openSettlementModal(txn)}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
                      >
                        {isIncome ? 'Receber' : 'Liquidar'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* DRE Executive Snapshot (1 col) */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  DRE Sintético Gerencial
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{dre.period}</span>
            </div>

            <div className="space-y-3 mt-4 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Receita Bruta:</span>
                <span className="font-bold text-emerald-400">
                  {maskValue(formatCurrency(dre.grossRevenue))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">(-) Deduções/Impostos:</span>
                <span className="text-rose-400">
                  -{maskValue(formatCurrency(dre.deductions))}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-300 font-semibold">(=) Lucro Bruto:</span>
                <span className="font-bold text-white">
                  {maskValue(formatCurrency(dre.grossProfit))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">(-) Despesas Operacionais:</span>
                <span className="text-rose-400">
                  -{maskValue(formatCurrency(dre.operatingExpenses))}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-300 font-semibold">(=) EBITDA Operacional:</span>
                <span className="font-bold text-emerald-300">
                  {maskValue(formatCurrency(dre.ebitda))}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 text-sm">
                <span className="text-white font-extrabold">(=) Lucro Líquido:</span>
                <span
                  className={`font-extrabold ${
                    dre.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {maskValue(formatCurrency(dre.netProfit))}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('reports')}
              className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span>Abrir DRE Completo & Relatórios</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
