import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthUserProfile, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: AuthUserProfile | null;
  organization: Organization | null;
  isDemoMode: boolean;
  isLoading: boolean;
  isRecoveryMode: boolean;
  setIsRecoveryMode: (active: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    companyName: string,
    document: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateSubscription: (
    plan: 'starter' | 'pro' | 'business',
    status?: 'active' | 'trialing',
    trialDays?: number
  ) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_SESSION_KEY = 'prosper_demo_session';

// Helper to get scoped subscription storage key
export const getSubscriptionStorageKey = (
  userId?: string | null,
  orgId?: string | null,
  isDemo?: boolean
): string => {
  if (isDemo) return 'prosper_sub_demo';
  if (userId) return `prosper_sub_${userId}`;
  if (orgId && orgId !== 'org-prosper-main' && orgId !== 'org-default') {
    return `prosper_sub_${orgId}`;
  }
  return 'prosper_sub_guest';
};

// Helper to get or initialize stored organization
const getStoredOrganization = (
  userId?: string | null,
  orgId?: string | null,
  isDemo?: boolean
): Organization => {
  const key = getSubscriptionStorageKey(userId, orgId, isDemo);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error parsing stored subscription:', e);
  }

  // Demo account default (14 days trial of Pro)
  if (isDemo) {
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const demoOrg: Organization = {
      id: 'org-prosper-demo',
      name: 'PROSPER Soluções (Modo Teste)',
      tradeName: 'PROSPER Teste',
      plan: 'pro',
      subscriptionStatus: 'trialing',
      trialEndsAt: trialEnds,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(demoOrg));
    return demoOrg;
  }

  // Real user default (Starter Active)
  const defaultOrg: Organization = {
    id: orgId || (userId ? `org-${userId}` : 'org-prosper-main'),
    name: 'PROSPER Soluções Empresariais',
    tradeName: 'PROSPER',
    plan: 'starter',
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(defaultOrg));
  return defaultOrg;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    const isDemo = sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
    return getStoredOrganization(null, null, isDemo);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => {
    return (
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('recovery=true') ||
      window.location.search.includes('type=recovery')
    );
  });

  // Enter Demo Mode
  const enterDemoMode = () => {
    setIsDemoMode(true);
    sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
    const demoOrg = getStoredOrganization('demo-user', 'org-prosper-demo', true);
    setOrganization(demoOrg);
    setProfile({
      id: 'demo-user',
      email: 'teste@prosper.com.br',
      fullName: 'Gestor (Conta de Teste)',
      role: 'admin',
      organizationId: demoOrg.id,
      organization: demoOrg,
    });
  };

  // Update subscription locally per user and remotely on Supabase
  const updateSubscription = (
    plan: 'starter' | 'pro' | 'business',
    status: 'active' | 'trialing' = 'active',
    trialDays?: number
  ) => {
    setOrganization((prev) => {
      const currentOrgId = prev?.id;
      const currentUserId = user?.id;
      const key = getSubscriptionStorageKey(currentUserId, currentOrgId, isDemoMode);

      const trialEndsAt =
        status === 'trialing'
          ? trialDays !== undefined
            ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
            : prev?.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

      const updated: Organization = {
        id: prev?.id || (currentUserId ? `org-${currentUserId}` : 'org-prosper-main'),
        name: prev?.name || 'PROSPER Soluções Empresariais',
        tradeName: prev?.tradeName || 'PROSPER',
        document: prev?.document,
        plan,
        subscriptionStatus: status,
        trialEndsAt,
        createdAt: prev?.createdAt || new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(updated));

      setProfile((prevProf) => {
        if (!prevProf) return null;
        return {
          ...prevProf,
          organization: updated,
        };
      });

      // Also update Supabase if connected to a real organization
      if (
        prev?.id &&
        prev.id !== 'org-prosper-main' &&
        prev.id !== 'org-default' &&
        prev.id !== 'org-prosper-demo'
      ) {
        const updatePayload: Record<string, unknown> = {
          plan,
          subscription_status: status,
        };
        // Sync trial_ends_at to Supabase so it persists across devices
        if (trialEndsAt) {
          updatePayload.trial_ends_at = trialEndsAt;
        }

        supabase
          .from('organizations')
          .update(updatePayload)
          .eq('id', prev.id)
          .then(({ error }) => {
            if (error) {
              console.error('[PROSPER] Falha ao sincronizar plano com Supabase:', error.message);
              // Retry once after 3 seconds for transient failures
              setTimeout(() => {
                supabase
                  .from('organizations')
                  .update(updatePayload)
                  .eq('id', prev.id!)
                  .then(({ error: retryError }) => {
                    if (retryError) {
                      console.error('[PROSPER] Retry falhou:', retryError.message);
                    }
                  });
              }, 3000);
            }
          });
      }

      return updated;
    });
  };

  // Fetch organization and member profile for a logged-in user
  const loadUserData = async (currentUser: User) => {
    try {
      const key = getSubscriptionStorageKey(currentUser.id, null, false);
      let localOrg: Organization | null = null;
      try {
        const stored = localStorage.getItem(key);
        if (stored) localOrg = JSON.parse(stored);
      } catch (e) {
        console.error('Error loading local subscription:', e);
      }

      // Query Supabase for organization membership
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', currentUser.id)
        .limit(1)
        .single();

      if (memberData && memberData.organizations) {
        const rawOrg = memberData.organizations;
        const org = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
        if (org) {
          const orgObj: Organization = {
            id: org.id,
            name: org.name || currentUser.user_metadata?.company_name || 'Minha Empresa',
            tradeName: org.trade_name || currentUser.user_metadata?.company_name || 'Minha Empresa',
            document: org.document || currentUser.user_metadata?.document,
            // Supabase is source of truth for plan; localStorage is fallback only
            plan: org.plan || localOrg?.plan || 'pro',
            subscriptionStatus: org.subscription_status || localOrg?.subscriptionStatus || 'trialing',
            // Load trialEndsAt from Supabase first, then localStorage fallback
            trialEndsAt: org.trial_ends_at || localOrg?.trialEndsAt,
            createdAt: org.created_at,
          };

          setOrganization(orgObj);
          localStorage.setItem(key, JSON.stringify(orgObj));
          setProfile({
            id: currentUser.id,
            email: currentUser.email || '',
            fullName: currentUser.user_metadata?.full_name || 'Gestor',
            role: memberData.role || 'admin',
            organizationId: org.id,
            organization: orgObj,
          });
          return;
        }
      }

      // Self-healing: If user is authenticated in Supabase but missing organization_members record, create it
      if (currentUser.id) {
        const companyName = currentUser.user_metadata?.company_name || 'Minha Empresa';
        const document = currentUser.user_metadata?.document || '';

        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({
            name: companyName,
            trade_name: companyName,
            document: document,
            plan: 'pro',
            subscription_status: 'trialing',
          })
          .select()
          .single();

        if (newOrg) {
          await supabase.from('organization_members').insert({
            organization_id: newOrg.id,
            user_id: currentUser.id,
            role: 'admin',
          });

          const orgObj: Organization = {
            id: newOrg.id,
            name: newOrg.name,
            tradeName: newOrg.trade_name || newOrg.name,
            document: newOrg.document,
            plan: 'pro',
            subscriptionStatus: 'trialing',
            trialEndsAt: newOrg.trial_ends_at,
            createdAt: newOrg.created_at,
          };

          setOrganization(orgObj);
          localStorage.setItem(key, JSON.stringify(orgObj));
          setProfile({
            id: currentUser.id,
            email: currentUser.email || '',
            fullName: currentUser.user_metadata?.full_name || 'Gestor',
            role: 'admin',
            organizationId: newOrg.id,
            organization: orgObj,
          });
          return;
        }
      }

      // Fallback user-scoped organization
      const userOrg = localOrg || getStoredOrganization(currentUser.id, null, false);
      setOrganization(userOrg);
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        fullName: currentUser.user_metadata?.full_name || 'Gestor',
        role: 'admin',
        organizationId: userOrg.id,
        organization: userOrg,
      });
    } catch (err) {
      console.warn('Error loading user organization:', err);
      const userOrg = getStoredOrganization(currentUser.id, null, false);
      setOrganization(userOrg);
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        fullName: currentUser.user_metadata?.full_name || 'Gestor',
        role: 'admin',
        organizationId: userOrg.id,
        organization: userOrg,
      });
    }
  };

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsDemoMode(false);
        sessionStorage.removeItem(DEMO_SESSION_KEY);
        loadUserData(session.user).finally(() => setIsLoading(false));
      } else {
        const isDemo = sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
        if (isDemo) {
          enterDemoMode();
        } else {
          const guestOrg = getStoredOrganization(null, null, false);
          setOrganization(guestOrg);
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    // 2. Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsDemoMode(false);
        sessionStorage.removeItem(DEMO_SESSION_KEY);
        loadUserData(session.user).finally(() => setIsLoading(false));
      } else {
        const isDemo = sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
        if (isDemo) {
          enterDemoMode();
        } else {
          const guestOrg = getStoredOrganization(null, null, false);
          setOrganization(guestOrg);
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      setIsDemoMode(false);
      sessionStorage.removeItem(DEMO_SESSION_KEY);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        await loadUserData(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign Up (Multi-tenant Onboarding with strict duplicate prevention)
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    companyName: string,
    document: string
  ) => {
    try {
      setIsDemoMode(false);
      sessionStorage.removeItem(DEMO_SESSION_KEY);

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim(),
            document: document.trim(),
          },
        },
      });

      // Handle Supabase duplicate email errors
      if (authError) {
        const errorMsg = (authError.message || '').toLowerCase();
        if (
          errorMsg.includes('already registered') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('user already') ||
          (authError as any).status === 422
        ) {
          throw new Error('Este e-mail já possui uma conta cadastrada. Faça login ou recupere sua senha.');
        }
        throw new Error(authError.message || 'Erro ao realizar o cadastro. Tente novamente.');
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar o usuário. Tente novamente.');
      }

      // Check if user already existed in Supabase (identities array is empty when user already exists)
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('Este e-mail já possui uma conta cadastrada. Faça login ou recupere sua senha.');
      }

      const userId = authData.user.id;

      // 2. Check if this user already has an organization (avoid duplicate orgs)
      try {
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id, organization_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (existingMember) {
          throw new Error('Este e-mail já possui uma empresa cadastrada. Faça login para acessar seu painel.');
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes('já possui uma empresa')) {
          throw checkErr;
        }
      }

      // 3. Provision organization (14-day trial of Pro) with robust Supabase insert & local fallback
      let orgId = `org-${userId}`;
      let orgObj: Organization = {
        id: orgId,
        name: companyName.trim() || 'Minha Empresa',
        tradeName: companyName.trim() || 'Minha Empresa',
        document: document.trim() || undefined,
        plan: 'pro',
        subscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: companyName.trim(),
            trade_name: companyName.trim(),
            document: document.trim(),
            plan: 'pro',
            subscription_status: 'trialing',
          })
          .select()
          .single();

        if (orgData && !orgError) {
          orgId = orgData.id;
          orgObj = {
            id: orgData.id,
            name: orgData.name,
            tradeName: orgData.trade_name || orgData.name,
            document: orgData.document,
            plan: 'pro',
            subscriptionStatus: 'trialing',
            trialEndsAt: orgData.trial_ends_at || orgObj.trialEndsAt,
            createdAt: orgData.created_at,
          };

          // 4. Link user to organization as admin
          await supabase.from('organization_members').insert({
            organization_id: orgId,
            user_id: userId,
            role: 'admin',
          });

          // 5. Seed initial default bank account
          await supabase.from('accounts_data').insert({
            id: `acc-main-${Date.now()}`,
            organization_id: orgId,
            name: 'Conta Principal PJ',
            bank_name: 'Banco Itaú',
            type: 'checking',
            initial_balance: 0,
            current_balance: 0,
            color: '#10B981',
            is_active: true,
            is_default: true,
          });

          // 6. Seed essential chart of accounts categories
          await supabase.from('categories_data').insert([
            { id: `cat-seed-1`, organization_id: orgId, name: 'Vendas de Produtos & Serviços', type: 'income', group_name: 'Receita Operacional Bruta', color: '#10B981' },
            { id: `cat-seed-2`, organization_id: orgId, name: 'Rendimentos de Aplicações', type: 'income', group_name: 'Receitas Financeiras', color: '#3B82F6' },
            { id: `cat-seed-3`, organization_id: orgId, name: 'Impostos e Tributos s/ Venda', type: 'expense', group_name: 'Deduções da Receita Bruta', color: '#F43F5E' },
            { id: `cat-seed-4`, organization_id: orgId, name: 'Custos com Fornecedores', type: 'expense', group_name: 'Custos dos Serviços Prestados', color: '#EA580C' },
            { id: `cat-seed-5`, organization_id: orgId, name: 'Salários e Encargos', type: 'expense', group_name: 'Despesas com Pessoal', color: '#8B5CF6' },
            { id: `cat-seed-6`, organization_id: orgId, name: 'Aluguel, Energia e Internet', type: 'expense', group_name: 'Despesas Administrativas', color: '#64748B' },
            { id: `cat-seed-7`, organization_id: orgId, name: 'Marketing e Anúncios', type: 'expense', group_name: 'Despesas Comerciais', color: '#EC4899' },
            { id: `cat-seed-8`, organization_id: orgId, name: 'Tarifas Bancárias e Juros', type: 'expense', group_name: 'Despesas Financeiras', color: '#EF4444' },
          ]);
        } else if (orgError) {
          console.warn('[PROSPER Auth] Supabase organization insert skipped (RLS/session), using local state:', orgError.message);
        }
      } catch (dbErr) {
        console.warn('[PROSPER Auth] Supabase organization setup fallback to local storage:', dbErr);
      }

      // Initialize user-scoped storage key
      const subKey = getSubscriptionStorageKey(userId, orgId, false);
      localStorage.setItem(subKey, JSON.stringify(orgObj));
      setOrganization(orgObj);
      setProfile({
        id: userId,
        email: normalizedEmail,
        fullName: fullName.trim() || 'Gestor',
        role: 'admin',
        organizationId: orgId,
        organization: orgObj,
      });

      return { error: null };
    } catch (err: any) {
      console.warn('[PROSPER Auth] Sign up error:', err?.message || err);
      return { error: err };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut warning:', err);
    }
    setIsDemoMode(false);
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    const guestOrg = getStoredOrganization(null, null, false);
    setOrganization(guestOrg);
  };

  // Reset Password (sends email with recovery link)
  const resetPassword = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const redirectTo = `${window.location.origin}/?recovery=true`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Update Password (used when user arrives via recovery link)
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setIsRecoveryMode(false);
      // Clean query and hash
      window.history.replaceState({}, document.title, window.location.pathname);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        isDemoMode,
        isLoading,
        isRecoveryMode,
        setIsRecoveryMode,
        signIn,
        signUp,
        signOut,
        enterDemoMode,
        resetPassword,
        updatePassword,
        updateSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
