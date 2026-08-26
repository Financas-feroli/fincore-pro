import React, { useState } from 'react';
import {
  Landmark,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Sparkles,
  RefreshCw,
  Crown,
  Zap,
  Lock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { getPlanFeatures } from '../../utils/planPermissions';
import { PricingModal } from '../common/PricingModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { storageService } from '../../services/storage';
import { BankAccount, BankReconciliationItem } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const BankingView: React.FC = () => {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    recalculateAccountBalances,
    setAccountBalanceDirectly,
    transferFunds,
    transactions,
    addTransaction,
    categories,
    showToast,
  } = useFinance();

  const { organization, isDemoMode } = useAuth();
  const isTrial = isDemoMode || organization?.subscriptionStatus === 'trialing';
  const planFeatures = getPlanFeatures(organization?.plan || 'pro', isTrial);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // New Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accName, setAccName] = useState('');
  const [accBankName, setAccBankName] = useState('Banco Itaú');
  const [accAgency, setAccAgency] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accType, setAccType] = useState<BankAccount['type']>('checking');
  const [accInitialBalance, setAccInitialBalance] = useState('0');
  const [accColor, setAccColor] = useState('#10B981');
  const [accCreditLimit, setAccCreditLimit] = useState('10000');
  const [accClosingDay, setAccClosingDay] = useState(25);
  const [accDueDay, setAccDueDay] = useState(5);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState(accounts[0]?.id || '');
  const [transferTo, setTransferTo] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferDesc, setTransferDesc] = useState('');

  // Delete Account Confirmation Modal
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  // Bank Reconciliation State
  const [reconciliationItems, setReconciliationItems] = useState<BankReconciliationItem[]>([]);
  const [selectedReconcileAcc, setSelectedReconcileAcc] = useState(accounts[0]?.id || '');

  // Open New/Edit Account Modal
  const handleOpenAccountModal = (accountToEdit?: BankAccount) => {
    if (!accountToEdit && accounts.length >= planFeatures.maxBankAccounts) {
      showToast(
        'Limite de Contas Bancárias Atingido 🔒',
        `O Plano Starter permite até ${planFeatures.maxBankAccounts} contas bancárias. Faça upgrade para o Plano Pro para cadastrar contas e cartões ilimitados.`,
        'warning'
      );
      setIsPricingModalOpen(true);
      return;
    }
    if (accountToEdit) {
      setEditingAccountId(accountToEdit.id);
      setAccName(accountToEdit.name);
      setAccBankName(accountToEdit.bankName);
      setAccAgency(accountToEdit.agency || '');
      setAccNumber(accountToEdit.accountNumber || '');
      setAccType(accountToEdit.type);
      setAccInitialBalance(accountToEdit.currentBalance.toString());
      setAccColor(accountToEdit.color);
      setAccCreditLimit((accountToEdit.creditLimit || 0).toString());
      setAccClosingDay(accountToEdit.closingDay || 25);
      setAccDueDay(accountToEdit.dueDay || 5);
    } else {
      setEditingAccountId(null);
      setAccName('');
      setAccBankName('Banco Itaú');
      setAccAgency('');
      setAccNumber('');
      setAccType('checking');
      setAccInitialBalance('0');
      setAccColor('#10B981');
      setAccCreditLimit('10000');
      setAccClosingDay(25);
      setAccDueDay(5);
    }
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    const initialBal = Math.round((parseFloat(accInitialBalance.replace(',', '.')) || 0) * 100) / 100;
    const limit = parseFloat(accCreditLimit.replace(',', '.')) || 0;

    if (editingAccountId) {
      updateAccount(editingAccountId, {
        name: accName.trim(),
        bankName: accBankName,
        agency: accAgency,
        accountNumber: accNumber,
        type: accType,
        initialBalance: initialBal,
        currentBalance: initialBal,
        color: accColor,
        creditLimit: accType === 'credit_card' ? limit : undefined,
        closingDay: accType === 'credit_card' ? accClosingDay : undefined,
        dueDay: accType === 'credit_card' ? accDueDay : undefined,
      });
    } else {
      addAccount({
        name: accName.trim(),
        bankName: accBankName,
        agency: accAgency,
        accountNumber: accNumber,
        type: accType,
        initialBalance: initialBal,
        currentBalance: initialBal,
        color: accColor,
        creditLimit: accType === 'credit_card' ? limit : undefined,
        closingDay: accType === 'credit_card' ? accClosingDay : undefined,
        dueDay: accType === 'credit_card' ? accDueDay : undefined,
      });
    }
    setIsAccountModalOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount.replace(',', '.')) || 0;
    if (amount <= 0) {
      showToast('Erro', 'Informe um valor válido para transferência.', 'error');
      return;
    }
    transferFunds(transferFrom, transferTo, amount, transferDate, transferDesc);
    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferDesc('');
  };

  // Upload and parse OFX/CSV file
  const handleOFXUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsedItems = storageService.parseOFX(content, file.name);
      if (parsedItems.length === 0) {
        showToast('Aviso', 'Nenhum lançamento identificado no arquivo enviado. Certifique-se de que é um extrato .OFX ou .CSV válido.', 'warning');
        return;
      }

      // Auto-match with system transactions
      const matched = parsedItems.map((item) => {
        const found = transactions.find(
          (t) =>
            t.accountId === selectedReconcileAcc &&
            Math.abs(t.amount - item.amount) < 0.01 &&
            Math.abs(new Date(t.dueDate).getTime() - new Date(item.date).getTime()) <=
              1000 * 60 * 60 * 24 * 3
        );
        if (found) {
          return {
            ...item,
            status: 'matched' as const,
            matchedTransactionId: found.id,
          };
        }
        return item;
      });

      setReconciliationItems(matched);
      const autoMatchedCount = matched.filter((i) => i.status === 'matched').length;
      showToast(
        'Extrato Processado com Sucesso',
        `${parsedItems.length} transações identificadas (${autoMatchedCount} conciliadas automaticamente).`,
        'success'
      );
    };
    reader.readAsText(file);
  };

  // Create fast transaction from unmatched OFX item
  const handleCreateTxnFromOFX = (item: BankReconciliationItem) => {
    const defaultCat = categories.find(
      (c) => c.type === (item.type === 'CREDIT' ? 'income' : 'expense')
    );

    addTransaction({
      description: item.description,
      amount: item.amount,
      originalAmount: item.amount,
      type: item.type === 'CREDIT' ? 'income' : 'expense',
      status: 'paid',
      categoryId: defaultCat?.id || categories[0]?.id || '',
      accountId: selectedReconcileAcc,
      dueDate: item.date,
      paymentDate: item.date,
      competenceDate: item.date.substring(0, 7) + '-01',
      paymentMethod: 'bank_transfer',
      reconciled: true,
      tags: ['Conciliado', 'ExtratoBancario'],
    });

    setReconciliationItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'matched' as const } : i))
    );

    showToast('Conciliado', `Lançamento "${item.description}" criado com sucesso.`, 'success');
  };

  // Batch import all remaining unmatched items
  const handleBatchImportUnmatched = () => {
    const unmatched = reconciliationItems.filter((i) => i.status !== 'matched');
    if (unmatched.length === 0) return;

    let count = 0;
    unmatched.forEach((item) => {
      const defaultCat = categories.find(
        (c) => c.type === (item.type === 'CREDIT' ? 'income' : 'expense')
      );

      addTransaction({
        description: item.description,
        amount: item.amount,
        originalAmount: item.amount,
        type: item.type === 'CREDIT' ? 'income' : 'expense',
        status: 'paid',
        categoryId: defaultCat?.id || categories[0]?.id || '',
        accountId: selectedReconcileAcc,
        dueDate: item.date,
        paymentDate: item.date,
        competenceDate: item.date.substring(0, 7) + '-01',
        paymentMethod: 'bank_transfer',
        reconciled: true,
        tags: ['Conciliado', 'ExtratoBancario'],
      });
      count++;
    });

    setReconciliationItems((prev) =>
      prev.map((i) => ({ ...i, status: 'matched' as const }))
    );

    showToast(
      'Importação em Lote Concluída',
      `${count} transações foram criadas e conciliadas no saldo da conta com sucesso!`,
      'success'
    );
  };

  const handleConfirmDeleteAccount = () => {
    if (!accountToDelete) return;
    deleteAccount(accountToDelete.id);
    setAccountToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-500" />
            Gestão Bancária & Conciliação
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Contas correntes, cartões corporativos, saldos em tempo real e conciliação de extratos OFX/CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={recalculateAccountBalances}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            title="Recalcula e reconcilia todos os saldos bancários com base no histórico de lançamentos"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Recalcular Saldos</span>
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Transferir Saldo</span>
          </button>
          <button
            onClick={() => handleOpenAccountModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta / Cartão</span>
          </button>
        </div>
      </div>

      {/* Bank Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isCard = acc.type === 'credit_card';
          const usedLimit = Math.abs(acc.currentBalance < 0 ? acc.currentBalance : 0);
          const limitTotal = acc.creditLimit || 50000;
          const availableLimit = Math.max(0, limitTotal - usedLimit);
          const limitPercent = Math.min(100, (usedLimit / limitTotal) * 100);

          return (
            <div
              key={acc.id}
              className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: acc.color }}
                    >
                      {isCard ? <CreditCard className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {acc.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{acc.bankName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenAccountModal(acc)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => setAccountToDelete(acc)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Details */}
                <div className="mt-5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isCard ? 'Fatura Atual Utilizada' : 'Saldo em Conta'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3
                      className={`text-2xl font-extrabold font-mono tracking-tight ${
                        isCard
                          ? 'text-rose-500'
                          : acc.currentBalance >= 0
                          ? 'text-slate-900 dark:text-white'
                          : 'text-rose-500'
                      }`}
                    >
                      {formatCurrency(isCard ? usedLimit : acc.currentBalance)}
                    </h3>
                  </div>

                  {/* For Credit Cards: Limit progress bar */}
                  {isCard && (
                    <div className="mt-3 space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-2 rounded-full transition-all"
                          style={{ width: `${limitPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>Disponível: {formatCurrency(availableLimit)}</span>
                        <span>Limite: {formatCurrency(limitTotal)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                        <span>Fecha dia: {acc.closingDay || 25}</span>
                        <span>Vence dia: {acc.dueDay || 5}</span>
                      </div>
                    </div>
                  )}

                  {/* Normal bank account agency/account info */}
                  {!isCard && acc.accountNumber && (
                    <div className="mt-3 text-[11px] text-slate-400 font-mono flex items-center gap-3">
                      {acc.agency && <span>Ag: {acc.agency}</span>}
                      <span>CC: {acc.accountNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom Stripe */}
              <div
                className="h-1 -mx-6 -mb-6 mt-5"
                style={{ backgroundColor: acc.color }}
              />
            </div>
          );
        })}
      </div>

      {/* Bank Statement Reconciliation Section (OFX / CSV) */}
      <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Conciliação Bancária Inteligente (OFX / CSV)
              </h3>
              {!planFeatures.hasOFXReconciliation && (
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-300 rounded border border-amber-500/30">
                  Disponível no Pro & Business
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Importe o extrato do seu banco e concilie automaticamente com os lançamentos do sistema.
            </p>
          </div>

          {planFeatures.hasOFXReconciliation && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedReconcileAcc}
                onChange={(e) => setSelectedReconcileAcc(e.target.value)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-slate-800 dark:text-slate-100"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    Conciliar: {a.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer transition-colors shadow-sm flex-shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar Extrato (.OFX / .CSV)</span>
                <input
                  type="file"
                  accept=".ofx,.csv,.txt"
                  onChange={handleOFXUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {!planFeatures.hasOFXReconciliation ? (
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Conciliação Automática OFX & CSV
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A importação e conciliação automática de extratos OFX de todos os bancos é um recurso dos planos <strong>PRO</strong> e <strong>BUSINESS</strong>.
              </p>
            </div>
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Fazer Upgrade para Plano Pro ↗</span>
            </button>
          </div>
        ) : reconciliationItems.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <Landmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nenhum extrato bancário importado no momento
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Baixe o arquivo <code>.OFX</code> no Internet Banking do seu banco e clique no botão acima para importar e conciliar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Statement Summary KPI Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total no Extrato</span>
                <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {reconciliationItems.length} lançamentos
                </p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-500 uppercase font-semibold">Total Entradas</span>
                <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  + {formatCurrency(reconciliationItems.filter((i) => i.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0))}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-rose-500 uppercase font-semibold">Total Saídas</span>
                <p className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                  - {formatCurrency(reconciliationItems.filter((i) => i.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0))}
                </p>
              </div>
              <div className="flex items-center justify-end sm:justify-center">
                {reconciliationItems.some((i) => i.status !== 'matched') ? (
                  <button
                    onClick={handleBatchImportUnmatched}
                    className="w-full px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Importar Todos ({reconciliationItems.filter((i) => i.status !== 'matched').length})</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    100% Conciliado
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>{reconciliationItems.length} transações no extrato</span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 font-semibold">
                  {reconciliationItems.filter((i) => i.status === 'matched').length} conciliadas
                </span>
                <button
                  onClick={() => setReconciliationItems([])}
                  className="text-slate-400 hover:text-rose-500 underline text-[11px]"
                >
                  Fechar Extrato
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              {reconciliationItems.map((item) => {
                const isMatched = item.status === 'matched';
                return (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                          isMatched
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {isMatched ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Data no extrato: {formatDate(item.date)} • FITID: {item.fitid}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span
                        className={`font-mono font-bold text-xs ${
                          item.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {item.type === 'CREDIT' ? '+ ' : '- '}
                        {formatCurrency(item.amount)}
                      </span>

                      {isMatched ? (
                        <span className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg">
                          Conciliado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateTxnFromOFX(item)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                        >
                          + Criar e Conciliar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal: New / Edit Bank Account */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={editingAccountId ? 'Editar Conta Bancária' : 'Nova Conta Bancária ou Cartão'}
        subtitle="Configure detalhes da instituição financeira, agência e saldos"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Nome de Identificação da Conta *
              </label>
              <input
                type="text"
                placeholder="Ex: Itaú PJ Principal, Nubank Reserva..."
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Instituição / Banco
              </label>
              <select
                value={accBankName}
                onChange={(e) => setAccBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="Banco Itaú">Banco Itaú</option>
                <option value="Nu Pagamentos">Nubank / Nu Pagamentos</option>
                <option value="Banco Inter">Banco Inter</option>
                <option value="Banco Bradesco">Banco Bradesco</option>
                <option value="Banco do Brasil">Banco do Brasil</option>
                <option value="Banco Santander">Banco Santander</option>
                <option value="Caixa Econômica">Caixa Econômica</option>
                <option value="BTG Pactual">BTG Pactual</option>
                <option value="Cora Bank">Cora Bank</option>
                <option value="Caixa Interno">Caixa Físico / Dinheiro</option>
                <option value="Outro">Outra Instituição</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tipo de Conta
              </label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as BankAccount['type'])}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="checking">Conta Corrente PJ</option>
                <option value="investment">Conta Investimento / Reserva</option>
                <option value="credit_card">Cartão de Crédito Corporativo</option>
                <option value="digital">Conta Digital / Carteira</option>
                <option value="cash">Caixa Físico (Fundo Fixo)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {editingAccountId ? 'Saldo da Conta (R$)' : 'Saldo Inicial (R$)'}
                </label>
                {editingAccountId && (
                  <button
                    type="button"
                    onClick={() => setAccInitialBalance('0')}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Zerar Saldo (R$ 0,00)
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="0,00"
                value={accInitialBalance}
                onChange={(e) => setAccInitialBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {accType === 'credit_card' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 bg-slate-100/60 dark:bg-[#161f30] rounded-xl border border-slate-200 dark:border-slate-700/70">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Limite Total (R$)
                </label>
                <input
                  type="text"
                  value={accCreditLimit}
                  onChange={(e) => setAccCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Dia Fechamento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={accClosingDay}
                  onChange={(e) => setAccClosingDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Dia Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={accDueDay}
                  onChange={(e) => setAccDueDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Agência
                </label>
                <input
                  type="text"
                  placeholder="0001"
                  value={accAgency}
                  onChange={(e) => setAccAgency(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Conta Corrente
                </label>
                <input
                  type="text"
                  placeholder="12345-6"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Color theme for the bank card */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cor do Cartão
            </label>
            <div className="flex items-center gap-2">
              {['#10B981', '#3B82F6', '#8B5CF6', '#EC7000', '#820AD1', '#FF7A00', '#1E293B'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      accColor === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
            >
              Salvar Conta
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Between Accounts */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transferência entre Contas"
        subtitle="Movimentação financeira interna entre contas da empresa"
        maxWidth="xl"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-5 flex items-center">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Valor da Transferência (R$)
              </label>
            </div>
            <input
              type="text"
              placeholder="0,00"
              required
              autoFocus
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 text-2xl font-extrabold font-mono bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-blue-600 dark:text-blue-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-5 flex items-center">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  De (Origem)
                </label>
              </div>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-blue-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="h-5 flex items-center">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Para (Destino)
                </label>
              </div>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-blue-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-5 flex items-center">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Data da Transferência
                </label>
              </div>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="h-5 flex items-center">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Descrição / Motivo
                </label>
              </div>
              <input
                type="text"
                placeholder="Ex: Reserva de contingência"
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md"
            >
              Transferir Agora
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Delete Bank Account */}
      <ConfirmationModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleConfirmDeleteAccount}
        title="Excluir Conta Bancária?"
        message={
          accountToDelete && (
            <div>
              <p>
                Você está prestes a remover a conta{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{accountToDelete.name}"
                </strong>{' '}
                ({accountToDelete.bankName}) com saldo atual de{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {formatCurrency(accountToDelete.currentBalance)}
                </strong>
                .
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Os lançamentos vinculados a esta conta permanecerão no extrato histórico.
              </p>
            </div>
          )
        }
        confirmLabel="Sim, Excluir Conta"
        cancelLabel="Voltar"
        variant="danger"
      />
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
    </div>
  );
};
