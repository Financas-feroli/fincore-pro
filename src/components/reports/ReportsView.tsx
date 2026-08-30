import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Crown,
  Zap,
  Lock,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { getPlanFeatures } from '../../utils/planPermissions';
import { PricingModal } from '../common/PricingModal';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { calculateDRE } from '../../utils/dreCalculator';

export const ReportsView: React.FC = () => {
  const { transactions, categories, costCenters, companyProfile } = useFinance();

  const { organization, isDemoMode } = useAuth();
  const isTrial = isDemoMode || organization?.subscriptionStatus === 'trialing';
  const planFeatures = getPlanFeatures(organization?.plan || 'pro', isTrial, organization?.trialEndsAt);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<'dre' | 'cashFlow' | 'costCenters'>('dre');
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayDateString().substring(0, 7));
  const [regime, setRegime] = useState<'competence' | 'cash'>('competence');

  // Auto scroll to top on report tab change
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [activeReport]);

  // Calculate DRE
  const dre = useMemo(() => {
    return calculateDRE(transactions, categories, selectedMonth, regime, companyProfile.fiscalRegime);
  }, [transactions, categories, selectedMonth, regime, companyProfile.fiscalRegime]);

  // Cash Flow Forecast vs Actual for selected month
  const cashFlowComparison = useMemo(() => {
    let realizedInflow = 0;
    let expectedInflow = 0;
    let realizedOutflow = 0;
    let expectedOutflow = 0;

    transactions.forEach((txn) => {
      if (txn.status === 'cancelled' || txn.type === 'transfer') return;
      const targetDate = (txn.paymentDate || txn.dueDate).split('T')[0];
      if (targetDate.startsWith(selectedMonth)) {
        if (txn.type === 'income') {
          if (txn.status === 'paid') realizedInflow += txn.amount;
          else if (txn.status === 'pending') expectedInflow += txn.amount;
        } else if (txn.type === 'expense') {
          if (txn.status === 'paid') realizedOutflow += txn.amount;
          else if (txn.status === 'pending') expectedOutflow += txn.amount;
        }
      }
    });

    realizedInflow = Math.round(realizedInflow * 100) / 100;
    expectedInflow = Math.round(expectedInflow * 100) / 100;
    realizedOutflow = Math.round(realizedOutflow * 100) / 100;
    expectedOutflow = Math.round(expectedOutflow * 100) / 100;

    const totalInflowForecast = Math.round((realizedInflow + expectedInflow) * 100) / 100;
    const totalOutflowForecast = Math.round((realizedOutflow + expectedOutflow) * 100) / 100;
    const netForecast = Math.round((totalInflowForecast - totalOutflowForecast) * 100) / 100;
    const netRealized = Math.round((realizedInflow - realizedOutflow) * 100) / 100;

    return {
      realizedInflow,
      expectedInflow,
      totalInflowForecast,
      realizedOutflow,
      expectedOutflow,
      totalOutflowForecast,
      netForecast,
      netRealized,
    };
  }, [transactions, selectedMonth]);

  // Cost Center Breakdown for selected month
  const costCenterBreakdown = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    costCenters.forEach((cc) => map.set(cc.id, { income: 0, expense: 0 }));

    transactions.forEach((txn) => {
      if (!txn.costCenterId || txn.status === 'cancelled' || txn.type === 'transfer') return;
      const targetDate = (txn.paymentDate || txn.dueDate).split('T')[0];
      if (targetDate.startsWith(selectedMonth)) {
        const current = map.get(txn.costCenterId) || { income: 0, expense: 0 };
        if (txn.type === 'income') current.income += txn.amount;
        if (txn.type === 'expense') current.expense += txn.amount;
        map.set(txn.costCenterId, current);
      }
    });

    return costCenters.map((cc) => {
      const data = map.get(cc.id) || { income: 0, expense: 0 };
      const inc = Math.round(data.income * 100) / 100;
      const exp = Math.round(data.expense * 100) / 100;
      const net = Math.round((inc - exp) * 100) / 100;
      return {
        ...cc,
        income: inc,
        expense: exp,
        net,
      };
    });
  }, [costCenters, transactions, selectedMonth]);

  // Print PDF Function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header with Report Controls */}
      <div className="no-print p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              Relatórios & DRE Gerencial
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrativo de Resultados do Exercício, Previsto vs Realizado e exportação contábil executiva.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Report Type Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveReport('dre')}
              className={`px-3.5 py-1.5 font-bold rounded-lg transition-all ${
                activeReport === 'dre'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              DRE Gerencial
            </button>
            <button
              onClick={() => setActiveReport('cashFlow')}
              className={`px-3.5 py-1.5 font-bold rounded-lg transition-all ${
                activeReport === 'cashFlow'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Previsto vs Realizado
            </button>
            <button
              onClick={() => setActiveReport('costCenters')}
              className={`px-3.5 py-1.5 font-bold rounded-lg transition-all ${
                activeReport === 'costCenters'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Por Centro de Custo
            </button>
          </div>

          {/* Month & Regime Selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="2026-09">Setembro / 2026</option>
                <option value="2026-08">Agosto / 2026 (Atual)</option>
                <option value="2026-07">Julho / 2026</option>
                <option value="2026-06">Junho / 2026</option>
                <option value="2026-05">Maio / 2026</option>
                <option value="2026-04">Abril / 2026</option>
                <option value="2026-03">Março / 2026</option>
              </select>
            </div>

            {activeReport === 'dre' && (
              <div className="flex items-center gap-1.5">
                <select
                  value={regime}
                  onChange={(e) => setRegime(e.target.value as 'competence' | 'cash')}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="competence">Regime de Competência</option>
                  <option value="cash">Regime de Caixa</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Report Wrapper */}
      <div className="p-8 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Company Timbre Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              {companyProfile.tradeName ? companyProfile.tradeName.charAt(0).toUpperCase() : (companyProfile.name ? companyProfile.name.charAt(0).toUpperCase() : 'P')}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {companyProfile.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                CNPJ: {companyProfile.document || 'Não informado'}
                {companyProfile.city ? ` • ${companyProfile.city}${companyProfile.state ? `/${companyProfile.state}` : ''}` : ''}
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 font-mono">
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {activeReport === 'dre'
                ? `DEMONSTRATIVO DO RESULTADO (DRE) — ${selectedMonth}`
                : activeReport === 'cashFlow'
                ? `FLUXO DE CAIXA: PREVISTO VS REALIZADO — ${selectedMonth}`
                : `RELATÓRIO POR CENTRO DE CUSTO — ${selectedMonth}`}
            </p>
            <p className="text-[11px] mt-1">
              Emitido em: {new Date().toLocaleDateString('pt-BR')} • PROSPER
            </p>
          </div>
        </div>

        {/* 1. DRE GERENCIAL VIEW */}
        {activeReport === 'dre' && (
          !planFeatures.hasAdvancedDRE ? (
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
                <Crown className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  DRE Gerencial Completo & Análise de Resultados
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  O Demonstrativo do Resultado do Exercício com estrutura contábil, margem EBITDA e apuração por competência e caixa é um recurso dos planos <strong>PRO</strong> e <strong>BUSINESS</strong>.
                </p>
              </div>
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Fazer Upgrade para o Plano Pro</span>
              </button>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Highlights Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-sans">
                  Receita Líquida
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(dre.netRevenue)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-sans">
                  Lucro Bruto
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(dre.grossProfit)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-sans">
                  EBITDA (LAJIDA)
                </span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {formatCurrency(dre.ebitda)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-sans">
                  Lucro Líquido
                </span>
                <span
                  className={`text-base font-extrabold ${
                    dre.netProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(dre.netProfit)} ({dre.netMargin.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* DRE Formal Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <th className="py-2.5 px-3 w-16">Conta</th>
                    <th className="py-2.5 px-4">Descrição da Estrutura Contábil</th>
                    <th className="py-2.5 px-4 text-right">Valor Realizado (R$)</th>
                    <th className="py-2.5 px-4 text-right w-24">AV (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {dre.items.map((item, idx) => {
                    const isTotal = item.isTotal;
                    const isSubtotal = item.isSubtotal;

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isTotal
                            ? 'bg-slate-100/90 dark:bg-slate-800/90 font-extrabold text-slate-900 dark:text-white text-[13px]'
                            : isSubtotal
                            ? 'bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-800 dark:text-slate-200'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-400">{item.code}</td>
                        <td className="py-2 px-4 font-sans font-medium">{item.title}</td>
                        <td
                          className={`py-2 px-4 text-right ${
                            item.amount < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : isTotal
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400 text-[11px]">
                          {item.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )
        )}

        {/* 2. CASH FLOW REALIZED VS FORECAST */}
        {activeReport === 'cashFlow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  Receitas Realizadas
                </span>
                <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(cashFlowComparison.realizedInflow)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Previsão Total: {formatCurrency(cashFlowComparison.totalInflowForecast)}
                </p>
              </div>

              <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">
                  Despesas Realizadas
                </span>
                <h3 className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(cashFlowComparison.realizedOutflow)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Previsão Total: {formatCurrency(cashFlowComparison.totalOutflowForecast)}
                </p>
              </div>

              <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 rounded-xl">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                  Resultado Realizado
                </span>
                <h3
                  className={`text-2xl font-extrabold font-mono mt-1 ${
                    cashFlowComparison.netRealized >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(cashFlowComparison.netRealized)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Resultado Previsto: {formatCurrency(cashFlowComparison.netForecast)}
                </p>
              </div>
            </div>

            {/* Cash Flow Detailed Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <th className="py-2.5 px-4">Indicador de Fluxo de Caixa</th>
                    <th className="py-2.5 px-4 text-right">Previsto / Orçado</th>
                    <th className="py-2.5 px-4 text-right">Realizado Efetivo</th>
                    <th className="py-2.5 px-4 text-right">Desvio / Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      (+) Entradas de Caixa (Receitas)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(cashFlowComparison.totalInflowForecast)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(cashFlowComparison.realizedInflow)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatCurrency(cashFlowComparison.realizedInflow - cashFlowComparison.totalInflowForecast)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      (-) Saídas de Caixa (Despesas)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(cashFlowComparison.totalOutflowForecast)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(cashFlowComparison.realizedOutflow)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatCurrency(cashFlowComparison.realizedOutflow - cashFlowComparison.totalOutflowForecast)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 font-bold">
                    <td className="py-3 px-4 text-slate-900 dark:text-white">
                      (=) Saldo Operacional Líquido do Mês
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(cashFlowComparison.netForecast)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-black ${
                        cashFlowComparison.netRealized >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(cashFlowComparison.netRealized)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatCurrency(cashFlowComparison.netRealized - cashFlowComparison.netForecast)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. COST CENTERS REPORT */}
        {activeReport === 'costCenters' && (
          <div className="space-y-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="py-2.5 px-3 w-16">Código</th>
                  <th className="py-2.5 px-4">Centro de Custo</th>
                  <th className="py-2.5 px-4 text-right">Receitas (R$)</th>
                  <th className="py-2.5 px-4 text-right">Despesas (R$)</th>
                  <th className="py-2.5 px-4 text-right">Resultado Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {costCenterReport.map((cc) => (
                  <tr key={cc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 text-slate-400 font-bold">{cc.code}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                      {cc.name}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(cc.income)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">
                      {formatCurrency(cc.expense)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-extrabold ${
                        cc.net >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(cc.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Signature Strip (Print-Friendly) */}
        <div className="hidden print:flex items-center justify-between pt-16 text-center text-xs text-slate-500">
          <div className="border-t border-slate-400 w-56 pt-2">
            <p className="font-bold text-slate-800">Diretoria Executiva</p>
            <p className="text-[10px]">Aprovador</p>
          </div>
          <div className="border-t border-slate-400 w-56 pt-2">
            <p className="font-bold text-slate-800">Controladoria / Finanças</p>
            <p className="text-[10px]">Responsável Técnico</p>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
};
