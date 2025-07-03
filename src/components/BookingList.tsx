'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtime } from '@/hooks/useRealtime'
import { Database } from '@/lib/types/supabase'
import styles from './BookingList.module.css'

type Booking = Database['public']['Tables']['booking']['Row']
type BookingStatus = Database['public']['Enums']['BookingStatus']
type PaymentStatus = Database['public']['Enums']['PaymentStatus']

interface BookingWithRelations extends Booking {
  instructor?: {
    first_name: string | null
    last_name: string | null
    phone_number: string | null
  } | null
  client?: {
    first_name: string | null
    last_name: string | null
  } | null
  pool_address?: {
    address_line: string | null
    city: string | null
    state: string | null
    zip: string | null
  } | null
}

interface BookingListProps {
  instructorId?: string
  clientId?: string
  showAll?: boolean
}

function BookingList({ instructorId, clientId, showAll = false }: BookingListProps) {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filter = instructorId 
    ? `instructor_id=eq.${instructorId}` 
    : clientId 
    ? `client_id=eq.${clientId}` 
    : undefined

  useRealtime(
    {
      table: 'booking',
      filter
    },
    {
      onInsert: (payload) => {
        const newBooking = payload.new as Booking
        setBookings(prev => [newBooking as BookingWithRelations, ...prev])
      },
      onUpdate: (payload) => {
        const updatedBooking = payload.new as Booking
        setBookings(prev => 
          prev.map(booking => 
            booking.id === updatedBooking.id ? updatedBooking as BookingWithRelations : booking
          )
        )
      },
      onDelete: (payload) => {
        const deletedBooking = payload.old as Booking
        setBookings(prev => 
          prev.filter(booking => booking.id !== deletedBooking.id)
        )
      },
      onError: (error) => {
        setError('Failed to connect to realtime updates')
        console.error('Realtime error:', error)
      }
    }
  )

  useEffect(() => {
    loadBookings()
  }, [instructorId, clientId, showAll])

  async function loadBookings() {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('booking')
      .select(`
        *,
        instructor:instructor_id(first_name, last_name, phone_number),
        client:client_id(first_name, last_name),
        pool_address:pool_address_id(address_line, city, state, zip)
      `)
      .order('created_at', { ascending: false })

    if (instructorId) {
      query = query.eq('instructor_id', instructorId)
    } else if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (!showAll) {
      query = query.not('booking_status', 'eq', 'CANCELLED')
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
      console.error('Error loading bookings:', error)
    } else {
      setBookings(data as BookingWithRelations[] || [])
    }

    setLoading(false)
  }

  function getStatusColor(status: BookingStatus) {
    switch (status) {
      case 'INTERESTED':
        return '#f59e0b'
      case 'SCHEDULED':
        return '#3b82f6'
      case 'BOOKED':
        return '#10b981'
      case 'COMPLETED':
        return '#059669'
      case 'CANCELLED':
        return '#ef4444'
      case 'IGNORED':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  function getPaymentStatusColor(status: PaymentStatus) {
    switch (status) {
      case 'PENDING':
        return '#f59e0b'
      case 'DEPOSIT':
        return '#3b82f6'
      case 'PAID':
        return '#10b981'
      case 'REFUNDED':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatDuration(duration: number | null) {
    if (!duration) return 'TBD'
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return `${hours}h ${minutes}m`
  }

  function getInstructorName(instructor: any) {
    if (!instructor) return 'TBD'
    return `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || 'TBD'
  }

  function getClientName(client: any) {
    if (!client) return 'TBD'
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'TBD'
  }

  function getAddress(address: any) {
    if (!address) return 'TBD'
    const parts = [address.address_line, address.city, address.state, address.zip].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'TBD'
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading bookings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={loadBookings} className={styles.retryButton}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={styles.bookingListContainer}>
      <div className={styles.bookingListHeader}>
        <h3 className={styles.bookingListTitle}>
          {instructorId ? 'My Bookings' : clientId ? 'My Classes' : 'All Bookings'}
        </h3>
        <div className={styles.bookingCount}>
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No bookings found</p>
          <p className={styles.emptyStateSubtext}>
            {instructorId ? 'You have no upcoming bookings' : 'No classes have been booked yet'}
          </p>
        </div>
      ) : (
        <div className={styles.bookingGrid}>
          {bookings.map(booking => (
            <div key={booking.id} className={styles.bookingCard}>
              <div className={styles.bookingHeader}>
                <div className={styles.bookingId}>#{booking.id.slice(0, 8)}</div>
                <div className={styles.bookingStatus}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(booking.booking_status) }}
                  >
                    {booking.booking_status}
                  </span>
                </div>
              </div>

              <div className={styles.bookingDetails}>
                <div className={styles.bookingRow}>
                  <span className={styles.bookingLabel}>Date & Time:</span>
                  <span className={styles.bookingValue}>
                    {formatDateTime(booking.start_time)}
                  </span>
                </div>

                <div className={styles.bookingRow}>
                  <span className={styles.bookingLabel}>Duration:</span>
                  <span className={styles.bookingValue}>
                    {formatDuration(booking.duration)}
                  </span>
                </div>

                {instructorId && (
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingLabel}>Client:</span>
                    <span className={styles.bookingValue}>
                      {getClientName(booking.client)}
                    </span>
                  </div>
                )}

                {clientId && (
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingLabel}>Instructor:</span>
                    <span className={styles.bookingValue}>
                      {getInstructorName(booking.instructor)}
                    </span>
                  </div>
                )}

                <div className={styles.bookingRow}>
                  <span className={styles.bookingLabel}>Location:</span>
                  <span className={styles.bookingValue}>
                    {getAddress(booking.pool_address)}
                  </span>
                </div>

                <div className={styles.bookingRow}>
                  <span className={styles.bookingLabel}>Payment:</span>
                  <span className={styles.bookingValue}>
                    <span 
                      className={styles.paymentBadge}
                      style={{ backgroundColor: getPaymentStatusColor(booking.payment_status) }}
                    >
                      {booking.payment_status}
                    </span>
                  </span>
                </div>
              </div>

              {booking.google_event_link && (
                <div className={styles.bookingActions}>
                  <a 
                    href={booking.google_event_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.calendarLink}
                  >
                    View in Calendar
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BookingList 