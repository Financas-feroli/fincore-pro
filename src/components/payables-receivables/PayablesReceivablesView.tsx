import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Edit2,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  User,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { Transaction } from '../../types';

export const PayablesReceivablesView: React.FC = () => {
  const {
    transactions,
    categories,
    contacts,
    accounts,
    openQuickEntry,
    openEditTransaction,
    openSettlementModal,
    activeTab,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'payables' | 'receivables'>(
    activeTab === 'receivables' ? 'receivables' : 'payables'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Auto scroll to top when changing subtab
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [activeSubTab]);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const contMap = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const targetType = activeSubTab === 'payables' ? 'expense' : 'income';
  const today = getTodayDateString();

  // Filter only pending items of selected type
  const pendingTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== targetType || t.status !== 'pending') return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const cont = contMap.get(t.contactId || '')?.name?.toLowerCase() || '';
        const cat = catMap.get(t.categoryId)?.name?.toLowerCase() || '';
        return (
          t.description.toLowerCase().includes(q) ||
          cont.includes(q) ||
          cat.includes(q) ||
          t.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [transactions, targetType, searchTerm, contMap, catMap]);

  // Aging Buckets
  const { overdueItems, todayItems, next7DaysItems, laterThisMonthItems, futureItems } =
    useMemo(() => {
      const overdue: Transaction[] = [];
      const dueToday: Transaction[] = [];
      const next7: Transaction[] = [];
      const laterThisMonth: Transaction[] = [];
      const future: Transaction[] = [];

      const currentMonthPrefix = today.substring(0, 7);

      const d7 = new Date();
      d7.setDate(d7.getDate() + 7);
      const d7Str = d7.toISOString().split('T')[0];

      pendingTransactions.forEach((txn) => {
        const cleanDue = (txn.dueDate || '').split('T')[0];
        if (cleanDue < today) {
          overdue.push(txn);
        } else if (cleanDue === today) {
          dueToday.push(txn);
        } else if (cleanDue <= d7Str) {
          next7.push(txn);
        } else if (cleanDue.startsWith(currentMonthPrefix)) {
          laterThisMonth.push(txn);
        } else {
          future.push(txn);
        }
      });

      return {
        overdueItems: overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        todayItems: dueToday,
        next7DaysItems: next7.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        laterThisMonthItems: laterThisMonth.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        futureItems: future.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      };
    }, [pendingTransactions, today]);

  // Summary Totals with exact cent precision
  const totalOverdue = Math.round(overdueItems.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
  const totalToday = Math.round(todayItems.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
  const totalPending = Math.round(pendingTransactions.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;

  const renderSection = (
    title: string,
    items: Transaction[],
    badgeColor: string,
    icon: React.ElementType,
    description: string
  ) => {
    const Icon = icon;
    const sectionTotal = Math.round(items.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;

    return (
      <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${badgeColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                  {items.length}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </div>
          <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
            {formatCurrency(sectionTotal)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              Nenhum lançamento neste período.
            </div>
          ) : (
            items.map((txn) => {
              const cont = contMap.get(txn.contactId || '');
              const cat = catMap.get(txn.categoryId);
              const acc = accMap.get(txn.accountId);

              return (
                <div
                  key={txn.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        activeSubTab === 'payables'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {activeSubTab === 'payables' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {txn.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono font-semibold text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Vencimento: {formatDate(txn.dueDate)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {cat?.name || 'Geral'}
                        </span>
                        {cont && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                              <User className="w-3 h-3 text-slate-400" />
                              {cont.tradeName || cont.name}
                            </span>
                          </>
                        )}
                        {acc && (
                          <>
                            <span>•</span>
                            <span>{acc.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`font-mono font-bold text-sm mr-1 ${
                        activeSubTab === 'payables'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCurrency(txn.amount)}
                    </span>
                    <button
                      onClick={() => openEditTransaction(txn)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      title="Editar Lançamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openSettlementModal(txn)}
                      className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                        activeSubTab === 'payables'
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{activeSubTab === 'payables' ? 'Dar Baixa' : 'Receber'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Subtab Toggle Bar & Quick Metric KPIs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Toggle Switch */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('payables')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'payables'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Contas a Pagar</span>
            {overdueItems.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-white text-rose-600 text-[10px] rounded-full font-bold">
                {overdueItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('receivables')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'receivables'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Contas a Receber</span>
          </button>
        </div>

        {/* Search & New Entry */}
        <div className="flex items-center gap-2 px-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Buscar ${activeSubTab === 'payables' ? 'contas a pagar' : 'recebíveis'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => openQuickEntry(activeSubTab === 'payables' ? 'expense' : 'income')}
            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeSubTab === 'payables' ? 'Nova Despesa' : 'Novo Recebível'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row for Selected Subtab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total em Aberto */}
        <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Total em Aberto ({pendingTransactions.length} contas)
          </span>
          <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalPending)}
          </p>
        </div>

        {/* Vencendo Hoje */}
        <div className="p-4 bg-white dark:bg-[#111827] border border-amber-500/30 rounded-xl shadow-sm bg-amber-500/5">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Vence Hoje ({todayItems.length})
          </span>
          <p className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalToday)}
          </p>
        </div>

        {/* Vencido / Em Atraso */}
        <div className="p-4 bg-white dark:bg-[#111827] border border-rose-500/30 rounded-xl shadow-sm bg-rose-500/5">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Vencidos / Em Atraso ({overdueItems.length})
          </span>
          <p className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalOverdue)}
          </p>
        </div>
      </div>

      {/* Chronological Aging Sections */}
      <div className="space-y-5">
        {/* 1. Vencidos */}
        {overdueItems.length > 0 &&
          renderSection(
            'Contas Vencidas (Atrasadas)',
            overdueItems,
            'bg-rose-500/15 text-rose-500',
            AlertTriangle,
            'Títulos que já ultrapassaram a data limite de vencimento'
          )}

        {/* 2. Vence Hoje */}
        {todayItems.length > 0 &&
          renderSection(
            'Vencem Hoje (Prioridade Máxima)',
            todayItems,
            'bg-amber-500/15 text-amber-500',
            Clock,
            'Lançamentos programados para liquidação na data de hoje'
          )}

        {/* 3. Próximos 7 dias */}
        {renderSection(
          'Vencimentos nos Próximos 7 Dias',
          next7DaysItems,
          'bg-blue-500/15 text-blue-500',
          Calendar,
          'Contas com vencimento na próxima semana'
        )}

        {/* 4. Restante do Mês */}
        {renderSection(
          'Restante deste Mês',
          laterThisMonthItems,
          'bg-purple-500/15 text-purple-500',
          Calendar,
          'Compromissos agendados até o final do mês corrente'
        )}

        {/* 5. Vencimentos Futuros */}
        {futureItems.length > 0 &&
          renderSection(
            'Vencimentos Futuros',
            futureItems,
            'bg-slate-500/15 text-slate-500',
            Calendar,
            'Contas programadas para os próximos meses'
          )}
      </div>
    </div>
  );
};
