import { getCollection, updateCollectionItem, saveCollection } from './db';

// TimeSlot interface as defined in design.md
export interface TimeSlot {
  id: number;
  date: string;        // ISO date string (YYYY-MM-DD)
  time: string;        // HH:MM format (12:00-21:00)
  status: 'available' | 'booked' | 'unavailable';
  bookedBy?: {
    leadId: number;
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LeadInfo {
  leadId: number;
  name: string;
  phone: string;
}

// Valid time slots range: 12:00 to 21:00 (hourly)
export const VALID_TIMES = [
  '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00'
];

const COLLECTION_NAME = 'booking-slots';

/**
 * Validates if a time string is within the allowed range (12:00-21:00)
 */
export function isValidTime(time: string): boolean {
  return VALID_TIMES.includes(time);
}

/**
 * Get all booking slots from the database
 */
export function getAllSlots(): TimeSlot[] {
  return getCollection(COLLECTION_NAME) as TimeSlot[];
}


/**
 * Get available slots for a specific date
 * Returns only slots with status 'available' for the given date
 * Validates: Requirements 1.1, 1.2, 1.4
 */
export function getAvailableSlots(date: string): TimeSlot[] {
  const allSlots = getAllSlots();
  return allSlots.filter(
    (slot) => slot.date === date && slot.status === 'available'
  );
}

/**
 * Get slots filtered by date (all statuses)
 */
export function getSlotsByDate(date: string): TimeSlot[] {
  const allSlots = getAllSlots();
  return allSlots.filter((slot) => slot.date === date);
}

/**
 * Filter slots by status
 */
export function filterSlotsByStatus(
  slots: TimeSlot[],
  status: TimeSlot['status']
): TimeSlot[] {
  return slots.filter((slot) => slot.status === status);
}

/**
 * Book a slot by ID with lead information
 * Changes slot status to 'booked' and stores lead info
 * Validates: Requirements 1.3
 */
export function bookSlot(slotId: number, leadInfo: LeadInfo): TimeSlot | null {
  const slots = getAllSlots();
  const slotIndex = slots.findIndex((s) => s.id === slotId);
  
  if (slotIndex === -1) {
    return null;
  }
  
  const slot = slots[slotIndex];
  
  // Can only book available slots
  if (slot.status !== 'available') {
    return null;
  }
  
  const updatedSlot: TimeSlot = {
    ...slot,
    status: 'booked',
    bookedBy: leadInfo,
    updatedAt: new Date().toISOString()
  };
  
  return updateCollectionItem(COLLECTION_NAME, slotId, updatedSlot) as TimeSlot;
}


/**
 * Generate default slots for a given number of days
 * Creates hourly slots from 12:00 to 21:00 for each day
 * Validates: Requirements 2.5
 */
export function generateDefaultSlots(days: number = 14): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const timestamp = now.toISOString();
  
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    for (const time of VALID_TIMES) {
      slots.push({
        id: Date.now() + d * 100 + VALID_TIMES.indexOf(time),
        date: dateStr,
        time,
        status: 'available',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
  }
  
  return slots;
}

/**
 * Initialize slots if none exist
 * Generates default slots for 14 days
 */
export function initializeSlotsIfEmpty(): TimeSlot[] {
  const existingSlots = getAllSlots();
  
  if (existingSlots.length === 0) {
    const newSlots = generateDefaultSlots(14);
    saveCollection(COLLECTION_NAME, newSlots);
    return newSlots;
  }
  
  return existingSlots;
}

/**
 * Create a single slot
 */
export function createSlot(date: string, time: string): TimeSlot | null {
  if (!isValidTime(time)) {
    return null;
  }
  
  const slots = getAllSlots();
  const timestamp = new Date().toISOString();
  
  const newSlot: TimeSlot = {
    id: Date.now(),
    date,
    time,
    status: 'available',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  slots.unshift(newSlot);
  saveCollection(COLLECTION_NAME, slots);
  
  return newSlot;
}


/**
 * Update slot status
 */
export function updateSlotStatus(
  slotId: number,
  status: TimeSlot['status']
): TimeSlot | null {
  return updateCollectionItem(COLLECTION_NAME, slotId, {
    status,
    updatedAt: new Date().toISOString()
  }) as TimeSlot | null;
}

/**
 * Delete a slot by ID
 */
export function deleteSlot(slotId: number): boolean {
  const slots = getAllSlots();
  const filteredSlots = slots.filter((s) => s.id !== slotId);
  
  if (filteredSlots.length === slots.length) {
    return false; // Slot not found
  }
  
  saveCollection(COLLECTION_NAME, filteredSlots);
  return true;
}

/**
 * Get a single slot by ID
 */
export function getSlotById(slotId: number): TimeSlot | undefined {
  const slots = getAllSlots();
  return slots.find((s) => s.id === slotId);
}
