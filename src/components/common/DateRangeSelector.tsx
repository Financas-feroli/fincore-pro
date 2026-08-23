import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const DateRangeSelector: React.FC = () => {
  const { dateRange, setDateRange } = useFinance();
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    {
      label: 'Hoje',
      getRange: () => {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today, label: 'Hoje' };
      },
    },
    {
      label: 'Últimos 7 dias',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          label: 'Últimos 7 dias',
        };
      },
    },
    {
      label: 'Este Mês',
      getRange: () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(y, today.getMonth() + 1, 0).getDate();
        return {
          start: `${y}-${m}-01`,
          end: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
          label: 'Este Mês',
        };
      },
    },
    {
      label: 'Mês Passado',
      getRange: () => {
        const today = new Date();
        const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const y = prevMonth.getFullYear();
        const m = String(prevMonth.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(y, prevMonth.getMonth() + 1, 0).getDate();
        return {
          start: `${y}-${m}-01`,
          end: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
          label: 'Mês Passado',
        };
      },
    },
    {
      label: 'Próximos 30 dias',
      getRange: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 30);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          label: 'Próximos 30 dias',
        };
      },
    },
    {
      label: 'Ano Atual (2026)',
      getRange: () => {
        const y = new Date().getFullYear();
        return {
          start: `${y}-01-01`,
          end: `${y}-12-31`,
          label: `Ano ${y}`,
        };
      },
    },
    {
      label: 'Tudo (Sem filtro)',
      getRange: () => {
        return {
          start: '2020-01-01',
          end: '2030-12-31',
          label: 'Todo o Período',
        };
      },
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
        <span>{dateRange.label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 animate-fade-in">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Período de Análise
            </div>
            {presets.map((preset) => {
              const isSelected = dateRange.label === preset.label;
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    setDateRange(preset.getRange());
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
