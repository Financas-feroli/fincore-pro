import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Landmark,
  Users,
  FolderTree,
  FileSpreadsheet,
  Settings,
  Plus,
  ShieldCheck,
  Zap,
  Crown,
} from 'lucide-react';
import { useFinance, NavTab } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { PricingModal } from '../common/PricingModal';

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openQuickEntry,
    summary,
    companyProfile,
  } = useFinance();

  const { organization } = useAuth();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Executivo',
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      label: 'Lançamentos & Extrato',
      icon: ArrowLeftRight,
    },
    {
      id: 'payables',
      label: 'Contas a Pagar',
      icon: TrendingDown,
      badge: summary.overduePayablesCount > 0 ? summary.overduePayablesCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'receivables',
      label: 'Contas a Receber',
      icon: TrendingUp,
      badge: summary.overdueReceivablesCount > 0 ? summary.overdueReceivablesCount : undefined,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'banking',
      label: 'Bancos & Conciliação',
      icon: Landmark,
    },
    {
      id: 'contacts',
      label: 'Clientes & Fornecedores',
      icon: Users,
    },
    {
      id: 'categories',
      label: 'Categorias & Centros de Custo',
      icon: FolderTree,
    },
    {
      id: 'reports',
      label: 'Relatórios & DRE',
      icon: FileSpreadsheet,
    },
    {
      id: 'settings',
      label: 'Configurações do Sistema',
      icon: Settings,
    },
  ];

  return (
    <>
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen select-none transition-all z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-xl">
            P
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white leading-tight">
                PROSPER
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-300/40">
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-tight uppercase truncate mt-0.5">
              Gestão Financeira Inteligente
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => openQuickEntry('expense')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
            <span className="ml-auto text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded text-emerald-100 font-mono">
              N
            </span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold dark:bg-emerald-500/15'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full" />
                )}
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dynamic Plan & Upgrade Banner */}
        {(() => {
          const currentPlan = organization?.plan || 'pro';
          const isTrial = organization?.subscriptionStatus === 'trialing';
          const planNameFormatted =
            currentPlan === 'business' ? 'Business' : currentPlan === 'starter' ? 'Starter' : 'Pro';

          let remainingDays = 14;
          if (organization?.trialEndsAt) {
            const diffMs = new Date(organization.trialEndsAt).getTime() - Date.now();
            remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          }

          return (
            <div
              className={`p-3.5 mx-3 mb-3 border rounded-2xl transition-all ${
                isTrial
                  ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-500/20'
                  : 'bg-gradient-to-br from-emerald-600/15 via-teal-600/10 to-emerald-500/15 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Crown className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    Plano {planNameFormatted}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${
                    isTrial
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isTrial ? (remainingDays > 0 ? `${remainingDays}d Teste` : 'Expirado') : 'Ativo'}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                {isTrial
                  ? remainingDays > 0
                    ? `${remainingDays} dias restantes de teste grátis.`
                    : 'Seu período de testes encerrou.'
                  : 'Acesso completo a todas as ferramentas PROSPER.'}
              </p>

              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="w-full mt-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1"
              >
                {isTrial ? (
                  <>
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>Assinar Plano</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3 h-3 text-amber-300" />
                    <span>Gerenciar Plano</span>
                  </>
                )}
              </button>
            </div>
          );
        })()}

        {/* Bottom Summary Pill */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Saldo Líquido</span>
            <span
              className={`font-bold font-mono ${
                summary.totalBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary.totalBalance)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Isolamento Cloud Supabase RLS</span>
          </div>
        </div>
      </aside>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </>
  );
};
