'use client'

import React from 'react'
import { colors } from '@/lib/colors'

type Booking = {
  id: string
  start_time?: string
  end_time?: string
  status?: string
  instructor_id?: string
}

type BookingCardProps = {
  booking: Booking
  onClick?: (id: string) => void
}

export default function BookingCard({ booking, onClick }: BookingCardProps) {
  const formattedDate = new Date(booking?.start_time ?? '').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  const formattedTime = new Date(booking?.start_time ?? '').toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <div 
      onClick={() => onClick?.(booking.id)}
      style={{
        aspectRatio: '1/1',
        background: colors.common.white,
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${colors.border.light}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{
            background: colors.primary[100],
            color: colors.primary[700],
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.875rem'
          }}>
            {booking.status}
          </span>
        </div>

        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: colors.text.primary,
          marginBottom: '0.5rem'
        }}>
          {formattedDate}
        </h3>
        
        <p style={{
          color: colors.text.secondary,
          fontSize: '1rem'
        }}>
          {formattedTime}
        </p>
      </div>

      <div style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        borderTop: `1px solid ${colors.border.light}`,
        fontSize: '0.875rem',
        color: colors.text.secondary
      }}>
        Instructor ID: {booking?.instructor_id?.slice(0, 8)}...
      </div>
    </div>
  )
} 