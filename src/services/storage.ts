import {
  BankAccount,
  Category,
  CompanyProfile,
  Contact,
  CostCenter,
  Transaction,
  BankReconciliationItem,
} from '../types';
import {
  initialBankAccounts,
  initialCategories,
  initialCompanyProfile,
  initialContacts,
  initialCostCenters,
  generateSeedTransactions,
} from './mockData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'fincore_transactions_v1',
  ACCOUNTS: 'fincore_accounts_v1',
  CATEGORIES: 'fincore_categories_v1',
  COST_CENTERS: 'fincore_cost_centers_v1',
  CONTACTS: 'fincore_contacts_v1',
  COMPANY: 'fincore_company_v1',
  THEME: 'fincore_theme_v1',
};

export interface AppBackupData {
  version: string;
  exportedAt: string;
  companyProfile: CompanyProfile;
  accounts: BankAccount[];
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
  transactions: Transaction[];
}

export const storageService = {
  // Load or initialize all data
  loadAllData(): {
    transactions: Transaction[];
    accounts: BankAccount[];
    categories: Category[];
    costCenters: CostCenter[];
    contacts: Contact[];
    companyProfile: CompanyProfile;
  } {
    try {
      const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const storedAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const storedCostCenters = localStorage.getItem(STORAGE_KEYS.COST_CENTERS);
      const storedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      const storedCompany = localStorage.getItem(STORAGE_KEYS.COMPANY);

      if (!storedTransactions) {
        // First run: initialize with rich demo data
        const initialTxns = generateSeedTransactions();
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTxns));
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(initialBankAccounts));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
        localStorage.setItem(STORAGE_KEYS.COST_CENTERS, JSON.stringify(initialCostCenters));
        localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(initialContacts));
        localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(initialCompanyProfile));

        return {
          transactions: initialTxns,
          accounts: initialBankAccounts,
          categories: initialCategories,
          costCenters: initialCostCenters,
          contacts: initialContacts,
          companyProfile: initialCompanyProfile,
        };
      }

      return {
        transactions: storedTransactions ? JSON.parse(storedTransactions) : [],
        accounts: storedAccounts ? JSON.parse(storedAccounts) : initialBankAccounts,
        categories: storedCategories ? JSON.parse(storedCategories) : initialCategories,
        costCenters: storedCostCenters ? JSON.parse(storedCostCenters) : initialCostCenters,
        contacts: storedContacts ? JSON.parse(storedContacts) : initialContacts,
        companyProfile: storedCompany ? JSON.parse(storedCompany) : initialCompanyProfile,
      };
    } catch (e) {
      console.error('Failed to load from storage, using initial mock data', e);
      return {
        transactions: generateSeedTransactions(),
        accounts: initialBankAccounts,
        categories: initialCategories,
        costCenters: initialCostCenters,
        contacts: initialContacts,
        companyProfile: initialCompanyProfile,
      };
    }
  },

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  saveAccounts(accounts: BankAccount[]) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  saveCategories(categories: Category[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  saveCostCenters(costCenters: CostCenter[]) {
    localStorage.setItem(STORAGE_KEYS.COST_CENTERS, JSON.stringify(costCenters));
  },

  saveContacts(contacts: Contact[]) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },

  saveCompany(company: CompanyProfile) {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
  },

  // Reset to full demo dataset
  resetToDemoData() {
    const demoTxns = generateSeedTransactions();
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(demoTxns));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(initialBankAccounts));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
    localStorage.setItem(STORAGE_KEYS.COST_CENTERS, JSON.stringify(initialCostCenters));
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(initialContacts));
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(initialCompanyProfile));
    return {
      transactions: demoTxns,
      accounts: initialBankAccounts,
      categories: initialCategories,
      costCenters: initialCostCenters,
      contacts: initialContacts,
      companyProfile: initialCompanyProfile,
    };
  },

  // Export full system backup JSON
  exportBackup(data: {
    companyProfile: CompanyProfile;
    accounts: BankAccount[];
    categories: Category[];
    costCenters: CostCenter[];
    contacts: Contact[];
    transactions: Transaction[];
  }) {
    const backup: AppBackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      ...data,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_fincore_pro_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Validate and parse restore JSON
  parseBackupFile(content: string): AppBackupData {
    const parsed = JSON.parse(content);
    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      throw new Error('Arquivo de backup inválido: lista de transações não encontrada.');
    }
    return parsed;
  },

  // Export transactions to CSV
  exportTransactionsToCSV(
    transactions: Transaction[],
    categories: Category[],
    accounts: BankAccount[],
    contacts: Contact[]
  ) {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const accMap = new Map(accounts.map((a) => [a.id, a.name]));
    const contMap = new Map(contacts.map((c) => [c.id, c.name]));

    const headers = [
      'Data Vencimento',
      'Data Pagamento',
      'Tipo',
      'Descrição',
      'Categoria',
      'Conta Bancária',
      'Cliente/Fornecedor',
      'Valor (R$)',
      'Status',
      'Método de Pagamento',
      'Documento',
      'Tags',
    ];

    const rows = transactions.map((t) => [
      t.dueDate,
      t.paymentDate || '',
      t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
      `"${t.description.replace(/"/g, '""')}"`,
      `"${catMap.get(t.categoryId) || ''}"`,
      `"${accMap.get(t.accountId) || ''}"`,
      `"${contMap.get(t.contactId || '') || ''}"`,
      t.amount.toFixed(2).replace('.', ','),
      t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : 'Cancelado',
      t.paymentMethod,
      t.documentNumber || '',
      `"${t.tags.join(', ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lancamentos_fincore_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Parse OFX / Bank Statement file
  parseOFX(content: string): BankReconciliationItem[] {
    const items: BankReconciliationItem[] = [];
    // Basic OFX XML/SGML tag parser
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      const block = match[1];
      const trntype = (block.match(/<TRNTYPE>([^<\r\n]+)/i)?.[1] || 'OTHER').trim();
      const dtposted = (block.match(/<DTPOSTED>([^<\r\n]+)/i)?.[1] || '').trim();
      const trnamt = parseFloat((block.match(/<TRNAMT>([^<\r\n]+)/i)?.[1] || '0').trim());
      const fitid = (block.match(/<FITID>([^<\r\n]+)/i)?.[1] || Math.random().toString(36).substring(7)).trim();
      const memo = (block.match(/<MEMO>([^<\r\n]+)/i)?.[1] || block.match(/<NAME>([^<\r\n]+)/i)?.[1] || 'Lançamento Extrato').trim();

      // Format date YYYYMMDD to YYYY-MM-DD
      let date = new Date().toISOString().split('T')[0];
      if (dtposted.length >= 8) {
        date = `${dtposted.substring(0, 4)}-${dtposted.substring(4, 6)}-${dtposted.substring(6, 8)}`;
      }

      items.push({
        id: `ofx-${fitid}`,
        fitid,
        date,
        description: memo,
        amount: Math.abs(trnamt),
        type: trnamt < 0 || trntype === 'DEBIT' ? 'DEBIT' : 'CREDIT',
        status: 'unmatched',
      });
    }

    // Fallback parser if CSV statement format
    if (items.length === 0 && (content.includes(';') || content.includes(','))) {
      const lines = content.split(/\r?\n/);
      lines.slice(1).forEach((line, idx) => {
        if (!line.trim()) return;
        const parts = line.split(/[;,]/);
        if (parts.length >= 3) {
          const rawDate = parts[0]?.trim();
          const desc = parts[1]?.trim().replace(/"/g, '') || 'Lançamento';
          const rawAmount = parseFloat(parts[2]?.trim().replace('R$', '').replace('.', '').replace(',', '.') || '0');
          
          if (!isNaN(rawAmount) && rawAmount !== 0) {
            items.push({
              id: `csv-${idx}-${Date.now()}`,
              fitid: `csv-${idx}`,
              date: rawDate.includes('/') ? rawDate.split('/').reverse().join('-') : rawDate,
              description: desc,
              amount: Math.abs(rawAmount),
              type: rawAmount < 0 ? 'DEBIT' : 'CREDIT',
              status: 'unmatched',
            });
          }
        }
      });
    }

    return items;
  },
};
