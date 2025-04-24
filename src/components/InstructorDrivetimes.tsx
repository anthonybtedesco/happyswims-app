import { colors } from "@/lib/colors"
import { Instructor } from "@/lib/types/supabase"
import { formatDuration } from "@/lib/mapbox"

// Extended instructor type that includes travel time
type InstructorWithTravelTime = Instructor & {
  travel_time_seconds?: number | null;
  specialties?: string;
}

// Component to display instructors in a table with travel times
export default function InstructorDrivetimes({ 
  instructors, 
  selectedInstructorId,
  onInstructorSelect,
  poolAddressId
}: { 
  instructors: InstructorWithTravelTime[], 
  selectedInstructorId: string,
  onInstructorSelect: (id: string) => void,
  poolAddressId: string
}) {
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
          </tr>
        </thead>
        <tbody>
          {instructors.map(instructor => (
            <tr 
              key={instructor.id}
              onClick={() => onInstructorSelect(instructor.id)}
              style={{
                cursor: 'pointer',
                backgroundColor: instructor.id === selectedInstructorId ? `${colors.primary[300]}40` : 'transparent',
                borderBottom: `1px solid ${colors.border.light}`
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

