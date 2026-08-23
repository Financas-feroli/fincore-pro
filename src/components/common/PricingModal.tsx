import React, { useState } from 'react';
import {
  Check,
  Zap,
  Shield,
  ArrowRight,
  CreditCard,
  QrCode,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, organization } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'business'>('pro');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');

  // Stripe Payment Links configured by the user
  const stripePaymentLinks: Record<'starter' | 'pro' | 'business', string> = {
    starter: 'https://buy.stripe.com/test_28EeVc5greGsaGf3wydMI00',
    pro: 'https://buy.stripe.com/test_bJefZg24ffKw8y7ffgdMI01',
    business: 'https://buy.stripe.com/test_cNicN4eR1eGs6pZ3wydMI02',
  };

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      subtitle: 'Ideal para MEIs e profissionais autônomos',
      monthlyPrice: 49,
      yearlyPrice: 39,
      features: [
        '1 Usuário Gestor',
        'Até 2 Contas Bancárias',
        'Lançamentos & Extratos Ilimitados',
        'Contas a Pagar e a Receber',
        'Exportação de Planilhas CSV',
        'Suporte por E-mail',
      ],
      popular: false,
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      subtitle: 'Para pequenas e médias empresas em crescimento',
      monthlyPrice: 97,
      yearlyPrice: 79,
      features: [
        'Até 3 Usuários (Admin + Operador)',
        'Contas Bancárias & Cartões Ilimitados',
        'Conciliação Bancária OFX Automática',
        'DRE Gerencial Completo (Competência/Caixa)',
        'Centros de Custo & Rateio Departamental',
        'Projeção de Fluxo de Caixa Diário',
        'Suporte Prioritário via WhatsApp',
      ],
      popular: true,
    },
    {
      id: 'business' as const,
      name: 'Business',
      subtitle: 'Para empresas estruturadas e controladoria',
      monthlyPrice: 197,
      yearlyPrice: 159,
      features: [
        'Usuários Ilimitados com Perfis de Acesso',
        'Multi-empresas / Filiais',
        'Conciliação Bancária OFX Inteligente',
        'Relatórios Gerenciais Avançados & Auditoria',
        'Acesso Dedicado para Contador / Auditor',
        'Backup Automático em Nuvem Diário',
        'Gerente de Contas Exclusivo',
      ],
      popular: false,
    },
  ];

  const handleCheckout = () => {
    const baseLink = stripePaymentLinks[selectedPlan];
    if (!baseLink) return;

    // Prefill customer email and organization ID in Stripe checkout
    const params = new URLSearchParams();
    if (user?.email) {
      params.append('prefilled_email', user.email);
    }
    if (organization?.id) {
      params.append('client_reference_id', organization.id);
    }

    const finalCheckoutUrl = `${baseLink}?${params.toString()}`;
    window.open(finalCheckoutUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escolha o Plano Ideal para sua Empresa"
      subtitle="Evolua a gestão do seu negócio com ferramentas financeiras de alta precisão"
      maxWidth="3xl"
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

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-lg ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] font-black rounded-full shadow-md uppercase tracking-wider">
                    Mais Escolhido
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {plan.name}
                    </h4>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                    {plan.subtitle}
                  </p>

                  <div className="mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-semibold text-slate-400">R$</span>
                      <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                        {price}
                      </span>
                      <span className="text-xs text-slate-400">/mês</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                        Cobrado anualmente (R$ {price * 12}/ano)
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2.5 mt-4 text-xs">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3">
                  <button
                    type="button"
                    className={`w-full py-2 text-xs font-bold rounded-xl transition-all ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Plano Selecionado' : 'Selecionar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Method & Checkout Trigger */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Formas aceitas no Checkout:
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <QrCode className="w-3.5 h-3.5" />
                <span>PIX</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cartão de Crédito</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>Ir para Checkout Stripe ({selectedPlan.toUpperCase()})</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Security badges footer */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 pt-1">
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
