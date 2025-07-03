'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MapboxAddressAutofill from './MapboxAddressAutofill'

interface InstructorOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  instructorId: string
}

interface AddressData {
  address_line: string
  city: string
  state: string
  zip: string
  latitude?: number
  longitude?: number
}

interface InstructorData {
  first_name: string
  last_name: string
  phone_number: string
  address: AddressData
}

export default function InstructorOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  instructorId
}: InstructorOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [formData, setFormData] = useState<InstructorData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: {
      address_line: '',
      city: '',
      state: '',
      zip: ''
    }
  })

  const totalSteps = 3

  useEffect(() => {
    if (isOpen && instructorId) {
      fetchInstructorData()
    }
  }, [isOpen, instructorId])

  async function fetchInstructorData() {
    setInitialLoading(true)
    try {
      const { data: instructor, error: instructorError } = await supabase
        .from('instructor')
        .select('first_name, last_name, phone_number, home_address_id')
        .eq('id', instructorId)
        .single()

      if (instructorError) {
        console.error('Error fetching instructor:', instructorError)
        return
      }

      if (instructor) {
        let addressData = {
          address_line: '',
          city: '',
          state: '',
          zip: '',
          latitude: undefined as number | undefined,
          longitude: undefined as number | undefined
        }

        if (instructor.home_address_id) {
          const { data: address, error: addressError } = await supabase
            .from('address')
            .select('address_line, city, state, zip, latitude, longitude')
            .eq('id', instructor.home_address_id)
            .single()

          if (!addressError && address) {
            addressData = {
              address_line: address.address_line || '',
              city: address.city || '',
              state: address.state || '',
              zip: address.zip || '',
              latitude: address.latitude || undefined,
              longitude: address.longitude || undefined
            }
          }
        }

        setFormData({
          first_name: instructor.first_name || '',
          last_name: instructor.last_name || '',
          phone_number: instructor.phone_number || '',
          address: addressData
        })
      }
    } catch (error) {
      console.error('Error fetching instructor data:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  function handleInputChange(field: keyof Omit<InstructorData, 'address'>, value: string) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function handleAddressChange(value: string) {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        address_line: value
      }
    }))
  }

  function handleAddressPartsChange(parts: AddressData) {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        ...parts
      }
    }))
  }

  function handleCoordinatesChange(lat: number, lng: number) {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        latitude: lat,
        longitude: lng
      }
    }))
  }

  function formatPhoneNumber(value: string) {
    const phoneNumber = value.replace(/\D/g, '')
    if (phoneNumber.length <= 3) {
      return phoneNumber
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    }
  }

  function handlePhoneChange(value: string) {
    const formatted = formatPhoneNumber(value)
    handleInputChange('phone_number', formatted)
  }

  async function handleNext() {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      await handleSubmit()
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Current user:', user)
      console.log('Auth error:', authError)
      console.log('User email:', user?.email)

      if (authError || !user) {
        console.error('User not authenticated:', authError)
        return
      }

      let addressId = null

      if (formData.address.address_line && formData.address.city && formData.address.state && formData.address.zip) {
        const { data: addressData, error: addressError } = await supabase
          .from('address')
          .insert({
            address_line: formData.address.address_line,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.zip,
            latitude: formData.address.latitude,
            longitude: formData.address.longitude
          })
          .select()
          .single()

        if (addressError) {
          console.error('Error creating address:', addressError)
          return
        }

        addressId = addressData.id
      }

      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        user_id: user.id,
        ...(addressId && { home_address_id: addressId })
      }

      console.log('Updating instructor with data:', updateData)
      console.log('Instructor ID:', instructorId)

      const { data, error: instructorError } = await supabase
        .from('instructor')
        .update(updateData)
        .eq('id', instructorId)
        .select()

      console.log('Update response data:', data)
      console.log('Update response error:', instructorError)

      if (instructorError) {
        console.error('Error updating instructor:', instructorError)
        return
      }

      onComplete()
    } catch (error) {
      console.error('Error during onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  function canProceedToNext() {
    switch (currentStep) {
      case 1:
        return formData.first_name.trim() && formData.last_name.trim()
      case 2:
        return formData.phone_number.replace(/\D/g, '').length >= 10
      case 3:
        const hasAnyAddressField = formData.address.address_line.trim() || 
                                  formData.address.city.trim() || 
                                  formData.address.state.trim() || 
                                  formData.address.zip.trim()
        
        if (hasAnyAddressField) {
          console.log('Address validation: At least one field is filled')
          console.log('Address fields:', {
            address_line: formData.address.address_line,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.zip
          })
        }
        
        return formData.address.address_line.trim() && 
               formData.address.city.trim() && 
               formData.address.state.trim() && 
               formData.address.zip.trim()
      default:
        return false
    }
  }

  if (!isOpen) return null

  if (initialLoading) {
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
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div>Loading instructor data...</div>
        </div>
      </div>
    )
  }

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
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            Complete Your Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#6b7280',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          gap: '0.5rem'
        }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: i + 1 <= currentStep ? '#007bff' : '#e9ecef',
                borderRadius: '2px',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </div>

        {currentStep === 1 && (
          <div>
            <h3 style={{ 
              marginBottom: '1.5rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151'
            }}>Personal Information</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your first name"
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your last name"
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h3 style={{ 
              marginBottom: '1.5rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151'
            }}>Contact Information</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handlePhoneChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="(555) 123-4567"
                autoComplete="tel"
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h3 style={{ 
              marginBottom: '1.5rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151'
            }}>Home Address</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Address *
              </label>
              <MapboxAddressAutofill
                value={formData.address.address_line}
                onChange={handleAddressChange}
                onAddressPartsChange={handleAddressPartsChange}
                onCoordinatesChange={handleCoordinatesChange}
                required
                placeholder="Enter your home address"
              />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="City"
                  autoComplete="address-level2"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007bff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  State *
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="State"
                  autoComplete="address-level1"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007bff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                ZIP Code *
              </label>
              <input
                type="text"
                value={formData.address.zip}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, zip: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="ZIP Code"
                autoComplete="postal-code"
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem',
          gap: '1rem'
        }}>
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{
              padding: '0.875rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 1 ? 0.5 : 1,
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
              flex: 1,
              maxWidth: '120px'
            }}
            onMouseEnter={(e) => {
              if (currentStep !== 1) {
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.borderColor = '#9ca3af'
              }
            }}
            onMouseLeave={(e) => {
              if (currentStep !== 1) {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#d1d5db'
              }
            }}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceedToNext() || loading}
            style={{
              padding: '0.875rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: canProceedToNext() && !loading ? '#007bff' : '#e9ecef',
              color: 'white',
              cursor: canProceedToNext() && !loading ? 'pointer' : 'not-allowed',
              opacity: canProceedToNext() && !loading ? 1 : 0.5,
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
              flex: 1,
              maxWidth: '120px'
            }}
            onMouseEnter={(e) => {
              if (canProceedToNext() && !loading) {
                e.currentTarget.style.backgroundColor = '#0056b3'
              }
            }}
            onMouseLeave={(e) => {
              if (canProceedToNext() && !loading) {
                e.currentTarget.style.backgroundColor = '#007bff'
              }
            }}
          >
            {loading ? 'Saving...' : currentStep === totalSteps ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
} 