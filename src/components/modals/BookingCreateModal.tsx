'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supbase/client'
import { colors, buttonVariants } from '@/lib/colors'

type Instructor = {
  id: string
}

type Client = {
  id: string
  first_name: string
  last_name: string
}

type Address = {
  id: string
  address_line: string
  city: string
  state: string
  zip: string
}

type BookingCreateModalProps = {
  isOpen: boolean
  onClose: () => void
  instructors: Instructor[]
  clients: Client[]
  addresses: Address[]
}

export default function BookingCreateModal({ isOpen, onClose, instructors, clients, addresses }: BookingCreateModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    instructor_id: '',
    pool_address: '',
    start_time: '',
    duration: 30,
    recurrence_weeks: 0,
    status: 'scheduled'
  })

  const [addressData, setAddressData] = useState({
    address_line: '',
    city: '',
    state: '',
    zip: ''
  })

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log("addressData", addressData)
      const { data, error } = await supabase
        .from('address')
        .insert([addressData])
        .select()

      console.log("data", data)

      if (error) throw error

      if (data) {
        setFormData({ ...formData, pool_address: data[0].id })
        setShowAddressForm(false)
      }
    } catch (err: any) {
      setError(err.message)
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
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: colors.common.white,
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: colors.text.primary
          }}>
            Create New Booking
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: colors.text.secondary
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Client
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Instructor
              </label>
              <select
                value={formData.instructor_id}
                onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              >
                <option value="">Select Instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Pool Address
              </label>
              {!showAddressForm ? (
                <>
                  <select
                    value={formData.pool_address}
                    onChange={(e) => setFormData({ ...formData, pool_address: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border.light}`,
                      backgroundColor: colors.common.white
                    }}
                  >
                    <option value="">Select Pool</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.address_line}, {address.city}, {address.state} {address.zip}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    style={{
                      marginTop: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    + Add New Address
                  </button>
                </>
              ) : (
                <div style={{ border: `1px solid ${colors.border.light}`, padding: '1rem', borderRadius: '6px' }}>
                  <form onSubmit={handleAddressSubmit}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <input
                        placeholder="Address Line"
                        value={addressData.address_line}
                        onChange={(e) => setAddressData({ ...addressData, address_line: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border.light}`,
                          backgroundColor: colors.common.white
                        }}
                      />
                      <input
                        placeholder="City"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border.light}`,
                          backgroundColor: colors.common.white
                        }}
                      />
                      <input
                        placeholder="State"
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border.light}`,
                          backgroundColor: colors.common.white
                        }}
                      />
                      <input
                        placeholder="ZIP Code"
                        value={addressData.zip}
                        onChange={(e) => setAddressData({ ...addressData, zip: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border.light}`,
                          backgroundColor: colors.common.white
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        type="submit"
                        style={{
                          ...buttonVariants.primary,
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        style={{
                          ...buttonVariants.secondary,
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Duration (minutes)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Recurrence (weeks)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={formData.recurrence_weeks}
                onChange={(e) => setFormData({ ...formData, recurrence_weeks: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              backgroundColor: colors.status.error + '20',
              color: colors.status.error
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              backgroundColor: colors.status.success + '20',
              color: colors.status.success
            }}>
              Booking created successfully!
            </div>
          )}

          <button
            type="submit"
            style={{
              ...buttonVariants.primary,
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Create Booking
          </button>
        </form>
      </div>
    </div>
  )
}