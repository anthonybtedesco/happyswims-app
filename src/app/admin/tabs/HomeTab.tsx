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

  function getCalendarEvents() {
    console.log('Getting calendar events. Selected user:', selectedUser)

    const bookingEvents = selectedUser 
      ? bookings
          .filter(booking => {
            const matchingClient = clients.find(client => client.id === selectedUser)
            console.log('Filtering bookings for client:', matchingClient?.id)
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

    console.log('Calendar Events:', {
      bookings: bookingEvents.length,
      total: bookingEvents.length
    });

    return bookingEvents;
  }

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

            // Add tooltip
            const { instructor, client, poolAddress, duration, status } = info.event.extendedProps;
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