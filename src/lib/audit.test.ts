/**
 * Property-based tests for audit logging functions
 * 
 * **Feature: admin-enhancements**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import {
  logAction,
  filterAuditLogs,
  getAuditLogs,
  getUniqueCollections,
  AuditLog,
  AuditLogFilter,
  LogActionParams,
} from './audit';
import { saveCollection } from './db';

const DB_DIR = path.join(process.cwd(), 'data');
const TEST_BACKUP_DIR = path.join(process.cwd(), 'data-backup-audit-test');
const COLLECTION_NAME = 'logs';

// Backup and restore functions for test isolation
function backupData() {
  if (!fs.existsSync(TEST_BACKUP_DIR)) {
    fs.mkdirSync(TEST_BACKUP_DIR, { recursive: true });
  }
  const src = path.join(DB_DIR, `${COLLECTION_NAME}.json`);
  const dest = path.join(TEST_BACKUP_DIR, `${COLLECTION_NAME}.json`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

function restoreData() {
  const src = path.join(TEST_BACKUP_DIR, `${COLLECTION_NAME}.json`);
  const dest = path.join(DB_DIR, `${COLLECTION_NAME}.json`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
  if (fs.existsSync(TEST_BACKUP_DIR)) {
    fs.rmSync(TEST_BACKUP_DIR, { recursive: true });
  }
}

function clearTestData() {
  saveCollection(COLLECTION_NAME, []);
}

// ============ Generators ============

// Generate action types
const actionArb = fc.constantFrom('create', 'update', 'delete') as fc.Arbitrary<'create' | 'update' | 'delete'>;

// Generate collection names
const collectionArb = fc.constantFrom('leads', 'finance', 'booking-slots', 'clients', 'services');

// Generate record IDs
const recordIdArb = fc.integer({ min: 1000000000000, max: 9999999999999 });

// Generate user names
const userArb = fc.constantFrom('Admin', 'Manager', 'System');


// Generate simple record data
const recordDataArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  phone: fc.stringMatching(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/),
  status: fc.constantFrom('new', 'active', 'completed'),
});

// Generate timestamp strings
const timestampArb = fc.integer({ min: 0, max: 365 }).map(offset => {
  const date = new Date('2025-01-01');
  date.setDate(date.getDate() + offset);
  return date.toISOString();
});

// Generate date strings (YYYY-MM-DD)
const dateArb = fc.integer({ min: 0, max: 365 }).map(offset => {
  const date = new Date('2025-01-01');
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
});

// Generate an AuditLog entry
const auditLogArb: fc.Arbitrary<AuditLog> = fc.record({
  id: recordIdArb,
  timestamp: timestampArb,
  action: actionArb,
  collection: collectionArb,
  recordId: recordIdArb,
  user: userArb,
  details: fc.record({
    before: fc.option(recordDataArb, { nil: undefined }),
    after: fc.option(recordDataArb, { nil: undefined }),
    changes: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  }),
});

// Generate array of AuditLogs with mixed properties
const mixedLogsArb = fc.array(auditLogArb, { minLength: 1, maxLength: 50 }).map(logs => {
  // Ensure unique IDs
  return logs.map((log, index) => ({
    ...log,
    id: Date.now() + index,
    createdAt: log.timestamp, // Add createdAt for compatibility
  }));
});

// ============ Property Tests ============

describe('Audit Logging Functions', () => {
  beforeEach(() => {
    backupData();
    clearTestData();
  });

  afterEach(() => {
    restoreData();
  });

  /**
   * **Feature: admin-enhancements, Property 6: Audit log completeness**
   * 
   * *For any* CRUD operation (create, update, delete) on any collection,
   * the audit log should contain a record with: correct action type, collection name,
   * record ID, timestamp, and appropriate details (after for create, before/after for update,
   * before for delete).
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
   */
  describe('Property 6: Audit log completeness', () => {
    it('should create complete log entry for CREATE action with after details', async () => {
      await fc.assert(
        fc.asyncProperty(
          collectionArb,
          recordIdArb,
          userArb,
          recordDataArb,
          async (collection, recordId, user, afterData) => {
            clearTestData();

            const result = await logAction({
              action: 'create',
              collection,
              recordId,
              user,
              after: afterData,
            });

            // Log should be created
            expect(result).not.toBeNull();
            
            // Verify all required fields (Requirement 3.5)
            expect(result!.action).toBe('create');
            expect(result!.collection).toBe(collection);
            expect(result!.recordId).toBe(recordId);
            expect(result!.user).toBe(user);
            expect(result!.timestamp).toBeDefined();
            expect(new Date(result!.timestamp).getTime()).not.toBeNaN();
            
            // For create, details should contain after (Requirement 3.1)
            expect(result!.details.after).toEqual(afterData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create complete log entry for UPDATE action with before/after details', async () => {
      await fc.assert(
        fc.asyncProperty(
          collectionArb,
          recordIdArb,
          userArb,
          recordDataArb,
          recordDataArb,
          async (collection, recordId, user, beforeData, afterData) => {
            clearTestData();

            const result = await logAction({
              action: 'update',
              collection,
              recordId,
              user,
              before: beforeData,
              after: afterData,
            });

            // Log should be created
            expect(result).not.toBeNull();
            
            // Verify all required fields (Requirement 3.5)
            expect(result!.action).toBe('update');
            expect(result!.collection).toBe(collection);
            expect(result!.recordId).toBe(recordId);
            expect(result!.user).toBe(user);
            expect(result!.timestamp).toBeDefined();
            
            // For update, details should contain before and after (Requirement 3.2)
            expect(result!.details.before).toEqual(beforeData);
            expect(result!.details.after).toEqual(afterData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create complete log entry for DELETE action with before details', async () => {
      await fc.assert(
        fc.asyncProperty(
          collectionArb,
          recordIdArb,
          userArb,
          recordDataArb,
          async (collection, recordId, user, beforeData) => {
            clearTestData();

            const result = await logAction({
              action: 'delete',
              collection,
              recordId,
              user,
              before: beforeData,
            });

            // Log should be created
            expect(result).not.toBeNull();
            
            // Verify all required fields (Requirement 3.5)
            expect(result!.action).toBe('delete');
            expect(result!.collection).toBe(collection);
            expect(result!.recordId).toBe(recordId);
            expect(result!.user).toBe(user);
            expect(result!.timestamp).toBeDefined();
            
            // For delete, details should contain before (Requirement 3.3)
            expect(result!.details.before).toEqual(beforeData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist log entry to database', async () => {
      await fc.assert(
        fc.asyncProperty(
          actionArb,
          collectionArb,
          recordIdArb,
          async (action, collection, recordId) => {
            clearTestData();

            await logAction({
              action,
              collection,
              recordId,
              after: action === 'create' ? { test: 'data' } : undefined,
              before: action === 'delete' ? { test: 'data' } : undefined,
            });

            // Verify log is in database
            const logs = getAuditLogs();
            expect(logs.length).toBeGreaterThan(0);
            
            const savedLog = logs.find(l => l.recordId === recordId && l.collection === collection);
            expect(savedLog).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: admin-enhancements, Property 7: Audit log filtering**
   * 
   * *For any* set of audit logs and any filter criteria (action type, collection, date range),
   * the filtered result should contain only logs matching all specified criteria.
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Property 7: Audit log filtering', () => {
    it('should filter logs by action type correctly', () => {
      fc.assert(
        fc.property(mixedLogsArb, actionArb, (logs, targetAction) => {
          const filter: AuditLogFilter = { action: targetAction };
          const filtered = filterAuditLogs(logs, filter);

          // All filtered logs should have the target action
          expect(filtered.every(log => log.action === targetAction)).toBe(true);

          // Count should match expected
          const expectedCount = logs.filter(l => l.action === targetAction).length;
          expect(filtered.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it('should filter logs by collection correctly', () => {
      fc.assert(
        fc.property(mixedLogsArb, collectionArb, (logs, targetCollection) => {
          const filter: AuditLogFilter = { collection: targetCollection };
          const filtered = filterAuditLogs(logs, filter);

          // All filtered logs should have the target collection
          expect(filtered.every(log => log.collection === targetCollection)).toBe(true);

          // Count should match expected
          const expectedCount = logs.filter(l => l.collection === targetCollection).length;
          expect(filtered.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it('should filter logs by date range correctly', () => {
      fc.assert(
        fc.property(
          mixedLogsArb,
          dateArb,
          dateArb,
          (logs, date1, date2) => {
            // Ensure startDate <= endDate
            const [startDate, endDate] = [date1, date2].sort();
            
            const filter: AuditLogFilter = { startDate, endDate };
            const filtered = filterAuditLogs(logs, filter);

            // All filtered logs should be within the date range
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            filtered.forEach(log => {
              const logDate = new Date(log.timestamp || log.createdAt || '');
              expect(logDate >= start).toBe(true);
              expect(logDate <= end).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter logs by multiple criteria (action AND collection)', () => {
      fc.assert(
        fc.property(mixedLogsArb, actionArb, collectionArb, (logs, targetAction, targetCollection) => {
          const filter: AuditLogFilter = { 
            action: targetAction, 
            collection: targetCollection 
          };
          const filtered = filterAuditLogs(logs, filter);

          // All filtered logs should match BOTH criteria
          expect(filtered.every(log => 
            log.action === targetAction && log.collection === targetCollection
          )).toBe(true);

          // Count should match expected
          const expectedCount = logs.filter(l => 
            l.action === targetAction && l.collection === targetCollection
          ).length;
          expect(filtered.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it('should return all logs when no filter is applied', () => {
      fc.assert(
        fc.property(mixedLogsArb, (logs) => {
          const filter: AuditLogFilter = {};
          const filtered = filterAuditLogs(logs, filter);

          // Should return all logs
          expect(filtered.length).toBe(logs.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no logs match filter', () => {
      fc.assert(
        fc.property(mixedLogsArb, (logs) => {
          // Use a collection that doesn't exist in our test data
          const filter: AuditLogFilter = { collection: 'nonexistent-collection' };
          const filtered = filterAuditLogs(logs, filter);

          expect(filtered.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============ Additional Unit Tests ============

  describe('getUniqueCollections', () => {
    it('should return unique collection names sorted alphabetically', () => {
      fc.assert(
        fc.property(mixedLogsArb, (logs) => {
          const collections = getUniqueCollections(logs);

          // Should be sorted
          const sorted = [...collections].sort();
          expect(collections).toEqual(sorted);

          // Should be unique
          const unique = new Set(collections);
          expect(collections.length).toBe(unique.size);

          // All collections should exist in logs
          collections.forEach(col => {
            expect(logs.some(l => l.collection === col)).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('logAction edge cases', () => {
    it('should use default user when not provided', async () => {
      clearTestData();

      const result = await logAction({
        action: 'create',
        collection: 'leads',
        recordId: 123456789,
        after: { name: 'Test' },
      });

      expect(result!.user).toBe('Admin');
    });

    it('should generate changes summary for update action', async () => {
      clearTestData();

      const result = await logAction({
        action: 'update',
        collection: 'leads',
        recordId: 123456789,
        before: { name: 'Old Name', status: 'new' },
        after: { name: 'New Name', status: 'new' },
      });

      // Changes should list the changed field
      expect(result!.details.changes).toBe('name');
    });
  });
});
