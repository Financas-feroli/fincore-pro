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
  TRANSACTIONS: 'prosper_transactions_v1',
  ACCOUNTS: 'prosper_accounts_v1',
  CATEGORIES: 'prosper_categories_v1',
  COST_CENTERS: 'prosper_cost_centers_v1',
  CONTACTS: 'prosper_contacts_v1',
  COMPANY: 'prosper_company_v1',
  THEME: 'prosper_theme_v1',
  STRIPE_LINKS: 'prosper_stripe_links_v1',
};

const LEGACY_KEYS = {
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
      const storedTransactions =
        localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || localStorage.getItem(LEGACY_KEYS.TRANSACTIONS);
      const storedAccounts =
        localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || localStorage.getItem(LEGACY_KEYS.ACCOUNTS);
      const storedCategories =
        localStorage.getItem(STORAGE_KEYS.CATEGORIES) || localStorage.getItem(LEGACY_KEYS.CATEGORIES);
      const storedCostCenters =
        localStorage.getItem(STORAGE_KEYS.COST_CENTERS) || localStorage.getItem(LEGACY_KEYS.COST_CENTERS);
      const storedContacts =
        localStorage.getItem(STORAGE_KEYS.CONTACTS) || localStorage.getItem(LEGACY_KEYS.CONTACTS);
      const storedCompany =
        localStorage.getItem(STORAGE_KEYS.COMPANY) || localStorage.getItem(LEGACY_KEYS.COMPANY);

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

      let companyProfile: CompanyProfile = storedCompany ? JSON.parse(storedCompany) : initialCompanyProfile;
      if (
        companyProfile.name.includes('FinCore') ||
        companyProfile.tradeName?.includes('FinCore') ||
        companyProfile.email?.includes('fincore')
      ) {
        companyProfile = {
          ...companyProfile,
          name: companyProfile.name.replace(/FinCore Pro/gi, 'PROSPER').replace(/FinCore/gi, 'PROSPER'),
          tradeName: 'PROSPER',
          email: companyProfile.email.replace(/fincorepro/gi, 'prosper').replace(/fincore/gi, 'prosper'),
        };
        localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(companyProfile));
      }

      return {
        transactions: storedTransactions ? JSON.parse(storedTransactions) : [],
        accounts: storedAccounts ? JSON.parse(storedAccounts) : initialBankAccounts,
        categories: storedCategories ? JSON.parse(storedCategories) : initialCategories,
        costCenters: storedCostCenters ? JSON.parse(storedCostCenters) : initialCostCenters,
        contacts: storedContacts ? JSON.parse(storedContacts) : initialContacts,
        companyProfile,
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

  getStripeLinks(): Record<'starter' | 'pro' | 'business', string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STRIPE_LINKS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stripe links:', e);
    }
    return {
      starter: 'https://buy.stripe.com/test_28EeVc5greGsaGf3wydMI00',
      pro: 'https://buy.stripe.com/test_bJefZg24ffKw8y7ffgdMI01',
      business: 'https://buy.stripe.com/test_cNicN4eR1eGs6pZ3wydMI02',
    };
  },

  saveStripeLinks(links: Record<'starter' | 'pro' | 'business', string>) {
    localStorage.setItem(STORAGE_KEYS.STRIPE_LINKS, JSON.stringify(links));
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
    a.download = `backup_prosper_${new Date().toISOString().split('T')[0]}.json`;
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
    link.setAttribute('download', `lancamentos_prosper_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Parse OFX / CSV Bank Statement with universal bank support
  parseOFX(content: string, fileName?: string): BankReconciliationItem[] {
    const items: BankReconciliationItem[] = [];
    const isOFX =
      (fileName && fileName.toLowerCase().endsWith('.ofx')) ||
      content.includes('<OFX>') ||
      content.includes('<STMTTRN>') ||
      content.includes('<BANKTRANLIST>') ||
      content.includes('OFXHEADER');

    if (isOFX) {
      // Handle both XML closed tags <STMTTRN>...</STMTTRN> and SGML open tags <STMTTRN>
      const rawBlocks = content.split(/<STMTTRN>/i);

      for (let i = 1; i < rawBlocks.length; i++) {
        const block = rawBlocks[i];
        const cleanBlock = block.split(/<\/STMTTRN>|<BANKTRANLIST>|<\/BANKTRANLIST>/i)[0];

        const trntype = (cleanBlock.match(/<TRNTYPE>([^<\r\n]+)/i)?.[1] || 'OTHER').trim().toUpperCase();
        const dtposted = (cleanBlock.match(/<DTPOSTED>([^<\r\n]+)/i)?.[1] || '').trim();
        const trnamtStr = (cleanBlock.match(/<TRNAMT>([^<\r\n]+)/i)?.[1] || '0').trim();
        const fitid = (cleanBlock.match(/<FITID>([^<\r\n]+)/i)?.[1] || `fit-${Date.now()}-${i}`).trim();
        const memo = (
          cleanBlock.match(/<MEMO>([^<\r\n]+)/i)?.[1] ||
          cleanBlock.match(/<NAME>([^<\r\n]+)/i)?.[1] ||
          cleanBlock.match(/<CHECKNUM>([^<\r\n]+)/i)?.[1] ||
          'Lançamento Bancário'
        ).trim();

        const normalizedAmt = trnamtStr.replace(',', '.');
        const trnamt = parseFloat(normalizedAmt);
        if (isNaN(trnamt)) continue;

        let date = new Date().toISOString().split('T')[0];
        const dateDigits = dtposted.replace(/\D/g, '');
        if (dateDigits.length >= 8) {
          const y = dateDigits.substring(0, 4);
          const m = dateDigits.substring(4, 6);
          const d = dateDigits.substring(6, 8);
          date = `${y}-${m}-${d}`;
        }

        const isDebit = trnamt < 0 || trntype === 'DEBIT' || trntype === 'PAYMENT' || trntype === 'FEE' || trntype === 'SRVCHG' || trntype === 'POS';

        items.push({
          id: `ofx-${fitid.replace(/[^a-zA-Z0-9_-]/g, '_')}-${i}`,
          fitid,
          date,
          description: memo,
          amount: Math.round(Math.abs(trnamt) * 100) / 100,
          type: isDebit ? 'DEBIT' : 'CREDIT',
          status: 'unmatched',
        });
      }
      return items;
    }

    // CSV Statement Parser (Nubank, Itaú, Bradesco, Santander, Inter, BB, Caixa, etc.)
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Detect Delimiter
    const sample = lines.slice(0, 5).join('\n');
    const countSemicolons = (sample.match(/;/g) || []).length;
    const countTabs = (sample.match(/\t/g) || []).length;
    const countCommas = (sample.match(/,/g) || []).length;

    let delimiter = ';';
    if (countTabs > countSemicolons && countTabs > countCommas) {
      delimiter = '\t';
    } else if (countCommas > countSemicolons) {
      delimiter = ',';
    }

    // Helper for RFC 4180 CSV splitting
    const parseLine = (line: string): string[] => {
      const res: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === delimiter && !inQuotes) {
          res.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      res.push(cur.trim());
      return res;
    };

    // Helper for Brazilian date parsing
    const parseDate = (raw: string): string => {
      if (!raw) return new Date().toISOString().split('T')[0];
      const cl = raw.trim().replace(/^["']|["']$/g, '');
      if (cl.includes('/')) {
        const p = cl.split('/');
        if (p.length === 3) {
          const d = p[0].padStart(2, '0');
          const m = p[1].padStart(2, '0');
          let y = p[2].split(' ')[0];
          if (y.length === 2) y = `20${y}`;
          return `${y}-${m}-${d}`;
        }
      }
      if (cl.includes('-')) {
        const p = cl.split('-');
        if (p.length === 3) {
          if (p[0].length === 4) return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].substring(0, 2).padStart(2, '0')}`;
          return `${p[2].substring(0, 4)}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
        }
      }
      const num = cl.replace(/\D/g, '');
      if (num.length >= 8) return `${num.substring(0, 4)}-${num.substring(4, 6)}-${num.substring(6, 8)}`;
      return new Date().toISOString().split('T')[0];
    };

    // Helper for Brazilian amount parsing
    const parseAmount = (raw: string): { amount: number; isNegative: boolean } => {
      if (!raw) return { amount: 0, isNegative: false };
      let s = raw.trim().toUpperCase();
      const isNeg = s.includes('-') || s.startsWith('(') || s.endsWith(' D') || s.includes('DÉBITO') || s.includes('DEBITO');
      s = s.replace(/[R$()CD\s]/g, '').trim();

      if (s.includes(',') && s.includes('.')) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
          s = s.replace(/\./g, '').replace(',', '.');
        } else {
          s = s.replace(/,/g, '');
        }
      } else if (s.includes(',')) {
        s = s.replace(',', '.');
      }

      const num = Math.abs(parseFloat(s) || 0);
      return { amount: num, isNegative: isNeg };
    };

    // Detect Header
    let headerIndex = -1;
    let dateCol = -1;
    let descCol = -1;
    let amountCol = -1;
    let debitCol = -1;
    let creditCol = -1;
    let docCol = -1;

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const cols = parseLine(lines[i]).map((c) =>
        c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      );

      for (let c = 0; c < cols.length; c++) {
        const col = cols[c];
        if (['data', 'date', 'dt', 'data lancamento', 'data movimento'].some((k) => col.includes(k))) dateCol = c;
        if (['descricao', 'historico', 'memo', 'lancamento', 'identificador', 'detalhe', 'titulo'].some((k) => col.includes(k))) descCol = c;
        if (['valor', 'amount', 'quantia', 'valor (r$)', 'val.'].some((k) => col === k || col.includes('valor'))) amountCol = c;
        if (['debito', 'saida', 'saidas', 'debitos', 'pagamento'].some((k) => col.includes(k))) debitCol = c;
        if (['credito', 'entrada', 'entradas', 'creditos', 'recebimento'].some((k) => col.includes(k))) creditCol = c;
        if (['documento', 'doc', 'num doc', 'nro doc', 'docto'].some((k) => col.includes(k))) docCol = c;
      }

      if (dateCol !== -1 && (amountCol !== -1 || (debitCol !== -1 && creditCol !== -1))) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      headerIndex = 0;
      dateCol = 0;
      descCol = 1;
      amountCol = 2;
    } else if (descCol === -1) {
      descCol = dateCol === 0 ? 1 : 0;
    }

    const dataRows = lines.slice(headerIndex + 1);
    dataRows.forEach((line, idx) => {
      if (!line.trim()) return;
      const parts = parseLine(line);
      if (parts.length <= Math.max(dateCol, amountCol !== -1 ? amountCol : debitCol)) return;

      const rawDate = parts[dateCol] || '';
      const date = parseDate(rawDate);
      const desc = (parts[descCol] || 'Lançamento Extrato').replace(/^["']|["']$/g, '').trim();
      const docNum = docCol !== -1 ? parts[docCol] : undefined;

      let amount = 0;
      let isDebit = false;

      if (amountCol !== -1) {
        const parsed = parseAmount(parts[amountCol] || '0');
        amount = parsed.amount;
        isDebit = parsed.isNegative;
      } else if (debitCol !== -1 && creditCol !== -1) {
        const debitParsed = parseAmount(parts[debitCol] || '0');
        const creditParsed = parseAmount(parts[creditCol] || '0');
        if (debitParsed.amount > 0) {
          amount = debitParsed.amount;
          isDebit = true;
        } else if (creditParsed.amount > 0) {
          amount = creditParsed.amount;
          isDebit = false;
        }
      }

      if (amount > 0) {
        items.push({
          id: `csv-${Date.now()}-${idx}`,
          fitid: docNum || `csv-${idx + 1}`,
          date,
          description: desc,
          amount: Math.round(amount * 100) / 100,
          type: isDebit ? 'DEBIT' : 'CREDIT',
          status: 'unmatched',
        });
      }
    });

    return items;
  },
};
