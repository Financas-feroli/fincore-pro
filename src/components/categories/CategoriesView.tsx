import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Crown,
  Zap,
  Lock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { getPlanFeatures } from '../../utils/planPermissions';
import { PricingModal } from '../common/PricingModal';
import { formatCurrency } from '../../utils/formatters';
import { Category, CostCenter } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const CategoriesView: React.FC = () => {
  const {
    categories,
    costCenters,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
  } = useFinance();

  const { organization, isDemoMode } = useAuth();
  const isTrial = isDemoMode || organization?.subscriptionStatus === 'trialing';
  const planFeatures = getPlanFeatures(organization?.plan || 'pro', isTrial, organization?.trialEndsAt);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'costCenters'>('categories');

  // Auto scroll to top on tab change
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [activeTab]);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<Category['type']>('expense');
  const [catGroup, setCatGroup] = useState('Despesas Administrativas');
  const [catColor, setCatColor] = useState('#EF4444');
  const [catBudget, setCatBudget] = useState('');

  // Cost Center Modal State
  const [isCCModalOpen, setIsCCModalOpen] = useState(false);
  const [editingCCId, setEditingCCId] = useState<string | null>(null);
  const [ccCode, setCcCode] = useState('100');
  const [ccName, setCcName] = useState('');
  const [ccDesc, setCcDesc] = useState('');
  const [ccBudget, setCcBudget] = useState('');

  // Delete Confirmation States
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [ccToDelete, setCcToDelete] = useState<CostCenter | null>(null);

  const currentMonthStr = new Date().toISOString().substring(0, 7);

  // Calculate monthly spent per category
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((txn) => {
      if (txn.status === 'paid' && txn.dueDate.startsWith(currentMonthStr)) {
        map.set(txn.categoryId, (map.get(txn.categoryId) || 0) + txn.amount);
      }
    });
    return map;
  }, [transactions, currentMonthStr]);

  // Calculate monthly spent per cost center
  const costCenterSpentMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((txn) => {
      if (txn.costCenterId && txn.status === 'paid' && txn.dueDate.startsWith(currentMonthStr)) {
        map.set(txn.costCenterId, (map.get(txn.costCenterId) || 0) + txn.amount);
      }
    });
    return map;
  }, [transactions, currentMonthStr]);

  // Group Categories
  const groupedCategories = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    categories.forEach((cat) => {
      const g = cat.group || (cat.type === 'income' ? 'Outras Receitas' : 'Outras Despesas');
      if (!groups[g]) groups[g] = [];
      groups[g].push(cat);
    });
    return groups;
  }, [categories]);

  // Handle Category Modal
  const handleOpenCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCatId(cat.id);
      setCatName(cat.name);
      setCatType(cat.type);
      setCatGroup(cat.group || 'Despesas Administrativas');
      setCatColor(cat.color);
      setCatBudget(cat.budgetMonthly?.toString() || '');
    } else {
      setEditingCatId(null);
      setCatName('');
      setCatType('expense');
      setCatGroup('Despesas Administrativas');
      setCatColor('#EF4444');
      setCatBudget('5000');
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const budget = parseFloat(catBudget.replace(',', '.')) || undefined;

    if (editingCatId) {
      updateCategory(editingCatId, {
        name: catName.trim(),
        type: catType,
        group: catGroup,
        color: catColor,
        budgetMonthly: budget,
      });
    } else {
      addCategory({
        name: catName.trim(),
        type: catType,
        group: catGroup,
        color: catColor,
        budgetMonthly: budget,
      });
    }
    setIsCatModalOpen(false);
  };

  // Handle Cost Center Modal
  const handleOpenCCModal = (cc?: CostCenter) => {
    if (cc) {
      setEditingCCId(cc.id);
      setCcCode(cc.code);
      setCcName(cc.name);
      setCcDesc(cc.description || '');
      setCcBudget(cc.budgetMonthly?.toString() || '');
    } else {
      setEditingCCId(null);
      setCcCode(`${(costCenters.length + 1) * 100}`);
      setCcName('');
      setCcDesc('');
      setCcBudget('30000');
    }
    setIsCCModalOpen(true);
  };

  const handleSaveCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccName.trim()) return;

    const budget = parseFloat(ccBudget.replace(',', '.')) || undefined;

    if (editingCCId) {
      updateCostCenter(editingCCId, {
        code: ccCode.trim(),
        name: ccName.trim(),
        description: ccDesc.trim() || undefined,
        budgetMonthly: budget,
        isActive: true,
      });
    } else {
      addCostCenter({
        code: ccCode.trim(),
        name: ccName.trim(),
        description: ccDesc.trim() || undefined,
        budgetMonthly: budget,
        isActive: true,
      });
    }
    setIsCCModalOpen(false);
  };

  const handleConfirmDeleteCat = () => {
    if (!catToDelete) return;
    deleteCategory(catToDelete.id);
    setCatToDelete(null);
  };

  const handleConfirmDeleteCC = () => {
    if (!ccToDelete) return;
    deleteCostCenter(ccToDelete.id);
    setCcToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-500" />
            Categorias & Centros de Custo
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Plano de contas gerencial, estrutura contábil para DRE e rateio departamental orçado.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Categorias & DRE ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('costCenters')}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === 'costCenters'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Centros de Custo ({costCenters.length})</span>
            </button>
          </div>

          <button
            onClick={() =>
              !planFeatures.hasCostCenters && activeTab === 'costCenters' ? setIsPricingModalOpen(true) : activeTab === 'categories' ? handleOpenCatModal() : handleOpenCCModal()
            }
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition-all ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'categories' ? 'Nova Categoria' : 'Novo Centro de Custo'}</span>
          </button>
        </div>
      </div>

      {/* PLANO DE CONTAS TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {Object.entries(groupedCategories).map(([groupName, catList]) => (
            <div
              key={groupName}
              className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {groupName}
                </h4>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  {catList.length} subcategorias
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {catList.map((cat) => {
                  const spentThisMonth = categorySpentMap.get(cat.id) || 0;
                  const budget = cat.budgetMonthly || 0;
                  const percentUsed = budget > 0 ? (spentThisMonth / budget) * 100 : 0;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {cat.name}
                          </h5>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenCatModal(cat)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {!cat.isSystem && (
                            <button
                              onClick={() => setCatToDelete(cat)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Realized vs Budget */}
                      <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500">
                          Mês: <strong>{formatCurrency(spentThisMonth)}</strong>
                        </span>
                        {budget > 0 && (
                          <span
                            className={`font-semibold ${
                              percentUsed > 100 ? 'text-rose-500' : 'text-slate-400'
                            }`}
                          >
                            Meta: {formatCurrency(budget)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CENTROS DE CUSTO TAB */}
      {activeTab === 'costCenters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {costCenters.map((cc) => {
            const spent = costCenterSpentMap.get(cc.id) || 0;
            const budget = cc.budgetMonthly || 50000;
            const percent = Math.min(100, (spent / budget) * 100);

            return (
              <div
                key={cc.id}
                className="p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold font-mono">
                        {cc.code}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cc.name}
                        </h4>
                        {cc.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{cc.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenCCModal(cc)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCcToDelete(cc)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Budget Utilization Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400">
                        Consumo no Mês: <strong>{formatCurrency(spent)}</strong>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Orçamento: {formatCurrency(budget)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{percent.toFixed(1)}% utilizado</span>
                      <span>Disponível: {formatCurrency(Math.max(0, budget - spent))}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Category */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCatId ? 'Editar Categoria' : 'Nova Categoria Contábil'}
        subtitle="Estruture seu plano de contas para relatórios e DRE precisos"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Assinaturas de Softwares SaaS"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tipo
              </label>
              <select
                value={catType}
                onChange={(e) => setCatType(e.target.value as Category['type'])}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="expense">Despesa (-)</option>
                <option value="income">Receita (+)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Grupo no DRE
              </label>
              <select
                value={catGroup}
                onChange={(e) => setCatGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                {catType === 'income' ? (
                  <>
                    <option value="Receita Operacional Bruta">Receita Operacional Bruta</option>
                    <option value="Receitas Financeiras">Receitas Financeiras</option>
                    <option value="Outras Receitas">Outras Receitas</option>
                  </>
                ) : (
                  <>
                    <option value="Deduções da Receita Bruta">Deduções & Impostos sobre Venda</option>
                    <option value="Custos dos Serviços Prestados">Custos Variáveis / CPV</option>
                    <option value="Despesas com Pessoal">Despesas com Pessoal & Folha</option>
                    <option value="Despesas Administrativas">Despesas Administrativas</option>
                    <option value="Despesas Comerciais">Despesas Comerciais & Marketing</option>
                    <option value="Despesas Financeiras">Despesas Financeiras & Tarifas</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Meta de Orçamento Mensal (R$)
            </label>
            <input
              type="text"
              placeholder="5000"
              value={catBudget}
              onChange={(e) => setCatBudget(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
              {['#10B981', '#059669', '#3B82F6', '#6366F1', '#8B5CF6', '#F43F5E', '#EF4444', '#F97316', '#EAB308', '#64748B'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      catColor === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cost Center */}
      <Modal
        isOpen={isCCModalOpen}
        onClose={() => setIsCCModalOpen(false)}
        title={editingCCId ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
        subtitle="Agrupe lançamentos por departamento ou filial"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCostCenter} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Código
              </label>
              <input
                type="text"
                required
                placeholder="100"
                value={ccCode}
                onChange={(e) => setCcCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Nome do Centro de Custo
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Engenharia & Produto"
                value={ccName}
                onChange={(e) => setCcName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Descrição / Finalidade
            </label>
            <input
              type="text"
              placeholder="Ex: Despesas com servidores, ferramentas e equipe"
              value={ccDesc}
              onChange={(e) => setCcDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Orçamento Mensal Teto (R$)
            </label>
            <input
              type="text"
              placeholder="50000"
              value={ccBudget}
              onChange={(e) => setCcBudget(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/70 rounded-xl font-mono placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCCModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
            >
              Salvar Centro de Custo
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Delete Category */}
      <ConfirmationModal
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={handleConfirmDeleteCat}
        title="Excluir Categoria do Plano de Contas?"
        message={
          catToDelete && (
            <div>
              <p>
                Deseja realmente remover a categoria{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{catToDelete.name}"
                </strong>
                ?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Os lançamentos contábeis já registrados permanecerão com o histórico intacto.
              </p>
            </div>
          )
        }
        confirmLabel="Sim, Excluir Categoria"
        cancelLabel="Voltar"
        variant="danger"
      />

      {/* Confirmation Modal: Delete Cost Center */}
      <ConfirmationModal
        isOpen={!!ccToDelete}
        onClose={() => setCcToDelete(null)}
        onConfirm={handleConfirmDeleteCC}
        title="Excluir Centro de Custo?"
        message={
          ccToDelete && (
            <div>
              <p>
                Deseja realmente remover o centro de custo{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{ccToDelete.code} - {ccToDelete.name}"
                </strong>
                ?
              </p>
            </div>
          )
        }
        confirmLabel="Sim, Excluir Centro de Custo"
        cancelLabel="Voltar"
        variant="danger"
      />
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
    </div>
  );
};
