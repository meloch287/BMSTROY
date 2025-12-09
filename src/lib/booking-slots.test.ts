/**
 * Property-based tests for booking slots functions
 * 
 * **Feature: admin-enhancements**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import {
  TimeSlot,
  LeadInfo,
  VALID_TIMES,
  isValidTime,
  getAllSlots,
  getAvailableSlots,
  getSlotsByDate,
  filterSlotsByStatus,
  bookSlot,
  generateDefaultSlots,
  createSlot,
  updateSlotStatus,
  deleteSlot,
  getSlotById,
} from './booking-slots';
import { saveCollection } from './db';

const DB_DIR = path.join(process.cwd(), 'data');
const TEST_BACKUP_DIR = path.join(process.cwd(), 'data-backup-booking-test');
const COLLECTION_NAME = 'booking-slots';

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

// Generate valid date strings (YYYY-MM-DD)
const dateArb = fc.integer({ min: 0, max: 2000 }).map(offset => {
  const date = new Date('2024-01-01');
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
});

// Generate valid time strings from VALID_TIMES
const validTimeArb = fc.constantFrom(...VALID_TIMES);

// Generate invalid time strings (outside 12:00-21:00 range)
const invalidTimeArb = fc.constantFrom(
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '22:00', '23:00', '11:30', '12:30', '25:00', 'invalid'
);

// Generate slot status
const statusArb = fc.constantFrom('available', 'booked', 'unavailable') as fc.Arbitrary<TimeSlot['status']>;

// Generate phone numbers
const phoneArb = fc.stringMatching(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/);

// Generate lead info
const leadInfoArb: fc.Arbitrary<LeadInfo> = fc.record({
  leadId: fc.integer({ min: 1000000000000, max: 9999999999999 }),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  phone: phoneArb,
});

// Generate a TimeSlot
const timeSlotArb = (status?: TimeSlot['status']): fc.Arbitrary<TimeSlot> => fc.record({
  id: fc.integer({ min: 1000000000000, max: 9999999999999 }),
  date: dateArb,
  time: validTimeArb,
  status: status ? fc.constant(status) : statusArb,
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString()),
});

// Generate array of TimeSlots with mixed statuses
const mixedSlotsArb = fc.array(
  fc.oneof(
    timeSlotArb('available'),
    timeSlotArb('booked'),
    timeSlotArb('unavailable')
  ),
  { minLength: 1, maxLength: 50 }
).map(slots => {
  // Ensure unique IDs
  return slots.map((slot, index) => ({
    ...slot,
    id: Date.now() + index
  }));
});


// ============ Property Tests ============

describe('Booking Slots Functions', () => {
  beforeEach(() => {
    backupData();
    clearTestData();
  });

  afterEach(() => {
    restoreData();
  });

  /**
   * **Feature: admin-enhancements, Property 1: Available slots filtering**
   * 
   * *For any* set of time slots with mixed statuses, when filtering for available slots,
   * the result should contain only slots with status 'available' and no slots with
   * status 'booked' or 'unavailable'.
   * 
   * **Validates: Requirements 1.1, 1.4**
   */
  describe('Property 1: Available slots filtering', () => {
    it('should return only available slots when filtering by status', () => {
      fc.assert(
        fc.property(mixedSlotsArb, (slots) => {
          // Filter using pure function
          const availableSlots = filterSlotsByStatus(slots, 'available');
          
          // All returned slots should have status 'available'
          expect(availableSlots.every(s => s.status === 'available')).toBe(true);
          
          // No booked or unavailable slots should be in result
          expect(availableSlots.some(s => s.status === 'booked')).toBe(false);
          expect(availableSlots.some(s => s.status === 'unavailable')).toBe(false);
          
          // Count should match
          const expectedCount = slots.filter(s => s.status === 'available').length;
          expect(availableSlots.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it('should return only available slots for a specific date from database', () => {
      fc.assert(
        fc.property(mixedSlotsArb, dateArb, (slots, targetDate) => {
          clearTestData();
          
          // Modify some slots to have the target date
          const modifiedSlots = slots.map((slot, i) => ({
            ...slot,
            date: i % 2 === 0 ? targetDate : slot.date
          }));
          
          saveCollection(COLLECTION_NAME, modifiedSlots);
          
          const availableSlots = getAvailableSlots(targetDate);
          
          // All returned slots should be available AND have the target date
          expect(availableSlots.every(s => 
            s.status === 'available' && s.date === targetDate
          )).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: admin-enhancements, Property 2: Date-based slot filtering**
   * 
   * *For any* set of time slots across multiple dates and any selected date,
   * when filtering slots by date, all returned slots should have the matching date
   * and no slots from other dates should be included.
   * 
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: Date-based slot filtering', () => {
    it('should return only slots matching the specified date', () => {
      fc.assert(
        fc.property(
          fc.array(dateArb, { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (dates, targetIndex) => {
            clearTestData();
            
            // Create slots for multiple dates
            const slots: TimeSlot[] = [];
            const uniqueDates = Array.from(new Set(dates));
            
            uniqueDates.forEach((date, dateIdx) => {
              VALID_TIMES.slice(0, 3).forEach((time, timeIdx) => {
                slots.push({
                  id: Date.now() + dateIdx * 100 + timeIdx,
                  date,
                  time,
                  status: 'available',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              });
            });
            
            saveCollection(COLLECTION_NAME, slots);
            
            const targetDate = uniqueDates[targetIndex % uniqueDates.length];
            const filteredSlots = getSlotsByDate(targetDate);
            
            // All returned slots should have the target date
            expect(filteredSlots.every(s => s.date === targetDate)).toBe(true);
            
            // No slots from other dates should be included
            expect(filteredSlots.some(s => s.date !== targetDate)).toBe(false);
            
            // Count should match expected
            const expectedCount = slots.filter(s => s.date === targetDate).length;
            expect(filteredSlots.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for date with no slots', () => {
      fc.assert(
        fc.property(mixedSlotsArb, dateArb, (slots, unusedDate) => {
          clearTestData();
          
          // Ensure no slot has the unused date
          const modifiedSlots = slots.map(slot => ({
            ...slot,
            date: slot.date === unusedDate ? '1999-01-01' : slot.date
          }));
          
          saveCollection(COLLECTION_NAME, modifiedSlots);
          
          const filteredSlots = getSlotsByDate(unusedDate);
          
          expect(filteredSlots.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: admin-enhancements, Property 3: Booking changes slot status**
   * 
   * *For any* available time slot, when a booking is made for that slot,
   * the slot status should change to 'booked' and the bookedBy field
   * should contain the lead information.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: Booking changes slot status', () => {
    it('should change slot status to booked and store lead info', () => {
      fc.assert(
        fc.property(
          timeSlotArb('available'),
          leadInfoArb,
          (slot, leadInfo) => {
            clearTestData();
            
            // Save the available slot
            saveCollection(COLLECTION_NAME, [slot]);
            
            // Book the slot
            const bookedSlot = bookSlot(slot.id, leadInfo);
            
            // Slot should be returned
            expect(bookedSlot).not.toBeNull();
            
            // Status should be 'booked'
            expect(bookedSlot!.status).toBe('booked');
            
            // bookedBy should contain lead info
            expect(bookedSlot!.bookedBy).toBeDefined();
            expect(bookedSlot!.bookedBy!.leadId).toBe(leadInfo.leadId);
            expect(bookedSlot!.bookedBy!.name).toBe(leadInfo.name);
            expect(bookedSlot!.bookedBy!.phone).toBe(leadInfo.phone);
            
            // Verify in database
            const dbSlot = getSlotById(slot.id);
            expect(dbSlot?.status).toBe('booked');
            expect(dbSlot?.bookedBy?.leadId).toBe(leadInfo.leadId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow booking already booked slots', () => {
      fc.assert(
        fc.property(
          timeSlotArb('booked'),
          leadInfoArb,
          (slot, leadInfo) => {
            clearTestData();
            
            // Save the booked slot
            saveCollection(COLLECTION_NAME, [slot]);
            
            // Try to book the already booked slot
            const result = bookSlot(slot.id, leadInfo);
            
            // Should return null (booking failed)
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow booking unavailable slots', () => {
      fc.assert(
        fc.property(
          timeSlotArb('unavailable'),
          leadInfoArb,
          (slot, leadInfo) => {
            clearTestData();
            
            // Save the unavailable slot
            saveCollection(COLLECTION_NAME, [slot]);
            
            // Try to book the unavailable slot
            const result = bookSlot(slot.id, leadInfo);
            
            // Should return null (booking failed)
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: admin-enhancements, Property 4: Time slot validation**
   * 
   * *For any* time string, when creating a new slot, the system should accept
   * only times in the range 12:00-21:00 (hourly) and reject times outside this range.
   * 
   * **Validates: Requirements 2.2**
   */
  describe('Property 4: Time slot validation', () => {
    it('should accept valid times (12:00-21:00)', () => {
      fc.assert(
        fc.property(validTimeArb, (time) => {
          expect(isValidTime(time)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid times (outside 12:00-21:00)', () => {
      fc.assert(
        fc.property(invalidTimeArb, (time) => {
          expect(isValidTime(time)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should create slot only with valid time', () => {
      fc.assert(
        fc.property(dateArb, validTimeArb, (date, time) => {
          clearTestData();
          
          const slot = createSlot(date, time);
          
          // Slot should be created
          expect(slot).not.toBeNull();
          expect(slot!.date).toBe(date);
          expect(slot!.time).toBe(time);
          expect(slot!.status).toBe('available');
        }),
        { numRuns: 100 }
      );
    });

    it('should not create slot with invalid time', () => {
      fc.assert(
        fc.property(dateArb, invalidTimeArb, (date, time) => {
          clearTestData();
          
          const slot = createSlot(date, time);
          
          // Slot should NOT be created
          expect(slot).toBeNull();
          
          // Database should be empty
          const allSlots = getAllSlots();
          expect(allSlots.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============ Additional Unit Tests ============

  describe('generateDefaultSlots', () => {
    it('should generate correct number of slots for given days', () => {
      const days = 7;
      const slots = generateDefaultSlots(days);
      
      // Should have days * VALID_TIMES.length slots
      expect(slots.length).toBe(days * VALID_TIMES.length);
      
      // All slots should be available
      expect(slots.every(s => s.status === 'available')).toBe(true);
      
      // All times should be valid
      expect(slots.every(s => VALID_TIMES.includes(s.time))).toBe(true);
    });

    it('should generate slots with unique IDs', () => {
      const slots = generateDefaultSlots(14);
      const ids = slots.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(slots.length);
    });
  });

  describe('updateSlotStatus', () => {
    it('should update slot status correctly', () => {
      fc.assert(
        fc.property(
          timeSlotArb('available'),
          fc.constantFrom('booked', 'unavailable') as fc.Arbitrary<TimeSlot['status']>,
          (slot, newStatus) => {
            clearTestData();
            saveCollection(COLLECTION_NAME, [slot]);
            
            const updated = updateSlotStatus(slot.id, newStatus);
            
            expect(updated).not.toBeNull();
            expect(updated!.status).toBe(newStatus);
            
            // Verify in database
            const dbSlot = getSlotById(slot.id);
            expect(dbSlot?.status).toBe(newStatus);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('deleteSlot', () => {
    it('should delete existing slot', () => {
      fc.assert(
        fc.property(timeSlotArb(), (slot) => {
          clearTestData();
          saveCollection(COLLECTION_NAME, [slot]);
          
          const result = deleteSlot(slot.id);
          
          expect(result).toBe(true);
          expect(getSlotById(slot.id)).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for non-existent slot', () => {
      clearTestData();
      
      const result = deleteSlot(999999999);
      
      expect(result).toBe(false);
    });
  });
});
