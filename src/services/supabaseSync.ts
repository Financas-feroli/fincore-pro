/**
 * supabaseSync.ts — Cloud Sync Layer for PROSPER
 *
 * This module provides bidirectional sync between localStorage and Supabase.
 * It is designed to be enabled via the VITE_ENABLE_CLOUD_SYNC environment variable.
 *
 * Architecture: Write-through pattern
 *  - Write: localStorage (immediate) + Supabase (async, fire-and-forget with retry)
 *  - Read:  Supabase (primary on load) → localStorage (fallback)
 *
 * Security: All queries are scoped by organization_id + Supabase RLS policies.
 */

import { supabase } from './supabase';
import {
  Transaction,
  BankAccount,
  Category,
  CostCenter,
  Contact,
  CompanyProfile,
} from '../types';

// Feature flag: enable cloud sync
export const isCloudSyncEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_CLOUD_SYNC === 'true';
};

// -------------------------------------------------------------------
// Helper: Retry with exponential backoff
// -------------------------------------------------------------------
const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

// -------------------------------------------------------------------
// TRANSACTIONS
// -------------------------------------------------------------------
export const syncTransactionsToSupabase = async (
  transactions: Transaction[],
  organizationId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    await retryAsync(async () => {
      // Upsert all transactions (insert or update by id)
      const rows = transactions.map((txn) => ({
        id: txn.id,
        organization_id: organizationId,
        type: txn.type,
        description: txn.description,
        amount: txn.amount,
        date: txn.date,
        due_date: txn.dueDate,
        payment_date: txn.paymentDate,
        status: txn.status,
        category_id: txn.categoryId,
        account_id: txn.accountId,
        target_account_id: txn.targetAccountId,
        contact_id: txn.contactId,
        cost_center_id: txn.costCenterId,
        notes: txn.notes,
        is_recurring: txn.isRecurring,
        recurrence_frequency: txn.recurrenceFrequency,
        parent_transaction_id: txn.parentTransactionId,
        installment_number: txn.installmentNumber,
        installment_total: txn.installmentTotal,
        interest_amount: txn.interestAmount,
        fine_amount: txn.fineAmount,
        discount_amount: txn.discountAmount,
        created_at: txn.createdAt,
        updated_at: txn.updatedAt,
        data_json: JSON.stringify(txn), // Full JSON backup for safety
      }));

      const { error } = await supabase
        .from('transactions')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw error;
    });
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to sync transactions:', err);
  }
};

export const loadTransactionsFromSupabase = async (
  organizationId: string
): Promise<Transaction[] | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('data_json')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map((row: { data_json: string }) => JSON.parse(row.data_json) as Transaction);
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to load transactions from Supabase:', err);
    return null;
  }
};

// -------------------------------------------------------------------
// ACCOUNTS
// -------------------------------------------------------------------
export const syncAccountsToSupabase = async (
  accounts: BankAccount[],
  organizationId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    await retryAsync(async () => {
      const rows = accounts.map((acc) => ({
        id: acc.id,
        organization_id: organizationId,
        name: acc.name,
        bank_name: acc.bankName,
        type: acc.type,
        initial_balance: acc.initialBalance,
        current_balance: acc.currentBalance,
        color: acc.color,
        is_active: acc.isActive,
        is_default: acc.isDefault,
        data_json: JSON.stringify(acc),
      }));

      const { error } = await supabase
        .from('accounts_data')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw error;
    });
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to sync accounts:', err);
  }
};

export const loadAccountsFromSupabase = async (
  organizationId: string
): Promise<BankAccount[] | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const { data, error } = await supabase
      .from('accounts_data')
      .select('data_json')
      .eq('organization_id', organizationId);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map((row: { data_json: string }) => JSON.parse(row.data_json) as BankAccount);
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to load accounts from Supabase:', err);
    return null;
  }
};

// -------------------------------------------------------------------
// CATEGORIES
// -------------------------------------------------------------------
export const syncCategoriesToSupabase = async (
  categories: Category[],
  organizationId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    await retryAsync(async () => {
      const rows = categories.map((cat) => ({
        id: cat.id,
        organization_id: organizationId,
        name: cat.name,
        type: cat.type,
        group_name: cat.group,
        color: cat.color,
        data_json: JSON.stringify(cat),
      }));

      const { error } = await supabase
        .from('categories_data')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw error;
    });
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to sync categories:', err);
  }
};

// -------------------------------------------------------------------
// COST CENTERS
// -------------------------------------------------------------------
export const syncCostCentersToSupabase = async (
  costCenters: CostCenter[],
  organizationId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    await retryAsync(async () => {
      const rows = costCenters.map((cc) => ({
        id: cc.id,
        organization_id: organizationId,
        name: cc.name,
        data_json: JSON.stringify(cc),
      }));

      const { error } = await supabase
        .from('cost_centers_data')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw error;
    });
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to sync cost centers:', err);
  }
};

