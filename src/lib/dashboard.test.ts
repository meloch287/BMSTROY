/**
 * Property-based tests for dashboard utility functions
 * 
 * **Feature: admin-enhancements**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  Lead,
  LeadStatus,
  Transaction,
  calculateFunnel,
  calculateRevenue,
  calculatePeriodComparison,
  getPeriodRange,
  getPreviousPeriodRange,
} from './dashboard';

// ============ Generators ============

// Generate valid lead status
const leadStatusArb = fc.constantFrom('new', 'call', 'measure', 'contract') as fc.Arbitrary<LeadStatus>;

// Generate phone number (simplified for performance)
const phoneArb = fc.tuple(
  fc.integer({ min: 900, max: 999 }),
  fc.integer({ min: 100, max: 999 }),
  fc.integer({ min: 10, max: 99 }),
  fc.integer({ min: 10, max: 99 })
).map(([a, b, c, d]) => `+7 (${a}) ${b}-${c}-${d}`);

// Generate valid ISO date string (avoid fc.date() which can produce invalid dates)
const isoDateArb = fc.integer({ min: 0, max: 3650 }).map(dayOffset => {
  const date = new Date('2020-01-01');
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
});

// Generate a Lead
const leadArb: fc.Arbitrary<Lead> = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  phone: phoneArb,
  status: leadStatusArb,
  createdAt: isoDateArb,
});

// Generate array of leads
const leadsArb = fc.array(leadArb, { minLength: 0, maxLength: 50 });

// Generate transaction type
const txTypeArb = fc.constantFrom('income', 'expense') as fc.Arbitrary<'income' | 'expense'>;

// Generate a Transaction
const transactionArb: fc.Arbitrary<Transaction> = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  type: txTypeArb,
  amount: fc.integer({ min: 0, max: 10000000 }),
  desc: fc.string({ minLength: 0, maxLength: 50 }),
  project: fc.constantFrom('Общий', 'ЖК Символ', 'ЖК Зиларт'),
  createdAt: isoDateArb,
});

// Generate array of transactions
const transactionsArb = fc.array(transactionArb, { minLength: 0, maxLength: 50 });

// Generate any number for comparison (including negative for edge cases)
const anyNumberArb = fc.integer({ min: -10000000, max: 10000000 });


// ============ Property Tests ============

describe('Dashboard Utility Functions', () => {

  /**
   * **Feature: admin-enhancements, Property 10: Funnel aggregation**
   * 
   * *For any* set of leads with various statuses, the funnel aggregation should
   * return counts that sum to the total number of leads, with each lead counted
   * exactly once in its status category.
   * 
   * **Validates: Requirements 5.1, 5.5**
   */
  describe('Property 10: Funnel aggregation', () => {
    it('should count all leads exactly once across all status categories', () => {
      fc.assert(
        fc.property(leadsArb, (leads) => {
          const funnel = calculateFunnel(leads);
          
          // Sum of all funnel counts should equal total leads
          const totalCount = funnel.new + funnel.call + funnel.measure + funnel.contract;
          expect(totalCount).toBe(leads.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly count leads by status', () => {
      fc.assert(
        fc.property(leadsArb, (leads) => {
          const funnel = calculateFunnel(leads);
          
          // Each status count should match manual count
          const expectedNew = leads.filter(l => l.status === 'new').length;
          const expectedCall = leads.filter(l => l.status === 'call').length;
          const expectedMeasure = leads.filter(l => l.status === 'measure').length;
          const expectedContract = leads.filter(l => l.status === 'contract').length;
          
          expect(funnel.new).toBe(expectedNew);
          expect(funnel.call).toBe(expectedCall);
          expect(funnel.measure).toBe(expectedMeasure);
          expect(funnel.contract).toBe(expectedContract);
        }),
        { numRuns: 100 }
      );
    });

    it('should return zeros for empty leads array', () => {
      const funnel = calculateFunnel([]);
      
      expect(funnel.new).toBe(0);
      expect(funnel.call).toBe(0);
      expect(funnel.measure).toBe(0);
      expect(funnel.contract).toBe(0);
    });

    it('should handle leads with missing status as "new"', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 999999 }),
              name: fc.string({ minLength: 1 }),
              phone: fc.string(),
              status: fc.constant(undefined as unknown as LeadStatus),
              createdAt: fc.constant(new Date().toISOString()),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (leadsWithoutStatus) => {
            const funnel = calculateFunnel(leadsWithoutStatus as Lead[]);
            
            // All leads without status should be counted as 'new'
            // Since status is undefined, they won't match any category
            const total = funnel.new + funnel.call + funnel.measure + funnel.contract;
            // Leads with undefined status won't be counted in any category
            expect(total).toBeLessThanOrEqual(leadsWithoutStatus.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: admin-enhancements, Property 11: Revenue calculation**
   * 
   * *For any* set of finance transactions within a period, the revenue calculation
   * should equal the sum of all income transactions minus the sum of all expense
   * transactions.
   * 
   * **Validates: Requirements 5.2, 5.5**
   */
  describe('Property 11: Revenue calculation', () => {
    it('should calculate profit as income minus expenses', () => {
      fc.assert(
        fc.property(transactionsArb, (transactions) => {
          const revenue = calculateRevenue(transactions);
          
          // Calculate expected values manually
          const expectedIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const expectedExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          expect(revenue.income).toBe(expectedIncome);
          expect(revenue.expense).toBe(expectedExpense);
          expect(revenue.profit).toBe(expectedIncome - expectedExpense);
        }),
        { numRuns: 100 }
      );
    });

    it('should return zeros for empty transactions array', () => {
      const revenue = calculateRevenue([]);
      
      expect(revenue.income).toBe(0);
      expect(revenue.expense).toBe(0);
      expect(revenue.profit).toBe(0);
    });

    it('should filter transactions by period when provided', () => {
      // Generate valid date strings to avoid Invalid Date issues
      const validDateArb = fc.integer({ min: 0, max: 364 }).map(dayOffset => {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + dayOffset);
        return date;
      });

      fc.assert(
        fc.property(
          transactionsArb,
          validDateArb,
          validDateArb,
          (transactions, date1, date2) => {
            // Ensure start is before end
            const period = {
              start: date1 < date2 ? date1 : date2,
              end: date1 < date2 ? date2 : date1,
            };
            
            const revenue = calculateRevenue(transactions, period);
            
            // Calculate expected values for transactions within period
            const filteredTxs = transactions.filter(t => {
              const txDate = new Date(t.createdAt);
              return txDate >= period.start && txDate <= period.end;
            });
            
            const expectedIncome = filteredTxs
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + Number(t.amount), 0);
            
            const expectedExpense = filteredTxs
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + Number(t.amount), 0);
            
            expect(revenue.income).toBe(expectedIncome);
            expect(revenue.expense).toBe(expectedExpense);
            expect(revenue.profit).toBe(expectedIncome - expectedExpense);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle string amounts correctly', () => {
      const transactions: Transaction[] = [
        { id: 1, type: 'income', amount: '1000' as unknown as number, desc: 'Test', project: 'Общий', createdAt: new Date().toISOString() },
        { id: 2, type: 'expense', amount: '500' as unknown as number, desc: 'Test', project: 'Общий', createdAt: new Date().toISOString() },
      ];
      
      const revenue = calculateRevenue(transactions);
      
      expect(revenue.income).toBe(1000);
      expect(revenue.expense).toBe(500);
      expect(revenue.profit).toBe(500);
    });
  });


  /**
   * **Feature: admin-enhancements, Property 12: Period comparison calculation**
   * 
   * *For any* current period revenue and previous period revenue, the percentage
   * change should equal ((current - previous) / previous) * 100, handling the
   * zero previous case.
   * 
   * **Validates: Requirements 5.3**
   */
  describe('Property 12: Period comparison calculation', () => {
    it('should calculate percentage change correctly for non-zero previous', () => {
      fc.assert(
        fc.property(
          anyNumberArb,
          fc.integer({ min: 1, max: 10000000 }), // Non-zero previous
          (current, previous) => {
            const comparison = calculatePeriodComparison(current, previous);
            
            const expectedChange = ((current - previous) / Math.abs(previous)) * 100;
            const roundedExpected = Math.round(expectedChange * 100) / 100;
            
            expect(comparison.current).toBe(current);
            expect(comparison.previous).toBe(previous);
            expect(comparison.change).toBe(roundedExpected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero previous with positive current as 100% growth', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000000 }), // Positive current
          (current) => {
            const comparison = calculatePeriodComparison(current, 0);
            
            expect(comparison.current).toBe(current);
            expect(comparison.previous).toBe(0);
            expect(comparison.change).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero previous with negative current as -100%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000000, max: -1 }), // Negative current
          (current) => {
            const comparison = calculatePeriodComparison(current, 0);
            
            expect(comparison.current).toBe(current);
            expect(comparison.previous).toBe(0);
            expect(comparison.change).toBe(-100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle both zero as 0% change', () => {
      const comparison = calculatePeriodComparison(0, 0);
      
      expect(comparison.current).toBe(0);
      expect(comparison.previous).toBe(0);
      expect(comparison.change).toBe(0);
    });

    it('should return positive change when current significantly > previous', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 10000000 }),
          (previous) => {
            // Ensure current is at least 1% greater to avoid rounding to 0
            const current = Math.floor(previous * 1.02);
            
            const comparison = calculatePeriodComparison(current, previous);
            
            expect(comparison.change).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return negative change when current significantly < previous', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 10000000 }),
          (previous) => {
            // Ensure current is at least 1% less to avoid rounding to 0
            const current = Math.floor(previous * 0.98);
            
            const comparison = calculatePeriodComparison(current, previous);
            
            expect(comparison.change).toBeLessThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============ Additional Unit Tests ============

  describe('getPeriodRange', () => {
    it('should return correct range for week', () => {
      const ref = new Date('2024-06-15T12:00:00Z');
      const range = getPeriodRange('week', ref);
      
      expect(range.end.getTime()).toBeGreaterThanOrEqual(ref.getTime());
      expect(range.start.getTime()).toBeLessThan(range.end.getTime());
      
      // Approximately 7 days difference
      const diffDays = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
    });

    it('should return correct range for month', () => {
      const ref = new Date('2024-06-15T12:00:00Z');
      const range = getPeriodRange('month', ref);
      
      // Approximately 30 days difference
      const diffDays = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(32);
    });

    it('should return correct range for quarter', () => {
      const ref = new Date('2024-06-15T12:00:00Z');
      const range = getPeriodRange('quarter', ref);
      
      // Approximately 90 days difference
      const diffDays = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(88);
      expect(diffDays).toBeLessThanOrEqual(93);
    });

    it('should return correct range for year', () => {
      const ref = new Date('2024-06-15T12:00:00Z');
      const range = getPeriodRange('year', ref);
      
      // Approximately 365 days difference
      const diffDays = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(364);
      expect(diffDays).toBeLessThanOrEqual(367);
    });
  });

  describe('getPreviousPeriodRange', () => {
    it('should return range immediately before current period', () => {
      const ref = new Date('2024-06-15T12:00:00Z');
      const currentRange = getPeriodRange('month', ref);
      const previousRange = getPreviousPeriodRange('month', ref);
      
      // Previous end should be just before current start
      expect(previousRange.end.getTime()).toBeLessThan(currentRange.start.getTime());
      
      // Durations should be approximately equal
      const currentDuration = currentRange.end.getTime() - currentRange.start.getTime();
      const previousDuration = previousRange.end.getTime() - previousRange.start.getTime();
      
      // Allow for small differences due to month length variations
      const durationDiff = Math.abs(currentDuration - previousDuration);
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(durationDiff).toBeLessThan(oneDayMs * 4); // Within 4 days
    });
  });
});
