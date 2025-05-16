import { Availability, Booking } from '@/lib/types/supabase';

interface TimeSlot {
  start: Date;
  end: Date;
}

export interface RealAvailability {
  [instructorId: string]: TimeSlot[];
}

/**
 * Converts a timerange string (e.g. "09:00-17:00") to start and end minutes from midnight
 */
function parseTimeRange(timerange: string): { start: number; end: number } {
  const [start, end] = timerange.split('-').map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  });
  return { start, end };
}

/**
 * Checks if two time ranges overlap
 */
function doTimeRangesOverlap(
  range1Start: number,
  range1End: number,
  range2Start: number,
  range2End: number
): boolean {
  return range1Start < range2End && range2Start < range1End;
}

/**
 * Subtracts a booking time range from an availability time range
 * Returns array of remaining time ranges
 */
function subtractTimeRange(
  availStart: number,
  availEnd: number,
  bookingStart: number,
  bookingEnd: number
): { start: number; end: number }[] {
  const result: { start: number; end: number }[] = [];

  // If booking starts after availability starts, add the first chunk
  if (bookingStart > availStart) {
    result.push({ start: availStart, end: bookingStart });
  }

  // If booking ends before availability ends, add the last chunk
  if (bookingEnd < availEnd) {
    result.push({ start: bookingEnd, end: availEnd });
  }

  return result;
}

/**
 * Calculates real availability for each instructor by subtracting their bookings from their availabilities
 */
export function calculateRealAvailability(
  instructorIds: string[],
  availabilities: Availability[],
  bookings: Booking[],
  startDate: Date,
  endDate: Date
): RealAvailability {
  const realAvailability: RealAvailability = {};

  // Process each instructor
  instructorIds.forEach(instructorId => {
    const instructorAvailabilities = availabilities.filter(
      a => a.instructor_id === instructorId
    );
    const instructorBookings = bookings.filter(
      b => b.instructor_id === instructorId
    );

    const availableSlots: TimeSlot[] = [];

    // Process each day in the date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Get availabilities that apply to this day
      const applicableAvailabilities = instructorAvailabilities.filter(avail => {
        const availStart = new Date(avail.start_date);
        const availEnd = new Date(avail.end_date);
        return currentDate >= availStart && currentDate <= availEnd;
      });

      // Process each availability for this day
      applicableAvailabilities.forEach(avail => {
        // Parse the time ranges for this availability
        const timeRanges = avail.timerange.split(',');
        
        timeRanges.forEach(timeRange => {
          const { start: availStartMinutes, end: availEndMinutes } = parseTimeRange(timeRange);

          // Create a Date object for this specific time slot
          const slotStart = new Date(currentDate);
          slotStart.setHours(Math.floor(availStartMinutes / 60));
          slotStart.setMinutes(availStartMinutes % 60);

          const slotEnd = new Date(currentDate);
          slotEnd.setHours(Math.floor(availEndMinutes / 60));
          slotEnd.setMinutes(availEndMinutes % 60);

          // Get bookings that overlap with this time slot
          const overlappingBookings = instructorBookings.filter(booking => {
            const bookingStart = new Date(booking.start_time);
            const bookingEnd = new Date(booking.end_time);

            return (
              bookingStart.toDateString() === currentDate.toDateString() &&
              doTimeRangesOverlap(
                availStartMinutes,
                availEndMinutes,
                bookingStart.getHours() * 60 + bookingStart.getMinutes(),
                bookingEnd.getHours() * 60 + bookingEnd.getMinutes()
              )
            );
          });

          // If no overlapping bookings, add the entire slot
          if (overlappingBookings.length === 0) {
            availableSlots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd)
            });
            return;
          }

          // Process each booking and subtract it from the availability
          let remainingRanges = [{ start: availStartMinutes, end: availEndMinutes }];

          overlappingBookings.forEach(booking => {
            const bookingStart = new Date(booking.start_time);
            const bookingEnd = new Date(booking.end_time);
            const bookingStartMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
            const bookingEndMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

            const newRemainingRanges: { start: number; end: number }[] = [];
            remainingRanges.forEach(range => {
              const subtractedRanges = subtractTimeRange(
                range.start,
                range.end,
                bookingStartMinutes,
                bookingEndMinutes
              );
              newRemainingRanges.push(...subtractedRanges);
            });
            remainingRanges = newRemainingRanges;
          });

          // Convert remaining ranges to TimeSlots and add them
          remainingRanges.forEach(range => {
            const rangeStart = new Date(currentDate);
            rangeStart.setHours(Math.floor(range.start / 60));
            rangeStart.setMinutes(range.start % 60);

            const rangeEnd = new Date(currentDate);
            rangeEnd.setHours(Math.floor(range.end / 60));
            rangeEnd.setMinutes(range.end % 60);

            availableSlots.push({
              start: new Date(rangeStart),
              end: new Date(rangeEnd)
            });
          });
        });
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort available slots and merge any that are adjacent
    const sortedSlots = availableSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    const mergedSlots: TimeSlot[] = [];
    
    sortedSlots.forEach(slot => {
      const lastSlot = mergedSlots[mergedSlots.length - 1];
      if (lastSlot && lastSlot.end.getTime() === slot.start.getTime()) {
        lastSlot.end = slot.end;
      } else {
        mergedSlots.push({ start: new Date(slot.start), end: new Date(slot.end) });
      }
    });

    realAvailability[instructorId] = mergedSlots;
  });

  return realAvailability;
}

/**
 * Checks if a specific time slot is available within the real availability
 */
export function isTimeSlotAvailable(
  realAvailability: RealAvailability,
  instructorId: string,
  startTime: Date,
  endTime: Date
): boolean {
  const instructorSlots = realAvailability[instructorId] || [];
  
  return instructorSlots.some(slot => 
    startTime >= slot.start && endTime <= slot.end
  );
}

/**
 * Gets all available time slots for a specific day
 */
export function getAvailableSlotsForDay(
  realAvailability: RealAvailability,
  instructorId: string,
  date: Date
): TimeSlot[] {
  const instructorSlots = realAvailability[instructorId] || [];
  const dayStart = new Date(date.setHours(0, 0, 0, 0));
  const dayEnd = new Date(date.setHours(23, 59, 59, 999));

  return instructorSlots.filter(slot =>
    slot.start >= dayStart && slot.end <= dayEnd
  );
} 