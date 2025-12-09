import { NextResponse } from 'next/server';
import { getCollection, addToCollection } from '@/lib/db';
import { filterAuditLogs, getUniqueCollections, AuditLogFilter } from '@/lib/audit';

/**
 * GET /api/logs
 * Query params:
 *   - action: filter by action type (create/update/delete)
 *   - collection: filter by collection name
 *   - startDate: filter by start date (YYYY-MM-DD)
 *   - endDate: filter by end date (YYYY-MM-DD)
 *   - collections: if 'true', return unique collection names
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logs = getCollection('logs');
  
  // Return unique collections if requested
  if (searchParams.get('collections') === 'true') {
    return NextResponse.json(getUniqueCollections(logs));
  }
  
  // Build filter from query params
  const filter: AuditLogFilter = {};
  
  const action = searchParams.get('action');
  if (action && ['create', 'update', 'delete'].includes(action)) {
    filter.action = action as 'create' | 'update' | 'delete';
  }
  
  const collection = searchParams.get('collection');
  if (collection) {
    filter.collection = collection;
  }
  
  const startDate = searchParams.get('startDate');
  if (startDate) {
    filter.startDate = startDate;
  }
  
  const endDate = searchParams.get('endDate');
  if (endDate) {
    filter.endDate = endDate;
  }
  
  // Apply filters (Requirement 3.4)
  const filteredLogs = filterAuditLogs(logs, filter);
  
  return NextResponse.json(filteredLogs);
}

export async function POST(request: Request) {
    const body = await request.json();
    return NextResponse.json(addToCollection('logs', { ...body, date: new Date().toISOString() }));
}