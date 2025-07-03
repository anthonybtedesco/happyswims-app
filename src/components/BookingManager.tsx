'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/types/supabase'
import styles from './BookingManager.module.css'

type Booking = Database['public']['Tables']['booking']['Row']
type BookingStatus = Database['public']['Enums']['BookingStatus']
type PaymentStatus = Database['public']['Enums']['PaymentStatus']

interface BookingManagerProps {
  instructorId?: string
  clientId?: string
  onBookingChange?: () => void
}

interface BookingFormData {
  start_time: string
  duration: number
  pool_address_id: string
  booking_status: BookingStatus
  payment_status: PaymentStatus
  notes?: string
}

function BookingManager({ instructorId, clientId, onBookingChange }: BookingManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [formData, setFormData] = useState<BookingFormData>({
    start_time: '',
    duration: 60,
    pool_address_id: '',
    booking_status: 'SCHEDULED',
    payment_status: 'PENDING'
  })

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    const { data, error } = await supabase
      .from('address')
      .select('*')
      .order('address_line', { ascending: true })

    if (!error && data) {
      setAddresses(data)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }))
  }

  function resetForm() {
    setFormData({
      start_time: '',
      duration: 60,
      pool_address_id: '',
      booking_status: 'SCHEDULED',
      payment_status: 'PENDING'
    })
    setEditingBooking(null)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const bookingData = {
      ...formData,
      instructor_id: instructorId,
      client_id: clientId,
      end_time: new Date(new Date(formData.start_time).getTime() + formData.duration * 60000).toISOString()
    }

    try {
      if (editingBooking) {
        const { error } = await supabase
          .from('booking')
          .update(bookingData)
          .eq('id', editingBooking.id)

        if (error) throw error
        setSuccess('Booking updated successfully!')
      } else {
        const { error } = await supabase
          .from('booking')
          .insert(bookingData)

        if (error) throw error
        setSuccess('Booking created successfully!')
      }

      resetForm()
      setShowForm(false)
      onBookingChange?.()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(bookingId: string) {
    if (!confirm('Are you sure you want to delete this booking?')) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('booking')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      setSuccess('Booking deleted successfully!')
      onBookingChange?.()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function editBooking(booking: Booking) {
    setEditingBooking(booking)
    setFormData({
      start_time: booking.start_time ? new Date(booking.start_time).toISOString().slice(0, 16) : '',
      duration: booking.duration || 60,
      pool_address_id: booking.pool_address_id || '',
      booking_status: booking.booking_status,
      payment_status: booking.payment_status
    })
    setShowForm(true)
  }

  function formatAddress(address: any) {
    const parts = [address.address_line, address.city, address.state, address.zip].filter(Boolean)
    return parts.join(', ')
  }

  return (
    <div className={styles.bookingManagerContainer}>
      <div className={styles.bookingManagerHeader}>
        <h3 className={styles.bookingManagerTitle}>
          {editingBooking ? 'Edit Booking' : 'Create New Booking'}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={styles.createButton}
          >
            Create Booking
          </button>
        )}
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.bookingForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date & Time</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Duration (minutes)</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  className={styles.select}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Location</label>
                <select
                  name="pool_address_id"
                  value={formData.pool_address_id}
                  onChange={handleInputChange}
                  required
                  className={styles.select}
                >
                  <option value="">Select a location</option>
                  {addresses.map(address => (
                    <option key={address.id} value={address.id}>
                      {formatAddress(address)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Booking Status</label>
                <select
                  name="booking_status"
                  value={formData.booking_status}
                  onChange={handleInputChange}
                  required
                  className={styles.select}
                >
                  <option value="INTERESTED">Interested</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="BOOKED">Booked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="IGNORED">Ignored</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Status</label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleInputChange}
                  required
                  className={styles.select}
                >
                  <option value="PENDING">Pending</option>
                  <option value="DEPOSIT">Deposit Paid</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingBooking ? 'Update Booking' : 'Create Booking')}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          {success}
        </div>
      )}
    </div>
  )
}

export default BookingManager 