import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Database,
  Download,
  Upload,
  RefreshCw,
  Sun,
  Moon,
  Crown,
  Zap,
  CheckCircle2,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { CompanyProfile } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { PricingModal } from '../common/PricingModal';
import { storageService } from '../../services/storage';

export const SettingsView: React.FC = () => {
  const {
    companyProfile,
    updateCompanyProfile,
    exportBackup,
    restoreBackup,
    loadDemoData,
    theme,
    toggleTheme,
    showToast,
  } = useFinance();

  const { organization, signOut, isDemoMode, user, profile } = useAuth();

  const [formProfile, setFormProfile] = useState<CompanyProfile>(companyProfile);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  useEffect(() => {
    setFormProfile(companyProfile);
  }, [companyProfile]);

  const handleSubmitCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyProfile(formProfile);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        restoreBackup(content);
      }
    };
    reader.readAsText(file);
  };

  const planName = organization?.plan ? organization.plan.toUpperCase() : 'PRO';
  const isTrial = organization?.subscriptionStatus === 'trialing';
  let remainingDays = 14;
  if (organization?.trialEndsAt) {
    const diffMs = new Date(organization.trialEndsAt).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in pb-16">
      {/* Settings Title */}
      <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-500" />
          Configurações do Sistema
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Parâmetros cadastrais da empresa, regime tributário, preferências visuais e backups de segurança.
        </p>
      </div>

      {/* 1. Subscription & Plan Card (SaaS Billing) */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl shadow-sm text-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white leading-tight">
                  Plano PROSPER {planName}
                </h4>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                    isDemoMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : isTrial
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {isDemoMode
                    ? 'Modo Demonstração (Test Drive)'
                    : isTrial
                    ? remainingDays > 0
                      ? `Período de Testes (${remainingDays} dias restantes)`
                      : 'Período de Testes Expirado'
                    : 'Assinatura Ativa'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Organização: <strong>{isDemoMode ? 'PROSPER Soluções (Modo Teste)' : organization?.name || formProfile.name}</strong> • {isDemoMode ? 'Conta de Teste' : profile?.email || user?.email || 'Banco em Nuvem Ativo'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Mudar de Plano / Assinar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              {organization?.plan === 'starter' && !isTrial
                ? '1 Usuário Gestor • Até 2 Contas Bancárias'
                : organization?.plan === 'business' && !isTrial
                ? 'Usuários Ilimitados • Multi-filiais & Contador'
                : 'Até 5 Usuários • Contas Bancárias Ilimitadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              {organization?.plan === 'starter' && !isTrial
                ? 'Lançamentos & Extrato Ilimitados'
                : organization?.plan === 'business' && !isTrial
                ? 'Conciliação OFX & Auditoria Avançada'
                : 'Conciliação OFX Instantânea & DRE Completo'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              {organization?.plan === 'business' && !isTrial
                ? 'Gerente Dedicado & Isolamento Enterprise'
                : organization?.plan === 'starter' && !isTrial
                ? 'Exportação CSV & Nuvem Supabase RLS'
                : 'Centros de Custo & Suporte Prioritário'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Company Profile Form */}
      <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building2 className="w-4 h-4 text-emerald-500" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Dados da Organização
          </h4>
        </div>

        <form onSubmit={handleSubmitCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Razão Social
              </label>
              <input
                type="text"
                value={formProfile.name}
                onChange={(e) => setFormProfile({ ...formProfile, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={formProfile.tradeName}
                onChange={(e) => setFormProfile({ ...formProfile, tradeName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Slogan / Mensagem Subtítulo do Topo
            </label>
            <input
              type="text"
              value={formProfile.slogan ?? ''}
              placeholder="Ex: Gestão financeira inteligente para seu negócio"
              onChange={(e) => setFormProfile({ ...formProfile, slogan: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400">
              Essa mensagem aparecerá de forma dinâmica diretamente abaixo do nome da empresa no topo da barra lateral.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                CNPJ
              </label>
              <input
                type="text"
                value={formProfile.document}
                onChange={(e) => setFormProfile({ ...formProfile, document: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Regime Tributário
              </label>
              <select
                value={formProfile.fiscalRegime}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    fiscalRegime: e.target.value as CompanyProfile['fiscalRegime'],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="simples">Simples Nacional</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="lucro_real">Lucro Real</option>
                <option value="mei">MEI</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Telefone
              </label>
              <input
                type="text"
                value={formProfile.phone}
                onChange={(e) => setFormProfile({ ...formProfile, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Endereço da Sede
              </label>
              <input
                type="text"
                value={formProfile.address}
                onChange={(e) => setFormProfile({ ...formProfile, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Cidade / UF
              </label>
              <input
                type="text"
                value={`${formProfile.city} / ${formProfile.state}`}
                onChange={(e) => {
                  const parts = e.target.value.split('/');
                  setFormProfile({
                    ...formProfile,
                    city: parts[0]?.trim() || '',
                    state: parts[1]?.trim() || 'SP',
                  });
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              Salvar Alterações da Empresa
            </button>
          </div>
        </form>
      </div>

      {/* 3. Backup & Data Management */}
      <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-4 h-4 text-blue-500" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Backup, Restauração e Demonstração
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Backup Download */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                Fazer Backup (.JSON)
              </h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Baixe uma cópia completa de todos os lançamentos, contas e contatos no formato JSON.
              </p>
            </div>
            <button
              onClick={exportBackup}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              Baixar Backup
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-500" />
                Restaurar Backup
              </h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Importe um arquivo de backup previamente gerado para restabelecer os dados.
              </p>
            </div>
            <label className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm text-center cursor-pointer block">
              <span>Selecionar Arquivo</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Demo Data Reset */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                Recarregar Dados Demo
              </h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Restaura o conjunto modelo com 6 meses de histórico empresarial de demonstração.
              </p>
            </div>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              Carregar Empresa Modelo
            </button>
          </div>
        </div>
      </div>

      {/* 4. System Preferences */}
      <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Aparência da Interface
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Alterne entre o Modo Escuro executivo e o Modo Claro.
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Tema Escuro</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Session & Logout Card */}
      <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LogOut className="w-4 h-4 text-rose-500" />
            Sessão & Desconexão
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Conectado como: <strong>{isDemoMode ? 'Gestor (Conta de Teste)' : profile?.fullName || user?.email || 'Gestor'}</strong> • {isDemoMode ? 'teste@prosper.com.br' : user?.email || 'admin@empresa.com'}
          </p>
        </div>

        <button
          onClick={async () => {
            await signOut();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Encerrar Sessão (Sair)</span>
        </button>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onConfirm={loadDemoData}
        title="Recarregar Dados de Demonstração?"
        message={
          <div>
            <p>
              Esta ação irá substituir os lançamentos e cadastros atuais pela base de demonstração contendo 6 meses de histórico modelo.
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              💡 <strong>Dica:</strong> Se você possui dados reais cadastrados, recomendamos fazer o download do Backup (.JSON) antes de continuar.
            </p>
          </div>
        }
        confirmLabel="Sim, Restaurar Dados Demo"
        cancelLabel="Cancelar"
        variant="warning"
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
};
