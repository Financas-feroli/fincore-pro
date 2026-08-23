import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthUserProfile, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: AuthUserProfile | null;
  organization: Organization | null;
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
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organization and member profile
  const loadUserData = async (currentUser: User) => {
    try {
      // 1. Get member record
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', currentUser.id)
        .limit(1)
        .single();

      if (memberData && memberData.organizations) {
        const org = memberData.organizations;
        const orgObj: Organization = {
          id: org.id,
          name: org.name,
          tradeName: org.trade_name,
          document: org.document,
          plan: org.plan || 'starter',
          subscriptionStatus: org.subscription_status || 'trialing',
          createdAt: org.created_at,
        };

        setOrganization(orgObj);
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          fullName: currentUser.user_metadata?.full_name || 'Gestor',
          role: memberData.role || 'admin',
          organizationId: org.id,
          organization: orgObj,
        });
      } else {
        // Fallback default organization
        const fallbackOrg: Organization = {
          id: 'org-default',
          name: currentUser.user_metadata?.company_name || 'Minha Empresa',
          plan: 'starter',
          subscriptionStatus: 'trialing',
        };
        setOrganization(fallbackOrg);
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          fullName: currentUser.user_metadata?.full_name || 'Gestor',
          role: 'admin',
          organizationId: 'org-default',
          organization: fallbackOrg,
        });
      }
    } catch (err) {
      console.warn('Error loading user organization:', err);
    }
  };

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user).finally(() => setIsLoading(false));
      } else {
        setOrganization(null);
        setProfile(null);
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

      // 2. Insert new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: companyName,
          trade_name: companyName,
          document: document,
          plan: 'starter',
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

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganization(null);
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
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
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
