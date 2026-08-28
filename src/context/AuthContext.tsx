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

  // Real user default
  const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const defaultOrg: Organization = {
    id: orgId || (userId ? `org-${userId}` : 'org-prosper-main'),
    name: 'PROSPER Soluções Empresariais',
    tradeName: 'PROSPER',
    plan: 'pro',
    subscriptionStatus: 'trialing',
    trialEndsAt: trialEnds,
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
        const org = memberData.organizations;
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
      } else {
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
      }
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Sign Up (Multi-tenant Onboarding)
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

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
            document: document,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Não foi possível criar o usuário.');

      const userId = authData.user.id;

      // 2. Insert new organization (14-day trial of Pro)
      const { data: orgData, error: orgError } = await supabase
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

      if (orgData) {
        const orgId = orgData.id;

        // 3. Link user to organization as admin
        await supabase.from('organization_members').insert({
          organization_id: orgId,
          user_id: userId,
          role: 'admin',
        });

        // 4. Seed initial default bank account
        await supabase.from('accounts').insert({
          organization_id: orgId,
          name: 'Conta Principal PJ',
          bank_name: 'Banco Itaú',
          type: 'checking',
          initial_balance: 0,
          current_balance: 0,
          color: '#10B981',
        });

        // 5. Seed essential chart of accounts categories
        await supabase.from('categories').insert([
          { organization_id: orgId, name: 'Vendas de Produtos & Serviços', type: 'income', group: 'Receita Operacional Bruta', color: '#10B981' },
          { organization_id: orgId, name: 'Rendimentos de Aplicações', type: 'income', group: 'Receitas Financeiras', color: '#3B82F6' },
          { organization_id: orgId, name: 'Impostos e Tributos s/ Venda', type: 'expense', group: 'Deduções da Receita Bruta', color: '#F43F5E' },
          { organization_id: orgId, name: 'Custos com Fornecedores', type: 'expense', group: 'Custos dos Serviços Prestados', color: '#EA580C' },
          { organization_id: orgId, name: 'Salários e Encargos', type: 'expense', group: 'Despesas com Pessoal', color: '#8B5CF6' },
          { organization_id: orgId, name: 'Aluguel, Energia e Internet', type: 'expense', group: 'Despesas Administrativas', color: '#64748B' },
          { organization_id: orgId, name: 'Marketing e Anúncios', type: 'expense', group: 'Despesas Comerciais', color: '#EC4899' },
          { organization_id: orgId, name: 'Tarifas Bancárias e Juros', type: 'expense', group: 'Despesas Financeiras', color: '#EF4444' },
        ]);
      }

      // Initialize user-scoped storage key
      getStoredOrganization(userId, orgData?.id, false);

      return { error: null };
    } catch (err: any) {
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

  // Reset Password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
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
        signIn,
        signUp,
        signOut,
        enterDemoMode,
        resetPassword,
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
