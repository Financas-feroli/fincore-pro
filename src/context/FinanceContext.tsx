import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  BankAccount,
  Category,
  CompanyProfile,
  Contact,
  CostCenter,
  FinancialSummary,
  RecurrenceFrequency,
  Transaction,
} from '../types';
import { storageService, AppBackupData } from '../services/storage';
import { useAuth } from './AuthContext';
import { calculateCashFlowAndSummary } from '../utils/cashFlowCalculator';
import { getTodayDateString, addMonthsClampDay } from '../utils/formatters';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'payables'
  | 'receivables'
  | 'banking'
  | 'contacts'
  | 'categories'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface DateRangeFilter {
  start: string;
  end: string;
  label: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  accounts: BankAccount[];
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
  companyProfile: CompanyProfile;
  summary: FinancialSummary;
  
  // UI State
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  hideBalances: boolean;
  toggleHideBalances: () => void;
  isQuickEntryOpen: boolean;
  setIsQuickEntryOpen: (open: boolean) => void;
  quickEntryType: 'income' | 'expense' | 'transfer';
  openQuickEntry: (type?: 'income' | 'expense' | 'transfer') => void;
  editingTransaction: Transaction | null;
  openEditTransaction: (txn: Transaction) => void;
  closeQuickEntry: () => void;
  
  // Settlement Modal
  isSettlementModalOpen: boolean;
  settlementTransaction: Transaction | null;
  openSettlementModal: (txn: Transaction) => void;
  closeSettlementModal: () => void;

  // Search & Global Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;

  // Notification Toasts
  toasts: ToastMessage[];
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  dismissToast: (id: string) => void;

  // Transaction Operations
  addTransaction: (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    options?: {
      installments?: number;
      recurrenceFrequency?: RecurrenceFrequency;
      recurrenceMonths?: number;
    }
  ) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteMultipleTransactions: (ids: string[]) => void;
  settleTransaction: (
    id: string,
    details: {
      paymentDate: string;
      accountId: string;
      interestAmount?: number;
      fineAmount?: number;
      discountAmount?: number;
    }
  ) => void;
  settleMultipleTransactions: (ids: string[], accountId: string, paymentDate: string) => void;
  transferFunds: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: string,
    description: string
  ) => void;

  // Account Operations
  addAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteAccount: (id: string) => void;
  recalculateAccountBalances: () => void;
  setAccountBalanceDirectly: (accountId: string, newBalance: number, resetInitial?: boolean) => void;

  // Category Operations
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Contact Operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  // Cost Center Operations
  addCostCenter: (costCenter: Omit<CostCenter, 'id'>) => void;
  updateCostCenter: (id: string, updates: Partial<CostCenter>) => void;
  deleteCostCenter: (id: string) => void;

  // Settings & Backups
  updateCompanyProfile: (profile: CompanyProfile) => void;
  loadDemoData: () => void;
  exportBackup: () => void;
  restoreBackup: (fileContent: string) => boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, organization, isDemoMode } = useAuth();

  const activeTenantId = useMemo(() => {
    if (isDemoMode) return 'demo';
    if (user?.id) return `user_${user.id}`;
    return 'guest';
  }, [isDemoMode, user?.id]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    return {
      name: 'PROSPER Soluções',
      tradeName: 'PROSPER',
      document: '00.000.000/0001-00',
      fiscalRegime: 'simples',
      email: 'contato@prosper.com.br',
      phone: '(11) 99999-9999',
      address: 'Av. Paulista, 1000 - São Paulo/SP',
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
    };
  });

  // Re-load and isolate data whenever the active tenant or user changes
  useEffect(() => {
    const companyInfo = {
      name: organization?.name || user?.user_metadata?.company_name || 'Minha Empresa Ltda',
      tradeName: organization?.tradeName || user?.user_metadata?.company_name || 'Minha Empresa',
      document: organization?.document || user?.user_metadata?.document || '',
      email: user?.email || '',
    };
    const data = storageService.loadAllData(activeTenantId, companyInfo);
    setTransactions(data.transactions);
    setAccounts(data.accounts);
    setCategories(data.categories);
    setCostCenters(data.costCenters);
    setContacts(data.contacts);
    setCompanyProfile(data.companyProfile);
  }, [activeTenantId, organization?.id, organization?.name]);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('prosper_theme') as 'dark' | 'light') || (localStorage.getItem('fincore_theme') as 'dark' | 'light') || 'dark';
  });

  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    return localStorage.getItem('prosper_hide_balances') === 'true';
  });

  const toggleHideBalances = () => {
    setHideBalances((prev) => {
      const next = !prev;
      localStorage.setItem('prosper_hide_balances', String(next));
      return next;
    });
  };

  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementTransaction, setSettlementTransaction] = useState<Transaction | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Default date filter: Current Month
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
      label: 'Este Mês',
    };
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply Theme class to HTML
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('prosper_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Recalculate financial summary
  const summary = useMemo(() => {
    return calculateCashFlowAndSummary(transactions, accounts);
  }, [transactions, accounts]);

  // Sync to storage with active tenant isolation
  const syncTransactions = (newTxns: Transaction[]) => {
    setTransactions(newTxns);
    storageService.saveTransactions(newTxns, activeTenantId);
  };

  const syncAccounts = (newAccs: BankAccount[]) => {
    setAccounts(newAccs);
    storageService.saveAccounts(newAccs, activeTenantId);
  };

  const syncCategories = (newCats: Category[]) => {
    setCategories(newCats);
    storageService.saveCategories(newCats, activeTenantId);
  };

  const syncCostCenters = (newCCs: CostCenter[]) => {
    setCostCenters(newCCs);
    storageService.saveCostCenters(newCCs, activeTenantId);
  };

  const syncContacts = (newConts: Contact[]) => {
    setContacts(newConts);
    storageService.saveContacts(newConts, activeTenantId);
  };

  const syncCompany = (newComp: CompanyProfile) => {
    setCompanyProfile(newComp);
    storageService.saveCompany(newComp, activeTenantId);
  };

  // Quick Entry & Edit Transaction Handlers
  const openQuickEntry = (type: 'income' | 'expense' | 'transfer' = 'expense') => {
    setEditingTransaction(null);
    setQuickEntryType(type);
    setIsQuickEntryOpen(true);
  };

  const openEditTransaction = (txn: Transaction) => {
    setEditingTransaction(txn);
    setQuickEntryType(txn.type);
    setIsQuickEntryOpen(true);
  };

  const closeQuickEntry = () => {
    setEditingTransaction(null);
    setIsQuickEntryOpen(false);
  };

  // Settlement Modal Helpers
  const openSettlementModal = (txn: Transaction) => {
    setSettlementTransaction(txn);
    setIsSettlementModalOpen(true);
  };

  const closeSettlementModal = () => {
    setSettlementTransaction(null);
    setIsSettlementModalOpen(false);
  };

  // Helper to adjust balance for an account
  const adjustAccountBalance = (
    accountList: BankAccount[],
    accountId: string,
    amountDelta: number
  ) => {
    const acc = accountList.find((a) => a.id === accountId);
    if (acc) {
      acc.currentBalance = Number((acc.currentBalance + amountDelta).toFixed(2));
      acc.updatedAt = new Date().toISOString();
    }
  };

  // ADD TRANSACTION (Supports single, installments and recurrence with exact cent math & date clamping)
  const addTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    options?: {
      installments?: number;
      recurrenceFrequency?: RecurrenceFrequency;
      recurrenceMonths?: number;
    }
  ) => {
    const installments = Math.max(1, options?.installments || 1);
    const recurrenceFreq = options?.recurrenceFrequency || 'none';
    const recurrenceCount = Math.max(1, options?.recurrenceMonths || 12);

    const newTxns: Transaction[] = [];
    const timestamp = new Date().toISOString();
    const parentGroupId = `grp-${Date.now()}`;
    const totalAmount = Number(data.amount.toFixed(2));

    if (installments > 1) {
      // Installment Plan: exact cent distribution so sum(installments) === totalAmount
      const baseInstallmentAmount = Math.floor((totalAmount / installments) * 100) / 100;
      const roundingRemainder = Number((totalAmount - baseInstallmentAmount * installments).toFixed(2));

      for (let i = 1; i <= installments; i++) {
        // First installment absorbs the fractional cents difference
        const currentAmount = i === 1
          ? Number((baseInstallmentAmount + roundingRemainder).toFixed(2))
          : baseInstallmentAmount;

        const calculatedDueDate = addMonthsClampDay(data.dueDate, i - 1);
        const calculatedCompetence = addMonthsClampDay(data.competenceDate, i - 1);
        const isFirstPaid = i === 1 && data.status === 'paid';

        newTxns.push({
          ...data,
          id: `txn-${Date.now()}-${i}`,
          description: `${data.description} (${i}/${installments})`,
          amount: currentAmount,
          originalAmount: currentAmount,
          dueDate: calculatedDueDate,
          competenceDate: calculatedCompetence,
          status: isFirstPaid ? 'paid' : 'pending',
          paymentDate: isFirstPaid ? data.paymentDate || calculatedDueDate : undefined,
          installment: {
            current: i,
            total: installments,
            parentId: parentGroupId,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    } else if (recurrenceFreq !== 'none') {
      // Recurrent Transactions with safe calendar intervals
      for (let i = 1; i <= recurrenceCount; i++) {
        let calculatedDueDate = data.dueDate;
        let calculatedCompetence = data.competenceDate;

        if (recurrenceFreq === 'daily') {
          const baseD = new Date(data.dueDate.split('T')[0]);
          baseD.setDate(baseD.getDate() + (i - 1));
          calculatedDueDate = baseD.toISOString().split('T')[0];
        } else if (recurrenceFreq === 'weekly') {
          const baseD = new Date(data.dueDate.split('T')[0]);
          baseD.setDate(baseD.getDate() + (i - 1) * 7);
          calculatedDueDate = baseD.toISOString().split('T')[0];
        } else if (recurrenceFreq === 'biweekly') {
          const baseD = new Date(data.dueDate.split('T')[0]);
          baseD.setDate(baseD.getDate() + (i - 1) * 14);
          calculatedDueDate = baseD.toISOString().split('T')[0];
        } else if (recurrenceFreq === 'monthly') {
          calculatedDueDate = addMonthsClampDay(data.dueDate, i - 1);
          calculatedCompetence = addMonthsClampDay(data.competenceDate, i - 1);
        } else if (recurrenceFreq === 'bimonthly') {
          calculatedDueDate = addMonthsClampDay(data.dueDate, (i - 1) * 2);
          calculatedCompetence = addMonthsClampDay(data.competenceDate, (i - 1) * 2);
        } else if (recurrenceFreq === 'quarterly') {
          calculatedDueDate = addMonthsClampDay(data.dueDate, (i - 1) * 3);
          calculatedCompetence = addMonthsClampDay(data.competenceDate, (i - 1) * 3);
        } else if (recurrenceFreq === 'semiannual') {
          calculatedDueDate = addMonthsClampDay(data.dueDate, (i - 1) * 6);
          calculatedCompetence = addMonthsClampDay(data.competenceDate, (i - 1) * 6);
        } else if (recurrenceFreq === 'yearly') {
          calculatedDueDate = addMonthsClampDay(data.dueDate, (i - 1) * 12);
          calculatedCompetence = addMonthsClampDay(data.competenceDate, (i - 1) * 12);
        }

        const isFirstPaid = i === 1 && data.status === 'paid';

        newTxns.push({
          ...data,
          id: `txn-${Date.now()}-${i}`,
          dueDate: calculatedDueDate,
          competenceDate: calculatedCompetence,
          status: isFirstPaid ? 'paid' : 'pending',
          paymentDate: isFirstPaid ? data.paymentDate || calculatedDueDate : undefined,
          recurrence: {
            frequency: recurrenceFreq,
            current: i,
            count: recurrenceCount,
            parentId: parentGroupId,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    } else {
      // Single transaction
      newTxns.push({
        ...data,
        id: `txn-${Date.now()}`,
        amount: totalAmount,
        originalAmount: totalAmount,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    // Update account balances if transactions are paid immediately
    const updatedAccounts = accounts.map((a) => ({ ...a }));
    newTxns.forEach((txn) => {
      if (txn.status === 'paid') {
        if (txn.type === 'income') {
          adjustAccountBalance(updatedAccounts, txn.accountId, txn.amount);
        } else if (txn.type === 'expense') {
          adjustAccountBalance(updatedAccounts, txn.accountId, -txn.amount);
        } else if (txn.type === 'transfer' && txn.targetAccountId) {
          adjustAccountBalance(updatedAccounts, txn.accountId, -txn.amount);
          adjustAccountBalance(updatedAccounts, txn.targetAccountId, txn.amount);
        }
      }
    });

    syncAccounts(updatedAccounts);
    syncTransactions([...newTxns, ...transactions]);
    showToast('Lançamento adicionado', `${newTxns.length} registro(s) criado(s) com sucesso!`, 'success');
  };

  // UPDATE TRANSACTION (Reverts old balance effect and applies new balance effect)
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const oldTxn = transactions.find((t) => t.id === id);
    if (!oldTxn) return;

    const updatedAccounts = accounts.map((a) => ({ ...a }));
    const newTxn: Transaction = {
      ...oldTxn,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Revert old effect if it was paid
    if (oldTxn.status === 'paid') {
      if (oldTxn.type === 'income') {
        adjustAccountBalance(updatedAccounts, oldTxn.accountId, -oldTxn.amount);
      } else if (oldTxn.type === 'expense') {
        adjustAccountBalance(updatedAccounts, oldTxn.accountId, oldTxn.amount);
      } else if (oldTxn.type === 'transfer' && oldTxn.targetAccountId) {
        adjustAccountBalance(updatedAccounts, oldTxn.accountId, oldTxn.amount);
        adjustAccountBalance(updatedAccounts, oldTxn.targetAccountId, -oldTxn.amount);
      }
    }

    // Apply new effect if it is paid
    if (newTxn.status === 'paid') {
      if (newTxn.type === 'income') {
        adjustAccountBalance(updatedAccounts, newTxn.accountId, newTxn.amount);
      } else if (newTxn.type === 'expense') {
        adjustAccountBalance(updatedAccounts, newTxn.accountId, -newTxn.amount);
      } else if (newTxn.type === 'transfer' && newTxn.targetAccountId) {
        adjustAccountBalance(updatedAccounts, newTxn.accountId, -newTxn.amount);
        adjustAccountBalance(updatedAccounts, newTxn.targetAccountId, newTxn.amount);
      }
    }

    syncAccounts(updatedAccounts);
    syncTransactions(transactions.map((t) => (t.id === id ? newTxn : t)));
    showToast('Lançamento atualizado', 'As alterações foram salvas com sucesso.', 'info');
  };

  // DELETE TRANSACTION (Safely reverses paid balance effects including transfers)
  const deleteTransaction = (id: string) => {
    const txn = transactions.find((t) => t.id === id);
    if (txn && txn.status === 'paid') {
      const updatedAccounts = accounts.map((a) => ({ ...a }));
      if (txn.type === 'income') {
        adjustAccountBalance(updatedAccounts, txn.accountId, -txn.amount);
      } else if (txn.type === 'expense') {
        adjustAccountBalance(updatedAccounts, txn.accountId, txn.amount);
      } else if (txn.type === 'transfer' && txn.targetAccountId) {
        adjustAccountBalance(updatedAccounts, txn.accountId, txn.amount);
        adjustAccountBalance(updatedAccounts, txn.targetAccountId, -txn.amount);
      }
      syncAccounts(updatedAccounts);
    }

    syncTransactions(transactions.filter((t) => t.id !== id));
    showToast('Lançamento removido', 'O registro foi excluído.', 'warning');
  };

  // DELETE MULTIPLE TRANSACTIONS
  const deleteMultipleTransactions = (ids: string[]) => {
    const idSet = new Set(ids);
    const updatedAccounts = accounts.map((a) => ({ ...a }));

    transactions.forEach((txn) => {
      if (idSet.has(txn.id) && txn.status === 'paid') {
        if (txn.type === 'income') {
          adjustAccountBalance(updatedAccounts, txn.accountId, -txn.amount);
        } else if (txn.type === 'expense') {
          adjustAccountBalance(updatedAccounts, txn.accountId, txn.amount);
        } else if (txn.type === 'transfer' && txn.targetAccountId) {
          adjustAccountBalance(updatedAccounts, txn.accountId, txn.amount);
          adjustAccountBalance(updatedAccounts, txn.targetAccountId, -txn.amount);
        }
      }
    });

    syncAccounts(updatedAccounts);
    syncTransactions(transactions.filter((t) => !idSet.has(t.id)));
    showToast('Exclusão em massa', `${ids.length} lançamentos foram excluídos.`, 'warning');
  };

  // SETTLE (BAIXA) TRANSACTION
  const settleTransaction = (
    id: string,
    details: {
      paymentDate: string;
      accountId: string;
      interestAmount?: number;
      fineAmount?: number;
      discountAmount?: number;
    }
  ) => {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;
    if (txn.status === 'paid') {
      showToast('Aviso', 'Este lançamento já se encontra liquidado.', 'info');
      closeSettlementModal();
      return;
    }

    const interest = Math.max(0, details.interestAmount || 0);
    const fine = Math.max(0, details.fineAmount || 0);
    const discount = Math.max(0, details.discountAmount || 0);
    const finalAmount = Number(
      Math.max(0, txn.originalAmount + interest + fine - discount).toFixed(2)
    );

    const updatedTxn: Transaction = {
      ...txn,
      status: 'paid',
      accountId: details.accountId,
      paymentDate: details.paymentDate,
      interestAmount: interest,
      fineAmount: fine,
      discountAmount: discount,
      amount: finalAmount,
      updatedAt: new Date().toISOString(),
    };

    const updatedAccounts = accounts.map((a) => ({ ...a }));
    if (txn.type === 'income') {
      adjustAccountBalance(updatedAccounts, details.accountId, finalAmount);
    } else if (txn.type === 'expense') {
      adjustAccountBalance(updatedAccounts, details.accountId, -finalAmount);
    } else if (txn.type === 'transfer' && txn.targetAccountId) {
      adjustAccountBalance(updatedAccounts, details.accountId, -finalAmount);
      adjustAccountBalance(updatedAccounts, txn.targetAccountId, finalAmount);
    }

    syncAccounts(updatedAccounts);
    syncTransactions(transactions.map((t) => (t.id === id ? updatedTxn : t)));
    closeSettlementModal();
    showToast(
      txn.type === 'income' ? 'Recebimento confirmado!' : 'Pagamento realizado!',
      `Lançamento liquidado no valor de R$ ${finalAmount.toFixed(2)}.`,
      'success'
    );
  };

  // SETTLE MULTIPLE TRANSACTIONS IN BATCH
  const settleMultipleTransactions = (ids: string[], accountId: string, paymentDate: string) => {
    const idSet = new Set(ids);
    const updatedAccounts = accounts.map((a) => ({ ...a }));

    const updatedTxns = transactions.map((txn) => {
      if (idSet.has(txn.id) && txn.status !== 'paid') {
        if (txn.type === 'income') {
          adjustAccountBalance(updatedAccounts, accountId, txn.amount);
        } else if (txn.type === 'expense') {
          adjustAccountBalance(updatedAccounts, accountId, -txn.amount);
        }
        return {
          ...txn,
          status: 'paid' as const,
          accountId,
          paymentDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return txn;
    });

    syncAccounts(updatedAccounts);
    syncTransactions(updatedTxns);
    showToast('Liquidação em lote', `${ids.length} contas liquidadas com sucesso!`, 'success');
  };

  // TRANSFER FUNDS BETWEEN ACCOUNTS
  const transferFunds = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: string,
    description: string
  ) => {
    if (fromAccountId === toAccountId) {
      showToast('Erro na transferência', 'A conta de origem e destino devem ser diferentes.', 'error');
      return;
    }

    const numAmount = Number(amount.toFixed(2));
    if (numAmount <= 0) {
      showToast('Erro', 'O valor da transferência deve ser maior que zero.', 'error');
      return;
    }

    const updatedAccounts = accounts.map((a) => ({ ...a }));
    const fromAcc = updatedAccounts.find((a) => a.id === fromAccountId);
    const toAcc = updatedAccounts.find((a) => a.id === toAccountId);

    if (!fromAcc || !toAcc) {
      showToast('Erro', 'Contas bancárias não encontradas.', 'error');
      return;
    }

    adjustAccountBalance(updatedAccounts, fromAccountId, -numAmount);
    adjustAccountBalance(updatedAccounts, toAccountId, numAmount);

    const timestamp = new Date().toISOString();
    const transferTxn: Transaction = {
      id: `txn-transfer-${Date.now()}`,
      description: description || `Transferência de ${fromAcc.name} para ${toAcc.name}`,
      amount: numAmount,
      originalAmount: numAmount,
      type: 'transfer',
      status: 'paid',
      categoryId: 'cat-rec-outras',
      accountId: fromAccountId,
      targetAccountId: toAccountId,
      dueDate: date,
      paymentDate: date,
      competenceDate: date.substring(0, 7) + '-01',
      paymentMethod: 'bank_transfer',
      tags: ['Transferência', 'Interna'],
      reconciled: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    syncAccounts(updatedAccounts);
    syncTransactions([transferTxn, ...transactions]);
    showToast(
      'Transferência realizada',
      `R$ ${numAmount.toFixed(2)} transferidos de ${fromAcc.name} para ${toAcc.name}.`,
      'success'
    );
  };

  // BANK ACCOUNTS CRUD
  const addAccount = (data: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = new Date().toISOString();
    const newAcc: BankAccount = {
      ...data,
      id: `acc-${Date.now()}`,
      initialBalance: Number(data.initialBalance.toFixed(2)),
      currentBalance: Number(data.initialBalance.toFixed(2)),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    syncAccounts([...accounts, newAcc]);
    showToast('Conta criada', `Conta ${newAcc.name} cadastrada.`, 'success');
  };

  const updateAccount = (id: string, updates: Partial<BankAccount>) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    syncAccounts(updated);
    showToast('Conta atualizada', 'Os dados bancários foram salvos.', 'info');
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      showToast('Aviso', 'Você precisa manter ao menos uma conta cadastrada.', 'warning');
      return;
    }
    syncAccounts(accounts.filter((a) => a.id !== id));
    showToast('Conta removida', 'Conta bancária excluída.', 'warning');
  };

  // Recalculates all account balances strictly from initial balance + paid transactions
  const recalculateAccountBalances = () => {
    const balanceMap = new Map<string, number>();
    accounts.forEach((acc) => {
      balanceMap.set(acc.id, acc.initialBalance || 0);
    });

    transactions.forEach((txn) => {
      if (txn.status !== 'paid' || txn.status === 'cancelled') return;
      if (txn.type === 'income') {
        balanceMap.set(txn.accountId, (balanceMap.get(txn.accountId) || 0) + txn.amount);
      } else if (txn.type === 'expense') {
        balanceMap.set(txn.accountId, (balanceMap.get(txn.accountId) || 0) - txn.amount);
      } else if (txn.type === 'transfer' && txn.targetAccountId) {
        balanceMap.set(txn.accountId, (balanceMap.get(txn.accountId) || 0) - txn.amount);
        balanceMap.set(txn.targetAccountId, (balanceMap.get(txn.targetAccountId) || 0) + txn.amount);
      }
    });

    const updated = accounts.map((acc) => ({
      ...acc,
      currentBalance: Math.round(((balanceMap.get(acc.id) || 0) + Number.EPSILON) * 100) / 100,
      updatedAt: new Date().toISOString(),
    }));

    syncAccounts(updated);
    showToast('Saldos recalculados', 'Os saldos bancários foram sincronizados com os lançamentos.', 'info');
  };

  // Directly adjust account balance (e.g. calibration or zeroing)
  const setAccountBalanceDirectly = (accountId: string, newBalance: number, resetInitial = false) => {
    const num = Math.round((newBalance + Number.EPSILON) * 100) / 100;
    const updated = accounts.map((a) =>
      a.id === accountId
        ? {
            ...a,
            currentBalance: num,
            initialBalance: resetInitial ? num : a.initialBalance,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    syncAccounts(updated);
    showToast('Saldo atualizado', `Saldo da conta ajustado para R$ ${num.toFixed(2)}.`, 'success');
  };

  // CATEGORIES CRUD
  const addCategory = (data: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
    };
    syncCategories([...categories, newCat]);
    showToast('Categoria adicionada', `Categoria ${newCat.name} cadastrada.`, 'success');
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    syncCategories(categories.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Categoria atualizada', 'Plano de contas atualizado.', 'info');
  };

  const deleteCategory = (id: string) => {
    syncCategories(categories.filter((c) => c.id !== id));
    showToast('Categoria removida', 'Categoria excluída.', 'warning');
  };

  // CONTACTS CRUD
  const addContact = (data: Omit<Contact, 'id' | 'createdAt'>) => {
    const newCont: Contact = {
      ...data,
      id: `cont-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    syncContacts([...contacts, newCont]);
    showToast('Contato salvo', `${newCont.name} adicionado à lista.`, 'success');
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    syncContacts(contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Contato atualizado', 'Cadastro atualizado.', 'info');
  };

  const deleteContact = (id: string) => {
    syncContacts(contacts.filter((c) => c.id !== id));
    showToast('Contato excluído', 'Registro removido.', 'warning');
  };

  // COST CENTERS CRUD
  const addCostCenter = (data: Omit<CostCenter, 'id'>) => {
    const newCC: CostCenter = {
      ...data,
      id: `cc-${Date.now()}`,
    };
    syncCostCenters([...costCenters, newCC]);
    showToast('Centro de Custo criado', `${newCC.name} adicionado.`, 'success');
  };

  const updateCostCenter = (id: string, updates: Partial<CostCenter>) => {
    syncCostCenters(costCenters.map((cc) => (cc.id === id ? { ...cc, ...updates } : cc)));
    showToast('Centro de Custo atualizado', 'Dados salvos.', 'info');
  };

  const deleteCostCenter = (id: string) => {
    syncCostCenters(costCenters.filter((cc) => cc.id !== id));
    showToast('Centro de Custo removido', 'Registro excluído.', 'warning');
  };

  // COMPANY PROFILE
  const updateCompanyProfile = (profile: CompanyProfile) => {
    syncCompany(profile);
    showToast('Configurações salvas', 'Dados da empresa atualizados com sucesso.', 'success');
  };

  // LOAD DEMO DATA
  const loadDemoData = () => {
    const reset = storageService.resetToDemoData();
    setTransactions(reset.transactions);
    setAccounts(reset.accounts);
    setCategories(reset.categories);
    setCostCenters(reset.costCenters);
    setContacts(reset.contacts);
    setCompanyProfile(reset.companyProfile);
    showToast('Dados Demo Restaurados', 'Base completa de demonstração carregada com sucesso!', 'success');
  };

  // BACKUP EXPORT
  const exportBackup = () => {
    storageService.exportBackup({
      companyProfile,
      accounts,
      categories,
      costCenters,
      contacts,
      transactions,
    });
    showToast('Backup gerado', 'O arquivo JSON foi baixado para o seu dispositivo.', 'success');
  };

  // BACKUP RESTORE
  const restoreBackup = (fileContent: string): boolean => {
    try {
      const parsed: AppBackupData = storageService.parseBackupFile(fileContent);
      setTransactions(parsed.transactions || []);
      setAccounts(parsed.accounts || []);
      setCategories(parsed.categories || []);
      setCostCenters(parsed.costCenters || []);
      setContacts(parsed.contacts || []);
      if (parsed.companyProfile) setCompanyProfile(parsed.companyProfile);

      storageService.saveTransactions(parsed.transactions || [], activeTenantId);
      storageService.saveAccounts(parsed.accounts || [], activeTenantId);
      storageService.saveCategories(parsed.categories || [], activeTenantId);
      storageService.saveCostCenters(parsed.costCenters || [], activeTenantId);
      storageService.saveContacts(parsed.contacts || [], activeTenantId);
      if (parsed.companyProfile) storageService.saveCompany(parsed.companyProfile, activeTenantId);

      showToast('Backup restaurado', 'Todos os dados foram importados com sucesso!', 'success');
      return true;
    } catch (e: any) {
      showToast('Erro na restauração', e.message || 'Arquivo de backup inválido.', 'error');
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        accounts,
        categories,
        costCenters,
        contacts,
        companyProfile,
        summary,
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        hideBalances,
        toggleHideBalances,
        isQuickEntryOpen,
        setIsQuickEntryOpen,
        quickEntryType,
        openQuickEntry,
        editingTransaction,
        openEditTransaction,
        closeQuickEntry,
        isSettlementModalOpen,
        settlementTransaction,
        openSettlementModal,
        closeSettlementModal,
        searchQuery,
        setSearchQuery,
        dateRange,
        setDateRange,
        toasts,
        showToast,
        dismissToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        settleTransaction,
        settleMultipleTransactions,
        transferFunds,
        addAccount,
        updateAccount,
        deleteAccount,
        recalculateAccountBalances,
        setAccountBalanceDirectly,
        addCategory,
        updateCategory,
        deleteCategory,
        addContact,
        updateContact,
        deleteContact,
        addCostCenter,
        updateCostCenter,
        deleteCostCenter,
        updateCompanyProfile,
        loadDemoData,
        exportBackup,
        restoreBackup,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
