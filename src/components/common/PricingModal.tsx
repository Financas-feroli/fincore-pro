import React, { useState } from 'react';
import {
  Check,
  Zap,
  Shield,
  CreditCard,
  Building2,
  Sparkles,
  Crown,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { storageService } from '../../services/storage';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, organization, updateSubscription } = useAuth();
  const { showToast } = useFinance();

  const currentPlan = organization?.plan || 'pro';
  const isTrial = organization?.subscriptionStatus === 'trialing';

  // Selected plan state for interactive card selection
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'starter' | 'pro' | 'business'>(() => {
    if (isTrial) return 'trial';
    return currentPlan as any;
  });

  // Sync selectedPlan whenever organization updates or modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (isTrial) {
        setSelectedPlan('trial');
      } else {
        setSelectedPlan((organization?.plan || 'pro') as any);
      }
    }
  }, [isOpen, organization?.plan, isTrial]);

  let remainingDays = 14;
  if (organization?.trialEndsAt) {
    const diffMs = new Date(organization.trialEndsAt).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Get Stripe checkout URL with dynamic parameters
  const getStripeCheckoutUrl = (planId: 'starter' | 'pro' | 'business') => {
    const links = storageService.getStripeLinks();
    const baseLink =
      links[planId] || 'https://buy.stripe.com/test_bJefZg24ffKw8y7ffgdMI01';

    const params = new URLSearchParams();
    if (user?.email) params.append('prefilled_email', user.email);
    if (organization?.id) params.append('client_reference_id', organization.id);

    return `${baseLink}${baseLink.includes('?') ? '&' : '?'}${params.toString()}`;
  };

  // Handle Trial Start
  const handleStartTrial = () => {
    updateSubscription('pro', 'trialing', 14);
    showToast(
      'Período de Testes Ativado! 🚀',
      'Você tem 14 dias de acesso completo e irrestrito ao plano PROSPER PRO.',
      'success'
    );
    onClose();
  };

  // Handle Plan Subscription
  const handleSubscribePlan = (plan: 'starter' | 'pro' | 'business') => {
    updateSubscription(plan, 'active');
    const planName = plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Business';
    showToast(
      `Plano PROSPER ${planName} Ativado! 🚀`,
      `Sua assinatura mensal do plano ${planName} foi atualizada com sucesso.`,
      'success'
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escolha o Plano Ideal para sua Empresa"
      subtitle="Gestão financeira completa, DRE e controladoria em tempo real • Sem fidelidade, cancele quando quiser"
      maxWidth="5xl"
    >
      <div className="space-y-5 pt-2">
        {/* 4 Spacious Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch pt-2">
          {/* COLUMN 1: TESTE GRÁTIS (14 DIAS) */}
          <div
            onClick={() => setSelectedPlan('trial')}
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between relative transition-all duration-150 cursor-pointer select-none h-full ${
              selectedPlan === 'trial'
                ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xl ring-2 ring-emerald-500/30'
                : isTrial
                ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 hover:border-emerald-500/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div>
              {/* Header row with fixed height and no wrapping */}
              <div className="flex items-center justify-between gap-2 h-7 min-h-[28px]">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                  Avaliação Gratuita
                </span>
                {selectedPlan === 'trial' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Selecionado
                  </span>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                )}
              </div>

              {/* Title & subtitle */}
              <div className="mt-3 min-h-[52px]">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Teste Grátis
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Experimente todos os recursos sem compromisso
                </p>
              </div>

              {/* Price area */}
              <div className="mt-2 pb-4 border-b border-slate-100 dark:border-slate-800 min-h-[64px] flex flex-col justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    0
                  </span>
                  <span className="text-xs text-slate-400">/14 dias</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5 whitespace-nowrap">
                  Sem necessidade de cartão
                </span>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mt-4 text-xs">
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">14 dias de acesso total</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Todos os módulos liberados</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Conciliação bancária OFX</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">DRE Gerencial e Fluxo</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Relatórios & Gráficos</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Sem fidelidade ou cobranças</span>
                </li>
              </ul>
            </div>

            {/* Direct Action Button */}
            <div className="mt-6 pt-3">
              {isTrial ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-default"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Em Teste ({remainingDays}d restantes)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTrial();
                  }}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                >
                  Iniciar 14 Dias Grátis
                </button>
              )}
            </div>
          </div>

          {/* COLUMN 2: STARTER */}
          <div
            onClick={() => setSelectedPlan('starter')}
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between relative transition-all duration-150 cursor-pointer select-none h-full ${
              selectedPlan === 'starter'
                ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xl ring-2 ring-emerald-500/30'
                : !isTrial && currentPlan === 'starter'
                ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 h-7 min-h-[28px]">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
                  MEI & Autônomos
                </span>
                {selectedPlan === 'starter' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Selecionado
                  </span>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
              </div>

              {/* Title & subtitle */}
              <div className="mt-3 min-h-[52px]">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Starter
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Ideal para MEIs e profissionais autônomos
                </p>
              </div>

              {/* Price area */}
              <div className="mt-2 pb-4 border-b border-slate-100 dark:border-slate-800 min-h-[64px] flex flex-col justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    49
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5 whitespace-nowrap">
                  Assinatura mensal recorrente
                </span>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mt-4 text-xs">
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">1 Usuário Gestor</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Até 2 Contas Bancárias</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Lançamentos Ilimitados</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Contas a Pagar e a Receber</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Exportação de Planilhas CSV</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Suporte por E-mail</span>
                </li>
              </ul>
            </div>

            {/* Direct Action Button */}
            <div className="mt-6 pt-3">
              {!isTrial && currentPlan === 'starter' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-default"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Plano Atual Ativo</span>
                </button>
              ) : (
                <a
                  href={getStripeCheckoutUrl('starter')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribePlan('starter');
                  }}
                  className={`w-full py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    selectedPlan === 'starter'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-md'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Assinar Starter</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5" />
                </a>
              )}
            </div>
          </div>

          {/* COLUMN 3: PRO (MAIS ESCOLHIDO) */}
          <div
            onClick={() => setSelectedPlan('pro')}
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between relative transition-all duration-150 cursor-pointer select-none h-full ${
              selectedPlan === 'pro'
                ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xl ring-2 ring-emerald-500/30'
                : !isTrial && currentPlan === 'pro'
                ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] font-black rounded-full shadow-md uppercase tracking-wider flex items-center gap-1 z-10 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Mais Escolhido</span>
            </div>

            <div>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 h-7 min-h-[28px]">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0">
                  PMEs & Escala
                </span>
                {selectedPlan === 'pro' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Selecionado
                  </span>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Crown className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                )}
              </div>

              {/* Title & subtitle */}
              <div className="mt-3 min-h-[52px]">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Pro
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Para pequenas e médias empresas em crescimento
                </p>
              </div>

              {/* Price area */}
              <div className="mt-2 pb-4 border-b border-slate-100 dark:border-slate-800 min-h-[64px] flex flex-col justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    97
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5 whitespace-nowrap">
                  Assinatura mensal recorrente
                </span>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mt-4 text-xs">
                <li className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-[11px]">Até 3 Usuários (Admin + Operador)</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-[11px]">Contas Bancárias Ilimitadas</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-[11px]">Conciliação Bancária OFX/CSV</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-[11px]">DRE Gerencial Completo</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-[11px]">Centros de Custo & Rateio</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-[11px]">Suporte Prioritário WhatsApp</span>
                </li>
              </ul>
            </div>

            {/* Direct Action Button */}
            <div className="mt-6 pt-3">
              {!isTrial && currentPlan === 'pro' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-default"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Plano Atual Ativo</span>
                </button>
              ) : (
                <a
                  href={getStripeCheckoutUrl('pro')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribePlan('pro');
                  }}
                  className={`w-full py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    selectedPlan === 'pro'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-md'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Assinar Pro</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5" />
                </a>
              )}
            </div>
          </div>

          {/* COLUMN 4: BUSINESS */}
          <div
            onClick={() => setSelectedPlan('business')}
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between relative transition-all duration-150 cursor-pointer select-none h-full ${
              selectedPlan === 'business'
                ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xl ring-2 ring-emerald-500/30'
                : !isTrial && currentPlan === 'business'
                ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 h-7 min-h-[28px]">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 whitespace-nowrap shrink-0">
                  Controladoria
                </span>
                {selectedPlan === 'business' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Selecionado
                  </span>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                )}
              </div>

              {/* Title & subtitle */}
              <div className="mt-3 min-h-[52px]">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Business
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Para empresas estruturadas e controladoria
                </p>
              </div>

              {/* Price area */}
              <div className="mt-2 pb-4 border-b border-slate-100 dark:border-slate-800 min-h-[64px] flex flex-col justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    197
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5 whitespace-nowrap">
                  Assinatura mensal recorrente
                </span>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mt-4 text-xs">
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Usuários Ilimitados com Perfis</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Multi-empresas / Filiais</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Conciliação OFX Inteligente</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Relatórios Avançados & Auditoria</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Acesso Dedicado para Contador</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Gerente de Contas Exclusivo</span>
                </li>
              </ul>
            </div>

            {/* Direct Action Button */}
            <div className="mt-6 pt-3">
              {!isTrial && currentPlan === 'business' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-default"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Plano Atual Ativo</span>
                </button>
              ) : (
                <a
                  href={getStripeCheckoutUrl('business')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribePlan('business');
                  }}
                  className={`w-full py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    selectedPlan === 'business'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-md'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Assinar Business</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Clean & Elegant Payment & Trust Footer */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Pagamento Seguro via Cartão de Crédito (Stripe)</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Garantia de 7 dias
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Liberação imediata
            </span>
            <span>•</span>
            <span>Sem fidelidade • Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
