import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  User,
  Wallet,
  Tag,
  Filter,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { Transaction } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const PayablesReceivablesView: React.FC = () => {
  const {
    transactions,
    categories,
    contacts,
    accounts,
    openQuickEntry,
    openEditTransaction,
    openSettlementModal,
    deleteTransaction,
    activeTab,
    setActiveTab,
  } = useFinance();

  // Mode is strictly synchronized with FinanceContext activeTab
  const currentMode: 'payables' | 'receivables' = activeTab === 'receivables' ? 'receivables' : 'payables';
  const isPayables = currentMode === 'payables';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');
  const [filterContactId, setFilterContactId] = useState<string>('all');

  // Confirmation Modal
  const [deleteTargetTxn, setDeleteTargetTxn] = useState<Transaction | null>(null);

  // Auto scroll to top when changing tab
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [currentMode]);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const contMap = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const targetType = isPayables ? 'expense' : 'income';
  const today = getTodayDateString();
  const currentMonthPrefix = today.substring(0, 7);

  // Filter only pending items of selected type
  const pendingTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== targetType || t.status !== 'pending') return false;

      // Category filter
      if (filterCategoryId !== 'all' && t.categoryId !== filterCategoryId) return false;

      // Account filter
      if (filterAccountId !== 'all' && t.accountId !== filterAccountId) return false;

      // Contact filter
      if (filterContactId !== 'all' && t.contactId !== filterContactId) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const cont = contMap.get(t.contactId || '')?.name?.toLowerCase() || '';
        const cat = catMap.get(t.categoryId)?.name?.toLowerCase() || '';
        const doc = (t.documentNumber || '').toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          cont.includes(q) ||
          cat.includes(q) ||
          doc.includes(q) ||
          t.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [transactions, targetType, searchTerm, filterCategoryId, filterAccountId, filterContactId, contMap, catMap]);

  // Historical settled transactions in current month
  const settledThisMonth = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== targetType || t.status !== 'paid') return false;
      const date = (t.paymentDate || t.dueDate || '').split('T')[0];
      return date.startsWith(currentMonthPrefix);
    });
  }, [transactions, targetType, currentMonthPrefix]);

  const totalSettledThisMonth = useMemo(() => {
    return Math.round(settledThisMonth.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
  }, [settledThisMonth]);

  // Aging Buckets
  const { overdueItems, todayItems, next7DaysItems, laterThisMonthItems, futureItems } =
    useMemo(() => {
      const overdue: Transaction[] = [];
      const dueToday: Transaction[] = [];
      const next7: Transaction[] = [];
      const laterThisMonth: Transaction[] = [];
      const future: Transaction[] = [];

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
    }, [pendingTransactions, today, currentMonthPrefix]);

  // Summary Totals with exact cent precision
  const totalOverdue = Math.round(overdueItems.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
  const totalToday = Math.round(todayItems.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
  const totalPending = Math.round(pendingTransactions.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;

  // Filter relevant contacts for current mode (Suppliers for payables, Customers for receivables)
  const relevantContacts = useMemo(() => {
    return contacts.filter((c) => isPayables ? c.type === 'supplier' || c.type === 'both' : c.type === 'customer' || c.type === 'both');
  }, [contacts, isPayables]);

  // Filter relevant categories for current mode
  const relevantCategories = useMemo(() => {
    return categories.filter((c) => c.type === targetType);
  }, [categories, targetType]);

  const calculateDaysDiff = (dueDateStr: string) => {
    const due = new Date(dueDateStr.split('T')[0]).getTime();
    const now = new Date(today).getTime();
    const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderSection = (
    title: string,
    items: Transaction[],
    badgeColor: string,
    icon: React.ElementType,
    description: string,
    isOverdueSection = false
  ) => {
    const Icon = icon;
    const sectionTotal = Math.round(items.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;

    return (
      <div className={`p-5 bg-white dark:bg-[#111827] border rounded-2xl shadow-sm space-y-3 transition-all ${
        isOverdueSection && items.length > 0
          ? 'border-rose-500/40 dark:border-rose-500/30'
          : 'border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${badgeColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                  isOverdueSection && items.length > 0
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full'
                }`}>
                  {items.length}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </div>
          <span className={`font-mono font-extrabold text-sm ${
            isOverdueSection && items.length > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-900 dark:text-white'
          }`}>
            {formatCurrency(sectionTotal)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              Nenhum título pendente neste período.
            </div>
          ) : (
            items.map((txn) => {
              const cont = contMap.get(txn.contactId || '');
              const cat = catMap.get(txn.categoryId);
              const acc = accMap.get(txn.accountId);
              const daysDiff = calculateDaysDiff(txn.dueDate);

              return (
                <div
                  key={txn.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2.5 rounded-xl transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isPayables
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}
                    >
                      {isPayables ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                        <span>{txn.description}</span>
                        {txn.installment && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                            {txn.installment.current}/{txn.installment.total}
                          </span>
                        )}
                        {daysDiff < 0 ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-800/50">
                            {Math.abs(daysDiff)} {Math.abs(daysDiff) === 1 ? 'dia' : 'dias'} em atraso
                          </span>
                        ) : daysDiff === 0 ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800/50">
                            Vence hoje
                          </span>
                        ) : null}
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono font-semibold text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(txn.dueDate)}
                        </span>

                        {cont && (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            {isPayables ? <Building className="w-3 h-3 text-slate-400" /> : <User className="w-3 h-3 text-slate-400" />}
                            <span className="truncate max-w-[140px]">{cont.name}</span>
                          </span>
                        )}

                        {cat && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[120px]">{cat.name}</span>
                          </span>
                        )}

                        {acc && (
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3 h-3 text-slate-400" />
                            <span>{acc.name}</span>
                          </span>
                        )}

                        {txn.documentNumber && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                            <FileText className="w-3 h-3 text-slate-400" />
                            {txn.documentNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <span
                      className={`font-mono font-extrabold text-sm mr-1 ${
                        isPayables
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
                      onClick={() => setDeleteTargetTxn(txn)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Excluir Lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openSettlementModal(txn)}
                      className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
                        isPayables
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPayables ? 'Dar Baixa' : 'Receber'}</span>
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
    <div className="space-y-6 animate-fade-in pb-12 select-none">
      {/* Top Header Mode Switch & Direct Action */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Toggle Switch */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('payables')}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg transition-all ${
              isPayables
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Contas a Pagar</span>
            {overdueItems.length > 0 && isPayables && (
              <span className="ml-1 px-1.5 py-0.5 bg-white text-rose-600 text-[10px] rounded-full font-extrabold shadow-sm">
                {overdueItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('receivables')}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg transition-all ${
              !isPayables
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Contas a Receber</span>
            {overdueItems.length > 0 && !isPayables && (
              <span className="ml-1 px-1.5 py-0.5 bg-white text-emerald-600 text-[10px] rounded-full font-extrabold shadow-sm">
                {overdueItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Search & New Entry */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Buscar em ${isPayables ? 'contas a pagar' : 'contas a receber'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => openQuickEntry(isPayables ? 'expense' : 'income')}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 ${
              isPayables
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isPayables ? 'Nova Conta a Pagar' : 'Novo Recebível'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total em Aberto */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isPayables ? 'Total a Pagar em Aberto' : 'Total a Receber Previsto'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isPayables ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {isPayables ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {formatCurrency(totalPending)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {pendingTransactions.length} títulos pendentes
            </span>
          </div>
          <div className={`absolute top-0 right-0 left-0 h-1 ${isPayables ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        </div>

        {/* 2. Em Atraso (Vencidos) */}
        <div className={`p-5 bg-white dark:bg-[#111827] border rounded-2xl shadow-sm relative overflow-hidden ${
          overdueItems.length > 0
            ? 'border-rose-500/40 bg-rose-500/[0.02]'
            : 'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isPayables ? 'Contas Vencidas' : 'Recebíveis em Atraso'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(totalOverdue)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {overdueItems.length} {overdueItems.length === 1 ? 'título em atraso' : 'títulos em atraso'}
            </span>
          </div>
          <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />
        </div>

        {/* 3. Vence Hoje */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-amber-500/30 rounded-2xl shadow-sm relative overflow-hidden bg-amber-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isPayables ? 'Vence Hoje' : 'Recebe Hoje'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(totalToday)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {todayItems.length} títulos programados hoje
            </span>
          </div>
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
        </div>

        {/* 4. Total Liquidado no Mês */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
              {isPayables ? 'Pago este Mês' : 'Recebido este Mês'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
              {formatCurrency(totalSettledThisMonth)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {settledThisMonth.length} baixas concluídas no mês
            </span>
          </div>
          <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500" />
        </div>
      </div>

      {/* Filter Bar Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px] mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros:</span>
        </div>

        {/* Category Filter */}
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">Todas as Categorias</option>
          {relevantCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Contact Filter */}
        <select
          value={filterContactId}
          onChange={(e) => setFilterContactId(e.target.value)}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">{isPayables ? 'Todos os Fornecedores' : 'Todos os Clientes'}</option>
          {relevantContacts.map((cont) => (
            <option key={cont.id} value={cont.id}>
              {cont.name}
            </option>
          ))}
        </select>

        {/* Bank Account Filter */}
        <select
          value={filterAccountId}
          onChange={(e) => setFilterAccountId(e.target.value)}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">Todas as Contas Bancárias</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Reset button if filtered */}
        {(filterCategoryId !== 'all' || filterContactId !== 'all' || filterAccountId !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setFilterCategoryId('all');
              setFilterContactId('all');
              setFilterAccountId('all');
              setSearchTerm('');
            }}
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Chronological Aging Sections */}
      <div className="space-y-5">
        {/* 1. Vencidos */}
        {overdueItems.length > 0 &&
          renderSection(
            isPayables ? 'Contas Vencidas (Atrasadas)' : 'Recebíveis em Atraso (Inadimplência)',
            overdueItems,
            'bg-rose-500/15 text-rose-500',
            AlertTriangle,
            isPayables
              ? 'Títulos a fornecedores que já ultrapassaram a data limite de pagamento'
              : 'Cobranças de clientes pendentes após o vencimento',
            true
          )}

        {/* 2. Vence Hoje */}
        {todayItems.length > 0 &&
          renderSection(
            isPayables ? 'Vencem Hoje (Prioridade Máxima)' : 'Recebimentos de Hoje',
            todayItems,
            'bg-amber-500/15 text-amber-500',
            Clock,
            isPayables
              ? 'Contas com pagamento programado para o dia de hoje'
              : 'Previsões de recebimento para compensação hoje'
          )}

        {/* 3. Próximos 7 dias */}
        {renderSection(
          'Vencimentos nos Próximos 7 Dias',
          next7DaysItems,
          'bg-blue-500/15 text-blue-500',
          Calendar,
          'Títulos programados para os próximos 7 dias'
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
            'Títulos programados para os próximos meses'
          )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetTxn}
        title="Excluir Lançamento"
        message={`Tem certeza que deseja excluir o lançamento "${deleteTargetTxn?.description}" no valor de ${formatCurrency(deleteTargetTxn?.amount || 0)}?`}
        confirmLabel="Sim, Excluir"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteTargetTxn) {
            deleteTransaction(deleteTargetTxn.id);
            setDeleteTargetTxn(null);
          }
        }}
        onCancel={() => setDeleteTargetTxn(null)}
      />
    </div>
  );
};
