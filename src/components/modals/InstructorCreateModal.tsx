'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { colors, buttonVariants } from '@/lib/colors'
import { adminSignUp } from '@/lib/auth'
import { geocodeNewAddress } from '@/lib/geocoding'
import AddressAutofillInput from '@/components/AddressAutofillInput'
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox/config'

import AutofillAddress from '@/lib/mapbox/AutofillAddress'
type InstructorCreateModalProps = {
  isOpen: boolean
  onClose: () => void
}


export default function InstructorCreateModal({ isOpen, onClose }: InstructorCreateModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address_line: '',
    city: '',
    state: '',
    zip: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      const { data, error } = await adminSignUp(formData.email, 'instructor')
      if (error) {
        setError(error.message)
        return
      }

      if (!data?.user) {
        throw new Error('Failed to create user')
      }

      console.log('Auth User:', data.user)

      // Get coordinates for the address
      console.log('Geocoding address before creating record');
      const coordinates = await geocodeNewAddress(
        formData.address_line,
        formData.city,
        formData.state,
        formData.zip
      );
      
      console.log('Geocoding results:', coordinates);

      // Create address record with coordinates if available
      const addressInsertData = {
        address_line: formData.address_line,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        ...(coordinates && { coordinates })
      };
      
      console.log('Creating address with data:', addressInsertData);

      const { data: addressData, error: addressError } = await supabase
        .from('address')
        .insert([addressInsertData])
        .select()
        .single()

      if (addressError) throw addressError

      // Then create the instructor record
      const instructorData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_id: data.user.id,
        home_address: addressData.id
      }
      console.log('Instructor Data:', instructorData)

      const { error: instructorError } = await supabase
        .from('instructor')
        .insert([instructorData])

      if (instructorError) {
        console.error('Instructor Error:', instructorError)
        throw instructorError
      }

      setSuccess(true)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        address_line: '',
        city: '',
        state: '',
        zip: ''
      })
      
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Handle address change from AutofillAddress component
  const handleAddressChange = (addressData: {
    address_line: string;
    city: string;
    state: string;
    zip: string;
  }) => {
    setFormData(prevData => ({
      ...prevData,
      ...addressData
    }));
  };

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
        maxWidth: '600px',
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
            Create New Instructor
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
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                Address
              </label>
              <AutofillAddress 
                initialData={{
                  address_line: formData.address_line,
                  city: formData.city,
                  state: formData.state,
                  zip: formData.zip
                }}
                onChange={handleAddressChange}
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
              Instructor created successfully!
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
            Create Instructor
          </button>
        </form>
      </div>
    </div>
  )
}
