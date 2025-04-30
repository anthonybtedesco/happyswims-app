'use client'

import React, { useState, useEffect } from 'react'
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
import { Address, Instructor, Client, Availability, Booking } from '@/lib/types/supabase'

interface HomeTabProps {
  users: any[]
  clients: Client[]
  instructors: Instructor[]
  addresses: Address[]
  bookings: Booking[]
  availabilities: Availability[]
  fetchData: () => Promise<void>
}

export default function HomeTab({ 
  users, 
  clients, 
  instructors, 
  addresses, 
  bookings,
  availabilities,
  fetchData
}: HomeTabProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showInstructorModal, setShowInstructorModal] = useState(false)

  // Log initial props
  useEffect(() => {
    console.log('HomeTab Props:', {
      users: users.length,
      clients: clients.length,
      instructors: instructors.length,
      bookings: bookings.length,
      availabilities: availabilities.length
    })
  }, [users, clients, instructors, bookings, availabilities])

  // Function to combine bookings and availabilities into calendar events
  const getCalendarEvents = () => {
    console.log('Getting calendar events. Selected user:', selectedUser)

    const bookingEvents = selectedUser 
      ? bookings
          .filter(booking => {
            const matchingClient = clients.find(client => client.id === selectedUser)
            console.log('Filtering bookings for client:', matchingClient?.id)
            return booking.client_id === matchingClient?.id
          })
          .map(booking => ({
            id: booking.id,
            start: booking.start_time,
            end: booking.end_time,
            title: `Booking`,
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            display: 'block'
          }))
      : bookings.map(booking => ({
          id: booking.id,
          start: booking.start_time,
          end: booking.end_time,
          title: `Booking`,
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          display: 'block'
        }));

    const availabilityEvents = availabilities.map(availability => {
      try {
        // Validate timerange exists and has correct format
        if (!availability.timerange || !availability.timerange.includes('-')) {
          console.error('Invalid timerange format:', availability.timerange, 'for availability:', availability.id);
          return {
            id: `avail-${availability.id}`,
            start: availability.start_date,
            end: availability.end_date,
            title: `Available (Time not specified)`,
            backgroundColor: availability.color || '#10b981',
            borderColor: availability.color || '#10b981',
            display: 'block',
            allDay: true
          };
        }

        // Parse the time range (e.g., "00:00-16:00")
        const [startTime, endTime] = availability.timerange.split('-');
        
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

    const combinedEvents = [...bookingEvents, ...availabilityEvents];
    console.log('Calendar Events:', {
      bookings: bookingEvents.length,
      availabilities: availabilityEvents.length,
      total: combinedEvents.length
    })

    return combinedEvents;
  };

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Users</h2>
        <div style={{ marginTop: '1rem' }}>
          <Select onValueChange={(value) => {
            console.log('User selection changed:', value)
            setSelectedUser(value)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} (client)
                </SelectItem>
              ))}
            </SelectContent>
          </Select> 
        </div>
        <Button onClick={() => {
          console.log('Opening booking modal')
          setShowBookingModal(true)
        }}>New Booking</Button>
        <Button onClick={() => {
          console.log('Opening client modal')
          setShowClientModal(true)
        }}>New Client</Button>
        <Button onClick={() => {
          console.log('Opening instructor modal')
          setShowInstructorModal(true)
        }}>New Instructor</Button>
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
          }}
        />
      </div>

      <BookingCreateModal
        isOpen={showBookingModal}
        onClose={() => {
          console.log('Closing booking modal')
          setShowBookingModal(false)
        }}
        instructors={instructors}
        clients={clients}
        addresses={addresses}
        availabilities={availabilities}
      />

      <ClientCreateModal
        isOpen={showClientModal}
        onClose={() => {
          console.log('Closing client modal')
          setShowClientModal(false)
        }}
      />

      <InstructorCreateModal
        isOpen={showInstructorModal}
        onClose={() => {
          console.log('Closing instructor modal')
          setShowInstructorModal(false)
        }}
      />
    </div>
  )
} 