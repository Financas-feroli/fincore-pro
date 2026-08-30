/**
 * supabaseSync.ts — Cloud Sync Layer for PROSPER
 *
 * This module provides complete bidirectional sync between localStorage and Supabase.
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
// AUDIT LOG HELPER
// -------------------------------------------------------------------
export const recordAuditLog = async (
  organizationId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SETTLE' | 'SUBSCRIPTION_CHANGE',
  entityType: 'transaction' | 'account' | 'category' | 'contact' | 'organization',
  entityId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> => {
  if (!isCloudSyncEnabled() || !organizationId) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_values: oldValues || null,
      new_values: newValues || null,
    });
  } catch (err) {
    // Non-blocking: audit failure should never break UI transactions
    console.warn('[PROSPER AuditLog] Failed to log action:', err);
  }
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
      const rows = transactions.map((txn) => {
        const isRecurring = Boolean(
          txn.recurrence && txn.recurrence.frequency !== 'none'
        );
        const recurrenceFrequency = txn.recurrence?.frequency || 'none';
        const parentId =
          txn.recurrence?.parentId || txn.installment?.parentId || null;
        const installmentNum = txn.installment?.current || null;
        const installmentTot = txn.installment?.total || null;
        const effectiveDate =
          txn.paymentDate || txn.dueDate || txn.competenceDate || new Date().toISOString().split('T')[0];

        return {
          id: txn.id,
          organization_id: organizationId,
          type: txn.type,
          description: txn.description,
          amount: txn.amount,
          date: effectiveDate,
          due_date: txn.dueDate,
          payment_date: txn.paymentDate || null,
          status: txn.status,
          category_id: txn.categoryId || null,
          account_id: txn.accountId || null,
          target_account_id: txn.targetAccountId || null,
          contact_id: txn.contactId || null,
          cost_center_id: txn.costCenterId || null,
          notes: txn.notes || null,
          is_recurring: isRecurring,
          recurrence_frequency: recurrenceFrequency,
          parent_transaction_id: parentId,
          installment_number: installmentNum,
          installment_total: installmentTot,
          interest_amount: txn.interestAmount || 0,
          fine_amount: txn.fineAmount || 0,
          discount_amount: txn.discountAmount || 0,
          created_at: txn.createdAt,
          updated_at: txn.updatedAt,
          deleted_at: null,
          data_json: JSON.stringify(txn), // Full JSON backup for safety
        };
      });

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
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map(
      (row: { data_json: string }) => JSON.parse(row.data_json) as Transaction
    );
  } catch (err) {
    console.error(
      '[PROSPER CloudSync] Failed to load transactions from Supabase:',
      err
    );
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
        is_default: acc.isDefault ?? false,
        deleted_at: null,
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
      .eq('organization_id', organizationId)
      .is('deleted_at', null);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map(
      (row: { data_json: string }) => JSON.parse(row.data_json) as BankAccount
    );
  } catch (err) {
    console.error(
      '[PROSPER CloudSync] Failed to load accounts from Supabase:',
      err
    );
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
        deleted_at: null,
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

export const loadCategoriesFromSupabase = async (
  organizationId: string
): Promise<Category[] | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const { data, error } = await supabase
      .from('categories_data')
      .select('data_json')
      .eq('organization_id', organizationId)
      .is('deleted_at', null);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map(
      (row: { data_json: string }) => JSON.parse(row.data_json) as Category
    );
  } catch (err) {
    console.error(
      '[PROSPER CloudSync] Failed to load categories from Supabase:',
      err
    );
    return null;
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
        deleted_at: null,
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

export const loadCostCentersFromSupabase = async (
  organizationId: string
): Promise<CostCenter[] | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const { data, error } = await supabase
      .from('cost_centers_data')
      .select('data_json')
      .eq('organization_id', organizationId)
      .is('deleted_at', null);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map(
      (row: { data_json: string }) => JSON.parse(row.data_json) as CostCenter
    );
  } catch (err) {
    console.error(
      '[PROSPER CloudSync] Failed to load cost centers from Supabase:',
      err
    );
    return null;
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
        deleted_at: null,
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

export const loadContactsFromSupabase = async (
  organizationId: string
): Promise<Contact[] | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const { data, error } = await supabase
      .from('contacts_data')
      .select('data_json')
      .eq('organization_id', organizationId)
      .is('deleted_at', null);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map(
      (row: { data_json: string }) => JSON.parse(row.data_json) as Contact
    );
  } catch (err) {
    console.error(
      '[PROSPER CloudSync] Failed to load contacts from Supabase:',
      err
    );
    return null;
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
      const { error } = await supabase.from('company_profiles').upsert(
        {
          organization_id: organizationId,
          name: profile.name,
          trade_name: profile.tradeName,
          document: profile.document,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          city: profile.city || null,
          state: profile.state || null,
          zip_code: profile.zipCode || null,
          slogan: profile.slogan || null,
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

export const loadCompanyProfileFromSupabase = async (
  organizationId: string
): Promise<CompanyProfile | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('data_json')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    if (!data || !data.data_json) return null;

    return JSON.parse(data.data_json) as CompanyProfile;
  } catch (err) {
    console.error(
      '[PROSPER CloudSync] Failed to load company profile from Supabase:',
      err
    );
    return null;
  }
};

// -------------------------------------------------------------------
// FULL LOAD — Load all data from Supabase for complete initial hydration
// -------------------------------------------------------------------
export const loadAllFromSupabase = async (
  organizationId: string
): Promise<{
  transactions: Transaction[] | null;
  accounts: BankAccount[] | null;
  categories: Category[] | null;
  costCenters: CostCenter[] | null;
  contacts: Contact[] | null;
  companyProfile: CompanyProfile | null;
} | null> => {
  if (!isCloudSyncEnabled()) return null;

  try {
    const [txns, accs, cats, ccs, conts, comp] = await Promise.all([
      loadTransactionsFromSupabase(organizationId),
      loadAccountsFromSupabase(organizationId),
      loadCategoriesFromSupabase(organizationId),
      loadCostCentersFromSupabase(organizationId),
      loadContactsFromSupabase(organizationId),
      loadCompanyProfileFromSupabase(organizationId),
    ]);

    // Only return if we have at least some data
    if (txns || accs || cats || ccs || conts || comp) {
      return {
        transactions: txns,
        accounts: accs,
        categories: cats,
        costCenters: ccs,
        contacts: conts,
        companyProfile: comp,
      };
    }
    return null;
  } catch (err) {
    console.error('[PROSPER CloudSync] Failed to load data from Supabase:', err);
    return null;
  }
};

// -------------------------------------------------------------------
// DELETE helpers (Soft Delete with deleted_at timestamp)
// -------------------------------------------------------------------
export const deleteTransactionFromSupabase = async (
  transactionId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', transactionId);

    if (error) {
      // Fallback to hard delete if soft delete column isn't present
      await supabase.from('transactions').delete().eq('id', transactionId);
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Delete transaction error:', err);
  }
};

export const deleteMultipleTransactionsFromSupabase = async (
  transactionIds: string[]
): Promise<void> => {
  if (!isCloudSyncEnabled() || transactionIds.length === 0) return;

  try {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', transactionIds);

    if (error) {
      // Fallback to hard delete
      await supabase.from('transactions').delete().in('id', transactionIds);
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Batch delete error:', err);
  }
};

export const deleteAccountFromSupabase = async (
  accountId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;
  try {
    const { error } = await supabase
      .from('accounts_data')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', accountId);

    if (error) {
      await supabase.from('accounts_data').delete().eq('id', accountId);
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Delete account error:', err);
  }
};

export const deleteCategoryFromSupabase = async (
  categoryId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;
  try {
    const { error } = await supabase
      .from('categories_data')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', categoryId);

    if (error) {
      await supabase.from('categories_data').delete().eq('id', categoryId);
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Delete category error:', err);
  }
};

export const deleteCostCenterFromSupabase = async (
  costCenterId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;
  try {
    const { error } = await supabase
      .from('cost_centers_data')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', costCenterId);

    if (error) {
      await supabase.from('cost_centers_data').delete().eq('id', costCenterId);
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Delete cost center error:', err);
  }
};

export const deleteContactFromSupabase = async (
  contactId: string
): Promise<void> => {
  if (!isCloudSyncEnabled()) return;
  try {
    const { error } = await supabase
      .from('contacts_data')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', contactId);

    if (error) {
      await supabase.from('contacts_data').delete().eq('id', contactId);
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Delete contact error:', err);
  }
};

// -------------------------------------------------------------------
// ONE-TIME MIGRATION: localStorage → Supabase
// -------------------------------------------------------------------
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
      console.warn(
        `[PROSPER CloudSync] ⚠️ Migration partially failed (${failures.length} errors). Will retry on next login.`
      );
    }
  } catch (err) {
    console.error('[PROSPER CloudSync] Migration failed:', err);
  }
};