// -------------------------------------------------------------------
// CONTACTS
// -------------------------------------------------------------------
export const syncContactsToSupabase = async (
  contacts: Contact[],
  organizationId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    await retryAsync(async () => {
      const rows = contacts.map((c) => ({
        id: c.id,
        organization_id: organizationId,
        name: c.name,
        type: c.type,
        data_json: JSON.stringify(c),
      }));

      const { error } = await supabase
        .from('contacts_data')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw error;
    });
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to sync contacts:', err);
  }
};

// -------------------------------------------------------------------
// COMPANY PROFILE
// -------------------------------------------------------------------
export const syncCompanyProfileToSupabase = async (
  profile: CompanyProfile,
  organizationId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    await retryAsync(async () => {
      const { error } = await supabase
        .from('company_profiles')
        .upsert(
          {
            organization_id: organizationId,
            name: profile.name,
            trade_name: profile.tradeName,
            document: profile.document,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            data_json: JSON.stringify(profile),
          },
          { onConflict: 'organization_id' }
        );

      if (error) throw error;
    });
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to sync company profile:', err);
  }
};

// -------------------------------------------------------------------
// FULL LOAD — Load all data from Supabase for initial hydration
// -------------------------------------------------------------------
export const loadAllFromSupabase = async (
  organizationId: string
): Promise<{
  transactions: Transaction[] | null;
  accounts: BankAccount[] | null;
} | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const [txns, accs] = await Promise.all([
      loadTransactionsFromSupabase(organizationId),
      loadAccountsFromSupabase(organizationId),
    ]);

    // Only return if we have at least some data
    if (txns || accs) {
      return { transactions: txns, accounts: accs };
    }
    return null;
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to load data from Supabase:', err);
    return null;
  }
};

// -------------------------------------------------------------------
// DELETE helpers (for sync of deletions)
// -------------------------------------------------------------------
export const deleteTransactionFromSupabase = async (
  transactionId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) console.error('[PROSPER CloudSync] Delete transaction failed:', error);
  } catch (err) {
    console.error('[PROSPER CloudSync] Delete transaction error:', err);
  }
};

export const deleteMultipleTransactionsFromSupabase = async (
  transactionIds: string[]
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', transactionIds);

    if (error) console.error('[PROSPER CloudSync] Batch delete failed:', error);
  } catch (err) {
    console.error('[PROSPER CloudSync] Batch delete error:', err);
  }
};

export const deleteAccountFromSupabase = async (accountId: string): Promise<void> => {
  if (!isCloudSyncEnabled()) return;
  try {
    const { error } = await supabase.from('accounts_data').delete().eq('id', accountId);
    if (error) console.error('[PROSPER CloudSync] Delete account failed:', error);
  } catch (err) {
    console.error('[PROSPER CloudSync] Delete account error:', err);
  }
};

// -------------------------------------------------------------------
// ONE-TIME MIGRATION: localStorage → Supabase
// -------------------------------------------------------------------
// Uploads all existing localStorage data to Supabase for users who
// had data before cloud sync was enabled. Runs only once per org.

interface LocalDataPayload {
  transactions: Transaction[];
  accounts: BankAccount[];
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
  companyProfile: CompanyProfile;
}

export const migrateLocalDataToSupabase = async (
  organizationId: string,
  localData: LocalDataPayload
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  const migrationKey = `prosper_cloud_migrated_${organizationId}`;
  if (localStorage.getItem(migrationKey) === 'true') {
    return; // Already migrated
  }

  console.log('[PROSPER CloudSync] Starting one-time migration to Supabase...');

  try {
    const results = await Promise.allSettled([
      localData.transactions.length > 0
        ? syncTransactionsToSupabase(localData.transactions, organizationId)
        : Promise.resolve(),
      localData.accounts.length > 0
        ? syncAccountsToSupabase(localData.accounts, organizationId)
        : Promise.resolve(),
      localData.categories.length > 0
        ? syncCategoriesToSupabase(localData.categories, organizationId)
        : Promise.resolve(),
      localData.costCenters.length > 0
        ? syncCostCentersToSupabase(localData.costCenters, organizationId)
        : Promise.resolve(),
      localData.contacts.length > 0
        ? syncContactsToSupabase(localData.contacts, organizationId)
        : Promise.resolve(),
      syncCompanyProfileToSupabase(localData.companyProfile, organizationId),
    ]);

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length === 0) {
      localStorage.setItem(migrationKey, 'true');
      console.log('[PROSPER CloudSync] ✅ Migration completed successfully!');
    } else {
      console.warn(`[PROSPER CloudSync] ⚠️ Migration partially failed (${failures.length} errors). Will retry on next login.`);
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Migration failed:', err);
  }
};
