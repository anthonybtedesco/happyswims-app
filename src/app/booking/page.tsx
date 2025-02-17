import React from 'react'
import { createClient } from '@/lib/supbase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/forms/OnboardingForm'
import { colors, buttonVariants } from '@/lib/colors'
import BookingCard from '@/components/BookingCard'

export default async function BookingPortal() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: client } = await supabase
    .from('client')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  const { data: bookings } = await supabase
    .from('booking')
    .select('*')
    .eq('client_id', client.id)

  if (!client) {
    return (
      <main>
        <h1>Welcome to Happy Swims!</h1>
        <p>Please complete your profile to continue</p>
        <OnboardingForm userId={session.user.id} />
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'transparent',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: colors.common.white,
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: colors.text.primary
            }}>
              Welcome back, {client.first_name}! 👋
            </h1>
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button style={{
                padding: '0.5rem 1rem',
                ...buttonVariants.primary,
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                Book a Lesson
              </button>
              <button style={{
                padding: '0.5rem 1rem',
                ...buttonVariants.secondary,
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                View Schedule
              </button>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{
              padding: '1.5rem',
              background: colors.primary[50],
              borderRadius: '12px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: colors.text.primary
              }}>Upcoming Lessons</h2>
              <p style={{color: colors.text.secondary}}>{bookings?.length ?? 0} upcoming lessons scheduled</p>
              {bookings?.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
            
            <div style={{
              padding: '1.5rem',
              background: colors.secondary[50],
              borderRadius: '12px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: colors.text.primary
              }}>Progress Tracker</h2>
              <p style={{color: colors.text.secondary}}>Track your swimming journey</p>
            </div>
            
            <div style={{
              padding: '1.5rem',
              background: '#faf5ff',
              borderRadius: '12px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>Quick Actions</h2>
              <p style={{color: '#4b5563'}}>Manage your swimming experience</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 