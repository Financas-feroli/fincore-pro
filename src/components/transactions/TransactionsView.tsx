import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  Search,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, getStatusBadge, getTodayDateString } from '../../utils/formatters';
import { storageService } from '../../services/storage';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { Transaction } from '../../types';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    categories,
    accounts,
    contacts,
    costCenters,
    openQuickEntry,
    openEditTransaction,
    openSettlementModal,
    deleteTransaction,
    deleteMultipleTransactions,
    settleMultipleTransactions,
    searchQuery,
    dateRange,
    showToast,
  } = useFinance();

  // Filters State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCostCenter, setFilterCostCenter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Selected for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAccountModalOpen, setBatchAccountModalOpen] = useState(false);
  const [batchAccountId, setBatchAccountId] = useState(accounts[0]?.id || '');

  // Confirmation Modals State
  const [deleteTargetTxn, setDeleteTargetTxn] = useState<Transaction | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const contMap = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  const effectiveSearch = localSearch || searchQuery;

  // Filter logic
  const filteredTransactions = useMemo(() => {
    const today = getTodayDateString();

    return transactions.filter((t) => {
      // Date Range Filter
      const targetDate = (t.paymentDate || t.dueDate).split('T')[0];
      if (targetDate < dateRange.start || targetDate > dateRange.end) {
        return false;
      }

      // Type Filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // Status Filter
      const cleanDue = (t.dueDate || '').split('T')[0];
      if (filterStatus === 'paid' && t.status !== 'paid') return false;
      if (filterStatus === 'pending' && (t.status !== 'pending' || cleanDue < today)) return false;
      if (filterStatus === 'overdue' && (t.status !== 'pending' || cleanDue >= today)) return false;

      // Category
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;

      // Account
      if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;

      // Cost Center
      if (filterCostCenter !== 'all' && t.costCenterId !== filterCostCenter) return false;

      // Search Query
      if (effectiveSearch) {
        const query = effectiveSearch.toLowerCase();
        const catName = catMap.get(t.categoryId)?.name?.toLowerCase() || '';
        const contName = contMap.get(t.contactId || '')?.name?.toLowerCase() || '';
        const doc = t.documentNumber?.toLowerCase() || '';
        const tags = t.tags.join(' ').toLowerCase();

        const match =
          t.description.toLowerCase().includes(query) ||
          catName.includes(query) ||
          contName.includes(query) ||
          doc.includes(query) ||
          tags.includes(query) ||
          t.amount.toString().includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [
    transactions,
    dateRange,
    filterType,
    filterStatus,
    filterCategory,
    filterAccount,
    filterCostCenter,
    effectiveSearch,
    catMap,
    contMap,
  ]);

  // Totals for filtered data
  const { totalInflow, totalOutflow, netTotal } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    filteredTransactions.forEach((t) => {
      if (t.status === 'cancelled' || t.type === 'transfer') return;
      if (t.type === 'income') inflow += t.amount;
      if (t.type === 'expense') outflow += t.amount;
    });
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netTotal: inflow - outflow,
    };
  }, [filteredTransactions]);

  // Paginated data
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Select all handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Batch Settlement
  const handleBatchSettle = () => {
    if (selectedIds.length === 0) return;
    settleMultipleTransactions(selectedIds, batchAccountId, getTodayDateString());
    setSelectedIds([]);
    setBatchAccountModalOpen(false);
  };

  // Batch Delete
  const handleExecuteBatchDelete = () => {
    if (selectedIds.length === 0) return;
    deleteMultipleTransactions(selectedIds);
    setSelectedIds([]);
    setIsBatchDeleteModalOpen(false);
  };

  // Single Delete
  const handleExecuteSingleDelete = () => {
    if (!deleteTargetTxn) return;
    deleteTransaction(deleteTargetTxn.id);
    setDeleteTargetTxn(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    storageService.exportTransactionsToCSV(
      filteredTransactions,
      categories,
      accounts,
      contacts
    );
    showToast('Exportação concluída', 'O relatório foi exportado com sucesso em CSV.', 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top Filter & Summary Header */}
      <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        {/* Row 1: Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Lançamentos Filtrados
            </span>
            <p className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
              {filteredTransactions.length} registros
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
              Total Entradas
            </span>
            <p className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(totalInflow)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">
              Total Saídas
            </span>
            <p className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {formatCurrency(totalOutflow)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">
              Saldo do Filtro
            </span>
            <p
              className={`text-base font-extrabold font-mono mt-0.5 ${
                netTotal >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netTotal)}
            </p>
          </div>
        </div>

        {/* Row 2: Dynamic Filters & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição, cliente, tags..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-slate-900 dark:text-slate-100 placeholder:font-normal placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="income">Apenas Receitas (+)</option>
            <option value="expense">Apenas Despesas (-)</option>
            <option value="transfer">Apenas Transferências (↔)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pagos / Recebidos</option>
            <option value="pending">Pendentes (No Prazo)</option>
            <option value="overdue">Vencidos (Atrasados)</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 max-w-[170px] truncate"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 max-w-[150px] truncate"
          >
            <option value="all">Todas as Contas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors ml-auto"
            title="Exportar dados filtrados para planilha CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Exportar Planilha</span>
          </button>

          {/* New Transaction Button */}
          <button
            onClick={() => openQuickEntry('expense')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{selectedIds.length} item(ns) selecionado(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchAccountModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Liquidar Selecionados</span>
            </button>
            <button
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Selecionados</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Main Transactions Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-10">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600">
                    {selectedIds.length > 0 && selectedIds.length === paginatedData.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Vencimento / Pgto</th>
                <th className="py-3 px-4">Descrição & Detalhes</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Conta Bancária</th>
                <th className="py-3 px-3">Cliente / Fornecedor</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Nenhum lançamento financeiro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                paginatedData.map((txn) => {
                  const isSelected = selectedIds.includes(txn.id);
                  const badge = getStatusBadge(txn.status, txn.dueDate);
                  const cat = catMap.get(txn.categoryId);
                  const acc = accMap.get(txn.accountId);
                  const cont = contMap.get(txn.contactId || '');

                  return (
                    <tr
                      key={txn.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleSelectOne(txn.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.bgClass}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(txn.dueDate)}
                        </div>
                        {txn.paymentDate && txn.status === 'paid' && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Pago em: {formatDate(txn.paymentDate)}
                          </div>
                        )}
                      </td>

                      {/* Description & Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                              txn.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : txn.type === 'expense'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {txn.type === 'income' ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : txn.type === 'expense' ? (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {txn.description}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              {txn.documentNumber && (
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                  {txn.documentNumber}
                                </span>
                              )}
                              {txn.tags.map((tag) => (
                                <span key={tag} className="text-slate-500 dark:text-slate-400">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{
                            backgroundColor: `${cat?.color || '#94a3b8'}15`,
                            color: cat?.color || '#94a3b8',
                          }}
                        >
                          {cat?.name || 'Geral'}
                        </span>
                      </td>

                      {/* Bank Account */}
                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {acc?.name || 'Caixa'}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[140px]">
                        {cont ? cont.tradeName || cont.name : '—'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            txn.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : txn.type === 'expense'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }
                        >
                          {txn.type === 'expense' ? '- ' : txn.type === 'income' ? '+ ' : ''}
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {txn.status !== 'paid' && (
                            <button
                              onClick={() => openSettlementModal(txn)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                              title="Liquidar / Dar Baixa"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> (Total de {filteredTransactions.length} registros)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Anterior
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Single Delete */}
      <ConfirmationModal
        isOpen={!!deleteTargetTxn}
        onClose={() => setDeleteTargetTxn(null)}
        onConfirm={handleExecuteSingleDelete}
        title="Excluir Lançamento Financeiro?"
        message={
          deleteTargetTxn && (
            <div className="space-y-2">
              <p>
                Tem certeza que deseja remover o lançamento{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{deleteTargetTxn.description}"
                </strong>{' '}
                no valor de{' '}
                <strong className="font-mono text-rose-500">
                  {formatCurrency(deleteTargetTxn.amount)}
                </strong>
                ?
              </p>
              {deleteTargetTxn.status === 'paid' && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                  ⚠️ <strong>Atenção:</strong> Este lançamento já está marcado como pago. Ao excluí-lo, o saldo da conta bancária será automaticamente recalculado/estornado.
                </p>
              )}
            </div>
          )
        }
        confirmLabel="Sim, Excluir"
        cancelLabel="Voltar"
        variant="danger"
      />

      {/* Confirmation Modal: Batch Delete */}
      <ConfirmationModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleExecuteBatchDelete}
        title="Exclusão em Massa de Lançamentos"
        message={
          <div>
            <p>
              Você está prestes a excluir definitivamente{' '}
              <strong className="text-rose-500 font-bold">{selectedIds.length}</strong>{' '}
              lançamentos selecionados.
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Esta ação não pode ser desfeita. Todos os saldos de contas liquidadas serão estornados.
            </p>
          </div>
        }
        confirmLabel={`Excluir ${selectedIds.length} Lançamentos`}
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
