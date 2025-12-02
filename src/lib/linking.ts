/**
 * Linking utility functions for managing bidirectional relationships
 * between Leads, Clients, and Estimates.
 * 
 * Requirements: 2.3, 3.4, 5.2, 5.3
 */

import { getCollection, saveCollection, updateCollectionItem } from './db';

// ============ Types ============

export interface Lead {
  id: number;
  name: string;
  phone: string;
  type: string;
  comment: string;
  status: 'new' | 'call' | 'measure' | 'contract';
  clientUuid?: string;
  createdAt: string;
}

export interface Client {
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  project: string;
  address?: string;
  leadId?: number;
  estimateUuid?: string;
  progress: number;
  currentStage: string;
  reports: any[];
  createdAt: string;
}

export interface Estimate {
  uuid: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  address?: string;
  clientUuid?: string;
  items: any[];
  approved: boolean;
  approvedAt?: string;
  createdAt: string;
}

// ============ Helper Functions ============

/**
 * Generate a unique UUID for entities
 */
export function generateUuid(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Parse address from lead comment field
 * Expected format: "Дата: X, Время: Y, Адрес: Z"
 */
export function parseAddressFromComment(comment: string): string | undefined {
  // Match "Адрес:" followed by everything until end of string
  const match = comment.match(/Адрес:\s*(.+)$/i);
  if (match && match[1] && match[1].trim() !== 'Не указан') {
    return match[1].trim();
  }
  return undefined;
}

// ============ Lead-Client Linking ============

/**
 * Creates a new client from a lead and establishes bidirectional link.
 * - Creates client with data from lead
 * - Updates lead with clientUuid
 * - Returns the created client
 * 
 * Requirements: 2.3
 */
export function createClientFromLead(lead: Lead, additionalData?: Partial<Client>): Client {
  const clients = getCollection('clients') as Client[];
  const leads = getCollection('leads') as Lead[];
  
  const address = parseAddressFromComment(lead.comment);
  const clientUuid = generateUuid();
  
  const newClient: Client = {
    uuid: clientUuid,
    name: lead.name,
    phone: lead.phone,
    email: additionalData?.email,
    project: additionalData?.project || `Проект от заявки #${lead.id}`,
    address: additionalData?.address || address,
    leadId: lead.id,
    estimateUuid: undefined,
    progress: 0,
    currentStage: '',
    reports: [],
    createdAt: new Date().toISOString(),
    ...additionalData,
  };
  
  // Add client to collection
  clients.unshift(newClient);
  saveCollection('clients', clients);
  
  // Update lead with client reference
  const leadIndex = leads.findIndex(l => l.id === lead.id);
  if (leadIndex !== -1) {
    leads[leadIndex].clientUuid = clientUuid;
    saveCollection('leads', leads);
  }
  
  return newClient;
}

/**
 * Get client linked to a lead
 */
export function getClientByLeadId(leadId: number): Client | undefined {
  const clients = getCollection('clients') as Client[];
  return clients.find(c => c.leadId === leadId);
}

/**
 * Get lead linked to a client
 */
export function getLeadByClientUuid(clientUuid: string): Lead | undefined {
  const leads = getCollection('leads') as Lead[];
  return leads.find(l => l.clientUuid === clientUuid);
}

// ============ Estimate-Client Linking ============

/**
 * Links an estimate to a client bidirectionally.
 * - Updates estimate with clientUuid
 * - Updates client with estimateUuid
 * 
 * Requirements: 3.4
 */
export function linkEstimateToClient(estimateUuid: string, clientUuid: string): boolean {
  const estimates = getCollection('estimates') as Estimate[];
  const clients = getCollection('clients') as Client[];
  
  const estimateIndex = estimates.findIndex(e => e.uuid === estimateUuid);
  const clientIndex = clients.findIndex(c => c.uuid === clientUuid);
  
  if (estimateIndex === -1 || clientIndex === -1) {
    return false;
  }
  
  // Update estimate with client reference
  estimates[estimateIndex].clientUuid = clientUuid;
  saveCollection('estimates', estimates);
  
  // Update client with estimate reference
  clients[clientIndex].estimateUuid = estimateUuid;
  saveCollection('clients', clients);
  
  return true;
}

/**
 * Get estimate linked to a client
 */
export function getEstimateByClientUuid(clientUuid: string): Estimate | undefined {
  const estimates = getCollection('estimates') as Estimate[];
  return estimates.find(e => e.clientUuid === clientUuid);
}

/**
 * Get client linked to an estimate
 */
export function getClientByEstimateUuid(estimateUuid: string): Client | undefined {
  const clients = getCollection('clients') as Client[];
  return clients.find(c => c.estimateUuid === estimateUuid);
}

// ============ Cleanup Functions ============

/**
 * Removes client reference from linked lead when client is deleted.
 * 
 * Requirements: 5.2
 */
export function unlinkClientFromLead(clientUuid: string): boolean {
  const clients = getCollection('clients') as Client[];
  const leads = getCollection('leads') as Lead[];
  
  const client = clients.find(c => c.uuid === clientUuid);
  if (!client || !client.leadId) {
    return false;
  }
  
  const leadIndex = leads.findIndex(l => l.id === client.leadId);
  if (leadIndex !== -1) {
    leads[leadIndex].clientUuid = undefined;
    saveCollection('leads', leads);
    return true;
  }
  
  return false;
}

/**
 * Removes estimate reference from linked client when estimate is deleted.
 * 
 * Requirements: 5.3
 */
export function unlinkEstimateFromClient(estimateUuid: string): boolean {
  const estimates = getCollection('estimates') as Estimate[];
  const clients = getCollection('clients') as Client[];
  
  const estimate = estimates.find(e => e.uuid === estimateUuid);
  if (!estimate || !estimate.clientUuid) {
    return false;
  }
  
  const clientIndex = clients.findIndex(c => c.uuid === estimate.clientUuid);
  if (clientIndex !== -1) {
    clients[clientIndex].estimateUuid = undefined;
    saveCollection('clients', clients);
    return true;
  }
  
  return false;
}

/**
 * Removes client reference from linked estimate when client is deleted.
 */
export function unlinkClientFromEstimate(clientUuid: string): boolean {
  const estimates = getCollection('estimates') as Estimate[];
  
  const estimateIndex = estimates.findIndex(e => e.clientUuid === clientUuid);
  if (estimateIndex !== -1) {
    estimates[estimateIndex].clientUuid = undefined;
    saveCollection('estimates', estimates);
    return true;
  }
  
  return false;
}

// ============ Validation Functions ============

/**
 * Check if a lead has a linked client
 */
export function leadHasClient(leadId: number): boolean {
  const leads = getCollection('leads') as Lead[];
  const lead = leads.find(l => l.id === leadId);
  return !!lead?.clientUuid;
}

/**
 * Check if a client has a linked estimate
 */
export function clientHasEstimate(clientUuid: string): boolean {
  const clients = getCollection('clients') as Client[];
  const client = clients.find(c => c.uuid === clientUuid);
  return !!client?.estimateUuid;
}

/**
 * Check if referenced entity exists (for orphaned reference handling)
 * 
 * Requirements: 5.4
 */
export function entityExists(type: 'lead' | 'client' | 'estimate', id: string | number): boolean {
  if (type === 'lead') {
    const leads = getCollection('leads') as Lead[];
    return leads.some(l => l.id === id);
  }
  if (type === 'client') {
    const clients = getCollection('clients') as Client[];
    return clients.some(c => c.uuid === id);
  }
  if (type === 'estimate') {
    const estimates = getCollection('estimates') as Estimate[];
    return estimates.some(e => e.uuid === id);
  }
  return false;
}
