"use client";

import React from 'react';
import Calendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Availability, Booking } from '@/lib/types/supabase';

interface DataCalendarProps {
  availabilities?: Availability[];
  bookings?: Booking[];
  height?: string;
}

export default function DataCalendar({ 
  availabilities = [], 
  bookings = [], 
  height = '500px' 
}: DataCalendarProps) {
  // Convert availabilities to calendar events
  const availabilityEvents = (availabilities || []).map(availability => {
    try {
      if (!availability.timerange || !availability.timerange.includes('-')) {
        return {
          id: `avail-${availability.id}`,
          start: availability.start_date,
          end: availability.end_date,
          title: `Available`,
          backgroundColor: availability.color || '#10b981',
          borderColor: availability.color || '#10b981',
          display: 'block',
          allDay: true
        };
      }

      const [startTime, endTime] = availability.timerange.split('-');
      
      if (!startTime || !endTime) {
        throw new Error(`Invalid time range format: ${availability.timerange}`);
      }

      const startDate = new Date(availability.start_date);
      const endDate = new Date(availability.end_date);
      
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
        throw new Error(`Invalid time values in range: ${availability.timerange}`);
      }

      startDate.setHours(startHours, startMinutes, 0);
      endDate.setHours(endHours, endMinutes, 0);

      const formatTime = (hours: number, minutes: number) => {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      const displayStartTime = formatTime(startHours, startMinutes);
      const displayEndTime = formatTime(endHours, endMinutes);

      return {
        id: `avail-${availability.id}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        title: `Available (${displayStartTime} - ${displayEndTime})`,
        backgroundColor: availability.color || '#10b981',
        borderColor: availability.color || '#10b981',
        display: 'block',
        allDay: false
      };
    } catch (err) {
      console.error('Error processing availability:', err, 'Availability:', availability);
      return {
        id: `avail-${availability.id}`,
        start: availability.start_date,
        end: availability.end_date,
        title: 'Available (Error with time range)',
        backgroundColor: availability.color || '#10b981',
        borderColor: availability.color || '#10b981',
        display: 'block',
        allDay: true
      };
    }
  });

  // Convert bookings to calendar events
  const bookingEvents = (bookings || []).map(booking => ({
    id: `booking-${booking.id}`,
    start: booking.start_time,
    end: booking.end_time,
    title: `Booking (${booking.duration} min)`,
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    display: 'block',
    extendedProps: {
      status: booking.status || 'scheduled',
      duration: booking.duration
    }
  }));

  // Combine all events
  const allEvents = [...availabilityEvents, ...bookingEvents];

  return (
    <div style={{ 
      height,
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <Calendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={allEvents}
        height="100%"
        firstDay={1}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        eventContent={renderEventContent}
      />
    </div>
  );
}

function renderEventContent(eventInfo: any) {
  const event = eventInfo.event;
  const isBooking = event.id.startsWith('booking-');
  
  return (
    <div style={{
      padding: '2px 4px',
      fontSize: '0.875rem',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      <div style={{
        fontWeight: isBooking ? '600' : '400',
        marginBottom: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {event.title}
      </div>
      {isBooking && event.extendedProps.status && (
        <div style={{
          fontSize: '0.75rem',
          opacity: 0.8
        }}>
          Status: {event.extendedProps.status}
        </div>
      )}
    </div>
  );
}