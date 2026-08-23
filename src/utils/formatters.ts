import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TransactionStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Robustly parses Brazilian currency strings like "1.250,50", "1250,50", "1250.50"
 */
export function parseBRL(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  const clean = value.toString().trim();
  if (!clean) return 0;
  
  // If formatted as "1.234,56" (contains both dot as thousand and comma as decimal)
  if (clean.includes(',') && clean.includes('.')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // If has only comma "1234,56"
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.')) || 0;
  }
  return parseFloat(clean) || 0;
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0,0%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '--/--/----';
  // Strip ISO time if present
  const cleanDate = dateStr.split('T')[0];
  const [year, month, day] = cleanDate.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

export function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const [year, month, day] = cleanDate.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds months to a YYYY-MM-DD date while clamping the day to the last valid day of the month.
 * Prevents JavaScript Date rollover bugs (e.g. Jan 31 + 1 month -> Feb 28, not Mar 3).
 */
export function addMonthsClampDay(baseDateStr: string, monthsToAdd: number): string {
  const cleanDate = baseDateStr.split('T')[0];
  const [y, m, d] = cleanDate.split('-').map(Number);
  
  const targetTotalMonth = m - 1 + monthsToAdd;
  const targetYear = y + Math.floor(targetTotalMonth / 12);
  const normalizedMonth = ((targetTotalMonth % 12) + 12) % 12;
  
  // Last day of target month: day 0 of month+1
  const maxDaysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const clampedDay = Math.min(d, maxDaysInTargetMonth);
  
  const mStr = String(normalizedMonth + 1).padStart(2, '0');
  const dStr = String(clampedDay).padStart(2, '0');
  return `${targetYear}-${mStr}-${dStr}`;
}

export function formatDocument(doc: string | undefined | null): string {
  if (!doc) return '';
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    // CPF: 000.000.000-00
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (clean.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function getStatusBadge(status: TransactionStatus, dueDate: string): {
  label: string;
  className: string;
  bgClass: string;
  textClass: string;
} {
  const today = getTodayDateString();
  const cleanDue = (dueDate || '').split('T')[0];
  const isOverdue = status === 'pending' && cleanDue < today;

  if (status === 'paid') {
    return {
      label: 'Pago/Recebido',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-500',
    };
  }

  if (isOverdue) {
    return {
      label: 'Vencido',
      className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      bgClass: 'bg-rose-500',
      textClass: 'text-rose-500',
    };
  }

  if (status === 'pending') {
    if (cleanDue === today) {
      return {
        label: 'Vence Hoje',
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-500',
      };
    }
    return {
      label: 'Pendente',
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
      bgClass: 'bg-blue-500',
      textClass: 'text-blue-500',
    };
  }

  if (status === 'scheduled') {
    return {
      label: 'Agendado',
      className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
      bgClass: 'bg-purple-500',
      textClass: 'text-purple-500',
    };
  }

  return {
    label: 'Cancelado',
    className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    bgClass: 'bg-slate-400',
    textClass: 'text-slate-400',
  };
}
