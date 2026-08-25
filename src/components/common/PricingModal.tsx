import React, { useState } from 'react';
import {
  Check,
  Zap,
  Shield,
  CreditCard,
  QrCode,
  Building2,
  Sparkles,
  Crown,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, organization, updateSubscription } = useAuth();
  const { showToast } = useFinance();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Stripe Payment Links configured
  const stripePaymentLinks: Record<'starter' | 'pro' | 'business', string> = {
    starter: 'https://buy.stripe.com/test_28EeVc5greGsaGf3wydMI00',
    pro: 'https://buy.stripe.com/test_bJefZg24ffKw8y7ffgdMI01',
    business: 'https://buy.stripe.com/test_cNicN4eR1eGs6pZ3wydMI02',
  };

  const currentPlan = organization?.plan || 'pro';
  const isTrial = organization?.subscriptionStatus === 'trialing';

  let remainingDays = 14;
  if (organization?.trialEndsAt) {
    const diffMs = new Date(organization.trialEndsAt).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

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
  const handleSubscribePlan = (planId: 'starter' | 'pro' | 'business') => {
    updateSubscription(planId, 'active');
    showToast(
      'Plano Ativado com Sucesso! 🎉',
      `Sua assinatura do plano PROSPER ${planId.toUpperCase()} está ativa com todos os recursos liberados.`,
      'success'
    );
    onClose();
  };

  // Handle Stripe Checkout
  const handleStripeCheckout = (planId: 'starter' | 'pro' | 'business') => {
    const baseLink = stripePaymentLinks[planId];
    if (!baseLink) return;

    const params = new URLSearchParams();
    if (user?.email) params.append('prefilled_email', user.email);
    if (organization?.id) params.append('client_reference_id', organization.id);

    updateSubscription(planId, 'active');

    const finalCheckoutUrl = `${baseLink}?${params.toString()}`;
    window.open(finalCheckoutUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escolha o Plano Ideal para sua Empresa"
      subtitle="Evolua a gestão do seu negócio com ferramentas financeiras de alta precisão e controladoria"
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Billing Period Switch (Monthly vs Yearly) */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 font-bold rounded-lg transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Faturamento Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-bold rounded-lg transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Faturamento Anual</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-amber-400 text-slate-900 rounded font-black">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* 4 Spacious Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* COLUMN 1: TESTE GRÁTIS (14 DIAS) */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between relative transition-all ${
              isTrial
                ? 'border-amber-500/60 bg-amber-500/5 dark:bg-amber-500/10 shadow-md ring-1 ring-amber-500/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  Avaliação Gratuita
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>

              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-3">
                Teste Grátis
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                Experimente todos os recursos sem compromisso
              </p>

              <div className="mt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    0
                  </span>
                  <span className="text-xs text-slate-400">/14 dias</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
                  Sem necessidade de cartão de crédito
                </span>
              </div>

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
                  <span className="text-[11px]">Sem fidelidade ou cobranças</span>
                </li>
              </ul>
            </div>

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
                  onClick={handleStartTrial}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                >
                  Iniciar 14 Dias Grátis
                </button>
              )}
            </div>
          </div>

          {/* COLUMN 2: STARTER */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between relative transition-all ${
              !isTrial && currentPlan === 'starter'
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-lg ring-1 ring-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Básico & Autônomos
                </span>
              </div>

              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-3">
                Starter
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                Ideal para MEIs e profissionais autônomos
              </p>

              <div className="mt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {billingPeriod === 'yearly' ? 39 : 49}
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                    Cobrado anualmente (R$ 468/ano)
                  </span>
                )}
              </div>

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
                <button
                  type="button"
                  onClick={() => handleSubscribePlan('starter')}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all"
                >
                  Assinar Starter
                </button>
              )}
            </div>
          </div>

          {/* COLUMN 3: PRO (MAIS ESCOLHIDO) */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between relative transition-all ${
              !isTrial && currentPlan === 'pro'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-xl ring-2 ring-emerald-500'
                : 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-lg'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] font-black rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Mais Escolhido</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  PMEs & Expansão
                </span>
                <Crown className="w-4 h-4 text-emerald-500" />
              </div>

              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-3">
                Pro
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                Para pequenas e médias empresas em crescimento
              </p>

              <div className="mt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {billingPeriod === 'yearly' ? 79 : 97}
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                    Cobrado anualmente (R$ 948/ano)
                  </span>
                )}
              </div>

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
                <button
                  type="button"
                  onClick={() => handleSubscribePlan('pro')}
                  className="w-full py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Assinar Pro</span>
                </button>
              )}
            </div>
          </div>

          {/* COLUMN 4: BUSINESS */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between relative transition-all ${
              !isTrial && currentPlan === 'business'
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-lg ring-1 ring-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                  Controladoria & Escala
                </span>
                <Building2 className="w-4 h-4 text-blue-500" />
              </div>

              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-3">
                Business
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                Para empresas estruturadas e controladoria
              </p>

              <div className="mt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-400">R$</span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {billingPeriod === 'yearly' ? 159 : 197}
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                    Cobrado anualmente (R$ 1.908/ano)
                  </span>
                )}
              </div>

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
                <button
                  type="button"
                  onClick={() => handleSubscribePlan('business')}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all"
                >
                  Assinar Business
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean & Trustworthy Payment Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Formas de Pagamento:
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 font-bold rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-3.5 h-3.5" />
              <span>PIX Instantâneo</span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 font-bold rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cartão de Crédito (até 12x)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStripeCheckout(currentPlan)}
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 underline flex items-center gap-1"
            >
              <span>Pagar via Checkout Stripe</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Security badges footer */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Garantia incondicional de 7 dias
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            Liberação imediata de acesso
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-purple-500" />
            Ambiente Seguro 256-bit SSL
          </span>
        </div>
      </div>
    </Modal>
  );
};

