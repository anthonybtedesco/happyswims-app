'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supbase/client'
import Calendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import googleCalendarPlugin from '@fullcalendar/google-calendar'
import { colors, buttonVariants } from '@/lib/colors'
import BookingCreateModal from '@/components/modals/BookingCreateModal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Instructor = {
  id: string
}

type Client = {
  id: string
  first_name: string
  last_name: string
  user_id: string
}

type Address = {
  id: string
  address_line: string
  city: string
  state: string
  zip: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])

  const [formData, setFormData] = useState({
    client_id: '',
    instructor_id: '',
    pool_address: '',
    start_time: '',
    duration: 30,
    recurrence_weeks: 0,
    status: 'scheduled'
  })

  useEffect(() => {
    fetchData()

    const bookingSubscription = supabase
      .channel('bookings-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking'
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      bookingSubscription.unsubscribe()
    }
    
  }, [])

  const fetchData = async () => {
    const [userData, instructorData, clientData, addressData, bookingData] = await Promise.all([
      supabase.from('client').select('*'),
      supabase.from('instructor').select('*'),
      supabase.from('client').select('*'),
      supabase.from('address').select('*'),
      supabase.from('booking').select(`*`)
    ])

    console.log("bookingData.data", bookingData.data)
    console.log("userData.data", userData.data)
    console.log("instructorData.data", instructorData.data)
    console.log("clientData.data", clientData.data)
    console.log("addressData.data", addressData.data)
    
    if (userData.data) setUsers(userData.data)
    if (instructorData.data) setInstructors(instructorData.data)
    if (clientData.data) setClients(clientData.data)
    if (addressData.data) setAddresses(addressData.data)
    if (bookingData.data) {
      const formattedBookings = bookingData.data.map(booking => ({
        id: booking.id,
        title: 'test',
        start: booking.start_time,
        end: booking.end_time,
      }))
      console.log("formattedBookings", formattedBookings)
      setBookings(formattedBookings)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const startTime = new Date(formData.start_time)
    const endTime = new Date(startTime.getTime() + formData.duration * 60000)

    try {
      const { error } = await supabase
        .from('booking')
        .insert([{
          ...formData,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        }])

      if (error) throw error

      setSuccess(true)
      setFormData({
        client_id: '',
        instructor_id: '',
        pool_address: '',
        start_time: '',
        duration: 30,
        recurrence_weeks: 0,
        status: 'scheduled'
      })
      
      setTimeout(() => {
        setShowBookingModal(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '250px' }}>
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

        </div>

        <div style={{ flex: 1 }}>
          {JSON.stringify(bookings)}
          {JSON.stringify(selectedUser)}
          {JSON.stringify(selectedUser ? bookings.filter(booking => booking.client_id === clients.find(client => client.id === selectedUser)?.id) : bookings)}
          <Calendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={selectedUser ? bookings.filter(booking => booking.client_id === clients.find(client => client.id === selectedUser)?.id) : bookings}
            height="80vh"
            firstDay={1}
          />
        </div>
      </div>

      <BookingCreateModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        instructors={instructors}
        clients={clients}
        addresses={addresses}
      />
    </main>
  )
}