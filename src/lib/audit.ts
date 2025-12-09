import { getCollection, addToCollection } from './db';

/**
 * Audit log entry structure
 */
export interface AuditLog {
  id: number;
  timestamp: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  recordId: number;
  user: string;
  details: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    changes?: string;
  };
  createdAt?: string; // Added by db layer
}

/**
 * Parameters for logging an action
 */
export interface LogActionParams {
  action: 'create' | 'update' | 'delete';
  collection: string;
  recordId: number;
  user?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

/**
 * Log an action to the audit log
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */
export async function logAction(params: LogActionParams): Promise<AuditLog | null> {
  try {
    const { action, collection, recordId, user = 'Admin', before, after } = params;

    const details: AuditLog['details'] = {};

    // Build details based on action type (Requirements 3.1, 3.2, 3.3)
    if (action === 'create' && after) {
      details.after = after;
    } else if (action === 'update') {
      if (before) details.before = before;
      if (after) details.after = after;
      // Generate changes summary
      if (before && after) {
        const changedFields = Object.keys(after).filter(
          key => JSON.stringify(before[key]) !== JSON.stringify(after[key])
        );
        if (changedFields.length > 0) {
          details.changes = changedFields.join(', ');
        }
      }
    } else if (action === 'delete' && before) {
      details.before = before;
    }

    // Create log entry with timestamp (Requirement 3.5)
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      collection,
      recordId,
      user,
      details,
      // Legacy fields for backward compatibility with existing logs page
      date: new Date().toISOString(),
    };

    const savedLog = addToCollection('logs', logEntry);
    return savedLog as AuditLog;
  } catch (error) {
    // Don't block main operation on audit failure
    console.error('Failed to write audit log:', error);
    return null;
  }
}


/**
 * Filter criteria for audit logs
 */
export interface AuditLogFilter {
  action?: 'create' | 'update' | 'delete';
  collection?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get all audit logs
 */
export function getAuditLogs(): AuditLog[] {
  return getCollection('logs') as AuditLog[];
}

/**
 * Filter audit logs by criteria
 * Requirement: 3.4
 */
export function filterAuditLogs(logs: AuditLog[], filter: AuditLogFilter): AuditLog[] {
  return logs.filter(log => {
    // Filter by action type
    if (filter.action && log.action !== filter.action) {
      return false;
    }

    // Filter by collection
    if (filter.collection && log.collection !== filter.collection) {
      return false;
    }

    // Filter by date range
    const logDate = new Date(log.timestamp || log.createdAt);
    
    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (logDate < startDate) {
        return false;
      }
    }

    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (logDate > endDate) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get unique collections from logs
 */
export function getUniqueCollections(logs: AuditLog[]): string[] {
  const collections = new Set<string>();
  logs.forEach(log => {
    if (log.collection) {
      collections.add(log.collection);
    }
  });
  return Array.from(collections).sort();
}
