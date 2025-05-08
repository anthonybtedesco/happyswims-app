'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Address, Instructor, Client, Availability, Booking } from '@/lib/types/supabase'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HomeTab from './tabs/HomeTab'
import DataTab from './tabs/DataTab'
import CalendarSettingsModal from '@/components/modals/CalendarSettingsModal'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])

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
    const [userData, instructorData, clientData, addressData, bookingData, availabilityData] = await Promise.all([
      supabase.from('client').select('*'),
      supabase.from('instructor').select('*, instructor_tag(tag_id, tag(id, name, color))'),
      supabase.from('client').select('*, client_tag(tag_id, tag(id, name, color))'),
      supabase.from('address').select('*, address_tag(tag_id, tag(id, name, color))'),
      supabase.from('booking').select(`*, booking_tag(tag_id, tag(id, name, color))`),
      supabase.from('availability').select(`*`)
    ])

    console.log("bookingData.data", bookingData.data)
    console.log("userData.data", userData.data)
    console.log("instructorData.data", instructorData.data)
    console.log("clientData.data", clientData.data)
    console.log("addressData.data", addressData.data)
    console.log("availabilityData.data", availabilityData.data)
    if (userData.data) setUsers(userData.data)
    if (instructorData.data) setInstructors(instructorData.data)
    if (clientData.data) setClients(clientData.data)
    if (addressData.data) setAddresses(addressData.data)
    if (bookingData.data) setBookings(bookingData.data)
    if (availabilityData.data) setAvailabilities(availabilityData.data)
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', gap: '1px' }}>
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
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Settings size={20} />
          </Button>
        </div>
      </div>

      {activeTab === 'home' && (
        <HomeTab 
          users={users}
          clients={clients}
          instructors={instructors}
          addresses={addresses}
          bookings={bookings}
          availabilities={availabilities}
          fetchData={fetchData}
        />
      )}

      {activeTab === 'data' && 
        (instructors && addresses && bookings && availabilities && fetchData && (
          <DataTab
            clients={clients}
            instructors={instructors}
            addresses={addresses}
            bookings={bookings}
            availabilities={availabilities}
            fetchData={fetchData}
          />
        )
      )}

      <CalendarSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        bookings={bookings}
        availabilities={availabilities}
      />
    </main>
  )
}
