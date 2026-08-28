-- ============================================================
-- PROSPER — Supabase Migration Script
-- ============================================================
-- Run this SQL in the Supabase SQL Editor to create the
-- financial data tables with proper RLS isolation.
--
-- Prerequisites:
--   • Table 'organizations' must already exist
--   • Supabase Auth must be configured
-- ============================================================

-- 1. Add trial_ends_at column to organizations if missing
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ============================================================
-- 2. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  date DATE,
  due_date DATE,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  category_id TEXT,
  account_id TEXT,
  target_account_id TEXT,
  contact_id TEXT,
  cost_center_id TEXT,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_frequency TEXT,
  parent_transaction_id TEXT,
  installment_number INTEGER,
  installment_total INTEGER,
  interest_amount NUMERIC(15, 2) DEFAULT 0,
  fine_amount NUMERIC(15, 2) DEFAULT 0,
  discount_amount NUMERIC(15, 2) DEFAULT 0,
  data_json JSONB, -- Full transaction object as JSON backup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast organization-scoped queries
CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(organization_id, status);

-- RLS: Users can only access transactions from their organization
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org transactions"
  ON transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org transactions"
  ON transactions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org transactions"
  ON transactions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. ACCOUNTS_DATA (bank accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT,
  type TEXT DEFAULT 'checking',
  initial_balance NUMERIC(15, 2) DEFAULT 0,
  current_balance NUMERIC(15, 2) DEFAULT 0,
  color TEXT DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_data_org_id ON accounts_data(organization_id);

ALTER TABLE accounts_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own org accounts_data"
  ON accounts_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. CATEGORIES_DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS categories_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  group_name TEXT,
  color TEXT DEFAULT '#6B7280',
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_data_org_id ON categories_data(organization_id);

ALTER TABLE categories_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own org categories_data"
  ON categories_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. COST_CENTERS_DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_centers_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_data_org_id ON cost_centers_data(organization_id);

ALTER TABLE cost_centers_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own org cost_centers_data"
  ON cost_centers_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. CONTACTS_DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('customer', 'supplier', 'both')),
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_data_org_id ON contacts_data(organization_id);

ALTER TABLE contacts_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own org contacts_data"
  ON contacts_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. COMPANY_PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS company_profiles (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  trade_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  data_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own org company_profiles"
  ON company_profiles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Done! All tables have RLS enabled with organization isolation.
-- To enable cloud sync in your app, set VITE_ENABLE_CLOUD_SYNC=true
-- in your .env file.
-- ============================================================
