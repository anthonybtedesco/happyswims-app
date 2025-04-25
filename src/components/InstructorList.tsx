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
  console.log('Received availabilities:', availabilities);
  console.log('Checking availability for datetime:', startDateTime);

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
      console.log('Parsing timerange string:', timerangeStr);
      // Remove brackets and split by comma
      const rangesStr = timerangeStr.replace(/^\[|\]$/g, '');
      console.log('After removing brackets:', rangesStr);
      return rangesStr.split(',').map(range => range.trim());
    } catch (error) {
      console.error('Error parsing time ranges:', error);
      return [];
    }
  };

  const isTimeInRange = (startMinutes: number, endMinutes: number, timeRanges: string[]): boolean => {
    console.log('Checking time ranges:', { startMinutes, endMinutes, timeRanges });
    
    return timeRanges.some(range => {
      try {
        const [startTime, endTime] = range.split('-').map(t => t.trim());
        const start = convertTimeToMinutes(startTime);
        const end = convertTimeToMinutes(endTime);
        
        console.log('Checking range:', { range, start, end });

        // Handle ranges that cross midnight
        if (end < start) {
          const result = (startMinutes >= start && startMinutes <= 24 * 60) || 
                        (endMinutes >= 0 && endMinutes <= end);
          console.log('Cross-midnight range result:', result);
          return result;
        }
        
        const result = startMinutes >= start && endMinutes <= end;
        console.log('Regular range result:', result);
        return result;
      } catch (error) {
        console.error('Error checking time range:', range, error);
        return false;
      }
    });
  };

  const isInstructorAvailable = (instructor: InstructorWithTravelTime): boolean => {
    console.log('\nChecking availability for instructor:', instructor.id);
    
    if (!startDateTime || !availabilities) {
      console.log('No startDateTime or availabilities');
      return false;
    }

    // Get instructor's availabilities
    const instructorAvailabilities = availabilities.filter(
      avail => avail.instructor_id === instructor.id
    );
    console.log('Found availabilities for instructor:', instructorAvailabilities);

    if (instructorAvailabilities.length === 0) {
      console.log('No availabilities found for instructor:', instructor.id);
      return false;
    }

    const bookingStart = new Date(startDateTime);
    const bookingEnd = new Date(bookingStart.getTime() + duration * 60000);
    console.log('Booking time range:', { 
      start: bookingStart.toISOString(), 
      end: bookingEnd.toISOString() 
    });

    // Check each availability period
    const result = instructorAvailabilities.some(availability => {
      try {
        console.log('\nChecking availability period:', availability);
        
        // Check if booking date is within availability period
        const availStart = new Date(availability.start_date);
        const availEnd = new Date(availability.end_date);
        console.log('Availability period:', { 
          start: availStart.toISOString(), 
          end: availEnd.toISOString() 
        });

        if (bookingStart < availStart || bookingStart > availEnd) {
          console.log('Booking date outside availability period');
          return false;
        }

        // Parse timeranges
        const timeRanges = parseTimeRanges(availability.timerange);
        console.log('Parsed time ranges:', timeRanges);

        // Convert booking times to minutes since midnight for comparison
        const bookingStartMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bookingEndMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
        console.log('Booking times in minutes:', { bookingStartMinutes, bookingEndMinutes });

        const isAvailable = isTimeInRange(bookingStartMinutes, bookingEndMinutes, timeRanges);
        console.log('Final availability result:', isAvailable);
        return isAvailable;
      } catch (error) {
        console.error('Error checking availability:', error);
        return false;
      }
    });

    console.log('Final result for instructor:', instructor.id, result);
    return result;
  };

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
          {instructors.map(instructor => {
            const isAvailable = isInstructorAvailable(instructor);
            return (
              <tr 
                key={instructor.id}
                onClick={() => isAvailable && onInstructorSelect(instructor.id)}
                style={{
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  backgroundColor: instructor.id === selectedInstructorId 
                    ? `${colors.primary[300]}40` 
                    : !isAvailable 
                      ? colors.status.error + '10'
                      : 'transparent',
                  borderBottom: `1px solid ${colors.border.light}`,
                  opacity: isAvailable ? 1 : 0.7
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
                  color: isAvailable ? colors.status.success : colors.status.error
                }}>
                  {isAvailable ? 'Available' : 'Not Available'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

