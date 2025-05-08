import { colors } from "@/lib/colors"
import { Instructor, Availability } from "@/lib/types/supabase"
import { formatDuration } from "@/lib/mapbox"

// Extended instructor type that includes travel time
type InstructorWithTravelTime = Instructor & {
  travel_time_seconds?: number | null;
  specialties?: string;
}

export default function InstructorList({ 
  instructors, 
  availabilities = [],
  selectedInstructorId,
  onInstructorSelect,
  poolAddressId,
  startDateTime,
  duration,
  recurrenceWeeks
}: { 
  instructors: InstructorWithTravelTime[], 
  availabilities?: Availability[],
  selectedInstructorId: string,
  onInstructorSelect: (id: string) => void,
  poolAddressId: string,
  startDateTime: string,
  duration: number,
  recurrenceWeeks: number
}) {
  const convertTimeToMinutes = (timeStr: string): number => {
    try {
      const [hours, minutes] = timeStr.trim().split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.error('Invalid time format:', timeStr);
        return 0;
      }
      return hours * 60 + minutes;
    } catch (error) {
      console.error('Error converting time:', timeStr, error);
      return 0;
    }
  };

  const parseTimeRanges = (timerangeStr: string): string[] => {
    try {
      const rangesStr = timerangeStr.replace(/^\[|\]$/g, '');
      return rangesStr.split(',').map(range => range.trim());
    } catch (error) {
      console.error('Error parsing time ranges:', error);
      return [];
    }
  };

  const isTimeInRange = (startMinutes: number, endMinutes: number, timeRanges: string[]): boolean => {
    return timeRanges.some(range => {
      try {
        const [startTime, endTime] = range.split('-').map(t => t.trim());
        const start = convertTimeToMinutes(startTime);
        const end = convertTimeToMinutes(endTime);
        
        // Handle ranges that cross midnight
        if (end < start) {
          return (startMinutes >= start && startMinutes <= 24 * 60) || 
                 (endMinutes >= 0 && endMinutes <= end);
        }
        
        return startMinutes >= start && endMinutes <= end;
      } catch (error) {
        console.error('Error checking time range:', range, error);
        return false;
      }
    });
  };

  const isInstructorAvailable = (instructor: InstructorWithTravelTime): boolean => {
    if (!startDateTime || !availabilities) {
      return false;
    }

    // Get instructor's availabilities
    const instructorAvailabilities = availabilities.filter(
      avail => avail.instructor_id === instructor.id
    );

    if (instructorAvailabilities.length === 0) {
      return false;
    }

    const bookingStart = new Date(startDateTime);
    const bookingEnd = new Date(bookingStart.getTime() + duration * 60000);

    // Check each availability period
    return instructorAvailabilities.some(availability => {
      try {
        // Check if booking date is within availability period
        const availStart = new Date(availability.start_date);
        const availEnd = new Date(availability.end_date);

        if (bookingStart < availStart || bookingStart > availEnd) {
          return false;
        }

        // Parse timeranges
        const timeRanges = parseTimeRanges(availability.timerange);

        // Convert booking times to minutes since midnight for comparison
        const bookingStartMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bookingEndMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

        // Check if the booking time fits within any of the time ranges
        return timeRanges.some(range => {
          const [startTime, endTime] = range.split('-').map(t => t.trim());
          const rangeStartMinutes = convertTimeToMinutes(startTime);
          const rangeEndMinutes = convertTimeToMinutes(endTime);

          // Handle ranges that cross midnight
          if (rangeEndMinutes < rangeStartMinutes) {
            return (bookingStartMinutes >= rangeStartMinutes && bookingStartMinutes <= 24 * 60) || 
                   (bookingEndMinutes >= 0 && bookingEndMinutes <= rangeEndMinutes);
          }

          // Check if the booking time fits within the range
          return bookingStartMinutes >= rangeStartMinutes && bookingEndMinutes <= rangeEndMinutes;
        });
      } catch (error) {
        console.error('Error checking availability:', error);
        return false;
      }
    });
  };

  // Filter instructors based on availability
  const availableInstructors = instructors.filter(instructor => isInstructorAvailable(instructor));

  return (
    <div style={{ 
      maxHeight: '250px', 
      overflowY: 'auto',
      border: `1px solid ${colors.border.light}`,
      borderRadius: '6px'
    }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: '0.875rem'
      }}>
        <thead style={{
          position: 'sticky',
          top: 0,
          backgroundColor: colors.common.white,
          borderBottom: `1px solid ${colors.border.light}`,
          zIndex: 10
        }}>
          <tr>
            <th style={{ 
              padding: '0.75rem', 
              textAlign: 'left',
              color: colors.text.secondary
            }}>Instructor</th>
            <th style={{ 
              padding: '0.75rem', 
              textAlign: 'left',
              color: colors.text.secondary 
            }}>Specialties</th>
            <th style={{ 
              padding: '0.75rem', 
              textAlign: 'left',
              color: colors.text.secondary 
            }}>Drive Time</th>
            <th style={{ 
              padding: '0.75rem', 
              textAlign: 'left',
              color: colors.text.secondary 
            }}>Availability</th>
          </tr>
        </thead>
        <tbody>
          {availableInstructors.map(instructor => (
            <tr 
              key={instructor.id}
              onClick={() => onInstructorSelect(instructor.id)}
              style={{
                cursor: 'pointer',
                backgroundColor: instructor.id === selectedInstructorId 
                  ? `${colors.primary[300]}40` 
                  : 'transparent',
                borderBottom: `1px solid ${colors.border.light}`,
                transition: 'background-color 0.2s ease'
              }}
            >
              <td style={{ padding: '0.75rem' }}>
                {instructor.first_name} {instructor.last_name}
              </td>
              <td style={{ padding: '0.75rem' }}>
                {instructor.specialties || 'No specialties listed'}
              </td>
              <td style={{ padding: '0.75rem' }}>
                {poolAddressId && instructor.travel_time_seconds !== undefined && instructor.travel_time_seconds !== null ? (
                  formatDuration(instructor.travel_time_seconds)
                ) : (
                  'Select a pool first'
                )}
              </td>
              <td style={{ 
                padding: '0.75rem',
                color: colors.status.success
              }}>
                Available
              </td>
            </tr>
          ))}
          {availableInstructors.length === 0 && (
            <tr>
              <td colSpan={4} style={{ 
                padding: '1rem', 
                textAlign: 'center',
                color: colors.text.secondary
              }}>
                No instructors available for the selected time slot
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

