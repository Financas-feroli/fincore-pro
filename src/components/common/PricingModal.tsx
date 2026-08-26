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
  ArrowLeft,
  Copy,
  CheckCircle2,
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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutPlan, setCheckoutPlan] = useState<'starter' | 'pro' | 'business' | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'card' | 'pix'>('card');

  const currentPlan = organization?.plan || 'pro';
  const isTrial = organization?.subscriptionStatus === 'trialing';

  let remainingDays = 14;
  if (organization?.trialEndsAt) {
    const diffMs = new Date(organization.trialEndsAt).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Get Stripe checkout URL with parameters
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
    setCheckoutPlan(null);
    onClose();
  };

  // Confirm Plan Activation
  const handleConfirmActivation = (planId: 'starter' | 'pro' | 'business') => {
    updateSubscription(planId, 'active');
    showToast(
      'Assinatura Ativada com Sucesso! 🎉',
      `O plano PROSPER ${planId.toUpperCase()} está 100% ativo para sua empresa.`,
      'success'
    );
    setCheckoutPlan(null);
    onClose();
  };

  // Handle Direct Stripe Checkout Trigger
  const handleDirectStripeRedirect = (planId: 'starter' | 'pro' | 'business') => {
    const url = getStripeCheckoutUrl(planId);
    updateSubscription(planId, 'active');
    showToast(
      'Redirecionando para o Stripe...',
      `Abrindo página oficial de pagamento do plano PROSPER ${planId.toUpperCase()}.`,
      'info'
    );

    // Safe direct open
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
  };

  const handleCopyPix = (amount: number) => {
    const pixCode = `00020126580014br.gov.bcb.pix0136financeiro@prosper.com.br5204000053039865405${amount}.005802BR5915PROSPER FINANCA6009SAO PAULO62070503***6304`;
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    showToast('Código PIX Copiado!', 'Cole no aplicativo do seu banco para realizar o pagamento.', 'info');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  // Calculate prices
  const getPlanPrice = (planId: 'starter' | 'pro' | 'business') => {
    if (planId === 'starter') return billingPeriod === 'yearly' ? 39 : 49;
    if (planId === 'pro') return billingPeriod === 'yearly' ? 79 : 97;
    return billingPeriod === 'yearly' ? 159 : 197;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setCheckoutPlan(null);
        onClose();
      }}
      title={
        checkoutPlan
          ? `Finalizar Assinatura — PROSPER ${checkoutPlan.toUpperCase()}`
          : 'Escolha o Plano Ideal para sua Empresa'
      }
      subtitle={
        checkoutPlan
          ? 'Escolha sua forma de pagamento para liberar o acesso corporativo imediato'
          : 'Evolua a gestão do seu negócio com ferramentas financeiras de alta precisão e controladoria'
      }
      maxWidth={checkoutPlan ? '2xl' : '5xl'}
    >
      {checkoutPlan ? (
        /* CHECKOUT / PAYMENT VIEW */
        <div className="space-y-5 animate-fade-in">
          {/* Back button & Plan Summary */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCheckoutPlan(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar aos Planos</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Plano Selecionado:</span>
              <span className="px-2.5 py-0.5 text-xs font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/30">
                PROSPER {checkoutPlan.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Pricing summary card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Valor da Assinatura:</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-semibold text-slate-400">R$</span>
                <span className="font-mono">{getPlanPrice(checkoutPlan)}</span>
                <span className="text-xs text-slate-400 font-normal">
                  /{billingPeriod === 'yearly' ? 'mês (cobrado anualmente)' : 'mês'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg">
                <Shield className="w-3.5 h-3.5" />
                Garantia 7 dias
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setPaymentTab('card')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                paymentTab === 'card'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cartão de Crédito / Stripe</span>
            </button>

            <button
              onClick={() => setPaymentTab('pix')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                paymentTab === 'pix'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>PIX Instantâneo</span>
            </button>
          </div>

          {/* TAB 1: CREDIT CARD & STRIPE */}
          {paymentTab === 'card' && (
            <div className="space-y-4 pt-1">
              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Checkout Seguro Stripe (Cartão em até 12x)
                  </h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Você será redirecionado para a página criptografada de pagamento do Stripe com suporte a faturamento automático e emissão de recibo contábil.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={getStripeCheckoutUrl(checkoutPlan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => updateSubscription(checkoutPlan, 'active')}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Ir para Checkout Stripe</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleConfirmActivation(checkoutPlan)}
                    className="w-full sm:w-auto px-5 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                  >
                    Ativar Assinatura Imediata (1-Clique)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PIX */}
          {paymentTab === 'pix' && (
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                {/* Mock QR Code visual */}
                <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center flex-shrink-0">
                  <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-slate-900 rounded-lg">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`${
                          (i % 2 === 0 || i % 7 === 0 || i === 12) && i !== 6 && i !== 18
                            ? 'bg-white'
                            : 'bg-slate-900'
                        } rounded-[2px]`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pague com PIX para liberação instantânea:
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Abra o app do seu banco, escaneie o QR Code ao lado ou use a chave PIX Copia e Cola abaixo.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyPix(getPlanPrice(checkoutPlan))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      {copiedPix ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Chave Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar Chave PIX</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <button
                type="button"
                onClick={() => handleConfirmActivation(checkoutPlan)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Confirmar Pagamento PIX e Ativar Acesso Imediato</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 4 COLUMNS PLANS VIEW */
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

              <div className="mt-6 pt-3 space-y-2">
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
                  <>
                    <a
                      href={getStripeCheckoutUrl('starter')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => updateSubscription('starter', 'active')}
                      className="w-full py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Assinar com Stripe</span>
                      <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTab('pix');
                        setCheckoutPlan('starter');
                      }}
                      className="w-full py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <QrCode className="w-3 h-3 text-emerald-500" />
                      <span>Pagar via PIX</span>
                    </button>
                  </>
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

              <div className="mt-6 pt-3 space-y-2">
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
                  <>
                    <a
                      href={getStripeCheckoutUrl('pro')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => updateSubscription('pro', 'active')}
                      className="w-full py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Assinar Pro com Stripe</span>
                      <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTab('pix');
                        setCheckoutPlan('pro');
                      }}
                      className="w-full py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <QrCode className="w-3 h-3 text-emerald-500" />
                      <span>Pagar via PIX</span>
                    </button>
                  </>
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

              <div className="mt-6 pt-3 space-y-2">
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
                  <>
                    <a
                      href={getStripeCheckoutUrl('business')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => updateSubscription('business', 'active')}
                      className="w-full py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Assinar Business com Stripe</span>
                      <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTab('pix');
                        setCheckoutPlan('business');
                      }}
                      className="w-full py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <QrCode className="w-3 h-3 text-emerald-500" />
                      <span>Pagar via PIX</span>
                    </button>
                  </>
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
              <span className="text-[11px] text-slate-400">
                Garantia incondicional de 7 dias com reembolso total
              </span>
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
      )}
    </Modal>
  );
};

