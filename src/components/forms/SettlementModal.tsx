import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate, getTodayDateString, parseBRL } from '../../utils/formatters';
import confetti from 'canvas-confetti';

export const SettlementModal: React.FC = () => {
  const {
    isSettlementModalOpen,
    closeSettlementModal,
    settlementTransaction,
    accounts,
    settleTransaction,
  } = useFinance();

  const [accountId, setAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [interestInput, setInterestInput] = useState<string>('');
  const [fineInput, setFineInput] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('');

  useEffect(() => {
    if (settlementTransaction) {
      setAccountId(settlementTransaction.accountId || accounts[0]?.id || '');
      setPaymentDate(getTodayDateString());
      setInterestInput('');
      setFineInput('');
      setDiscountInput('');
    }
  }, [settlementTransaction, accounts]);

  if (!settlementTransaction) return null;

  const interestAmount = parseBRL(interestInput);
  const fineAmount = parseBRL(fineInput);
  const discountAmount = parseBRL(discountInput);

  const originalAmount = settlementTransaction.originalAmount || settlementTransaction.amount;
  const finalCalculatedAmount = Math.max(
    0,
    originalAmount + interestAmount + fineAmount - discountAmount
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    settleTransaction(settlementTransaction.id, {
      paymentDate,
      accountId,
      interestAmount,
      fineAmount,
      discountAmount,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  const isIncome = settlementTransaction.type === 'income';

  return (
    <Modal
      isOpen={isSettlementModalOpen}
      onClose={closeSettlementModal}
      title={isIncome ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
      subtitle={`Liquidação de lançamento: ${settlementTransaction.description}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Value Hero Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
            isIncome
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Valor a Liquidar
          </span>
          <span className="text-3xl font-extrabold font-mono tracking-tight mt-1">
            {formatCurrency(finalCalculatedAmount)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            Valor Original: {formatCurrency(originalAmount)} • Vencimento: {formatDate(settlementTransaction.dueDate)}
          </span>
        </div>

        {/* Payment Account */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isIncome ? 'Conta de Destino (Crédito)' : 'Conta de Origem (Débito)'}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} — Saldo: {formatCurrency(acc.currentBalance)}
              </option>
            ))}
          </select>
        </div>

        {/* Date of Payment */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isIncome ? 'Data do Recebimento Efetivo' : 'Data do Pagamento Efetivo'}
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Interest, Fine, Discount Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              (+) Juros (R$)
            </label>
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="0,00"
              className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono placeholder:font-normal placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              (+) Multa (R$)
            </label>
            <input
              type="text"
              value={fineInput}
              onChange={(e) => setFineInput(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="0,00"
              className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono placeholder:font-normal placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              (-) Desconto (R$)
            </label>
            <input
              type="text"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="0,00"
              className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono placeholder:font-normal placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeSettlementModal}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Liquidação</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
