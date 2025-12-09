import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import {
  calculateFunnel,
  calculateRevenue,
  calculatePeriodComparison,
  getPeriodRange,
  getPreviousPeriodRange,
  Lead,
  Transaction,
} from '@/lib/dashboard';

/**
 * Dashboard API endpoint
 * Aggregates data from leads and finance collections
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month') as 'week' | 'month' | 'quarter' | 'year';
    
    // Get collections
    const leads = getCollection('leads') as Lead[];
    const transactions = getCollection('finance') as Transaction[];
    
    // Calculate funnel from all leads (Requirement 5.1, 5.5)
    const funnel = calculateFunnel(leads);
    
    // Get current and previous period ranges
    const currentRange = getPeriodRange(period);
    const previousRange = getPreviousPeriodRange(period);
    
    // Calculate revenue for current period (Requirement 5.2, 5.5)
    const currentRevenue = calculateRevenue(transactions, currentRange);
    
    // Calculate revenue for previous period (Requirement 5.3)
    const previousRevenue = calculateRevenue(transactions, previousRange);
    
    // Calculate period comparison (Requirement 5.3)
    const revenueComparison = calculatePeriodComparison(
      currentRevenue.profit,
      previousRevenue.profit
    );
    
    // Build response matching DashboardData interface from design
    const dashboardData = {
      funnel,
      revenue: {
        current: currentRevenue.profit,
        previous: previousRevenue.profit,
        change: revenueComparison.change,
        // Additional details
        income: currentRevenue.income,
        expense: currentRevenue.expense,
      },
      period: {
        start: currentRange.start.toISOString(),
        end: currentRange.end.toISOString(),
        type: period,
      },
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
