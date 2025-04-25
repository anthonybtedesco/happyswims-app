'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HomeTab from './tabs/HomeTab'
import DataTab from './tabs/DataTab'
import CalendarSettingsModal from '@/components/modals/CalendarSettingsModal'
import BookTab from './tabs/BookTab'
import InstructorTab from './tabs/InstructorTab'
import { useAllData } from '@/data/DataContext'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  const { state, fetchAllData } = useAllData()
  const { bookings, availabilities } = state
  
  useEffect(() => {
    fetchAllData()

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
          fetchAllData()
        }
      )
      .subscribe()

    return () => {
      bookingSubscription.unsubscribe()
    }

  }, [fetchAllData])

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
            <button 
              onClick={() => setActiveTab('book')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'book' ? '#f0f0f0' : 'transparent',
              }}
            > 
              Book
            </button>
            <button 
              onClick={() => setActiveTab('instructor')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'instructor' ? '#f0f0f0' : 'transparent',
              }}
            >  
              Instructor
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

      {activeTab === 'home' && <HomeTab />}
      {activeTab === 'data' && <DataTab />}
      {activeTab === 'book' && <BookTab />}
      {activeTab === 'instructor' && <InstructorTab />}
      
      <CalendarSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        bookings={bookings.data}
        availabilities={availabilities.data}
      />
    </main>
  )
}
