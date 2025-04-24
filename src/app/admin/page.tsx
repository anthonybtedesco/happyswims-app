'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Address, Instructor, Client } from '@/lib/types/supabase'
import HomeTab from './tabs/HomeTab'
import DataTab from './tabs/DataTab'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home')
  const [users, setUsers] = useState<any[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [bookings, setBookings] = useState<any[]>([])

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
        client_id: booking.client_id,
        instructor_id: booking.instructor_id,
        status: booking.status
      }))
      console.log("formattedBookings", formattedBookings)
      setBookings(formattedBookings)
    }
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '1px', borderBottom: '1px solid #ddd' }}>
          <button 
            onClick={() => setActiveTab('home')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'home' ? '#f0f0f0' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'home' ? '2px solid #0070f3' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'home' ? 'bold' : 'normal',
            }}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'data' ? '#f0f0f0' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'data' ? '2px solid #0070f3' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'data' ? 'bold' : 'normal',
            }}
          >
            Data
          </button>
        </div>
      </div>

      {activeTab === 'home' && (
        <HomeTab 
          users={users}
          clients={clients}
          instructors={instructors}
          addresses={addresses}
          bookings={bookings}
          fetchData={fetchData}
        />
      )}

      {activeTab === 'data' && (
        <DataTab
          clients={clients}
          instructors={instructors}
          addresses={addresses}
          bookings={bookings}
          fetchData={fetchData}
        />
      )}
    </main>
  )
}