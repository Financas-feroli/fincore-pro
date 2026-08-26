import React, { useState, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  Bell,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  LogOut,
  User,
  Building,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { DateRangeSelector } from '../common/DateRangeSelector';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    activeTab,
    theme,
    toggleTheme,
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

  const userInitial = isDemoMode
    ? 'T'
    : profile?.fullName
    ? profile.fullName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'P';

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
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          {currentTabInfo.title}
        </h2>
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

        {/* Quick Transaction Action Buttons */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => openQuickEntry('income')}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
            title="Nova Receita"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Receita</span>
          </button>
          <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => openQuickEntry('expense')}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
            title="Nova Despesa"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Despesa</span>
          </button>
          <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => openQuickEntry('transfer')}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
            title="Transferência entre Contas"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transferir</span>
          </button>
        </div>

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

        {/* User Profile & Logout Menu */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {userInitial}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[120px]">
                {isDemoMode ? 'Conta Teste' : profile?.fullName || user?.email?.split('@')[0] || 'Gestor'}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-none">
                Plano {(organization?.plan || 'pro').toUpperCase()} {isDemoMode ? '(Demo)' : organization?.subscriptionStatus === 'active' ? '(Ativo)' : '(Teste)'}
              </span>
            </div>
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 top-full w-64 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-30 py-2 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {isDemoMode ? 'Gestor (Conta de Teste)' : profile?.fullName || 'Usuário Gestor'}
                    </p>
                    {isDemoMode && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-300 rounded border border-amber-500/30">
                        Teste
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {isDemoMode ? 'teste@prosper.com.br' : user?.email || 'admin@empresa.com'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 w-fit">
                    <Building className="w-3 h-3" />
                    <span className="truncate">{isDemoMode ? 'PROSPER Soluções (Modo Teste)' : organization?.name || 'PROSPER Soluções'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                    <span className="text-slate-400">Plano Atual:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                      {organization?.plan || 'PRO'} • {isDemoMode ? 'Demo' : organization?.subscriptionStatus === 'active' ? 'Ativo' : 'Teste'}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configurações da Conta</span>
                  </button>

                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Encerrar Sessão (Sair)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
