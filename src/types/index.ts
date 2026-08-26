export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionStatus = 'paid' | 'pending' | 'overdue' | 'cancelled' | 'scheduled';

export type PaymentMethod = 
  | 'pix' 
  | 'boleto' 
  | 'credit_card' 
  | 'debit_card' 
  | 'bank_transfer' 
  | 'cash' 
  | 'other';

export type RecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'yearly';

export type AccountType = 'checking' | 'savings' | 'investment' | 'cash' | 'credit_card' | 'digital';

export interface Organization {
  id: string;
  name: string;
  tradeName?: string;
  document?: string;
  plan: 'starter' | 'pro' | 'business';
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled';
  trialEndsAt?: string;
  createdAt?: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'financial_operator' | 'viewer';
  organizationId: string;
  organization?: Organization;
}

export interface BankAccount {
  id: string;
  organizationId?: string;
  name: string;
  bankCode?: string;
  bankName: string;
  accountNumber?: string;
  agency?: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon?: string;
  isDefault?: boolean;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  organizationId?: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  parentId?: string;
  isSystem?: boolean;
  budgetMonthly?: number;
  group?: string; // ex: "Receita Operacional", "Despesas Administrativas", "Custos de Serviços"
}

export interface CostCenter {
  id: string;
  organizationId?: string;
  name: string;
  code: string;
  description?: string;
  budgetMonthly?: number;
  isActive: boolean;
}

export interface Contact {
  id: string;
  organizationId?: string;
  name: string;
  tradeName?: string;
  type: 'customer' | 'supplier' | 'both' | 'employee';
  document: string; // CNPJ ou CPF
  email?: string;
  phone?: string;
  pixKey?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  creditLimit?: number;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface InstallmentInfo {
  current: number;
  total: number;
  parentId: string;
}

export interface RecurrenceInfo {
  frequency: RecurrenceFrequency;
  interval?: number;
  count?: number;
  current?: number;
  parentId?: string;
}

export interface Transaction {
  id: string;
  organizationId?: string;
  description: string;
  amount: number; // Valor final líquido
  originalAmount: number; // Valor original antes de juros/descontos
  type: TransactionType;
  status: TransactionStatus;
  categoryId: string;
  accountId: string;
  targetAccountId?: string; // Usado para transferências
  contactId?: string; // Cliente / Fornecedor
  costCenterId?: string; // Centro de Custo
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  competenceDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  documentNumber?: string; // Número NF / Fatura / Recibo
  barcode?: string;
  notes?: string;
  tags: string[];
  installment?: InstallmentInfo;
  recurrence?: RecurrenceInfo;
  attachments?: Attachment[];
  interestAmount?: number; // Juros
  fineAmount?: number; // Multa
  discountAmount?: number; // Desconto
  netAmount?: number;
  reconciled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  name: string;
  tradeName: string;
  slogan?: string;
  document: string; // CNPJ
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  currency: string;
  fiscalRegime: 'simples' | 'lucro_presumido' | 'lucro_real' | 'mei';
  logoUrl?: string;
}

export interface DREItem {
  code: string;
  title: string;
  amount: number;
  percentage: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
  children?: DREItem[];
}

export interface DREStatement {
  period: string;
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  costs: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  financialExpenses: number;
  financialIncome: number;
  financialResult: number;
  profitBeforeTax: number;
  taxes: number;
  netProfit: number;
  netMargin: number;
  items: DREItem[];
}

export interface CashFlowPoint {
  date: string;
  dayLabel: string;
  income: number;
  expense: number;
  net: number;
  accumulatedBalance: number;
  isProjected?: boolean;
}

export interface BankReconciliationItem {
  id: string;
  fitid: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  status: 'matched' | 'unmatched' | 'ignored';
  matchedTransactionId?: string;
  suggestedCategoryId?: string;
}

export interface FinancialSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  expectedIncome: number;
  expectedExpense: number;
  overduePayables: number;
  overduePayablesCount: number;
  overdueReceivables: number;
  overdueReceivablesCount: number;
  todayPayables: number;
  todayReceivables: number;
  cashFlow30Days: CashFlowPoint[];
}
