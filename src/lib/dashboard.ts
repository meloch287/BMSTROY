/**
 * Dashboard utility functions for analytics calculations
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

// Lead status types matching the CRM columns
export type LeadStatus = 'new' | 'call' | 'measure' | 'contract';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number | string;
  desc: string;
  project: string;
  createdAt: string;
}

export interface FunnelData {
  new: number;
  call: number;
  measure: number;
  contract: number;
}

export interface RevenueData {
  income: number;
  expense: number;
  profit: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number; // percentage
}

/**
 * Calculate conversion funnel from leads
 * Property 10: Funnel aggregation - counts should sum to total leads
 * Validates: Requirements 5.1, 5.5
 */
export function calculateFunnel(leads: Lead[]): FunnelData {
  const funnel: FunnelData = {
    new: 0,
    call: 0,
    measure: 0,
    contract: 0,
  };

  for (const lead of leads) {
    const status = lead.status || 'new';
    if (status in funnel) {
      funnel[status as LeadStatus]++;
    }
  }

  return funnel;
}


/**
 * Calculate revenue from transactions within a period
 * Property 11: Revenue calculation - income minus expenses
 * Validates: Requirements 5.2, 5.5
 */
export function calculateRevenue(
  transactions: Transaction[],
  period?: { start: Date; end: Date }
): RevenueData {
  let filteredTxs = transactions;

  if (period) {
    filteredTxs = transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return txDate >= period.start && txDate <= period.end;
    });
  }

  let income = 0;
  let expense = 0;

  for (const tx of filteredTxs) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      income += amount;
    } else if (tx.type === 'expense') {
      expense += amount;
    }
  }

  return {
    income,
    expense,
    profit: income - expense,
  };
}

/**
 * Calculate percentage change between two periods
 * Property 12: Period comparison calculation
 * Validates: Requirements 5.3
 */
export function calculatePeriodComparison(
  current: number,
  previous: number
): PeriodComparison {
  let change = 0;

  if (previous !== 0) {
    change = ((current - previous) / Math.abs(previous)) * 100;
  } else if (current > 0) {
    // If previous is 0 and current is positive, it's 100% growth
    change = 100;
  } else if (current < 0) {
    // If previous is 0 and current is negative, it's -100%
    change = -100;
  }
  // If both are 0, change remains 0

  return {
    current,
    previous,
    change: Math.round(change * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Get date range for a specific period
 */
export function getPeriodRange(
  period: 'week' | 'month' | 'quarter' | 'year',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return { start, end };
}

/**
 * Get previous period range for comparison
 */
export function getPreviousPeriodRange(
  period: 'week' | 'month' | 'quarter' | 'year',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const currentRange = getPeriodRange(period, referenceDate);
  const duration = currentRange.end.getTime() - currentRange.start.getTime();

  const end = new Date(currentRange.start.getTime() - 1);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end.getTime() - duration);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}
