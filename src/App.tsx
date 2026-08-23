import React, { useRef, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { QuickTransactionModal } from './components/forms/QuickTransactionModal';
import { SettlementModal } from './components/forms/SettlementModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { PayablesReceivablesView } from './components/payables-receivables/PayablesReceivablesView';
import { BankingView } from './components/banking/BankingView';
import { ContactsView } from './components/contacts/ContactsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';

const AppContent: React.FC = () => {
  const { activeTab } = useFinance();
  const mainContainerRef = useRef<HTMLElement>(null);

  // Always reset scroll to the top whenever activeTab changes
  useEffect(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar / Header */}
        <Header />

        {/* Dynamic View Scrollable Container */}
        <main
          ref={mainContainerRef}
          className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth"
        >
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'transactions' && <TransactionsView />}
            {(activeTab === 'payables' || activeTab === 'receivables') && (
              <PayablesReceivablesView />
            )}
            {activeTab === 'banking' && <BankingView />}
            {activeTab === 'contacts' && <ContactsView />}
            {activeTab === 'categories' && <CategoriesView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <QuickTransactionModal />
      <SettlementModal />
      <ToastContainer />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-extrabold text-2xl shadow-xl shadow-emerald-500/20 animate-pulse">
          F
        </div>
        <p className="text-xs text-slate-400 font-medium mt-4">
          Iniciando ambiente seguro FinCore Pro...
        </p>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return (
      <>
        {authView === 'login' ? (
          <LoginView
            onSwitchToRegister={() => setAuthView('register')}
            onForgotPassword={() => setIsForgotPasswordOpen(true)}
            onDemoLogin={() => setIsDemoMode(true)}
          />
        ) : (
          <RegisterView onSwitchToLogin={() => setAuthView('login')} />
        )}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      </>
    );
  }

  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
