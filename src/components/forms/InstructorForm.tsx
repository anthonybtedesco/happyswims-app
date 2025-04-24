'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { colors, buttonVariants } from '@/lib/colors'

export default function InstructorForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isInstructor, setIsInstructor] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address_line: '',
    city: '',
    state: '',
    zip: ''
  })

  // Fetch current user and check if they're already an instructor
  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to access this page')
        setLoading(false)
        return
      }
      
      setUserData(user)
      
      // Check if user is already an instructor
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor')
        .select('*, address:home_address(*)')
        .eq('user_id', user.id)
        .single()
      
      if (instructorError && instructorError.code !== 'PGRST116') {
        setError('Error fetching instructor data')
        setLoading(false)
        return
      }
      
      if (instructorData) {
        setIsInstructor(true)
        // Pre-fill the form with existing data
        setFormData({
          first_name: instructorData.first_name || '',
          last_name: instructorData.last_name || '',
          address_line: instructorData.address?.address_line || '',
          city: instructorData.address?.city || '',
          state: instructorData.address?.state || '',
          zip: instructorData.address?.zip || ''
        })
      }
      
      setLoading(false)
    }
    
    fetchUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      if (!userData) {
        throw new Error('User not found')
      }

      // Create address record
      const { data: addressData, error: addressError } = await supabase
        .from('address')
        .insert([{
          address_line: formData.address_line,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        }])
        .select()
        .single()

      if (addressError) throw addressError

      // Create the instructor record
      const instructorData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_id: userData.id,
        home_address: addressData.id
      }

      const { error: instructorError } = await supabase
        .from('instructor')
        .insert([instructorData])

      if (instructorError) {
        throw instructorError
      }

      setSuccess(true)
      setIsInstructor(true)
      
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: colors.text.primary
      }}>
        {isInstructor ? 'Instructor Profile' : 'Become an Instructor'}
      </h2>
      
      {isInstructor && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1.5rem',
          borderRadius: '6px',
          backgroundColor: colors.primary[50] + '20',
          color: colors.primary[500]
        }}>
          You are already registered as an instructor.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
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
              disabled={isInstructor}
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
              disabled={isInstructor}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
              Street Address
            </label>
            <input
              type="text"
              value={formData.address_line}
              onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                backgroundColor: colors.common.white
              }}
              disabled={isInstructor}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
                disabled={isInstructor}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
                disabled={isInstructor}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
                disabled={isInstructor}
              />
            </div>
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
            You are now registered as an instructor!
          </div>
        )}

        {!isInstructor && (
          <button
            type="submit"
            style={{
              ...buttonVariants.primary,
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Register as Instructor'}
          </button>
        )}
      </form>
    </div>
  )
}
