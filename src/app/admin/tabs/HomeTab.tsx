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

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Users</h2>
        <div style={{ marginTop: '1rem' }}>
          <Select onValueChange={(value) => {
            console.log('Selected user:', value)
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
          events={(() => {
            // Convert bookings to calendar events
            const bookingEvents = (selectedUser 
              ? bookings.filter(booking => booking.client_id === clients.find(client => client.id === selectedUser)?.id)
              : bookings
            ).map(booking => ({
              id: booking.id,
              title: `Booking: ${clients.find(c => c.id === booking.client_id)?.first_name || ''} ${clients.find(c => c.id === booking.client_id)?.last_name || ''} with ${instructors.find(i => i.id === booking.instructor_id)?.first_name || ''} ${instructors.find(i => i.id === booking.instructor_id)?.last_name || ''}`,
              start: booking.start_time,
              end: booking.end_time,
              backgroundColor: '#4CAF50',  // Green for bookings
              borderColor: '#388E3C'
            }));

            // Convert availabilities to calendar events
            const availabilityEvents = (selectedUser
              ? availabilities.filter(avail => {
                  const instructor = instructors.find(i => i.id === avail.instructor_id);
                  return instructor?.user_id === selectedUser;
                })
              : availabilities
            ).map(avail => ({
              id: `avail-${avail.id}`,
              title: `Available: ${instructors.find(i => i.id === avail.instructor_id)?.first_name || ''} ${instructors.find(i => i.id === avail.instructor_id)?.last_name || ''}`,
              start: avail.start_date,
              end: avail.end_date,
              backgroundColor: avail.color || '#2196F3',  // Blue for availabilities
              borderColor: '#1976D2',
              display: 'background'
            }));

            return [...bookingEvents, ...availabilityEvents];
          })()}
          height="80vh"
          firstDay={1}
        />
      </div>

      <BookingCreateModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        instructors={instructors}
        clients={clients}
        addresses={addresses}
      />

      <ClientCreateModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
      />

      <InstructorCreateModal
        isOpen={showInstructorModal}
        onClose={() => setShowInstructorModal(false)}
      />
    </div>
  )
} 