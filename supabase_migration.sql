-- ==============================================================================
-- PROSPER SAAS — MASTER DATABASE MIGRATION SCRIPT (POSTGRESQL / SUPABASE)
-- ==============================================================================
-- Este script é 100% compatível com tipos TEXT e UUID (com type casting explícito ::text)
-- evitando o erro "operator does not exist: text = uuid".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSÕES & FUNÇÕES UTILITÁRIAS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para atualizar updated_at automaticamente em qualquer tabela
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. ORGANIZATIONS (Empresas / Multi-Tenant Root)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT,
  plan TEXT DEFAULT 'pro',
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Garante colunas caso a tabela já existisse
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS document TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Trigger updated_at para organizations
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. ORGANIZATION_MEMBERS (Vínculo de Usuários com Empresas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their own organization memberships" ON organization_members;
CREATE POLICY "Members can view their own organization memberships"
  ON organization_members FOR SELECT
  USING (
    user_id::text = auth.uid()::text OR
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;
CREATE POLICY "Admins can manage organization members"
  ON organization_members FOR ALL
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om
      WHERE om.user_id::text = auth.uid()::text AND om.role = 'admin'
    )
  );

-- Políticas RLS atualizadas para organizations (com casting ::text)
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;
CREATE POLICY "Admins can update their organizations"
  ON organizations FOR UPDATE
  USING (
    id::text IN (
      SELECT om.organization_id::text FROM organization_members om
      WHERE om.user_id::text = auth.uid()::text AND om.role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 4. ACCOUNTS_DATA (Contas Bancárias)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts_data (
  id TEXT PRIMARY KEY,
  organization_id UUID,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE accounts_data
  ADD COLUMN IF NOT EXISTS organization_id UUID,
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
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_data_org_id ON accounts_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_accounts_data_active ON accounts_data(organization_id, is_active) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts_data;
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE accounts_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org accounts_data" ON accounts_data;
CREATE POLICY "Users can CRUD own org accounts_data"
  ON accounts_data FOR ALL
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------------------------
-- 5. CATEGORIES_DATA (Categorias / Plano de Contas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories_data (
  id TEXT PRIMARY KEY,
  organization_id UUID,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'expense',
  group_name TEXT,
  color TEXT DEFAULT '#6B7280',
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE categories_data
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS group_name TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6B7280',
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_data_org_id ON categories_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_data_type ON categories_data(organization_id, type) WHERE deleted_at IS NULL;

ALTER TABLE categories_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org categories_data" ON categories_data;
CREATE POLICY "Users can CRUD own org categories_data"
  ON categories_data FOR ALL
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------------------------
-- 6. COST_CENTERS_DATA (Centros de Custo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_centers_data (
  id TEXT PRIMARY KEY,
  organization_id UUID,
  name TEXT NOT NULL,
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE cost_centers_data
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_cost_centers_data_org_id ON cost_centers_data(organization_id);

ALTER TABLE cost_centers_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org cost_centers_data" ON cost_centers_data;
CREATE POLICY "Users can CRUD own org cost_centers_data"
  ON cost_centers_data FOR ALL
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------------------------
-- 7. CONTACTS_DATA (Clientes e Fornecedores)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts_data (
  id TEXT PRIMARY KEY,
  organization_id UUID,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'customer',
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE contacts_data
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS data_json JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_data_org_id ON contacts_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_data_type ON contacts_data(organization_id, type) WHERE deleted_at IS NULL;

ALTER TABLE contacts_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org contacts_data" ON contacts_data;
CREATE POLICY "Users can CRUD own org contacts_data"
  ON contacts_data FOR ALL
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------------------------
-- 8. TRANSACTIONS (Lançamentos Financeiros)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  organization_id UUID,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(15, 2) DEFAULT 0,
  date DATE,
  due_date DATE,
  payment_date DATE,
  status TEXT DEFAULT 'pending',
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
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS organization_id UUID,
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
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Índices Compostos de Alta Performance para Consultas Financeiras
CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reporting ON transactions(organization_id, date, status, type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_due_status ON transactions(organization_id, due_date, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(organization_id, account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(organization_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_contact ON transactions(organization_id, contact_id) WHERE deleted_at IS NULL;

-- Trigger updated_at para transactions
DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Transactions (com casting ::text)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org transactions" ON transactions;
CREATE POLICY "Users can view own org transactions"
  ON transactions FOR SELECT
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert own org transactions" ON transactions;
CREATE POLICY "Users can insert own org transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can update own org transactions" ON transactions;
CREATE POLICY "Users can update own org transactions"
  ON transactions FOR UPDATE
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete own org transactions" ON transactions;
CREATE POLICY "Users can delete own org transactions"
  ON transactions FOR DELETE
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------------------------
-- 9. COMPANY_PROFILES (Configurações Cadastrais da Empresa)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_profiles (
  organization_id UUID PRIMARY KEY,
  name TEXT,
  trade_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  slogan TEXT,
  data_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

DROP TRIGGER IF EXISTS trg_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER trg_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org company_profiles" ON company_profiles;
CREATE POLICY "Users can CRUD own org company_profiles"
  ON company_profiles FOR ALL
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------------------------
-- 10. AUDIT_LOGS (Trilha de Auditoria e Governança Financeira)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(organization_id, entity_type, entity_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org audit_logs" ON audit_logs;
CREATE POLICY "Users can view own org audit_logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert own org audit_logs" ON audit_logs;
CREATE POLICY "Users can insert own org audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    organization_id::text IN (
      SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------------------------
-- 11. TABELAS DE EXPANSÃO & COMPLIANCE (Prontas para o Futuro)
-- ------------------------------------------------------------------------------

-- Orçamentos por Categoria (Budgets)
CREATE TABLE IF NOT EXISTS category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  category_id TEXT NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  budgeted_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, category_id, month_year)
);
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own category_budgets" ON category_budgets;
CREATE POLICY "Users can CRUD own category_budgets" ON category_budgets FOR ALL
  USING (organization_id::text IN (SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text));

-- Anexos e Notas Fiscais (Attachments)
CREATE TABLE IF NOT EXISTS transaction_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  transaction_id TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transaction_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own transaction_attachments" ON transaction_attachments;
CREATE POLICY "Users can CRUD own transaction_attachments" ON transaction_attachments FOR ALL
  USING (organization_id::text IN (SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text));

-- Importações de Extratos Bancários (OFX / CSV)
CREATE TABLE IF NOT EXISTS bank_statement_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  account_id TEXT,
  file_name TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bank_statement_imports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own bank_statement_imports" ON bank_statement_imports;
CREATE POLICY "Users can CRUD own bank_statement_imports" ON bank_statement_imports FOR ALL
  USING (organization_id::text IN (SELECT om.organization_id::text FROM organization_members om WHERE om.user_id::text = auth.uid()::text));

-- Consentimento de Privacidade & LGPD (Privacy Consents)
CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  term_version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own privacy_consents" ON privacy_consents;
CREATE POLICY "Users can manage own privacy_consents" ON privacy_consents FOR ALL
  USING (user_id::text = auth.uid()::text);
