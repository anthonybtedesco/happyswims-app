'use client'

import React, { useState } from 'react'
import Calendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import googleCalendarPlugin from '@fullcalendar/google-calendar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BookingCreateModal from '@/components/modals/BookingCreateModal'
import ClientCreateModal from '@/components/modals/ClientCreateModal'
import InstructorCreateModal from '@/components/modals/InstructorCreateModal'
import { useData } from '@/lib/context/DataContext'

export default function HomeTab() {
  const { 
    clients, 
    instructors, 
    addresses, 
    bookings, 
    availabilities, 
    loading 
  } = useData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showInstructorModal, setShowInstructorModal] = useState(false)

  function calculateHeatIntensity(events: any[], time: Date) {
    return events.filter(event => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      return time >= eventStart && time <= eventEnd
    }).length
  }

  function getHeatColor(intensity: number) {
    const maxIntensity = 5
    const normalizedIntensity = Math.min(intensity / maxIntensity, 1)
    const hue = 120 - (normalizedIntensity * 120)
    return `hsl(${hue}, 70%, 50%)`
  }

  // Function to combine bookings and availabilities into calendar events
  const getCalendarEvents = () => {
    const bookingEvents = selectedUser 
      ? bookings
          .filter(booking => {
            const matchingClient = clients.find(client => client.id === selectedUser)
            return booking.client_id === matchingClient?.id
          })
          .map(booking => {
            const instructor = instructors.find(inst => inst.id === booking.instructor_id)
            const client = clients.find(cli => cli.id === booking.client_id)
            const poolAddress = addresses.find(addr => addr.id === booking.pool_address_id)
            return {
              id: booking.id,
              start: booking.start_time,
              end: booking.end_time,
              title: `${instructor?.first_name} ${instructor?.last_name} with ${client?.first_name} ${client?.last_name}`,
              backgroundColor: '#3b82f6',
              borderColor: '#3b82f6',
              display: 'block',
              extendedProps: {
                instructor: instructor,
                client: client,
                poolAddress: poolAddress,
                duration: booking.duration,
                status: booking.status
              }
            }
          })
      : bookings.map(booking => {
          const instructor = instructors.find(inst => inst.id === booking.instructor_id)
          const client = clients.find(cli => cli.id === booking.client_id)
          const poolAddress = addresses.find(addr => addr.id === booking.pool_address_id)
          return {
            id: booking.id,
            start: booking.start_time,
            end: booking.end_time,
            title: `${instructor?.first_name} ${instructor?.last_name} with ${client?.first_name} ${client?.last_name}`,
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            display: 'block',
            extendedProps: {
              instructor: instructor,
              client: client,
              poolAddress: poolAddress,
              duration: booking.duration,
              status: booking.status
            }
          }
        });

    // Process availability events
    const availabilityEvents = availabilities.map(availability => {
      try {
        // Parse the time range (e.g., "00:00-16:00")
        const [startTime, endTime] = availability.timerange ? availability.timerange.split('-') : ['00:00', '00:00'];
        
        if (!startTime || !endTime) {
          throw new Error(`Invalid time range format: ${availability.timerange}`);
        }

        // Create a date object for start and end using the availability date but with the time from timerange
        const startDate = new Date(availability.start_date);
        const endDate = new Date(availability.end_date);
        
        // Set the hours and minutes from the time range
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
          throw new Error(`Invalid time values in range: ${availability.timerange}`);
        }

        startDate.setHours(startHours, startMinutes, 0);
        endDate.setHours(endHours, endMinutes, 0);

        // Format times for display
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
          title: `Available: ${displayStartTime} - ${displayEndTime}`,
          backgroundColor: availability.color || '#10b981',
          borderColor: availability.color || '#10b981',
          display: 'block',
          allDay: false
        };
      } catch (err) {
        const error = err as Error;
        console.error('Error processing availability:', error, 'Availability:', availability);
        // Return a fallback event
        return {
          id: `avail-${availability.id}`,
          start: availability.start_date,
          end: availability.end_date,
          title: `Available (Error: ${error.message})`,
          backgroundColor: availability.color || '#10b981',
          borderColor: availability.color || '#10b981',
          display: 'block',
          allDay: true
        };
      }
    });

    return [...bookingEvents, ...availabilityEvents];
  };

  // Show loading state
  if (loading.clients || loading.instructors || loading.addresses || loading.bookings || loading.availabilities) {
    return <div>Loading data...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Users</h2>
        <div style={{ marginTop: '1rem' }}>
          <Select onValueChange={(value) => setSelectedUser(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} (client)
                </SelectItem>
              ))}
            </SelectContent>
          </Select> 
        </div>
        <Button onClick={() => setShowBookingModal(true)}>New Booking</Button>
        <Button onClick={() => setShowClientModal(true)}>New Client</Button>
        <Button onClick={() => setShowInstructorModal(true)}>New Instructor</Button>
      </div>

      <div style={{ flex: 1 }}>
        <Calendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={getCalendarEvents()}
          height="80vh"
          firstDay={1}
          eventDidMount={(info) => {
            console.log('Event mounted:', {
              id: info.event.id,
              title: info.event.title,
              start: info.event.start,
              end: info.event.end
            })

            // Add tooltip
            const { instructor, client, poolAddress, duration, status } = info.event.extendedProps || {};
            if (instructor && client) { // Only add tooltip for booking events
              const tooltip = document.createElement('div');
              tooltip.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 300px;
                display: none;
              `;

              tooltip.innerHTML = `
                <div style="font-weight: 500; margin-bottom: 8px;">Booking Details</div>
                <div style="margin-bottom: 4px;"><strong>Instructor:</strong> ${instructor?.first_name} ${instructor?.last_name}</div>
                <div style="margin-bottom: 4px;"><strong>Client:</strong> ${client?.first_name} ${client?.last_name}</div>
                <div style="margin-bottom: 4px;"><strong>Location:</strong> ${poolAddress?.address_line}, ${poolAddress?.city}</div>
                <div style="margin-bottom: 4px;"><strong>Duration:</strong> ${duration} minutes</div>
                <div style="margin-bottom: 4px;"><strong>Status:</strong> ${status}</div>
              `;

              info.el.addEventListener('mouseenter', () => {
                document.body.appendChild(tooltip);
                const rect = info.el.getBoundingClientRect();
                tooltip.style.display = 'block';
                tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
                tooltip.style.left = `${rect.left + window.scrollX}px`;
              });

              info.el.addEventListener('mouseleave', () => {
                tooltip.remove();
              });
            }
          }}
        />
      </div>

      <BookingCreateModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false)
        }}
      />

      <ClientCreateModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false)
        }}
      />

      <InstructorCreateModal
        isOpen={showInstructorModal}
        onClose={() => {
          setShowInstructorModal(false)
        }}
      />
    </div>
  )
} 