import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Building,
  Phone,
  Mail,
  CreditCard,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDocument, formatPhone } from '../../utils/formatters';
import { Contact } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const ContactsView: React.FC = () => {
  const { contacts, transactions, addContact, updateContact, deleteContact } = useFinance();

  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier' | 'employee'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [type, setType] = useState<Contact['type']>('customer');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');

  // Delete Contact Confirmation
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Calculate financial statistics per contact
  const contactStats = useMemo(() => {
    const statsMap = new Map<
      string,
      { totalInvoiced: number; totalPaid: number; pendingBalance: number; count: number }
    >();

    transactions.forEach((txn) => {
      if (!txn.contactId || txn.status === 'cancelled') return;
      const current = statsMap.get(txn.contactId) || {
        totalInvoiced: 0,
        totalPaid: 0,
        pendingBalance: 0,
        count: 0,
      };
      current.count++;
      if (txn.status === 'paid') {
        current.totalPaid += txn.amount;
      } else if (txn.status === 'pending') {
        current.pendingBalance += txn.amount;
      }
      current.totalInvoiced += txn.amount;
      statsMap.set(txn.contactId, current);
    });

    return statsMap;
  }, [transactions]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (filterType !== 'all' && c.type !== filterType && c.type !== 'both') return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.tradeName?.toLowerCase().includes(q) ||
          c.document.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contacts, filterType, searchTerm]);

  const handleOpenModal = (contactToEdit?: Contact) => {
    if (contactToEdit) {
      setEditingContactId(contactToEdit.id);
      setName(contactToEdit.name);
      setTradeName(contactToEdit.tradeName || '');
      setType(contactToEdit.type);
      setDocument(contactToEdit.document);
      setEmail(contactToEdit.email || '');
      setPhone(contactToEdit.phone || '');
      setPixKey(contactToEdit.pixKey || '');
      setAddress(contactToEdit.address || '');
      setCity(contactToEdit.city || '');
      setState(contactToEdit.state || 'SP');
      setCreditLimit(contactToEdit.creditLimit?.toString() || '');
      setNotes(contactToEdit.notes || '');
    } else {
      setEditingContactId(null);
      setName('');
      setTradeName('');
      setType('customer');
      setDocument('');
      setEmail('');
      setPhone('');
      setPixKey('');
      setAddress('');
      setCity('');
      setState('SP');
      setCreditLimit('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const limit = parseFloat(creditLimit.replace(',', '.')) || undefined;

    if (editingContactId) {
      updateContact(editingContactId, {
        name: name.trim(),
        tradeName: tradeName.trim() || undefined,
        type,
        document: document.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        pixKey: pixKey.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        creditLimit: limit,
        notes: notes.trim() || undefined,
      });
    } else {
      addContact({
        name: name.trim(),
        tradeName: tradeName.trim() || undefined,
        type,
        document: document.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        pixKey: pixKey.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        creditLimit: limit,
        notes: notes.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const handleConfirmDeleteContact = () => {
    if (!contactToDelete) return;
    deleteContact(contactToDelete.id);
    setContactToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Clientes & Fornecedores
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre contatos comerciais, CNPJs, dados para PIX e acompanhe o histórico de faturamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Subtype filter */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({contacts.length})
            </button>
            <button
              onClick={() => setFilterType('customer')}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                filterType === 'customer'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Clientes
            </button>
            <button
              onClick={() => setFilterType('supplier')}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                filterType === 'supplier'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fornecedores
            </button>
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por razão, CNPJ, e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl text-slate-900 dark:text-slate-100 placeholder:font-normal placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition-all ml-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => {
          const stats = contactStats.get(contact.id) || {
            totalInvoiced: 0,
            totalPaid: 0,
            pendingBalance: 0,
            count: 0,
          };

          const isCustomer = contact.type === 'customer' || contact.type === 'both';

          return (
            <div
              key={contact.id}
              className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                        contact.type === 'customer'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : contact.type === 'supplier'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      }`}
                    >
                      {contact.type === 'customer'
                        ? 'Cliente'
                        : contact.type === 'supplier'
                        ? 'Fornecedor'
                        : 'Colaborador'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {contact.name}
                    </h4>
                    {contact.tradeName && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{contact.tradeName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenModal(contact)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setContactToDelete(contact)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact Data Details */}
                <div className="space-y-1.5 mt-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono">{formatDocument(contact.document)}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{formatPhone(contact.phone)}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.pixKey && (
                    <div className="flex items-center gap-2 truncate text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">PIX: {contact.pixKey}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Snapshot Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-sans font-medium tracking-wider">
                    Total Movimentado
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(stats.totalInvoiced)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-sans font-medium tracking-wider">
                    {isCustomer ? 'Saldo a Receber' : 'Saldo a Pagar'}
                  </span>
                  <span
                    className={`font-bold ${
                      stats.pendingBalance > 0
                        ? isCustomer
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(stats.pendingBalance)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New / Edit Contact */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContactId ? 'Editar Contato' : 'Novo Cliente ou Fornecedor'}
        subtitle="Cadastro completo para emissão de notas e lançamentos"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveContact} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#161f30] rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setType('customer')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'customer'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setType('supplier')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'supplier'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fornecedor
            </button>
            <button
              type="button"
              onClick={() => setType('employee')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'employee'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Colaborador
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Razão Social / Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Empresa Exemplo Ltda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Nome Fantasia
              </label>
              <input
                type="text"
                placeholder="Ex: Exemplo Tech"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                CNPJ ou CPF *
              </label>
              <input
                type="text"
                required
                placeholder="00.000.000/0000-00"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Telefone
              </label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Chave PIX
              </label>
              <input
                type="text"
                placeholder="Chave PIX..."
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                E-mail Financeiro
              </label>
              <input
                type="email"
                placeholder="financeiro@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Limite de Crédito (R$)
              </label>
              <input
                type="text"
                placeholder="50000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Endereço Completo
            </label>
            <input
              type="text"
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
            >
              Salvar Contato
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Delete Contact */}
      <ConfirmationModal
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        onConfirm={handleConfirmDeleteContact}
        title="Remover Cadastro de Contato?"
        message={
          contactToDelete && (
            <div>
              <p>
                Deseja realmente remover o contato{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{contactToDelete.name}"
                </strong>{' '}
                ({formatDocument(contactToDelete.document)})?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Os lançamentos vinculados a este contato continuarão registrados no histórico financeiro.
              </p>
            </div>
          )
        }
        confirmLabel="Sim, Excluir Contato"
        cancelLabel="Voltar"
        variant="danger"
      />
    </div>
  );
};
