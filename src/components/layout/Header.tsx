import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Bell,
  ArrowRightLeft,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  LogOut,
  User,
  Building,
  Crown,
  Settings,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { DateRangeSelector } from '../common/DateRangeSelector';
import { PricingModal } from '../common/PricingModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    activeTab,
    theme,
    toggleTheme,
    hideBalances,
    toggleHideBalances,
    openQuickEntry,
    searchQuery,
    setSearchQuery,
    transactions,
    summary,
    setActiveTab,
    openSettlementModal,
  } = useFinance();

  const { user, profile, organization, signOut, isDemoMode } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const userInitial = isDemoMode
    ? 'T'
    : profile?.fullName
    ? profile.fullName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'P';

  const displayName = isDemoMode
    ? 'Gestor (Conta de Teste)'
    : profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Gestor';

  const userEmail = isDemoMode ? 'teste@prosper.com.br' : user?.email || 'admin@empresa.com.br';
  const orgName = isDemoMode ? 'PROSPER Soluções (Modo Teste)' : organization?.name || user?.user_metadata?.company_name || 'PROSPER Soluções';
  const currentPlan = (organization?.plan || 'pro').toUpperCase();
  const isTrial = organization?.subscriptionStatus === 'trialing';
  const statusFormatted = isDemoMode ? 'Demo' : isTrial ? 'Teste Grátis' : 'Ativo';

  // Global Keyboard Shortcuts (N = New, / = Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openQuickEntry('expense');
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openQuickEntry]);

  // Urgent notifications (Overdue or Due Today)
  const urgentTransactions = transactions
    .filter((t) => t.status === 'pending')
    .slice(0, 5);

  const tabTitles: Record<string, { title: string; desc: string }> = {
    dashboard: {
      title: 'Dashboard Executivo',
      desc: 'Cockpit de gestão financeira em tempo real, liquidez imediata e controladoria.',
    },
    transactions: {
      title: 'Lançamentos & Extrato Geral',
      desc: 'Consulta analítica de receitas, despesas, transferências e conciliações.',
    },
    payables: {
      title: 'Contas a Pagar',
      desc: 'Gestão de compromissos com fornecedores, boletos e despesas operacionais.',
    },
    receivables: {
      title: 'Contas a Receber',
      desc: 'Previsão e liquidação de recebíveis de clientes, contratos e faturas.',
    },
    banking: {
      title: 'Gestão Bancária & Conciliação',
      desc: 'Contas correntes, cartões corporativos, saldos em tempo real e extratos OFX/CSV.',
    },
    contacts: {
      title: 'Clientes & Fornecedores',
      desc: 'Cadastro unificado de contatos comerciais, documentos fiscais e histórico financeiro.',
    },
    categories: {
      title: 'Categorias & Centros de Custo',
      desc: 'Plano de contas gerencial, estrutura para DRE e rateio departamental orçado.',
    },
    reports: {
      title: 'Relatórios & DRE Gerencial',
      desc: 'Demonstrativo de Resultados do Exercício, Previsto vs Realizado e exportação contábil.',
    },
    settings: {
      title: 'Configurações do Sistema',
      desc: 'Parâmetros cadastrais da empresa, regime tributário, personalização e backups.',
    },
  };

  const currentTabInfo = tabTitles[activeTab] || {
    title: 'PROSPER',
    desc: 'Sistema Financeiro',
  };

  return (
    <header className="h-16 px-6 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 select-none">
      {/* Title / Breadcrumb */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {currentTabInfo.title}
          </h2>
          {activeTab === 'dashboard' && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-bold border border-emerald-500/20">
              Live Data
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
          {currentTabInfo.desc}
        </p>
      </div>

      {/* Center Global Search */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Buscar lançamentos, clientes, categorias... (Pressione '/')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-emerald-500 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Date Filter */}
        <DateRangeSelector />

        {/* Privacy Toggle (Ocultar / Mostrar Saldos) */}
        <button
          onClick={toggleHideBalances}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          title={hideBalances ? 'Exibir valores monetários' : 'Ocultar valores monetários (Modo Privacidade)'}
        >
          {hideBalances ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Mostrar</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Ocultar</span>
            </>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notificações & Alertas"
          >
            <Bell className="w-4 h-4" />
            {(summary.overduePayablesCount > 0 || summary.todayPayables > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-30 py-2 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Central de Alertas
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {urgentTransactions.length} pendentes
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                  {urgentTransactions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      Tudo em dia! Nenhuma conta pendente.
                    </div>
                  ) : (
                    urgentTransactions.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          openSettlementModal(t);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              t.type === 'expense' ? 'text-rose-500' : 'text-amber-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {t.description}
                            </p>
                            <div className="flex items-center justify-between mt-1 text-[11px]">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(t.dueDate)}
                              </span>
                              <span
                                className={`font-mono font-semibold ${
                                  t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              >
                                {formatCurrency(t.amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      setActiveTab('payables');
                    }}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Ver todas as contas a pagar →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile & Google-Styled Account Menu */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-sm ring-2 ring-emerald-500/20">
              {userInitial}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[120px]">
                {displayName.split(' ')[0]}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-none">
                {currentPlan} {isDemoMode ? '(Demo)' : isTrial ? '(Teste)' : '(Ativo)'}
              </span>
            </div>
          </button>

          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-30 bg-black/10 dark:bg-black/40 backdrop-blur-[1px]"
                onClick={() => setIsUserMenuOpen(false)}
              />

              {/* Google-Styled Account Card */}
              <div className="absolute right-0 mt-3 top-full w-80 sm:w-92 bg-[#f8fafd] dark:bg-[#181d26] border border-slate-200/90 dark:border-slate-800 rounded-[28px] shadow-2xl shadow-slate-950/25 z-40 p-3.5 space-y-3 animate-fade-in text-slate-800 dark:text-slate-100">
                {/* Header: Email & Close */}
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                    {userEmail}
                  </span>
                  <button
                    onClick={() => setIsUserMenuOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                    title="Fechar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main Centered Account Card */}
                <div className="bg-white dark:bg-[#11151c] rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center">
                  {/* Large Centered Avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-emerald-500/20 dark:ring-emerald-400/20">
                      {userInitial}
                    </div>
                    {isDemoMode ? (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded-full shadow-sm">
                        Demo
                      </span>
                    ) : (
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#11151c]"
                        title="Conta Verificada"
                      >
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Name Greeting */}
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
                    Olá, {displayName.split(' ')[0]}!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[240px]">
                    {displayName}
                  </p>

                  {/* Company Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-semibold mt-2.5 border border-slate-200/60 dark:border-slate-700/60 max-w-full">
                    <Building className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{orgName}</span>
                  </div>

                  {/* Plan Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1.5 uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Crown className="w-3 h-3 text-emerald-500" />
                    <span>
                      Plano {currentPlan} • {statusFormatted}
                    </span>
                  </div>

                  {/* Google-Style "Gerenciar sua Conta" Button */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('settings');
                    }}
                    className="mt-4 px-5 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Gerenciar sua Conta PROSPER</span>
                  </button>
                </div>

                {/* Secondary Quick Action Card */}
                <div className="bg-white dark:bg-[#11151c] rounded-2xl p-1.5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-0.5">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsPricingModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-xl transition-colors font-medium group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          Planos & Assinatura
                        </p>
                        <p className="text-[10px] text-slate-400">Ver recursos ou alterar plano</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('settings');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-xl transition-colors font-medium group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          Perfil da Empresa
                        </p>
                        <p className="text-[10px] text-slate-400">CNPJ, slogan e preferências</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Google-Style Sign Out Button */}
                <button
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full py-2.5 px-4 bg-white dark:bg-[#11151c] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da conta</span>
                </button>

                {/* Google-Style Subtle Footer */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                  <span>Privacidade</span>
                  <span>•</span>
                  <span>Termos de Serviço</span>
                  <span>•</span>
                  <span>PROSPER SaaS</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pricing Modal from Header */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </header>
  );
};
