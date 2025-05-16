'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg } from '@fullcalendar/core';
import { RealAvailability } from '@/utils/availability';

interface CreateBookingCalendarProps {
  realAvailabilities: RealAvailability;
  selectedWeek: Date | null;
  onWeekSelect: (weekStart: Date) => void;
}

export default function CreateBookingCalendar({
  realAvailabilities,
  selectedWeek,
  onWeekSelect
}: CreateBookingCalendarProps) {
  const handleSelect = (selectInfo: DateSelectArg) => {
    // Always set to start of week (Monday)
    const date = new Date(selectInfo.start);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const weekStart = new Date(date.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    onWeekSelect(weekStart);
  };

  // Convert availabilities to calendar events
  const events = Object.entries(realAvailabilities).flatMap(([instructorId, slots]) =>
    slots.map(slot => ({
      start: slot.start,
      end: slot.end,
      display: 'background',
      backgroundColor: '#10B981',
      classNames: ['available-slot']
    }))
  );

  // If a week is selected, add a background event for the week
  if (selectedWeek) {
    const weekEnd = new Date(selectedWeek);
    weekEnd.setDate(selectedWeek.getDate() + 6);
    
    events.push({
      start: selectedWeek,
      end: weekEnd,
      display: 'background',
      backgroundColor: '#3B82F6',
      classNames: ['selected-week']
    });
  }

  const calendarStyles = {
    container: {
      height: '700px',
      width: '100%'
    }
  };

  // Define styles for the calendar
  const styles = `
    .booking-calendar .fc {
      background: white;
      height: 100%;
    }
    
    .booking-calendar .fc-toolbar {
      padding: 1rem;
    }
    
    .booking-calendar .fc-toolbar-title {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .booking-calendar .fc-toolbar-chunk {
      display: flex;
      gap: 0.5rem;
    }
    
    .booking-calendar .fc-button {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      color: #374151;
      text-transform: capitalize;
      padding: 0.5rem 1rem;
      font-weight: 500;
    }

    .booking-calendar .fc-button:hover {
      background: #e5e7eb;
    }

    .booking-calendar .fc-button-active {
      background: #3B82F6 !important;
      color: white !important;
      border-color: #2563eb !important;
    }
    
    .booking-calendar .fc-day-today {
      background: inherit !important;
    }
    
    .booking-calendar .fc-daygrid-day-frame {
      min-height: 100px;
      height: 100%;
    }

    .booking-calendar .fc-daygrid-body {
      height: 100% !important;
    }
    
    .booking-calendar .fc-view-harness {
      height: auto !important;
    }
    
    .booking-calendar .fc-daygrid-body-balanced {
      height: 100%;
    }

    .booking-calendar .fc-daygrid-day-top {
      padding: 0.5rem;
    }
    
    .booking-calendar .fc-daygrid-day-number {
      font-size: 1rem;
      color: #374151;
      text-decoration: none;
    }
    
    .booking-calendar .fc-day-today .fc-daygrid-day-number {
      background: #3B82F6;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .booking-calendar .fc-col-header-cell {
      padding: 0.75rem 0;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .booking-calendar .fc-col-header-cell-cushion {
      color: #4b5563;
      font-weight: 500;
      text-decoration: none;
      padding: 0.5rem;
    }
    
    .booking-calendar .available-slot {
      opacity: 0.15;
    }
    
    .booking-calendar .selected-week {
      opacity: 0.2;
    }
    
    .booking-calendar .fc-day {
      cursor: pointer;
    }
    
    .booking-calendar .fc-day:hover {
      background-color: rgba(59, 130, 246, 0.1);
    }

    .booking-calendar .fc-daygrid-day.fc-day-today {
      background-color: rgba(59, 130, 246, 0.05) !important;
    }

    .booking-calendar .fc-scrollgrid {
      border: none;
      height: 100%;
    }

    .booking-calendar .fc-scrollgrid-section-body {
      height: 100%;
    }

    .booking-calendar .fc-scrollgrid td {
      border-right: none;
    }

    .booking-calendar .fc-scrollgrid-section th {
      border-right: none;
    }
  `;

  return (
    <div className="booking-calendar" style={calendarStyles.container}>
      <style>{styles}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        selectConstraint={{
          start: '00:00',
          end: '24:00',
          dows: [1, 2, 3, 4, 5, 6, 0] // 0 = Sunday, 1 = Monday, etc
        }}
        selectAllow={(selectInfo) => {
          // Only allow selecting a range that starts on Monday and ends on Sunday
          const start = selectInfo.start;
          return start.getDay() === 1; // Monday
        }}
        select={handleSelect}
        events={events}
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: 'today'
        }}
        dayMaxEvents={0} // Hide "+more" link
        eventDisplay="background"
        selectMinDistance={1} // Prevent accidental selections
        unselectAuto={false}
        selectMirror={true}
        weekNumbers={true}
        weekNumberFormat={{ week: 'numeric' }}
        firstDay={1} // Start week on Monday
        fixedWeekCount={false} // Show only weeks in the current month
        showNonCurrentDates={false} // Hide days from other months
        height="100%"
      />
    </div>
  );
} 