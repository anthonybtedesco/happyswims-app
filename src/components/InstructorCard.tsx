'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MapComponent from './Maps/MapComponent'
import styles from './InstructorCard.module.css'

interface Address {
  id: string
  address_line: string
  city: string
  state: string
  zip: string
  latitude?: number
  longitude?: number
}

interface Instructor {
  id: string
  first_name: string
  last_name: string
  phone_number: string
  home_address_id: string
  home_address?: Address
}

interface InstructorCardProps {
  instructorId: string
  className?: string
}

function InstructorCard({ instructorId, className = '' }: InstructorCardProps) {
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInstructorData() {
      try {
        setLoading(true)
        setError(null)

        const { data: instructorData, error: instructorError } = await supabase
          .from('instructor')
          .select(`
            id,
            first_name,
            last_name,
            phone_number,
            home_address_id,
            home_address:address!home_address_id(
              id,
              address_line,
              city,
              state,
              zip,
              latitude,
              longitude
            )
          `)
          .eq('id', instructorId)
          .single()

        if (instructorError) {
          throw instructorError
        }

        console.log('Raw instructor data:', instructorData)
        console.log('Home address data:', instructorData.home_address)

        const transformedData: Instructor = {
          id: instructorData.id,
          first_name: instructorData.first_name,
          last_name: instructorData.last_name,
          phone_number: instructorData.phone_number,
          home_address_id: instructorData.home_address_id,
          home_address: instructorData.home_address ? {
            id: (instructorData.home_address as any).id,
            address_line: (instructorData.home_address as any).address_line,
            city: (instructorData.home_address as any).city,
            state: (instructorData.home_address as any).state,
            zip: (instructorData.home_address as any).zip,
            latitude: (instructorData.home_address as any).latitude,
            longitude: (instructorData.home_address as any).longitude
          } : undefined
        }

        console.log('Transformed data:', transformedData)
        console.log('Home address in transformed data:', transformedData.home_address)

        setInstructor(transformedData)
      } catch (err: any) {
        console.error('Error fetching instructor data:', err)
        setError(err.message || 'Failed to load instructor data')
      } finally {
        setLoading(false)
      }
    }

    if (instructorId) {
      fetchInstructorData()
    }
  }, [instructorId])

  if (loading) {
    return (
      <div className={`${styles.instructorCardLoading} ${className}`}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading instructor information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${styles.instructorCardError} ${className}`}>
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!instructor) {
    return (
      <div className={`${styles.instructorCardError} ${className}`}>
        <p>Instructor not found</p>
      </div>
    )
  }

  const addresses = instructor.home_address ? [instructor.home_address] : []

  console.log('Addresses array for map:', addresses)
  console.log('Instructor home address:', instructor.home_address)

  return (
    <div className={`${styles.instructorCard} ${className}`}>
      <div className={styles.instructorInfo}>
        <div className={styles.instructorHeader}>
          <h2 className={styles.instructorName}>
            {instructor.first_name} {instructor.last_name}
          </h2>
          <div className={styles.instructorId}>ID: {instructor.id}</div>
        </div>
        
        <div className={styles.instructorDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Phone:</span>
            <span className={styles.detailValue}>{instructor.phone_number || 'Not provided'}</span>
          </div>
          
          {instructor.home_address && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Home Address:</span>
              <span className={styles.detailValue}>
                {instructor.home_address.address_line}, {instructor.home_address.city}, {instructor.home_address.state} {instructor.home_address.zip}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.instructorMap}>
        <h3 className={styles.mapTitle}>
          {instructor.home_address && instructor.home_address.latitude && instructor.home_address.longitude ? 'Home Location' : 'Location Map'}
        </h3>
        <MapComponent
          key={`map-${instructor.id}-${addresses.length}`}
          addresses={addresses}
          height="300px"
          defaultMarkerColor="#3b82f6"
        />
        {instructor.home_address && (!instructor.home_address.latitude || !instructor.home_address.longitude) && (
          <p className={styles.warningMessage}>
            ⚠️ Address coordinates not available. Please update your address to include latitude and longitude.
          </p>
        )}
        {!instructor.home_address && (
          <p className={styles.infoMessage}>
            No home address configured. Please update your profile to add a home address.
          </p>
        )}
      </div>
    </div>
  )
}

export default InstructorCard 