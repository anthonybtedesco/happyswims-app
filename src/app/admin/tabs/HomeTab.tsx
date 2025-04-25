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
import { useAllData, useClients, useInstructors, useAddresses, useBookings, useAvailabilities } from '@/data/DataContext'

export default function HomeTab() {
  const { data: clients, loading: clientsLoading } = useClients();
  const { data: instructors, loading: instructorsLoading } = useInstructors();
  const { data: addresses, loading: addressesLoading } = useAddresses();
  const { data: bookings, loading: bookingsLoading } = useBookings();
  const { data: availabilities, loading: availabilitiesLoading } = useAvailabilities();
  const { fetchAllData } = useAllData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showInstructorModal, setShowInstructorModal] = useState(false)

  // Load initial data
  useEffect(() => {
    if (
      clients.length === 0 && 
      instructors.length === 0 && 
      addresses.length === 0 && 
      bookings.length === 0 && 
      availabilities.length === 0
    ) {
      fetchAllData();
    }
  }, [fetchAllData, clients.length, instructors.length, addresses.length, bookings.length, availabilities.length]);

  // Function to combine bookings and availabilities into calendar events
  const getCalendarEvents = () => {
    const bookingEvents = selectedUser 
      ? bookings
          .filter(booking => {
            const matchingClient = clients.find(client => client.id === selectedUser)
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

    return [...bookingEvents, ...availabilityEvents];
  };

  // Show loading state
  if (clientsLoading || instructorsLoading || addressesLoading || bookingsLoading || availabilitiesLoading) {
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
        />
      </div>

      <BookingCreateModal
        availabilities={availabilities}
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false)
        }}
        instructors={instructors}
        clients={clients}
        addresses={addresses}
      />

      <ClientCreateModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false)
          fetchAllData(); // Refresh data after adding a client
        }}
      />

      <InstructorCreateModal
        isOpen={showInstructorModal}
        onClose={() => {
          setShowInstructorModal(false)
          fetchAllData(); // Refresh data after adding an instructor
        }}
      />
    </div>
  )
} 