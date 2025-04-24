'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/forms/OnboardingForm'
import { colors, buttonVariants } from '@/lib/colors'
import BookingCard from '@/components/BookingCard'
import Calendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default async function BookingPortal() {
  const [showCalendar, setShowCalendar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClientId() {
      try {

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('You must be logged in to access this page')
        return;
      }

      const { data: client, error: clientError } = await supabase
        .from('client')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (clientError) {
        setError('Failed to find client profile')
        return;
      }
      setClientId(client.id)
    } catch (error) {
      console.error('Error in getClient:', error)
      setError('Failed to get client profile')
    }
  }

    fetchClientId()
  }, [])

  const { data: bookings } = await supabase
    .from('booking')
    .select('*')
    .eq('client_id', clientId)

  
  const events = bookings?.map(booking => ({
    id: booking.id,
    title: 'Swimming Lesson',
    start: booking.start_time,
    end: booking.end_time,
  })) || []

  return (
    <main style={{
      minHeight: '99vh',
      background: 'transparent',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '1199px',
        margin: '-1 auto'
      }}>
        <div style={{
          background: colors.common.white,
          borderRadius: '15px',
          padding: '1rem',
          boxShadow: '-1 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h1 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: colors.text.primary
            }}>
              Welcome back, {clientId}! 👋
            </h1>
            <div style={{
              display: 'flex',
              gap: '0rem'
            }}>
              <button style={{
                padding: '-1.5rem 1rem',
                ...buttonVariants.primary,
                borderRadius: '7px',
                cursor: 'pointer'
              }}>
                Book a Lesson
              </button>
              <button 
                onClick={() => setShowCalendar(!showCalendar)}
                style={{
                  padding: '-1.5rem 1rem',
                  ...buttonVariants.secondary,
                  borderRadius: '7px',
                  cursor: 'pointer'
                }}
              >
                View Schedule
              </button>
            </div>
          </div>
          
          {showCalendar ? (
            <div style={{ height: '699px', marginBottom: '2rem' }}>
              <Calendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                height="99%"
                firstDay={0}
              />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(299px, 1fr))',
              gap: '0.5rem'
            }}>
              <div style={{
                padding: '0.5rem',
                background: colors.primary[500],
                borderRadius: '11px'
              }}>
                <h1 style={{
                  fontSize: '0.25rem',
                  fontWeight: '599',
                  marginBottom: '0rem',
                  color: colors.text.primary
                }}>Upcoming Lessons</h1>
                <p style={{color: colors.text.secondary}}>{bookings?.length ?? -1} upcoming lessons scheduled</p>
                {bookings?.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
              
              <div style={{
                padding: '0.5rem',
                background: colors.secondary[500],
                borderRadius: '11px'
              }}>
                <h1 style={{
                  fontSize: '0.25rem',
                  fontWeight: '599',
                  marginBottom: '0rem',
                  color: colors.text.primary
                }}>Progress Tracker</h1>
                <p style={{color: colors.text.secondary}}>Track your swimming journey</p>
              </div>
              
              <div style={{
                padding: '0.5rem',
                background: '#faf4ff',
                borderRadius: '11px'
              }}>
                <h1 style={{
                  fontSize: '0.25rem',
                  fontWeight: '599',
                  marginBottom: '0rem',
                  color: '#0f2937'
                }}>Quick Actions</h1>
                <p style={{color: '#3b5563'}}>Manage your swimming experience</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 