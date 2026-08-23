import { BankAccount, CashFlowPoint, FinancialSummary, Transaction } from '../types';
import { getTodayDateString } from './formatters';

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateCashFlowAndSummary(
  transactions: Transaction[],
  accounts: BankAccount[],
  periodDays = 30
): FinancialSummary {
  const today = getTodayDateString();
  const currentMonthPrefix = today.substring(0, 7); // e.g. "2026-08"

  // 1. Total liquid balance (checking, savings, investment, digital, cash)
  let totalBalance = 0;
  accounts.forEach((acc) => {
    if (acc.type !== 'credit_card') {
      totalBalance += acc.currentBalance;
    }
  });
  totalBalance = round2(totalBalance);

  // 2. Month realization (Paid/Received in current month)
  let monthIncome = 0;
  let monthExpense = 0;
  let expectedIncome = 0;
  let expectedExpense = 0;
  let overduePayables = 0;
  let overduePayablesCount = 0;
  let overdueReceivables = 0;
  let overdueReceivablesCount = 0;
  let todayPayables = 0;
  let todayReceivables = 0;

  transactions.forEach((txn) => {
    if (txn.status === 'cancelled' || txn.type === 'transfer') return;

    const amount = Number(txn.amount) || 0;
    const cleanDue = (txn.dueDate || '').split('T')[0];
    const isOverdue = txn.status === 'pending' && cleanDue < today;
    const isToday = cleanDue === today && txn.status === 'pending';

    if (txn.type === 'expense') {
      if (isOverdue) {
        overduePayables += amount;
        overduePayablesCount++;
      }
      if (isToday) {
        todayPayables += amount;
      }
    } else if (txn.type === 'income') {
      if (isOverdue) {
        overdueReceivables += amount;
        overdueReceivablesCount++;
      }
      if (isToday) {
        todayReceivables += amount;
      }
    }

    // Month stats (Paid in current month or Scheduled in current month)
    const effectiveDate = (txn.paymentDate || cleanDue).split('T')[0];
    if (effectiveDate.startsWith(currentMonthPrefix)) {
      if (txn.status === 'paid') {
        if (txn.type === 'income') monthIncome += amount;
        if (txn.type === 'expense') monthExpense += amount;
      } else if (txn.status === 'pending') {
        if (txn.type === 'income') expectedIncome += amount;
        if (txn.type === 'expense') expectedExpense += amount;
      }
    }
  });

  monthIncome = round2(monthIncome);
  monthExpense = round2(monthExpense);
  expectedIncome = round2(expectedIncome);
  expectedExpense = round2(expectedExpense);
  overduePayables = round2(overduePayables);
  overdueReceivables = round2(overdueReceivables);
  todayPayables = round2(todayPayables);
  todayReceivables = round2(todayReceivables);
  const monthNet = round2(monthIncome - monthExpense);

  // 3. Generate 30-Day Daily Cash Flow (14 days past, today, 15 days future)
  const cashFlow30Days: CashFlowPoint[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14); // start 14 days ago

  const dailyMap = new Map<string, { income: number; expense: number }>();
  const dateList: string[] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap.set(dateStr, { income: 0, expense: 0 });
    dateList.push(dateStr);
  }

  // Populate daily inflows and outflows (excluding transfers)
  transactions.forEach((txn) => {
    if (txn.status === 'cancelled' || txn.type === 'transfer') return;
    const amount = Number(txn.amount) || 0;
    
    // For past dates: only PAID transactions matter
    // For future dates: PENDING and PAID transactions matter
    const targetDate = (txn.status === 'paid' && txn.paymentDate ? txn.paymentDate : txn.dueDate).split('T')[0];
    const entry = dailyMap.get(targetDate);
    
    if (entry) {
      if (targetDate <= today && txn.status !== 'paid') {
        // Pending past transactions do not affect historical bank balance directly
        return;
      }
      if (txn.type === 'income') {
        entry.income += amount;
      } else if (txn.type === 'expense') {
        entry.expense += amount;
      }
    }
  });

  // Calculate past realized sum up to today to establish the accurate starting curve
  let pastPaidSum = 0;
  dateList.forEach((dStr) => {
    if (dStr <= today) {
      const entry = dailyMap.get(dStr)!;
      pastPaidSum += entry.income - entry.expense;
    }
  });

  let runningSimulatedBalance = round2(totalBalance - pastPaidSum);

  dateList.forEach((dateStr) => {
    const values = dailyMap.get(dateStr)!;
    const isProjected = dateStr > today;
    const income = round2(values.income);
    const expense = round2(values.expense);
    const net = round2(income - expense);

    runningSimulatedBalance = round2(runningSimulatedBalance + net);

    const [, month, day] = dateStr.split('-');
    const dayLabel = `${day}/${month}`;

    cashFlow30Days.push({
      date: dateStr,
      dayLabel,
      income,
      expense,
      net,
      accumulatedBalance: runningSimulatedBalance,
      isProjected,
    });
  });

  return {
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet,
    expectedIncome,
    expectedExpense,
    overduePayables,
    overduePayablesCount,
    overdueReceivables,
    overdueReceivablesCount,
    todayPayables,
    todayReceivables,
    cashFlow30Days,
  };
}
