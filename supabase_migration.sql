-- ============================================================
-- PROSPER — Supabase Migration Script (Idempotent)
-- ============================================================

-- 1. Organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ============================================================
-- 2. TRANSACTIONS (Criação e Atualização de Colunas)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY
);

-- Garante que todas as colunas existam mesmo se a tabela já existia antes
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS category_id TEXT,
  ADD COLUMN IF NOT EXISTS account_id TEXT,
  ADD COLUMN IF NOT EXISTS target_account_id TEXT,
  ADD COLUMN IF NOT EXISTS contact_id TEXT,
  ADD COLUMN IF NOT EXISTS cost_center_id TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT,
  ADD COLUMN IF NOT EXISTS parent_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS installment_total INTEGER,
  ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(organization_id, status);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org transactions" ON transactions;
CREATE POLICY "Users can view own org transactions"
  ON transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own org transactions" ON transactions;
CREATE POLICY "Users can insert own org transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own org transactions" ON transactions;
CREATE POLICY "Users can update own org transactions"
  ON transactions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own org transactions" ON transactions;
CREATE POLICY "Users can delete own org transactions"
  ON transactions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. ACCOUNTS_DATA (Contas Bancárias)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts_data (
  id TEXT PRIMARY KEY
);

ALTER TABLE accounts_data
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'checking',
  ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10B981',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_accounts_data_org_id ON accounts_data(organization_id);

ALTER TABLE accounts_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org accounts_data" ON accounts_data;
CREATE POLICY "Users can CRUD own org accounts_data"
  ON accounts_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. CATEGORIES_DATA (Categorias)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories_data (
  id TEXT PRIMARY KEY
);

ALTER TABLE categories_data
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS group_name TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6B7280',
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_categories_data_org_id ON categories_data(organization_id);

ALTER TABLE categories_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org categories_data" ON categories_data;
CREATE POLICY "Users can CRUD own org categories_data"
  ON categories_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. COST_CENTERS_DATA (Centros de Custo)
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_centers_data (
  id TEXT PRIMARY KEY
);

ALTER TABLE cost_centers_data
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_cost_centers_data_org_id ON cost_centers_data(organization_id);

ALTER TABLE cost_centers_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org cost_centers_data" ON cost_centers_data;
CREATE POLICY "Users can CRUD own org cost_centers_data"
  ON cost_centers_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. CONTACTS_DATA (Clientes e Fornecedores)
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts_data (
  id TEXT PRIMARY KEY
);

ALTER TABLE contacts_data
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_contacts_data_org_id ON contacts_data(organization_id);

ALTER TABLE contacts_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org contacts_data" ON contacts_data;
CREATE POLICY "Users can CRUD own org contacts_data"
  ON contacts_data FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. COMPANY_PROFILES (Perfil da Empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_profiles (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS document TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS slogan TEXT,
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org company_profiles" ON company_profiles;
CREATE POLICY "Users can CRUD own org company_profiles"
  ON company_profiles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

