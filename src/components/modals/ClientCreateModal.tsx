'use client'

import React, { useState, useEffect } from 'react'
import { colors, buttonVariants } from '@/lib/colors'
import { adminSignUp } from '@/lib/auth'
import { geocodeNewAddress } from '@/lib/geocoding'
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox/config'
import { AddressInput, useData } from '@/lib/context/DataContext'
import AutofillAddress from '@/lib/mapbox/AutofillAddress'

type ClientCreateModalProps = {
  isOpen: boolean
  onClose: () => void
}

const DELAY_MS = 1000 // 1 second delay

export default function ClientCreateModal({ isOpen, onClose }: ClientCreateModalProps) {
  const { createAddress, createClient } = useData()
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

  // Log the token when component mounts
  useEffect(() => {
    console.log('ClientCreateModal - MAPBOX_ACCESS_TOKEN is available:', MAPBOX_ACCESS_TOKEN ? 'Yes' : 'No');
    console.log('ClientCreateModal - Token prefix:', MAPBOX_ACCESS_TOKEN.substring(0, 5) + '...');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      const { data, error } = await adminSignUp(formData.email, 'client')
      if (error) {
        setError(error.message)
        return
      }

      if (!data?.user) {
        throw new Error('Failed to create user')
      }

      // Get user ID safely from the response
      const userId = data.user.id
      if (!userId) {
        throw new Error('User ID not found in response')
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
        ...(coordinates && { 
          latitude: coordinates[1],  // Latitude is the second element in the tuple
          longitude: coordinates[0]  // Longitude is the first element in the tuple
        })
      };
      
      console.log('Creating address with data:', addressInsertData);
      
      const newAddress = await createAddress(addressInsertData as AddressInput);
      
      if (!newAddress) {
        throw new Error('Failed to create address');
      }

      // Then create the client record
      const clientData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_id: userId,
        home_address_id: newAddress.id
      }
      console.log('Client Data:', clientData)

      const newClient = await createClient(clientData);
      
      if (!newClient) {
        throw new Error('Failed to create client');
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
      }, 500)
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
            Create New Client
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
                key={`${formData.address_line}-${formData.city}-${formData.state}-${formData.zip}`}
                initialData={{
                  address_line: formData.address_line,
                  city: formData.city,
                  state: formData.state,
                  zip: formData.zip
                }}
                onChange={handleAddressChange}
              />
            </div>

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
              Client created successfully!
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
            Create Client
          </button>
        </form>
      </div>
    </div>
  )
}
