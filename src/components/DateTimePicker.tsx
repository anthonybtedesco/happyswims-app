import React, { useState, useEffect } from 'react';
import { colors } from '@/lib/colors';

interface DateTimePickerProps {
  selectedDateTime: string;
  onChange: (dateTime: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ selectedDateTime, onChange }) => {
  const [date, setDate] = useState(selectedDateTime ? selectedDateTime.split('T')[0] : '');
  const [time, setTime] = useState(selectedDateTime ? selectedDateTime.split('T')[1].slice(0, 5) : '');
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 21; hour++) { // 6 AM to 8 PM
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
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

      days.push(
        <td 
          key={day}
          onClick={() => !isPast && handleDateChange(currentDate)}
          style={{
            ...styles.calendarCell,
            ...(isSelected && styles.selectedDate),
            ...(isToday && styles.today),
            ...(isPast && styles.pastDate),
            cursor: isPast ? 'not-allowed' : 'pointer',
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
            {generateTimeSlots().map((timeSlot) => (
              <option key={timeSlot} value={timeSlot}>
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
};

export default DateTimePicker; 