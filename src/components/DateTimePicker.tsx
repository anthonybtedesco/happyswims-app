import React, { useState, useEffect } from 'react';
import { colors } from '@/lib/colors';
import { Availability } from '@/lib/types/supabase';
import { supabase } from '@/lib/supabase/client';

interface DateTimePickerProps {
  selectedDateTime: string;
  onChange: (dateTime: string) => void;
  duration?: number;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ 
  selectedDateTime, 
  onChange, 
  duration = 30
}) => {
  const [date, setDate] = useState(selectedDateTime ? selectedDateTime.split('T')[0] : '');
  const [time, setTime] = useState(selectedDateTime ? selectedDateTime.split('T')[1].slice(0, 5) : '');
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [fetchedAvailabilites, setFetchedAvailabilites] = useState(false);

  useEffect(() => {
    if (fetchedAvailabilites) {return}
    async function fetchAvailabilities() {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .gte('end_date', new Date().toISOString());

      if (error) {
        console.error('Error fetching availabilities:', error);
        return;
      }

      if (data) {
        console.log('Fetched availabilities:', data);
        setAvailabilities(data);
        setFetchedAvailabilites(true)
      }
    }

    fetchAvailabilities();
  }, []);

  useEffect(() => {
    if (selectedDateTime) {
      setDate(selectedDateTime.split('T')[0]);
      setTime(selectedDateTime.split('T')[1].slice(0, 5));
    }
  }, [selectedDateTime]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setShowCalendar(false);
    if (time) {
      onChange(`${newDate}T${time}`);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      onChange(`${date}T${newTime}`);
    }
  };

  const isTimeSlotAvailable = (dateStr: string, timeStr: string): boolean => {
    console.log('\n=== Checking Time Slot Availability ===');
    console.log('Date:', dateStr);
    console.log('Time:', timeStr);
    console.log('Duration:', duration, 'minutes');
    
    if (!availabilities.length) {
      console.log('No availabilities provided');
      return false;
    }

    if (!dateStr || !timeStr) {
      console.log('Invalid date or time string');
      return false;
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = new Date(dateStr);
    slotStart.setHours(hours, minutes, 0, 0);

    if (isNaN(slotStart.getTime())) {
      console.log('Invalid date created');
      return false;
    }

    const slotEnd = new Date(slotStart.getTime() + duration * 60000);
    
    console.log('Slot Start:', slotStart.toISOString());
    console.log('Slot End:', slotEnd.toISOString());

    const instructorIds = new Set(availabilities.map(a => a.instructor_id));
    console.log('Available Instructor IDs:', Array.from(instructorIds));
    
    const isAvailable = Array.from(instructorIds).some(instructorId => {
      console.log(`\nChecking instructor ${instructorId}:`);
      const instructorAvailabilities = availabilities.filter(a => a.instructor_id === instructorId);
      console.log('Instructor availabilities:', instructorAvailabilities);
      
      const isInstructorAvailable = instructorAvailabilities.some(availability => {
        const availStart = new Date(availability.start_date);
        const availEnd = new Date(availability.end_date);
        
        console.log('\nChecking availability period:');
        console.log('Availability Start:', availStart.toISOString());
        console.log('Availability End:', availEnd.toISOString());

        if (slotStart < availStart || slotStart > availEnd) {
          console.log('Slot is outside availability period');
          return false;
        }

        const timeRanges = availability.timerange.replace(/^\[|\]$/g, '').split(',').map(range => range.trim());
        console.log('Time ranges:', timeRanges);

        const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
        const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();
        console.log('Slot minutes:', { start: slotStartMinutes, end: slotEndMinutes });

        const isInTimeRange = timeRanges.some(range => {
          const [startTime, endTime] = range.split('-').map(t => t.trim());
          const [startHours, startMinutes] = startTime.split(':').map(Number);
          const [endHours, endMinutes] = endTime.split(':').map(Number);
          const rangeStartMinutes = startHours * 60 + startMinutes;
          const rangeEndMinutes = endHours * 60 + endMinutes;
          
          console.log('\nChecking time range:', range);
          console.log('Range minutes:', { start: rangeStartMinutes, end: rangeEndMinutes });

          if (rangeEndMinutes < rangeStartMinutes) {
            const isAvailable = (slotStartMinutes >= rangeStartMinutes && slotStartMinutes <= 24 * 60) || 
                              (slotEndMinutes >= 0 && slotEndMinutes <= rangeEndMinutes);
            console.log('Crosses midnight, available:', isAvailable);
            return isAvailable;
          }

          const isAvailable = slotStartMinutes >= rangeStartMinutes && slotEndMinutes <= rangeEndMinutes;
          console.log('Within range, available:', isAvailable);
          return isAvailable;
        });

        console.log('Is in time range:', isInTimeRange);
        return isInTimeRange;
      });

      console.log('Is instructor available:', isInstructorAvailable);
      return isInstructorAvailable;
    });

    console.log('\nFinal availability result:', isAvailable);
    return isAvailable;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 21; hour++) { // 6 AM to 8 PM
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const timeStr = `${formattedHour}:${formattedMinute}`;
        const isAvailable = isTimeSlotAvailable(date, timeStr);
        slots.push({ time: timeStr, available: isAvailable });
      }
    }
    return slots;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const isDateAvailable = (dateStr: string): boolean => {
    console.log('\n=== Checking Date Availability ===');
    console.log('Date:', dateStr);
    
    if (!availabilities.length) {
      console.log('No availabilities provided');
      return true;
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    console.log('Normalized date:', date.toISOString());

    const isAvailable = availabilities.some(availability => {
      const availStart = new Date(availability.start_date);
      const availEnd = new Date(availability.end_date);
      availStart.setHours(0, 0, 0, 0);
      availEnd.setHours(23, 59, 59, 999);
      
      console.log('\nChecking availability:');
      console.log('Availability Start:', availStart.toISOString());
      console.log('Availability End:', availEnd.toISOString());
      
      const isInRange = date >= availStart && date <= availEnd;
      console.log('Is in range:', isInRange);
      
      return isInRange;
    });

    console.log('Final date availability:', isAvailable);
    return isAvailable;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const weeks = [];
    let days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<td key={`empty-${i}`} style={styles.calendarCell}></td>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = currentDate === date;
      const isToday = today.getFullYear() === year && 
                      today.getMonth() === month && 
                      today.getDate() === day;
      const isPast = new Date(currentDate) < new Date(today.setHours(0, 0, 0, 0));
      const isAvailable = isDateAvailable(currentDate);

      days.push(
        <td 
          key={day}
          onClick={() => !isPast && isAvailable && handleDateChange(currentDate)}
          style={{
            ...styles.calendarCell,
            ...(isSelected && styles.selectedDate),
            ...(isToday && styles.today),
            ...(isPast && styles.pastDate),
            ...(isAvailable && !isPast && styles.availableDate),
            cursor: isPast || !isAvailable ? 'not-allowed' : 'pointer',
            opacity: isPast || !isAvailable ? 0.5 : 1,
          }}
        >
          {day}
        </td>
      );

      if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
        weeks.push(<tr key={day}>{days}</tr>);
        days = [];
      }
    }

    return weeks;
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputGroup}>
        <div style={styles.dateContainer}>
          <label style={styles.label}>Date</label>
          <div style={styles.datePickerContainer}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              style={styles.dateButton}
            >
              {date ? formatDateForDisplay(date) : 'Select Date'}
            </button>
            {showCalendar && (
              <div style={styles.calendarContainer}>
                <div style={styles.calendarHeader}>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    style={styles.monthButton}
                  >
                    ←
                  </button>
                  <span style={styles.monthYear}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    style={styles.monthButton}
                  >
                    →
                  </button>
                </div>
                <table style={styles.calendar}>
                  <thead>
                    <tr>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <th key={day} style={styles.weekdayHeader}>
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {renderCalendar()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div style={styles.timeContainer}>
          <label style={styles.label}>Time</label>
          <select
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            style={styles.timeSelect}
          >
            <option value="">Select Time</option>
            {generateTimeSlots().map(({ time: timeSlot, available }) => (
              <option 
                key={timeSlot} 
                value={timeSlot}
                style={{
                  backgroundColor: available ? colors.status.success + '20' : colors.status.error + '20',
                  color: available ? colors.text.primary : colors.text.disabled,
                  fontWeight: available ? '500' : 'normal'
                }}
              >
                {timeSlot}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    position: 'relative' as const,
  },
  inputGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  dateContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
  },
  timeContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    marginBottom: '0.5rem',
    color: colors.text.secondary,
    fontSize: '0.875rem',
  },
  datePickerContainer: {
    position: 'relative' as const,
  },
  dateButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: `1px solid ${colors.border.light}`,
    backgroundColor: colors.common.white,
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  calendarContainer: {
    position: 'absolute' as const,
    top: '100%',
    left: '0',
    zIndex: 1000,
    backgroundColor: colors.common.white,
    border: `1px solid ${colors.border.light}`,
    borderRadius: '6px',
    padding: '1rem',
    marginTop: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    padding: '0.25rem',
    textAlign: 'center' as const,
    fontSize: '0.75rem',
    color: colors.text.secondary,
  },
  monthButton: {
    padding: '0.25rem 0.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: colors.text.primary,
  },
  monthYear: {
    fontWeight: '500',
    color: colors.text.primary,
  },
  calendar: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  calendarCell: {
    padding: '0.5rem',
    textAlign: 'center' as const,
    fontSize: '0.875rem',
    color: colors.text.primary,
  },
  weekdayHeader: {
    padding: '0.5rem',
    color: colors.text.secondary,
    fontSize: '0.75rem',
    fontWeight: '500',
    textAlign: 'center' as const,
    borderBottom: `1px solid ${colors.border.light}`,
    backgroundColor: colors.common.white,
  },
  timeSelect: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: `1px solid ${colors.border.light}`,
    backgroundColor: colors.common.white,
    width: '100%',
    fontSize: '0.875rem',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8.825L1.175 4 2.25 2.925 6 6.675l3.75-3.75L10.825 4 6 8.825z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    paddingRight: '2rem',
  },
  selectedDate: {
    backgroundColor: colors.primary[500],
    color: colors.common.white,
    borderRadius: '4px',
  },
  today: {
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  pastDate: {
    color: colors.text.disabled,
    backgroundColor: 'transparent',
  },
  availableDate: {
    backgroundColor: colors.status.success + '20',
  },
};

export default DateTimePicker; 