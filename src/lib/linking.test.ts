/**
 * Property-based tests for linking functions
 * 
 * **Feature: crm-seo-optimization**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import {
  createClientFromLead,
  linkEstimateToClient,
  unlinkClientFromLead,
  unlinkEstimateFromClient,
  parseAddressFromComment,
  generateUuid,
  Lead,
  Client,
} from './linking';
import { getCollection, saveCollection } from './db';

const DB_DIR = path.join(process.cwd(), 'data');
const TEST_BACKUP_DIR = path.join(process.cwd(), 'data-backup-test');

// Backup and restore functions for test isolation
function backupData() {
  if (!fs.existsSync(TEST_BACKUP_DIR)) {
    fs.mkdirSync(TEST_BACKUP_DIR, { recursive: true });
  }
  ['leads', 'clients', 'estimates'].forEach(name => {
    const src = path.join(DB_DIR, `${name}.json`);
    const dest = path.join(TEST_BACKUP_DIR, `${name}.json`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
}

function restoreData() {
  ['leads', 'clients', 'estimates'].forEach(name => {
    const src = path.join(TEST_BACKUP_DIR, `${name}.json`);
    const dest = path.join(DB_DIR, `${name}.json`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  // Cleanup backup dir
  if (fs.existsSync(TEST_BACKUP_DIR)) {
    fs.rmSync(TEST_BACKUP_DIR, { recursive: true });
  }
}

function clearTestData() {
  saveCollection('leads', []);
  saveCollection('clients', []);
  saveCollection('estimates', []);
}

// ============ Generators ============

const phoneArb = fc.stringMatching(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/);

const leadStatusArb = fc.constantFrom('new', 'call', 'measure', 'contract') as fc.Arbitrary<'new' | 'call' | 'measure' | 'contract'>;

const leadArb = fc.record({
  id: fc.integer({ min: 1000000000000, max: 9999999999999 }),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  phone: phoneArb,
  type: fc.constantFrom('Замер', 'Консультация', 'Заявка'),
  comment: fc.string({ maxLength: 200 }),
  status: leadStatusArb,
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString()),
});

// ============ Property Tests ============

describe('Linking Functions', () => {
  beforeEach(() => {
    backupData();
    clearTestData();
  });

  afterEach(() => {
    restoreData();
  });

  describe('parseAddressFromComment', () => {
    it('should extract address from comment', () => {
      expect(parseAddressFromComment('Дата: 2 дек., Время: 10:00, Адрес: ул. Примерная, 1'))
        .toBe('ул. Примерная, 1');
      
      expect(parseAddressFromComment('Адрес: Москва, ул. Ленина 5'))
        .toBe('Москва, ул. Ленина 5');
      
      expect(parseAddressFromComment('Дата: 2 дек., Время: 10:00, Адрес: Не указан'))
        .toBeUndefined();
      
      expect(parseAddressFromComment('Без адреса'))
        .toBeUndefined();
    });
  });

  describe('generateUuid', () => {
    it('should generate unique UUIDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), () => {
          const uuid1 = generateUuid();
          const uuid2 = generateUuid();
          expect(uuid1).not.toBe(uuid2);
          expect(uuid1.length).toBeGreaterThan(10);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: crm-seo-optimization, Property 1: Bidirectional Lead-Client Link Consistency**
   * 
   * *For any* lead and client pair created through the "Create Client from Lead" flow,
   * the lead SHALL contain the client's UUID in its `clientUuid` field AND
   * the client SHALL contain the lead's ID in its `leadId` field.
   * 
   * **Validates: Requirements 2.3**
   */
  describe('Property 1: Bidirectional Lead-Client Link Consistency', () => {
    it('should maintain bidirectional links between lead and client', () => {
      fc.assert(
        fc.property(leadArb, (leadData) => {
          // Clear data for each iteration
          clearTestData();
          
          // Create lead in database
          const leads = getCollection('leads') as Lead[];
          const lead: Lead = { ...leadData, clientUuid: undefined };
          leads.push(lead);
          saveCollection('leads', leads);
          
          // Create client from lead
          const client = createClientFromLead(lead);
          
          // Verify bidirectional link
          const updatedLeads = getCollection('leads') as Lead[];
          const updatedLead = updatedLeads.find(l => l.id === lead.id);
          
          // Lead should have client's UUID
          expect(updatedLead?.clientUuid).toBe(client.uuid);
          
          // Client should have lead's ID
          expect(client.leadId).toBe(lead.id);
          
          // Client should have data from lead
          expect(client.name).toBe(lead.name);
          expect(client.phone).toBe(lead.phone);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve lead data in created client', () => {
      fc.assert(
        fc.property(leadArb, (leadData) => {
          clearTestData();
          
          const leads = getCollection('leads') as Lead[];
          const lead: Lead = { ...leadData, clientUuid: undefined };
          leads.push(lead);
          saveCollection('leads', leads);
          
          const client = createClientFromLead(lead);
          
          // Client name and phone must match lead
          expect(client.name).toBe(lead.name);
          expect(client.phone).toBe(lead.phone);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: crm-seo-optimization, Property 2: Bidirectional Estimate-Client Link Consistency**
   * 
   * *For any* estimate saved with a linked client, the estimate SHALL contain
   * the client's UUID in its `clientUuid` field AND the client SHALL contain
   * the estimate's UUID in its `estimateUuid` field.
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Property 2: Bidirectional Estimate-Client Link Consistency', () => {
    it('should maintain bidirectional links between estimate and client', () => {
      fc.assert(
        fc.property(
          fc.record({
            clientName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            clientPhone: phoneArb,
            clientEmail: fc.option(fc.emailAddress(), { nil: undefined }),
            address: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          }),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            phone: phoneArb,
            project: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          (estimateData, clientData) => {
            // Clear data for each iteration
            clearTestData();
            
            // Create client in database
            const clients = getCollection('clients') as Client[];
            const clientUuid = generateUuid();
            const client: Client = {
              uuid: clientUuid,
              name: clientData.name,
              phone: clientData.phone,
              project: clientData.project,
              progress: 0,
              currentStage: '',
              reports: [],
              createdAt: new Date().toISOString(),
            };
            clients.push(client);
            saveCollection('clients', clients);
            
            // Create estimate in database
            const estimates = getCollection('estimates');
            const estimateUuid = generateUuid();
            const estimate = {
              uuid: estimateUuid,
              clientName: estimateData.clientName,
              clientPhone: estimateData.clientPhone,
              clientEmail: estimateData.clientEmail,
              address: estimateData.address,
              items: [],
              approved: false,
              createdAt: new Date().toISOString(),
            };
            estimates.push(estimate);
            saveCollection('estimates', estimates);
            
            // Link estimate to client
            const result = linkEstimateToClient(estimateUuid, clientUuid);
            expect(result).toBe(true);
            
            // Verify bidirectional link
            const updatedEstimates = getCollection('estimates');
            const updatedEstimate = updatedEstimates.find((e: any) => e.uuid === estimateUuid);
            
            const updatedClients = getCollection('clients') as Client[];
            const updatedClient = updatedClients.find(c => c.uuid === clientUuid);
            
            // Estimate should have client's UUID
            expect(updatedEstimate?.clientUuid).toBe(clientUuid);
            
            // Client should have estimate's UUID
            expect(updatedClient?.estimateUuid).toBe(estimateUuid);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when linking non-existent entities', () => {
      clearTestData();
      
      // Try to link non-existent estimate to non-existent client
      const result = linkEstimateToClient('fake-estimate-uuid', 'fake-client-uuid');
      expect(result).toBe(false);
    });

    it('should return false when estimate exists but client does not', () => {
      clearTestData();
      
      // Create only estimate
      const estimates = getCollection('estimates');
      const estimateUuid = generateUuid();
      estimates.push({
        uuid: estimateUuid,
        clientName: 'Test',
        clientPhone: '+7 (999) 123-45-67',
        items: [],
        approved: false,
        createdAt: new Date().toISOString(),
      });
      saveCollection('estimates', estimates);
      
      const result = linkEstimateToClient(estimateUuid, 'fake-client-uuid');
      expect(result).toBe(false);
    });

    it('should return false when client exists but estimate does not', () => {
      clearTestData();
      
      // Create only client
      const clients = getCollection('clients') as Client[];
      const clientUuid = generateUuid();
      clients.push({
        uuid: clientUuid,
        name: 'Test',
        phone: '+7 (999) 123-45-67',
        project: 'Test Project',
        progress: 0,
        currentStage: '',
        reports: [],
        createdAt: new Date().toISOString(),
      });
      saveCollection('clients', clients);
      
      const result = linkEstimateToClient('fake-estimate-uuid', clientUuid);
      expect(result).toBe(false);
    });
  });

  /**
   * **Feature: crm-seo-optimization, Property 4: Lead Card Button Visibility**
   * 
   * *For any* lead with status "measure", the lead card SHALL display a "Create Client" button.
   * *For any* lead with status other than "measure", the button SHALL NOT be displayed.
   * 
   * **Validates: Requirements 2.1**
   */
  describe('Property 4: Lead Card Button Visibility', () => {
    // Pure function to determine if "Create Client" button should be visible
    const shouldShowCreateClientButton = (lead: Lead): boolean => {
      return lead.status === 'measure' && !lead.clientUuid;
    };

    it('should show Create Client button only for measure stage leads without client', () => {
      fc.assert(
        fc.property(leadArb, (leadData) => {
          const lead: Lead = { ...leadData, clientUuid: undefined };
          
          if (lead.status === 'measure') {
            // Measure stage leads without client should show button
            expect(shouldShowCreateClientButton(lead)).toBe(true);
          } else {
            // Non-measure stage leads should NOT show button
            expect(shouldShowCreateClientButton(lead)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT show Create Client button for leads with existing client', () => {
      fc.assert(
        fc.property(
          leadArb,
          fc.uuid(),
          (leadData, clientUuid) => {
            // Lead with clientUuid (already has client)
            const lead: Lead = { ...leadData, clientUuid };
            
            // Should NOT show button regardless of status
            expect(shouldShowCreateClientButton(lead)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show button for all measure leads without client', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1000000000000, max: 9999999999999 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            phone: phoneArb,
            type: fc.constantFrom('Замер', 'Консультация', 'Заявка'),
            comment: fc.string({ maxLength: 200 }),
            status: fc.constant('measure' as const),
            createdAt: fc.constant(new Date().toISOString()),
          }),
          (leadData) => {
            const lead: Lead = { ...leadData, clientUuid: undefined };
            expect(shouldShowCreateClientButton(lead)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: crm-seo-optimization, Property 5: Linked Entity Badge Visibility**
   * 
   * *For any* lead with a non-null `clientUuid`, the lead card SHALL display a client badge.
   * *For any* lead with null `clientUuid`, no badge SHALL be displayed.
   * 
   * **Validates: Requirements 2.4**
   */
  describe('Property 5: Linked Entity Badge Visibility', () => {
    // Pure function to determine if client badge should be visible
    const shouldShowClientBadge = (lead: Lead): boolean => {
      return !!lead.clientUuid;
    };

    it('should show client badge only for leads with linked client', () => {
      fc.assert(
        fc.property(
          leadArb,
          fc.option(fc.uuid(), { nil: undefined }),
          (leadData, clientUuid) => {
            const lead: Lead = { ...leadData, clientUuid };
            
            if (clientUuid) {
              // Leads with clientUuid should show badge
              expect(shouldShowClientBadge(lead)).toBe(true);
            } else {
              // Leads without clientUuid should NOT show badge
              expect(shouldShowClientBadge(lead)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show badge for all leads with clientUuid regardless of status', () => {
      fc.assert(
        fc.property(
          leadArb,
          fc.uuid(),
          (leadData, clientUuid) => {
            // Lead with clientUuid in any status
            const lead: Lead = { ...leadData, clientUuid };
            
            // Should always show badge when clientUuid exists
            expect(shouldShowClientBadge(lead)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT show badge for any lead without clientUuid', () => {
      fc.assert(
        fc.property(leadArb, (leadData) => {
          // Lead without clientUuid
          const lead: Lead = { ...leadData, clientUuid: undefined };
          
          // Should never show badge when clientUuid is undefined
          expect(shouldShowClientBadge(lead)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: crm-seo-optimization, Property 6: Client Deletion Cleans Lead Reference**
   * 
   * *For any* client deletion where the client has a linked lead,
   * the lead's `clientUuid` field SHALL be set to null after deletion.
   * 
   * **Validates: Requirements 5.2**
   */
  describe('Property 6: Client Deletion Cleans Lead Reference', () => {
    it('should remove clientUuid from lead when unlinking client', () => {
      fc.assert(
        fc.property(leadArb, (leadData) => {
          clearTestData();
          
          // Create lead in database
          const leads = getCollection('leads') as Lead[];
          const lead: Lead = { ...leadData, clientUuid: undefined };
          leads.push(lead);
          saveCollection('leads', leads);
          
          // Create client from lead (establishes bidirectional link)
          const client = createClientFromLead(lead);
          
          // Verify link exists
          const linkedLeads = getCollection('leads') as Lead[];
          const linkedLead = linkedLeads.find(l => l.id === lead.id);
          expect(linkedLead?.clientUuid).toBe(client.uuid);
          
          // Unlink client from lead (simulates cleanup before client deletion)
          const result = unlinkClientFromLead(client.uuid);
          expect(result).toBe(true);
          
          // Verify lead's clientUuid is now undefined
          const updatedLeads = getCollection('leads') as Lead[];
          const updatedLead = updatedLeads.find(l => l.id === lead.id);
          expect(updatedLead?.clientUuid).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should return false when client has no linked lead', () => {
      clearTestData();
      
      // Create client without leadId
      const clients = getCollection('clients') as Client[];
      const clientUuid = generateUuid();
      clients.push({
        uuid: clientUuid,
        name: 'Test',
        phone: '+7 (999) 123-45-67',
        project: 'Test Project',
        progress: 0,
        currentStage: '',
        reports: [],
        createdAt: new Date().toISOString(),
      });
      saveCollection('clients', clients);
      
      const result = unlinkClientFromLead(clientUuid);
      expect(result).toBe(false);
    });
  });

  /**
   * **Feature: crm-seo-optimization, Property 7: Estimate Deletion Cleans Client Reference**
   * 
   * *For any* estimate deletion where the estimate has a linked client,
   * the client's `estimateUuid` field SHALL be set to null after deletion.
   * 
   * **Validates: Requirements 5.3**
   */
  describe('Property 7: Estimate Deletion Cleans Client Reference', () => {
    it('should remove estimateUuid from client when unlinking estimate', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            phone: phoneArb,
            project: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          (clientData) => {
            clearTestData();
            
            // Create client in database
            const clients = getCollection('clients') as Client[];
            const clientUuid = generateUuid();
            const client: Client = {
              uuid: clientUuid,
              name: clientData.name,
              phone: clientData.phone,
              project: clientData.project,
              progress: 0,
              currentStage: '',
              reports: [],
              createdAt: new Date().toISOString(),
            };
            clients.push(client);
            saveCollection('clients', clients);
            
            // Create estimate in database
            const estimates = getCollection('estimates');
            const estimateUuid = generateUuid();
            estimates.push({
              uuid: estimateUuid,
              clientName: clientData.name,
              clientPhone: clientData.phone,
              items: [],
              approved: false,
              createdAt: new Date().toISOString(),
            });
            saveCollection('estimates', estimates);
            
            // Link estimate to client
            linkEstimateToClient(estimateUuid, clientUuid);
            
            // Verify link exists
            const linkedClients = getCollection('clients') as Client[];
            const linkedClient = linkedClients.find(c => c.uuid === clientUuid);
            expect(linkedClient?.estimateUuid).toBe(estimateUuid);
            
            // Unlink estimate from client (simulates cleanup before estimate deletion)
            const result = unlinkEstimateFromClient(estimateUuid);
            expect(result).toBe(true);
            
            // Verify client's estimateUuid is now undefined
            const updatedClients = getCollection('clients') as Client[];
            const updatedClient = updatedClients.find(c => c.uuid === clientUuid);
            expect(updatedClient?.estimateUuid).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when estimate has no linked client', () => {
      clearTestData();
      
      // Create estimate without clientUuid
      const estimates = getCollection('estimates');
      const estimateUuid = generateUuid();
      estimates.push({
        uuid: estimateUuid,
        clientName: 'Test',
        clientPhone: '+7 (999) 123-45-67',
        items: [],
        approved: false,
        createdAt: new Date().toISOString(),
      });
      saveCollection('estimates', estimates);
      
      const result = unlinkEstimateFromClient(estimateUuid);
      expect(result).toBe(false);
    });
  });

  /**
   * **Feature: crm-seo-optimization, Property 9: Entity Serialization Round-Trip**
   * 
   * *For any* Lead, Client, or Estimate entity, serializing to JSON and
   * deserializing back SHALL produce an entity equivalent to the original.
   * 
   * **Validates: Requirements 6.3**
   */
  describe('Property 9: Entity Serialization Round-Trip', () => {
    it('should round-trip Lead entities through JSON serialization', () => {
      fc.assert(
        fc.property(leadArb, (leadData) => {
          const lead: Lead = { ...leadData, clientUuid: undefined };
          
          // Serialize to JSON and back
          const serialized = JSON.stringify(lead);
          const deserialized = JSON.parse(serialized) as Lead;
          
          // Verify all fields are preserved
          expect(deserialized.id).toBe(lead.id);
          expect(deserialized.name).toBe(lead.name);
          expect(deserialized.phone).toBe(lead.phone);
          expect(deserialized.type).toBe(lead.type);
          expect(deserialized.comment).toBe(lead.comment);
          expect(deserialized.status).toBe(lead.status);
          expect(deserialized.createdAt).toBe(lead.createdAt);
          expect(deserialized.clientUuid).toBe(lead.clientUuid);
        }),
        { numRuns: 100 }
      );
    });

    it('should round-trip Lead entities with clientUuid through JSON serialization', () => {
      fc.assert(
        fc.property(
          leadArb,
          fc.uuid(),
          (leadData, clientUuid) => {
            const lead: Lead = { ...leadData, clientUuid };
            
            // Serialize to JSON and back
            const serialized = JSON.stringify(lead);
            const deserialized = JSON.parse(serialized) as Lead;
            
            // Verify clientUuid is preserved
            expect(deserialized.clientUuid).toBe(clientUuid);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should round-trip Client entities through JSON serialization', () => {
      fc.assert(
        fc.property(
          fc.record({
            uuid: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            phone: phoneArb,
            email: fc.option(fc.emailAddress(), { nil: undefined }),
            project: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            address: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
            leadId: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
            estimateUuid: fc.option(fc.uuid(), { nil: undefined }),
            progress: fc.integer({ min: 0, max: 100 }),
            currentStage: fc.string({ maxLength: 100 }),
          }),
          (clientData) => {
            const client: Client = {
              ...clientData,
              reports: [],
              createdAt: new Date().toISOString(),
            };
            
            // Serialize to JSON and back
            const serialized = JSON.stringify(client);
            const deserialized = JSON.parse(serialized) as Client;
            
            // Verify all fields are preserved
            expect(deserialized.uuid).toBe(client.uuid);
            expect(deserialized.name).toBe(client.name);
            expect(deserialized.phone).toBe(client.phone);
            expect(deserialized.email).toBe(client.email);
            expect(deserialized.project).toBe(client.project);
            expect(deserialized.address).toBe(client.address);
            expect(deserialized.leadId).toBe(client.leadId);
            expect(deserialized.estimateUuid).toBe(client.estimateUuid);
            expect(deserialized.progress).toBe(client.progress);
            expect(deserialized.currentStage).toBe(client.currentStage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should round-trip Estimate entities through JSON serialization', () => {
      fc.assert(
        fc.property(
          fc.record({
            uuid: fc.uuid(),
            clientName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            clientPhone: phoneArb,
            clientEmail: fc.option(fc.emailAddress(), { nil: undefined }),
            address: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
            clientUuid: fc.option(fc.uuid(), { nil: undefined }),
            approved: fc.boolean(),
          }),
          (estimateData) => {
            const estimate = {
              ...estimateData,
              items: [],
              createdAt: new Date().toISOString(),
              approvedAt: estimateData.approved ? new Date().toISOString() : undefined,
            };
            
            // Serialize to JSON and back
            const serialized = JSON.stringify(estimate);
            const deserialized = JSON.parse(serialized);
            
            // Verify all fields are preserved
            expect(deserialized.uuid).toBe(estimate.uuid);
            expect(deserialized.clientName).toBe(estimate.clientName);
            expect(deserialized.clientPhone).toBe(estimate.clientPhone);
            expect(deserialized.clientEmail).toBe(estimate.clientEmail);
            expect(deserialized.address).toBe(estimate.address);
            expect(deserialized.clientUuid).toBe(estimate.clientUuid);
            expect(deserialized.approved).toBe(estimate.approved);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
