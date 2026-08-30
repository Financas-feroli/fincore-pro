-- ============================================================
-- PROSPER — Supabase Migration Script (Idempotent & Production-Ready)
-- ============================================================
-- Este script é seguro para execução múltipla e cria toda a estrutura
-- necessária do zero, incluindo tabelas fundamentais faltantes.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. ORGANIZATIONS (Tabela Base do Multi-Tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  slogan TEXT,
  plan TEXT DEFAULT 'pro' CHECK (plan IN ('starter', 'pro', 'business')),
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por documento
CREATE INDEX IF NOT EXISTS idx_organizations_document ON organizations(document);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON organizations;
CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS em organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org" ON organizations;
CREATE POLICY "Users can view own org"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own org" ON organizations;
CREATE POLICY "Users can update own org"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================
-- 3. ORGANIZATION_MEMBERS (Essencial para RLS Multi-Tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'financial_operator', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_organization_members_updated_at ON organization_members;
CREATE TRIGGER trigger_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS em organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;
CREATE POLICY "Users can view own memberships"
  ON organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;
CREATE POLICY "Admins can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  original_amount NUMERIC(15, 2) DEFAULT 0,
  date DATE NOT NULL,
  due_date DATE,
  payment_date DATE,
  competence_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled', 'scheduled')),
  category_id TEXT REFERENCES categories_data(id) ON DELETE SET NULL,
  account_id TEXT NOT NULL REFERENCES accounts_data(id) ON DELETE RESTRICT,
  target_account_id TEXT REFERENCES accounts_data(id) ON DELETE SET NULL,
  contact_id TEXT REFERENCES contacts_data(id) ON DELETE SET NULL,
  cost_center_id TEXT REFERENCES cost_centers_data(id) ON DELETE SET NULL,
  notes TEXT,
  document_number TEXT,
  barcode TEXT,
  payment_method TEXT CHECK (payment_method IN ('pix', 'boleto', 'credit_card', 'debit_card', 'bank_transfer', 'cash', 'other')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly')),
  parent_transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  installment_number INTEGER,
  installment_total INTEGER,
  interest_amount NUMERIC(15, 2) DEFAULT 0,
  fine_amount NUMERIC(15, 2) DEFAULT 0,
  discount_amount NUMERIC(15, 2) DEFAULT 0,
  reconciled BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Índices otimizados para relatórios financeiros
CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_competence ON transactions(organization_id, competence_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(organization_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_contact ON transactions(organization_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cost_center ON transactions(organization_id, cost_center_id);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(organization_id, deleted_at) WHERE deleted_at IS NOT NULL;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions;
CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
    AND (deleted_at IS NULL OR deleted_at IS NOT NULL)
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
-- 5. ACCOUNTS_DATA (Contas Bancárias)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  agency TEXT,
  type TEXT NOT NULL DEFAULT 'checking' CHECK (type IN ('checking', 'savings', 'investment', 'cash', 'credit_card', 'digital')),
  initial_balance NUMERIC(15, 2) DEFAULT 0,
  current_balance NUMERIC(15, 2) DEFAULT 0,
  credit_limit NUMERIC(15, 2),
  closing_day INTEGER,
  due_day INTEGER,
  color TEXT DEFAULT '#10B981',
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_accounts_data_org_id ON accounts_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_accounts_data_active ON accounts_data(organization_id, is_active) WHERE is_active = TRUE;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_accounts_data_updated_at ON accounts_data;
CREATE TRIGGER trigger_accounts_data_updated_at
  BEFORE UPDATE ON accounts_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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
-- 6. CATEGORIES_DATA (Categorias / Plano de Contas)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  group_name TEXT,
  parent_id TEXT REFERENCES categories_data(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  budget_monthly NUMERIC(15, 2),
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_categories_data_org_id ON categories_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_data_type ON categories_data(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_data_group ON categories_data(organization_id, group_name);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_categories_data_updated_at ON categories_data;
CREATE TRIGGER trigger_categories_data_updated_at
  BEFORE UPDATE ON categories_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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
-- 7. COST_CENTERS_DATA (Centros de Custo)
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_centers_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  budget_monthly NUMERIC(15, 2),
  is_active BOOLEAN DEFAULT TRUE,
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_data_org_id ON cost_centers_data(organization_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_cost_centers_data_updated_at ON cost_centers_data;
CREATE TRIGGER trigger_cost_centers_data_updated_at
  BEFORE UPDATE ON cost_centers_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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
-- 8. CONTACTS_DATA (Clientes e Fornecedores)
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts_data (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('customer', 'supplier', 'both', 'employee')),
  document TEXT,
  email TEXT,
  phone TEXT,
  pix_key TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  credit_limit NUMERIC(15, 2),
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contacts_data_org_id ON contacts_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_data_type ON contacts_data(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_contacts_data_document ON contacts_data(organization_id, document);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_contacts_data_updated_at ON contacts_data;
CREATE TRIGGER trigger_contacts_data_updated_at
  BEFORE UPDATE ON contacts_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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
-- 9. COMPANY_PROFILES (Perfil da Empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_profiles (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  slogan TEXT,
  currency TEXT DEFAULT 'BRL',
  fiscal_regime TEXT CHECK (fiscal_regime IN ('simples', 'lucro_presumido', 'lucro_real', 'mei')),
  logo_url TEXT,
  data_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER trigger_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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

-- ============================================================
-- 10. AUDIT_LOG (Auditoria e Compliance)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT')),
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org audit log" ON audit_log;
CREATE POLICY "Users can view own org audit log"
  ON audit_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 11. ATTACHMENTS (Anexos de Transações)
-- ============================================================
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attachments_org_id ON attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_transaction_id ON attachments(transaction_id);

-- RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org attachments" ON attachments;
CREATE POLICY "Users can CRUD own org attachments"
  ON attachments FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 12. RECURRENCE_RULES (Regras de Recorrência)
-- ============================================================
CREATE TABLE IF NOT EXISTS recurrence_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly')),
  interval_days INTEGER DEFAULT 1,
  end_date DATE,
  max_occurrences INTEGER,
  current_occurrence INTEGER DEFAULT 0,
  auto_create BOOLEAN DEFAULT TRUE,
  days_before_create INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recurrence_rules_org_id ON recurrence_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_transaction_id ON recurrence_rules(transaction_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_active ON recurrence_rules(organization_id, is_active) WHERE is_active = TRUE;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_recurrence_rules_updated_at ON recurrence_rules;
CREATE TRIGGER trigger_recurrence_rules_updated_at
  BEFORE UPDATE ON recurrence_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own org recurrence_rules" ON recurrence_rules;
CREATE POLICY "Users can CRUD own org recurrence_rules"
  ON recurrence_rules FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 13. BANK_STATEMENT_IMPORTS (Importação de Extrato)
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_statement_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES accounts_data(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('ofx', 'csv', 'xlsx')),
  import_date TIMESTAMPTZ DEFAULT NOW(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_records INTEGER,
  matched_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  imported_by UUID REFERENCES auth.users(id),
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_statement_imports_org_id ON bank_statement_imports(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_statement_imports_account_id ON bank_statement_imports(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_statement_imports_status ON bank_statement_imports(organization_id, status);

-- RLS
ALTER TABLE bank_statement_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org imports" ON bank_statement_imports;
CREATE POLICY "Users can view own org imports"
  ON bank_statement_imports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 14. API_KEYS (Chaves de API para Integrações)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage API keys" ON api_keys;
CREATE POLICY "Admins can manage API keys"
  ON api_keys FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================
-- 15. PRIVACY_CONSENT (LGPD / GDPR Compliance)
-- ============================================================
CREATE TABLE IF NOT EXISTS privacy_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  contact_id TEXT REFERENCES contacts_data(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'data_processing', 'third_party_sharing', 'analytics')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_consent_org_id ON privacy_consent(organization_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_user_id ON privacy_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_contact_id ON privacy_consent(contact_id);

-- RLS
ALTER TABLE privacy_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org consent" ON privacy_consent;
CREATE POLICY "Users can view own org consent"
  ON privacy_consent FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 16. TRIGGER FUNCTION PARA AUDIT LOG AUTOMÁTICO
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_values := to_jsonb(OLD);
  END IF;

  INSERT INTO audit_log (
    organization_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_old_values,
    v_new_values
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 17. VIEW PARA RELATÓRIOS DRE (Demonstrativo de Resultado)
-- ============================================================
CREATE OR REPLACE VIEW dre_summary AS
SELECT
  t.organization_id,
  DATE_TRUNC('month', t.competence_date) AS competence_month,
  t.type AS transaction_type,
  c.group_name,
  c.name AS category_name,
  SUM(t.amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM transactions t
LEFT JOIN categories_data c ON t.category_id = c.id
WHERE t.deleted_at IS NULL
  AND t.status IN ('paid', 'pending')
GROUP BY t.organization_id, DATE_TRUNC('month', t.competence_date), t.type, c.group_name, c.name;

-- ============================================================
-- 18. VIEW PARA FLUXO DE CAIXA
-- ============================================================
CREATE OR REPLACE VIEW cash_flow_daily AS
SELECT
  t.organization_id,
  COALESCE(t.payment_date, t.due_date) AS cash_date,
  t.type AS transaction_type,
  SUM(t.amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM transactions t
WHERE t.deleted_at IS NULL
  AND t.status IN ('paid', 'pending', 'overdue')
GROUP BY t.organization_id, COALESCE(t.payment_date, t.due_date), t.type;

-- ============================================================
-- 19. FUNÇÃO PARA SOFT DELETE EM TRANSACTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION soft_delete_transaction(p_transaction_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE transactions
  SET deleted_at = NOW()
  WHERE id = p_transaction_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 20. SEED DATA - Categorias Padrão (Opcional)
-- ============================================================
-- Nota: As categorias específicas por organização são criadas no signup
-- Esta seção pode ser usada para templates padrão se necessário

