import { NextResponse } from 'next/server';
import {
  getAllSlots,
  getSlotsByDate,
  getAvailableSlots,
  createSlot,
  updateSlotStatus,
  deleteSlot,
  bookSlot,
  initializeSlotsIfEmpty,
  generateDefaultSlots,
  isValidTime,
  TimeSlot,
  getSlotById,
} from '@/lib/booking-slots';
import { saveCollection } from '@/lib/db';
import { logAction } from '@/lib/audit';

/**
 * GET /api/booking-slots
 * Query params:
 *   - date: filter by date (YYYY-MM-DD)
 *   - available: if 'true', return only available slots
 *   - init: if 'true', initialize default slots if empty
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const availableOnly = searchParams.get('available') === 'true';
    const init = searchParams.get('init') === 'true';

    // Initialize slots if requested and empty
    if (init) {
      initializeSlotsIfEmpty();
    }

    let slots: TimeSlot[];

    if (date && availableOnly) {
      slots = getAvailableSlots(date);
    } else if (date) {
      slots = getSlotsByDate(date);
    } else {
      slots = getAllSlots();
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching booking slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}


/**
 * POST /api/booking-slots
 * Body:
 *   - date: date string (YYYY-MM-DD)
 *   - time: time string (HH:MM, must be 12:00-21:00)
 *   - generateDays: number of days to generate default slots (optional)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Generate default slots for multiple days
    if (body.generateDays) {
      const days = Number(body.generateDays);
      if (days < 1 || days > 90) {
        return NextResponse.json(
          { error: 'generateDays must be between 1 and 90' },
          { status: 400 }
        );
      }
      const newSlots = generateDefaultSlots(days);
      const existingSlots = getAllSlots();
      saveCollection('booking-slots', [...existingSlots, ...newSlots]);
      
      // Audit log for bulk create (Requirement 3.1)
      await logAction({
        action: 'create',
        collection: 'booking-slots',
        recordId: 0, // Bulk operation
        after: { generatedDays: days, slotsCount: newSlots.length },
      });
      
      return NextResponse.json({ success: true, count: newSlots.length });
    }

    // Create single slot
    if (!body.date || !body.time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      );
    }

    if (!isValidTime(body.time)) {
      return NextResponse.json(
        { error: 'Time must be between 12:00 and 21:00 (hourly)' },
        { status: 400 }
      );
    }

    const newSlot = createSlot(body.date, body.time);
    if (!newSlot) {
      return NextResponse.json(
        { error: 'Failed to create slot' },
        { status: 500 }
      );
    }

    // Audit log for create action (Requirement 3.1)
    await logAction({
      action: 'create',
      collection: 'booking-slots',
      recordId: newSlot.id,
      after: newSlot,
    });

    return NextResponse.json(newSlot);
  } catch (error) {
    console.error('Error creating booking slot:', error);
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 });
  }
}


/**
 * PUT /api/booking-slots
 * Body:
 *   - id: slot ID
 *   - status: new status ('available' | 'booked' | 'unavailable')
 *   - book: if true, book the slot with leadInfo
 *   - leadInfo: { leadId, name, phone } (required if book is true)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    // Get slot before update for audit log (Requirement 3.2)
    const slotBefore = getSlotById(body.id);

    // Book a slot
    if (body.book) {
      if (!body.leadInfo || !body.leadInfo.leadId || !body.leadInfo.name || !body.leadInfo.phone) {
        return NextResponse.json(
          { error: 'leadInfo with leadId, name, and phone is required for booking' },
          { status: 400 }
        );
      }

      const bookedSlot = bookSlot(body.id, body.leadInfo);
      if (!bookedSlot) {
        return NextResponse.json(
          { error: 'Slot not found or not available for booking' },
          { status: 400 }
        );
      }

      // Audit log for booking (update action)
      await logAction({
        action: 'update',
        collection: 'booking-slots',
        recordId: body.id,
        before: slotBefore,
        after: bookedSlot,
      });

      return NextResponse.json(bookedSlot);
    }

    // Update slot status
    if (!body.status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['available', 'booked', 'unavailable'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Status must be available, booked, or unavailable' },
        { status: 400 }
      );
    }

    const updatedSlot = updateSlotStatus(body.id, body.status);
    if (!updatedSlot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Audit log for status update (Requirement 3.2)
    await logAction({
      action: 'update',
      collection: 'booking-slots',
      recordId: body.id,
      before: slotBefore,
      after: updatedSlot,
    });

    return NextResponse.json(updatedSlot);
  } catch (error) {
    console.error('Error updating booking slot:', error);
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 });
  }
}

/**
 * DELETE /api/booking-slots?id=X
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    // Get slot before deletion for audit log (Requirement 3.3)
    const slotBefore = getSlotById(Number(id));

    const success = deleteSlot(Number(id));
    if (!success) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Audit log for delete action
    if (slotBefore) {
      await logAction({
        action: 'delete',
        collection: 'booking-slots',
        recordId: Number(id),
        before: slotBefore,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking slot:', error);
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
  }
}
