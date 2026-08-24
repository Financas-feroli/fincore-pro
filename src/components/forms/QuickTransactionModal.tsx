import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../common/Modal';
import {
  PaymentMethod,
  RecurrenceFrequency,
  TransactionType,
  TransactionStatus,
} from '../../types';
import { formatCurrency, formatDate, getTodayDateString, parseBRL } from '../../utils/formatters';

export const QuickTransactionModal: React.FC = () => {
  const {
    isQuickEntryOpen,
    setIsQuickEntryOpen,
    quickEntryType,
    editingTransaction,
    updateTransaction,
    closeQuickEntry,
    accounts,
    categories,
    costCenters,
    contacts,
    addTransaction,
    transferFunds,
    addContact,
    showToast,
  } = useFinance();

  const [type, setType] = useState<TransactionType>(quickEntryType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [contactId, setContactId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [competenceDate, setCompetenceDate] = useState(getTodayDateString().substring(0, 7) + '-01');
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: number; type: string }[]>([]);

  // Toggle for extra fields
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced toggles
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(3);

  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('monthly');
  const [recurrenceMonths, setRecurrenceMonths] = useState(12);

  // Quick inline contact creation
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');

  // Reset or Populate on modal open / edit
  useEffect(() => {
    if (isQuickEntryOpen) {
      if (editingTransaction) {
        // PREFILL ALL FIELDS FOR EDITING
        setType(editingTransaction.type);
        setDescription(editingTransaction.description || '');
        setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
        setCategoryId(editingTransaction.categoryId || '');
        setAccountId(editingTransaction.accountId || '');
        setTargetAccountId(editingTransaction.targetAccountId || '');
        setContactId(editingTransaction.contactId || '');
        setCostCenterId(editingTransaction.costCenterId || '');
        setDueDate(editingTransaction.dueDate || getTodayDateString());
        setPaymentDate(editingTransaction.paymentDate || editingTransaction.dueDate || getTodayDateString());
        setCompetenceDate(editingTransaction.competenceDate || getTodayDateString().substring(0, 7) + '-01');
        setStatus(editingTransaction.status || 'paid');
        setPaymentMethod(editingTransaction.paymentMethod || 'pix');
        setDocumentNumber(editingTransaction.documentNumber || '');
        setNotes(editingTransaction.notes || '');
        setTagsInput((editingTransaction.tags || []).join(', '));
        setAttachments(editingTransaction.attachments || []);
        setIsInstallment(false);
        setIsRecurrent(false);
        setShowAdvanced(true);
        setIsCreatingContact(false);
      } else {
        // DEFAULTS FOR NEW TRANSACTION
        setType(quickEntryType);
        const defaultAcc = accounts[0]?.id || '';
        setAccountId(defaultAcc);
        setTargetAccountId(accounts[1]?.id || defaultAcc);

        const filteredCats = categories.filter((c) => c.type === (quickEntryType === 'income' ? 'income' : 'expense'));
        setCategoryId(filteredCats[0]?.id || '');
        setCostCenterId(costCenters[0]?.id || '');
        setDueDate(getTodayDateString());
        setPaymentDate(getTodayDateString());
        setCompetenceDate(getTodayDateString().substring(0, 7) + '-01');
        setStatus('paid');
        setAmount('');
        setDescription('');
        setDocumentNumber('');
        setNotes('');
        setTagsInput('');
        setIsInstallment(false);
        setIsRecurrent(false);
        setShowAdvanced(false);
        setAttachments([]);
        setIsCreatingContact(false);
      }
    }
  }, [isQuickEntryOpen, editingTransaction, quickEntryType, accounts, categories, costCenters]);

  // Update categories when type changes
  useEffect(() => {
    if (type !== 'transfer') {
      const filteredCats = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));
      if (filteredCats.length > 0 && !filteredCats.some((c) => c.id === categoryId)) {
        setCategoryId(filteredCats[0].id);
      }
    }
  }, [type, categories]);

  const numAmount = parseBRL(amount);

  const handleCreateContactInline = () => {
    if (!newContactName.trim()) return;
    const newId = `cont-${Date.now()}`;
    addContact({
      name: newContactName.trim(),
      type: type === 'income' ? 'customer' : 'supplier',
      document: '00.000.000/0001-00',
    });
    setContactId(newId);
    setIsCreatingContact(false);
    setNewContactName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems = Array.from(files).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
    }));
    setAttachments((prev) => [...prev, ...newItems]);
    showToast('Comprovante anexado', `${files.length} arquivo(s) associado(s).`, 'info');
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDocumentNumber('');
    setNotes('');
    setTagsInput('');
    setIsInstallment(false);
    setIsRecurrent(false);
    setAttachments([]);
  };

  const handleSubmit = (keepOpen = false) => {
    if (numAmount <= 0) {
      showToast('Erro de validação', 'Por favor, informe um valor maior que zero.', 'error');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // EDIT MODE
    if (editingTransaction) {
      if (!description.trim()) {
        showToast('Erro de validação', 'Por favor, informe uma descrição para o lançamento.', 'error');
        return;
      }

      updateTransaction(editingTransaction.id, {
        description: description.trim(),
        amount: numAmount,
        type,
        status,
        categoryId: type !== 'transfer' ? categoryId : editingTransaction.categoryId,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        contactId: contactId || undefined,
        costCenterId: costCenterId || undefined,
        dueDate,
        paymentDate: status === 'paid' ? paymentDate || dueDate : undefined,
        competenceDate,
        paymentMethod,
        documentNumber: documentNumber || undefined,
        notes: notes || undefined,
        tags,
        attachments: attachments.map((a) => ({ ...a, uploadedAt: (a as any).uploadedAt || new Date().toISOString() })),
      });

      closeQuickEntry();
      return;
    }

    // CREATE MODE: TRANSFER
    if (type === 'transfer') {
      transferFunds(accountId, targetAccountId, numAmount, dueDate, description);
      if (!keepOpen) closeQuickEntry();
      else resetForm();
      return;
    }

    // CREATE MODE: INCOME / EXPENSE
    if (!description.trim()) {
      showToast('Erro de validação', 'Por favor, informe uma descrição para o lançamento.', 'error');
      return;
    }

    addTransaction(
      {
        description: description.trim(),
        amount: numAmount,
        originalAmount: numAmount,
        type,
        status,
        categoryId,
        accountId,
        contactId: contactId || undefined,
        costCenterId: costCenterId || undefined,
        dueDate,
        paymentDate: status === 'paid' ? paymentDate || dueDate : undefined,
        competenceDate,
        paymentMethod,
        documentNumber: documentNumber || undefined,
        notes: notes || undefined,
        tags,
        attachments: attachments.map((a) => ({ ...a, uploadedAt: new Date().toISOString() })),
      },
      {
        installments: isInstallment ? Number(installmentsCount) : 1,
        recurrenceFrequency: isRecurrent ? recurrenceFreq : 'none',
        recurrenceMonths: isRecurrent ? Number(recurrenceMonths) : 12,
      }
    );

    if (!keepOpen) {
      closeQuickEntry();
    } else {
      resetForm();
    }
  };

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <Modal
      isOpen={isQuickEntryOpen}
      onClose={closeQuickEntry}
      title={
        editingTransaction
          ? type === 'income'
            ? 'Editar Receita'
            : type === 'expense'
            ? 'Editar Despesa'
            : 'Editar Transferência'
          : type === 'income'
          ? 'Nova Receita'
          : type === 'expense'
          ? 'Nova Despesa'
          : 'Nova Transferência'
      }
      subtitle={
        editingTransaction
          ? 'Atualize valores, categoria, conta bancária e datas deste lançamento'
          : 'Cadastre movimentações financeiras com agilidade e precisão'
      }
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Type Selector (Pill Style) */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#161f30] rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Despesa</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Receita</span>
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'transfer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transferência</span>
          </button>
        </div>

        {/* Hero Amount Field with High Contrast & Clean Label */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
            Valor do Lançamento
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-sm font-bold text-slate-400 dark:text-slate-500 font-mono">
              R$
            </span>
            <input
              type="text"
              autoFocus
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
              className={`w-full pl-12 pr-4 py-3 text-2xl font-extrabold font-mono rounded-xl border bg-slate-100/70 dark:bg-[#161f30] placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition-all ${
                type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  : type === 'expense'
                  ? 'text-rose-600 dark:text-rose-400 border-rose-500/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'text-blue-600 dark:text-blue-400 border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
            Descrição / Histórico
          </label>
          <input
            type="text"
            placeholder={
              type === 'income'
                ? 'Ex: Faturamento Contrato de Serviços #4092'
                : type === 'expense'
                ? 'Ex: Aluguel da Sede Comercial ou Licença de Software'
                : 'Ex: Transferência para reserva financeira'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Core Fields Grid (Clean 2-Column layout) */}
        {type === 'transfer' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Conta de Origem (Saída)
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-blue-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatCurrency(acc.currentBalance)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Conta de Destino (Entrada)
              </label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-blue-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatCurrency(acc.currentBalance)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Categoria / Plano de Contas
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.group ? `[${c.group}] ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Account */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Conta Bancária
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatCurrency(acc.currentBalance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Situação do Lançamento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="paid">{type === 'income' ? 'Recebido Já (Liquidado)' : 'Pago Já (Liquidado)'}</option>
                <option value="pending">Pendente (A Pagar / Receber)</option>
                <option value="scheduled">Agendado</option>
              </select>
            </div>
          </div>
        )}

        {/* Toggleable Clean Advanced Section */}
        {type !== 'transfer' && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <span>{showAdvanced ? 'Ocultar Opções Adicionais' : '+ Mais Detalhes (Cliente/Fornecedor, NF, Parcelamento...)'}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-3 animate-fade-in">
                {/* Contact & Cost Center Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                        {type === 'income' ? 'Cliente' : 'Fornecedor'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreatingContact(!isCreatingContact)}
                        className="text-[10px] text-emerald-500 hover:underline font-bold"
                      >
                        {isCreatingContact ? 'Cancelar' : '+ Novo Rápido'}
                      </button>
                    </div>

                    {isCreatingContact ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nome do contato..."
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateContactInline}
                          className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg font-bold"
                        >
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <select
                        value={contactId}
                        onChange={(e) => setContactId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl"
                      >
                        <option value="">Selecione (Opcional)...</option>
                        {contacts.map((cont) => (
                          <option key={cont.id} value={cont.id}>
                            {cont.name} {cont.tradeName ? `(${cont.tradeName})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Cost Center */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Centro de Custo
                    </label>
                    <select
                      value={costCenterId}
                      onChange={(e) => setCostCenterId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl"
                    >
                      {costCenters.map((cc) => (
                        <option key={cc.id} value={cc.id}>
                          {cc.code} - {cc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Method & Document NF */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Forma de Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl"
                    >
                      <option value="pix">PIX Instantâneo</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="bank_transfer">TED / Transferência</option>
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="cash">Dinheiro em Espécie</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Nº Documento / Nota Fiscal
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF-e 10948"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Tags & Attachments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Contrato, TI, Urgente"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Anexar Comprovante / NF
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Installments & Recurrence info/controls */}
                {!editingTransaction ? (
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 space-y-3">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInstallment}
                          onChange={(e) => {
                            setIsInstallment(e.target.checked);
                            if (e.target.checked) setIsRecurrent(false);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Parcelar em várias vezes</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isRecurrent}
                          onChange={(e) => {
                            setIsRecurrent(e.target.checked);
                            if (e.target.checked) setIsInstallment(false);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Lançamento fixo / recorrente</span>
                      </label>
                    </div>

                    {isInstallment && (
                      <div className="p-4 bg-slate-100/80 dark:bg-[#161f30] rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              Número de Parcelas:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="2"
                                max="360"
                                step="1"
                                value={installmentsCount || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 2 : Math.max(2, Math.min(360, Number(e.target.value)));
                                  setInstallmentsCount(val);
                                }}
                                className="w-24 px-3 py-2 text-sm font-bold font-mono text-center text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                placeholder="2"
                              />
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">vezes</span>
                            </div>
                          </div>

                          <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span>{installmentsCount}x de</span>
                            <span className="text-sm font-extrabold">{formatCurrency(numAmount > 0 && installmentsCount > 0 ? numAmount / installmentsCount : 0)}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                          <span>💡</span>
                          <span>O valor total de <strong>{formatCurrency(numAmount)}</strong> será dividido em <strong>{installmentsCount} parcelas mensais</strong> com vencimentos iniciando em {formatDate(dueDate)}.</span>
                        </p>
                      </div>
                    )}

                    {isRecurrent && (
                      <div className="p-4 bg-slate-100/80 dark:bg-[#161f30] rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                              Frequência da Recorrência:
                            </label>
                            <select
                              value={recurrenceFreq}
                              onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFrequency)}
                              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-sm"
                            >
                              <option value="daily">Diário (Todos os dias)</option>
                              <option value="weekly">Semanal (A cada 7 dias)</option>
                              <option value="biweekly">Quinzenal (A cada 14 dias)</option>
                              <option value="monthly">Mensal (Todo mês)</option>
                              <option value="bimonthly">Bimestral (A cada 2 meses)</option>
                              <option value="quarterly">Trimestral (A cada 3 meses)</option>
                              <option value="semiannual">Semestral (A cada 6 meses)</option>
                              <option value="yearly">Anual (A cada 1 ano)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                              Quantidade de Repetições:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="360"
                                step="1"
                                value={recurrenceMonths || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 1 : Math.max(1, Math.min(360, Number(e.target.value)));
                                  setRecurrenceMonths(val);
                                }}
                                className="w-24 px-3 py-2 text-sm font-bold font-mono text-center text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                placeholder="12"
                              />
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ocorrências</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                          <span>🔁</span>
                          <span>Serão gerados automaticamente <strong>{recurrenceMonths} lançamentos</strong> de <strong>{formatCurrency(numAmount)}</strong> cada a partir de {formatDate(dueDate)}.</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  (editingTransaction.installment || editingTransaction.recurrence) && (
                    <div className="p-3 bg-slate-100 dark:bg-[#161f30] rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      {editingTransaction.installment && (
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          📦 Registro de Parcela: <strong>{editingTransaction.installment.current} de {editingTransaction.installment.total}</strong>
                        </span>
                      )}
                      {editingTransaction.recurrence && (
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          🔁 Lançamento Recorrente ({editingTransaction.recurrence.frequency}) — Ocorrência {editingTransaction.recurrence.current}/{editingTransaction.recurrence.count}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">Edição individual</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {!editingTransaction ? (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Salvar e Novo</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 font-medium">
              ID: <span className="font-mono text-slate-500">{editingTransaction.id}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeQuickEntry}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  : type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
              }`}
            >
              {editingTransaction ? 'Salvar Alterações' : 'Salvar Lançamento'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
