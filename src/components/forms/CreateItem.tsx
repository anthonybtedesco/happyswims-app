'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import JoinCreateOrSelect from './JoinCreateOrSelect'
import MapboxAddressAutofill from './MapboxAddressAutofill'
import UserIdSelect from './UserIdSelect'
import DateTimePicker from '@/components/DateTimePicker'
import { MapComponent, calculateMatrix } from '@/lib/mapbox'
import InstructorList from '../InstructorList'
import { useData } from '@/lib/context/DataContext'
import { AddressInput, ClientInput, InstructorInput, AvailabilityInput, BookingInput, StudentInput } from '@/lib/context/DataContext'
import { colors, buttonVariants } from '@/lib/colors'
import AutofillAddress from '@/lib/mapbox/AutofillAddress'
import { geocodeNewAddress } from '@/lib/geocoding'
import '@/styles/map.css'
import { Instructor } from '@/lib/types/supabase'

// Extended instructor type that includes travel time
type InstructorWithTravelTime = Instructor & {
  travel_time_seconds?: number | null;
  specialties?: string;
}

interface FormField {
  key: string
  label: string
  type: 'text' | 'email' | 'date' | 'datetime' | 'select' | 'color' | 'time' | 'address'
  required?: boolean
  options?: { value: string; label: string }[]
  defaultValue?: any
  relatedTable?: string
  step?: number // Add step property for multi-step forms
}

interface CreateItemProps {
  table: string
  onClose: () => void
  onSuccess: (newItem: any) => Promise<void>
  options?: {
    instructors?: { id: string; first_name: string; last_name: string }[]
    clients?: { id: string; first_name: string; last_name: string }[]
    addresses?: { id: string; address_line: string }[]
  }
  noForm?: boolean
  nestedSelections?: {
    table: string
    label: string
    options: { value: string; label: string }[]
    onItemCreated?: (newItem: any) => void
  }[]
}

// Move StudentsManager outside the main component to prevent recreation
interface StudentsManagerProps {
  students: Array<{id: string, first_name: string, birthdate: string}>
  onAddStudent: () => void
  onRemoveStudent: (studentId: string) => void
  onUpdateStudent: (studentId: string, field: string, value: string) => void
}

const StudentsManager = React.memo(({ students, onAddStudent, onRemoveStudent, onUpdateStudent }: StudentsManagerProps) => {
  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, color: colors.text.primary, fontSize: '1.125rem', fontWeight: '600' }}>Students</h3>
        <button
          type="button"
          onClick={onAddStudent}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: buttonVariants.primary.background,
            color: buttonVariants.primary.text,
            border: buttonVariants.primary.border,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Add Student
        </button>
      </div>
      
      {students.length === 0 ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: colors.text.secondary,
          backgroundColor: colors.gray[50],
          borderRadius: '8px',
          border: `2px dashed ${colors.border.light}`
        }}>
          No students added yet. Click "Add Student" to create student records for this client.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map((student, index) => (
            <div key={student.id} style={{
              padding: '1.5rem',
              backgroundColor: colors.gray[50],
              borderRadius: '8px',
              border: `1px solid ${colors.border.light}`
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h4 style={{ 
                  margin: 0, 
                  color: colors.text.primary,
                  fontSize: '1rem',
                  fontWeight: '500'
                }}>
                  Student {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => onRemoveStudent(student.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: colors.status.error,
                    color: colors.common.white,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Remove
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: colors.text.secondary,
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={student.first_name}
                    onChange={(e) => onUpdateStudent(student.id, 'first_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: colors.common.white,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border.light}`,
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: colors.text.secondary,
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={student.birthdate}
                    onChange={(e) => onUpdateStudent(student.id, 'birthdate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: colors.common.white,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border.light}`,
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default function CreateItem({ table, onClose, onSuccess, options = {}, noForm = false, nestedSelections }: CreateItemProps) {
  const { 
    createClient, 
    createInstructor, 
    createAddress, 
    createAvailability, 
    createBooking,
    createStudent,
    instructors: contextInstructors,
    clients: contextClients,
    addresses: contextAddresses,
    availabilities
  } = useData()
  
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [localOptions, setLocalOptions] = useState(options)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [instructorsWithTravelTime, setInstructorsWithTravelTime] = useState<InstructorWithTravelTime[]>(contextInstructors)
  const isFirstRender = useRef(true)

  // Use a ref to track processing state to prevent infinite loops
  const isCalculatingRef = useRef(false)
  // Track which addresses have been processed
  const processedAddressesRef = useRef<Set<string>>(new Set())

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1)
  const isMultiStep = table === 'client' || table === 'instructor'
  const totalSteps = isMultiStep ? (table === 'client' ? 4 : 3) : 1

  const stepLabels = {
    1: 'User',
    2: 'Address', 
    3: 'Names',
    4: 'Students'
  }

  // Student management for client creation
  const [students, setStudents] = useState<Array<{id: string, first_name: string, birthdate: string}>>([])
  const [studentIdCounter, setStudentIdCounter] = useState(0)

  // Address form data for inline address creation
  const [addressData, setAddressData] = useState({
    address_line: '',
    city: '',
    state: '',
    zip: ''
  })
  
  // Track which address field is being created
  const [addressFieldContext, setAddressFieldContext] = useState<string>('')

  // Add a new student entry
  const addStudent = useCallback(() => {
    const newId = `student_${studentIdCounter}_${Date.now()}`
    setStudents(prev => [...prev, {
      id: newId,
      first_name: '',
      birthdate: ''
    }])
    setStudentIdCounter(prev => prev + 1)
  }, [studentIdCounter])

  // Remove a student entry
  const removeStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(student => student.id !== studentId))
  }, [])

  // Update student data
  const updateStudent = useCallback((studentId: string, field: string, value: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: value }
        : student
    ))
  }, [])

  // Update local options with context data
  useEffect(() => {
    const mergedOptions = {
      instructors: contextInstructors.length > 0 
        ? contextInstructors 
        : options.instructors || [],
      clients: contextClients.length > 0 
        ? contextClients 
        : options.clients || [],
      addresses: contextAddresses.length > 0 
        ? contextAddresses 
        : options.addresses || []
    }
    
    setLocalOptions(mergedOptions)
  }, [contextInstructors, contextClients, contextAddresses, options])

  // Update instructorsWithTravelTime when instructors change
  useEffect(() => {
    setInstructorsWithTravelTime(contextInstructors)
  }, [contextInstructors])

  // Calculate travel times when pool address is selected (for bookings)
  useEffect(() => {
    async function calculateTravelTimes() {
      // Only calculate for booking forms with pool address
      if (table !== 'booking' || isCalculatingRef.current) {
        return
      }
      
      if (!formData.pool_address_id || contextInstructors.length === 0) {
        setInstructorsWithTravelTime(contextInstructors)
        return
      }
      
      // Check if we've already processed this address to avoid infinite loops
      if (processedAddressesRef.current.has(formData.pool_address_id)) {
        return
      }

      try {
        isCalculatingRef.current = true
        console.log('Calculating travel times for instructors to pool:', formData.pool_address_id)
        
        // Find selected pool address
        const selectedPool = contextAddresses.find(addr => addr.id === formData.pool_address_id)
        
        if (!selectedPool || !selectedPool.latitude || !selectedPool.longitude) {
          console.error('Failed to get coordinates for pool address:', selectedPool)
          setInstructorsWithTravelTime(contextInstructors)
          isCalculatingRef.current = false
          return
        }
        
        // Mark this address as processed to avoid repeated processing
        processedAddressesRef.current.add(formData.pool_address_id)
        
        if (contextInstructors.length === 0) {
          console.warn('No instructors have valid home address coordinates after processing')
          setInstructorsWithTravelTime(contextInstructors)
          isCalculatingRef.current = false
          return
        }

        console.log(`Found ${contextInstructors.length} instructors with valid home addresses`)

        // Process instructors in batches of 10
        const BATCH_SIZE = 10
        const updatedInstructors: InstructorWithTravelTime[] = [...contextInstructors]
        const destination = [{ lat: selectedPool.latitude!, lng: selectedPool.longitude! }]

        for (let i = 0; i < contextInstructors.length; i += BATCH_SIZE) {
          const batch = contextInstructors.slice(i, i + BATCH_SIZE)
          const sources = batch.map(inst => {
            const homeAddress = contextAddresses.find(addr => addr.id === inst.home_address_id)
            return {
              lat: homeAddress?.latitude,
              lng: homeAddress?.longitude
            }
          }).filter(coord => coord.lat !== undefined && coord.lng !== undefined)

          console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} with ${sources.length} instructors`)
          const result = await calculateMatrix(sources as {lat: number, lng: number}[], destination as {lat: number, lng: number}[])
          
          // Update instructors in this batch with their travel times
          batch.forEach((instructor, batchIndex) => {
            const index = i + batchIndex
            if (result.durations && result.durations[batchIndex]) {
              updatedInstructors[index] = {
                ...instructor,
                travel_time_seconds: result.durations[batchIndex][0]
              }
            }
          })

          // Add a small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < contextInstructors.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        // Sort instructors by travel time (instructors without travel time at the end)
        updatedInstructors.sort((a, b) => {
          const aTravelTime = 'travel_time_seconds' in a ? a.travel_time_seconds : undefined
          const bTravelTime = 'travel_time_seconds' in b ? b.travel_time_seconds : undefined
          
          if (aTravelTime === undefined && bTravelTime === undefined) return 0
          if (aTravelTime === undefined) return 1
          if (bTravelTime === undefined) return -1
          return aTravelTime! - bTravelTime!
        })

        console.log('Updated instructors with travel times:', updatedInstructors)
        setInstructorsWithTravelTime(updatedInstructors)
      } catch (err) {
        console.error('Error calculating travel times:', err)
        setErrorMessage(`Failed to calculate travel times: ${err instanceof Error ? err.message : String(err)}`)
        setInstructorsWithTravelTime(contextInstructors)
      } finally {
        isCalculatingRef.current = false
      }
    }

    calculateTravelTimes()
  }, [table, formData.pool_address_id, contextInstructors, contextAddresses])

  // Define form fields based on table
  const getFormFields = (): FormField[] => {
    switch (table) {
      case 'client':
        return [
          {
            key: 'user_id',
            label: 'User ID',
            type: 'text',
            required: true,
            step: 1
          },
          { 
            key: 'home_address_id', 
            label: 'Home Address', 
            type: 'select',
            relatedTable: 'address',
            options: localOptions.addresses?.map(addr => ({
              value: addr.id,
              label: addr.address_line
            })) || [],
            step: 2
          },
          { key: 'first_name', label: 'First Name', type: 'text', required: true, step: 3 },
          { key: 'last_name', label: 'Last Name', type: 'text', required: true, step: 3 }
        ]
      case 'instructor':
        return [
          { key: 'user_id', label: 'User ID', type: 'text', required: true, step: 1 },
          { 
            key: 'home_address_id', 
            label: 'Home Address', 
            type: 'select',
            relatedTable: 'address',
            options: localOptions.addresses?.map(addr => ({
              value: addr.id,
              label: addr.address_line
            })) || [],
            step: 2
          },
          { key: 'first_name', label: 'First Name', type: 'text', required: true, step: 3 },
          { key: 'last_name', label: 'Last Name', type: 'text', required: true, step: 3 }
        ]
      case 'student':
        return [
          { key: 'first_name', label: 'First Name', type: 'text', required: true },
          { 
            key: 'client_id', 
            label: 'Client', 
            type: 'select',
            required: true,
            relatedTable: 'client',
            options: localOptions.clients?.map(client => ({
              value: client.id,
              label: `${client.first_name} ${client.last_name}`
            })) || []
          },
          { key: 'birthdate', label: 'Birth Date', type: 'date', required: true }
        ]
      case 'booking':
        return [
          { 
            key: 'client_id', 
            label: 'Client', 
            type: 'select',
            required: true,
            relatedTable: 'client',
            options: localOptions.clients?.map(client => ({
              value: client.id,
              label: `${client.first_name} ${client.last_name}`
            })) || []
          },
          { key: 'start_time', label: 'Start Time', type: 'datetime', required: true },
          { key: 'end_time', label: 'End Time', type: 'datetime', required: true },
          { 
            key: 'pool_address_id', 
            label: 'Pool Address', 
            type: 'select',
            required: true,
            relatedTable: 'address',
            options: contextAddresses?.map(addr => ({
              value: addr.id,
              label: `${addr.address_line}, ${addr.city}, ${addr.state} ${addr.zip}`
            })) || []
          },
          { 
            key: 'status', 
            label: 'Status', 
            type: 'select',
            options: [
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ],
            defaultValue: 'scheduled'
          },
          { 
            key: 'instructor_id', 
            label: 'Instructor', 
            type: 'select',
            required: true,
            relatedTable: 'instructor',
            options: localOptions.instructors?.map(instructor => ({
              value: instructor.id,
              label: `${instructor.first_name} ${instructor.last_name}`
            })) || []
          }
        ]
      case 'address':
        return [
          { key: 'address_line', label: 'Address', type: 'address', required: true },
          { key: 'city', label: 'City', type: 'text', required: true },
          { key: 'state', label: 'State', type: 'text', required: true },
          { key: 'zip', label: 'ZIP', type: 'text', required: true },
          { key: 'latitude', label: 'Latitude', type: 'text' },
          { key: 'longitude', label: 'Longitude', type: 'text' }
        ]
      case 'availability':
        return [
          { 
            key: 'instructor_id', 
            label: 'Instructor', 
            type: 'select',
            required: true,
            relatedTable: 'instructor',
            options: localOptions.instructors?.map(instructor => ({
              value: instructor.id,
              label: `${instructor.first_name} ${instructor.last_name}`
            })) || []
          },
          { key: 'start_date', label: 'Start Date', type: 'datetime', required: true },
          { key: 'end_date', label: 'End Date', type: 'datetime', required: true },
          { key: 'timerange', label: 'Time Range (e.g., 14:00-16:00)', type: 'text' },
          { key: 'color', label: 'Color', type: 'color', defaultValue: '#10b981' }
        ]
      default:
        return []
    }
  }

  const handleChange = (key: string, value: any) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [key]: value
      }
      
      // For booking forms, when client_id changes, set pool_address_id to client's home_address_id
      if (table === 'booking' && key === 'client_id' && value) {
        const selectedClient = contextClients.find(client => client.id === value)
        if (selectedClient && selectedClient.home_address_id) {
          newFormData.pool_address_id = selectedClient.home_address_id
        }
      }
      
      return newFormData
    })
  }

  const handleCoordinatesChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
  }
  
  const handleAddressPartsChange = (parts: {
    address_line: string;
    city: string;
    state: string;
    zip: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address_line: parts.address_line,
      city: parts.city,
      state: parts.state,
      zip: parts.zip
    }))
  }

  // Handle inline address creation
  const handleAddressSubmit = async () => {
    try {
      setErrorMessage('')
      
      if (!addressData.address_line || !addressData.city || !addressData.state || !addressData.zip) {
        setErrorMessage("All address fields are required")
        return
      }
      
      const coordinates = await geocodeNewAddress(
        addressData.address_line,
        addressData.city,
        addressData.state,
        addressData.zip
      )
      
      const addressInsertData = {
        ...addressData,
        ...(coordinates && { 
          latitude: coordinates[1],
          longitude: coordinates[0]
        })
      }
      
      const newAddress = await createAddress(addressInsertData as AddressInput)

      if (!newAddress) {
        throw new Error("Failed to create address")
      }

      // Update the correct field based on context
      if (addressFieldContext) {
        setFormData(prev => ({ ...prev, [addressFieldContext]: newAddress.id }))
      }
      setShowAddressForm(false)
      setAddressData({ address_line: '', city: '', state: '', zip: '' })
      setAddressFieldContext('')
    } catch (err: any) {
      setErrorMessage(`Failed to save address: ${err.message || String(err)}`)
    }
  }

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const fields = getFormFields()
    const currentStepFields = fields.filter(field => 
      isMultiStep ? field.step === currentStep : true
    )
    
    // Validate regular form fields
    for (const field of currentStepFields) {
      if (field.required && !formData[field.key]) {
        setErrorMessage(`${field.label} is required`)
        return false
      }
    }
    
    // Special validation for students step (step 4 for clients)
    if (table === 'client' && currentStep === 4) {
      // Students are optional, but if any are added, they must be valid
      for (const student of students) {
        if (student.first_name.trim() && !student.birthdate) {
          setErrorMessage('Birth date is required for all students')
          return false
        }
        if (student.birthdate && !student.first_name.trim()) {
          setErrorMessage('First name is required for all students')
          return false
        }
      }
    }
    
    setErrorMessage('')
    return true
  }

  // Navigate to next step
  const handleNextStep = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  // Navigate to previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For multi-step forms, validate current step first
    if (isMultiStep && !validateCurrentStep()) {
      return
    }
    
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const fields = getFormFields()
      const dataWithDefaults = { ...formData }
      
      fields.forEach(field => {
        if (field.defaultValue && !dataWithDefaults[field.key]) {
          dataWithDefaults[field.key] = field.defaultValue
        }
      })

      let newItem = null

      // Use the appropriate create function from context with type assertion
      switch (table) {
        case 'client':
          // Verify required fields are present
          if (!dataWithDefaults.first_name || !dataWithDefaults.last_name || 
              !dataWithDefaults.user_id || !dataWithDefaults.home_address_id) {
            throw new Error('Missing required fields for client')
          }
          newItem = await createClient(dataWithDefaults as ClientInput)
          
          // Create associated students if any
          if (newItem && students.length > 0) {
            const validStudents = students.filter(student => 
              student.first_name.trim() && student.birthdate
            )
            
            for (const student of validStudents) {
              try {
                await createStudent({
                  first_name: student.first_name.trim(),
                  birthdate: student.birthdate,
                  client_id: newItem.id
                })
              } catch (studentError) {
                console.error('Error creating student:', studentError)
                // Continue creating other students even if one fails
              }
            }
          }
          break
        case 'instructor':
          // Verify required fields are present
          if (!dataWithDefaults.first_name || !dataWithDefaults.last_name || 
              !dataWithDefaults.user_id) {
            throw new Error('Missing required fields for instructor')
          }
          newItem = await createInstructor(dataWithDefaults as InstructorInput)
          break
        case 'student':
          // Verify required fields are present
          if (!dataWithDefaults.first_name || !dataWithDefaults.client_id || 
              !dataWithDefaults.birthdate) {
            throw new Error('Missing required fields for student')
          }
          newItem = await createStudent(dataWithDefaults as StudentInput)
          break
        case 'address':
          // Verify required fields are present
          if (!dataWithDefaults.address_line || !dataWithDefaults.city || 
              !dataWithDefaults.state || !dataWithDefaults.zip) {
            throw new Error('Missing required fields for address')
          }
          newItem = await createAddress(dataWithDefaults as AddressInput)
          break
        case 'availability':
          // Verify required fields are present
          if (!dataWithDefaults.instructor_id) {
            throw new Error('Missing required instructor_id for availability')
          }
          newItem = await createAvailability(dataWithDefaults as AvailabilityInput)
          break
        case 'booking':
          // Verify required fields are present
          if (!dataWithDefaults.client_id || !dataWithDefaults.instructor_id || 
              !dataWithDefaults.pool_address_id || !dataWithDefaults.start_time || 
              !dataWithDefaults.end_time) {
            throw new Error('Missing required fields for booking')
          }
          newItem = await createBooking(dataWithDefaults as BookingInput)
          break
        default:
          throw new Error(`Unknown table: ${table}`)
      }

      if (!newItem) {
        throw new Error(`Failed to create ${table}`)
      }

      setSuccessMessage(`${table.charAt(0).toUpperCase() + table.slice(1)} created successfully!`)
      await onSuccess(newItem)
      
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: any) {
      console.error('Error creating item:', error)
      setErrorMessage(error.message || 'Failed to create item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.key] || field.defaultValue || ''
    
    // Special handling for user_id field in client and instructor forms
    if (field.key === 'user_id' && (table === 'client' || table === 'instructor')) {
      return (
        <UserIdSelect
          value={value}
          onChange={(newValue) => handleChange(field.key, newValue)}
          required={field.required}
        />
      )
    }
    
    // Special handling for instructor selection in booking forms
    if (field.key === 'instructor_id' && table === 'booking') {
      return (
        <InstructorList
          instructors={instructorsWithTravelTime}
          availabilities={availabilities}
          selectedInstructorId={value || ''}
          onInstructorSelect={(id) => {
            console.log("Selected instructor:", id)
            handleChange(field.key, id)
          }}
          poolAddressId={formData.pool_address_id}
          startDateTime={formData.start_time}
          duration={formData.duration || 30}
          recurrenceWeeks={formData.recurrence_weeks || 0}
        />
      )
    }
    
    // Check if the field is a foreign key relation (has '_id' in the name)
    if (field.key.includes('_id') && field.relatedTable) {
      // Skip rendering the home_address_id field if we have nested selections for addresses
      if (field.key === 'home_address_id' && nestedSelections?.some(nested => nested.table === 'address')) {
        return null
      }
      
      return (
        <div>
          <JoinCreateOrSelect
            value={value}
            onChange={(newValue) => {
              handleChange(field.key, newValue)
              // If this is a nested selection, update the parent form data
              if (nestedSelections?.some(nested => nested.table === field.relatedTable)) {
                handleChange('home_address_id', newValue)
              }
            }}
            relatedTable={field.relatedTable}
            options={field.options || []}
            label={field.label}
            required={field.required}
            onItemCreated={(newItem) => {
              // Update form data with the newly created item's ID
              handleChange(field.key, newItem.id)
            }}
            nestedSelections={nestedSelections}
            addresses={localOptions.addresses}
          />
          
          {/* Show address creation form for home_address_id */}
          {(field.key === 'home_address_id' || field.key === 'pool_address_id') && !showAddressForm && (
            <button
              type="button"
              onClick={() => {
                setAddressFieldContext(field.key)
                setShowAddressForm(true)
              }}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: 'none',
                color: colors.primary[500],
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              + Add New Address
            </button>
          )}
          
          {/* Map component for address selection */}
          {(field.key === 'home_address_id' || field.key === 'pool_address_id') && contextAddresses && contextAddresses.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <MapComponent 
                addresses={contextAddresses} 
                selectedAddressId={value}
                onAddressSelect={(addressId) => {
                  console.log("Address selected from map:", addressId);
                  handleChange(field.key, addressId);
                }}
                height="250px"
              />
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.75rem', 
                color: colors.text.secondary,
                textAlign: 'right' 
              }}>
                {field.key === 'pool_address_id' 
                  ? 'Click on a marker to select the pool address for this booking.'
                  : 'Click on a marker to select an address from the map.'
                }
              </div>
            </div>
          )}
          
          {/* Inline address creation form */}
          {(field.key === 'home_address_id' || field.key === 'pool_address_id') && showAddressForm && (
            <div style={{ 
              border: `1px solid ${colors.border.light}`, 
              padding: '1rem', 
              borderRadius: '8px',
              marginTop: '0.5rem',
              backgroundColor: colors.gray[50]
            }}>
              <AutofillAddress />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleAddressSubmit}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: buttonVariants.primary.background,
                    color: buttonVariants.primary.text,
                    border: buttonVariants.primary.border,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false)
                    setAddressData({ address_line: '', city: '', state: '', zip: '' })
                    setAddressFieldContext('')
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: buttonVariants.secondary.background,
                    color: buttonVariants.secondary.text,
                    border: `1px solid ${buttonVariants.secondary.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }

    switch (field.type) {
      case 'address':
        return (
          <div>
            <MapboxAddressAutofill
              value={value}
              onChange={(newValue) => handleChange(field.key, newValue)}
              onCoordinatesChange={handleCoordinatesChange}
              onAddressPartsChange={handleAddressPartsChange}
              required={field.required}
              placeholder={`Enter ${field.label}`}
            />
            
            {/* Show map for address type fields if addresses are available */}
            {contextAddresses && contextAddresses.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <MapComponent 
                  addresses={contextAddresses} 
                  selectedAddressId={formData.selectedMapAddress || ''}
                  onAddressSelect={(addressId) => {
                    console.log("Address selected from map for address field:", addressId);
                    const selectedAddress = contextAddresses?.find(addr => addr.id === addressId);
                    if (selectedAddress) {
                      handleChange(field.key, selectedAddress.address_line);
                      handleAddressPartsChange({
                        address_line: selectedAddress.address_line,
                        city: selectedAddress.city || '',
                        state: selectedAddress.state || '',
                        zip: selectedAddress.zip || ''
                      });
                      if (selectedAddress.latitude && selectedAddress.longitude) {
                        handleCoordinatesChange(selectedAddress.latitude, selectedAddress.longitude);
                      }
                      // Track selected address for map highlighting
                      handleChange('selectedMapAddress', addressId);
                    }
                  }}
                  height="250px"
                />
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.75rem', 
                  color: colors.text.secondary,
                  textAlign: 'right' 
                }}>
                  Click on a marker to use an existing address, or enter a new one above.
                </div>
              </div>
            )}
          </div>
        )
      case 'select':
        return (
          <select
            id={field.key}
            name={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              backgroundColor: colors.common.white,
              color: colors.text.primary,
              border: `1px solid ${colors.border.light}`,
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          >
            <option value="">Select {field.label}...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'datetime':
        return (
          <DateTimePicker
            selectedDateTime={value}
            onChange={(newValue) => handleChange(field.key, newValue)}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            id={field.key}
            name={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              backgroundColor: colors.common.white,
              color: colors.text.primary,
              border: `1px solid ${colors.border.light}`,
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
        )
      case 'color':
        return (
          <input
            type="color"
            id={field.key}
            name={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            style={{
              width: '60px',
              height: '40px',
              padding: '0',
              border: `1px solid ${colors.border.light}`,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          />
        )
      default:
        return (
          <input
            type={field.type}
            id={field.key}
            name={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              backgroundColor: colors.common.white,
              color: colors.text.primary,
              border: `1px solid ${colors.border.light}`,
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
        )
    }
  }

  const fields = getFormFields()

  // Get fields for current step or all fields for non-multi-step forms
  const currentStepFields = isMultiStep 
    ? fields.filter(field => field.step === currentStep)
    : fields

  // Special handling for address form
  const isAddressForm = table === 'address'
  const visibleFields = isAddressForm 
    ? currentStepFields.filter(field => field.key !== 'city' && field.key !== 'state' && field.key !== 'zip')
    : currentStepFields

  // Step indicator component
  const StepIndicator = () => {
    if (!isMultiStep) return null
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNum = index + 1
          const isActive = stepNum === currentStep
          const isCompleted = stepNum < currentStep
          
          return (
            <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? colors.status.success : isActive ? colors.primary[500] : colors.gray[200],
                color: isCompleted || isActive ? colors.common.white : colors.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <div style={{
                marginLeft: '0.5rem',
                fontSize: '14px',
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? colors.primary[500] : colors.text.secondary
              }}>
                {stepLabels[stepNum as keyof typeof stepLabels]}
              </div>
              {stepNum < totalSteps && (
                <div style={{
                  width: '30px',
                  height: '2px',
                  backgroundColor: stepNum < currentStep ? colors.status.success : colors.gray[200],
                  marginLeft: '0.5rem'
                }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Navigation buttons for multi-step forms
  const StepNavigation = () => {
    if (!isMultiStep) return null
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: `1px solid ${colors.border.light}`
      }}>
        <button 
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: currentStep === 1 ? colors.gray[100] : buttonVariants.secondary.background,
            color: currentStep === 1 ? colors.text.disabled : buttonVariants.secondary.text,
            border: currentStep === 1 ? 'none' : `1px solid ${buttonVariants.secondary.border}`,
            borderRadius: '6px',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          Previous
        </button>
        
        {currentStep < totalSteps ? (
          <button 
            type="button"
            onClick={handleNextStep}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: buttonVariants.primary.background,
              color: buttonVariants.primary.text,
              border: buttonVariants.primary.border,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Next
          </button>
        ) : (
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isSubmitting ? colors.gray[400] : colors.status.success,
              color: colors.common.white,
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        )}
      </div>
    )
  }

  // Render form content (fields and buttons)
  const formContent = (
    <>
      <StepIndicator />
      
      <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        {visibleFields.map((field) => (
          <div key={field.key} style={{ display: 'flex', flexDirection: 'column' }}>
            <label 
              htmlFor={field.key} 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: colors.text.secondary,
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {field.label}
              {field.required && <span style={{ color: colors.status.error }}> *</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>
      
      {isAddressForm && (
        <div style={{ 
          marginTop: '1rem', 
          fontSize: '0.875rem', 
          color: colors.text.secondary,
          padding: '1rem',
          backgroundColor: colors.gray[50],
          borderRadius: '6px',
          border: `1px solid ${colors.border.light}`
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>Auto-populated fields</p>
          <p style={{ margin: '0 0 1rem 0' }}>City, state, and ZIP will be auto-populated when you select an address</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ flex: 2 }}>
              <input 
                type="text" 
                value={formData.city || ''} 
                readOnly 
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: colors.gray[100],
                  color: colors.text.disabled,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: '4px'
                }}
                placeholder="City"
              />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                value={formData.state || ''} 
                readOnly 
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: colors.gray[100],
                  color: colors.text.disabled,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: '4px'
                }}
                placeholder="State"
              />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                value={formData.zip || ''} 
                readOnly 
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: colors.gray[100],
                  color: colors.text.disabled,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: '4px'
                }}
                placeholder="ZIP"
              />
            </div>
          </div>
        </div>
      )}

      {table === 'client' && currentStep === 4 && (
        <StudentsManager
          students={students}
          onAddStudent={addStudent}
          onRemoveStudent={removeStudent}
          onUpdateStudent={updateStudent}
        />
      )}

      {isMultiStep ? (
        <StepNavigation />
      ) : (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          marginTop: '2rem'
        }}>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: buttonVariants.secondary.background,
              color: buttonVariants.secondary.text,
              border: `1px solid ${buttonVariants.secondary.border}`,
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            type={noForm ? "button" : "submit"} 
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isSubmitting ? colors.gray[400] : buttonVariants.primary.background,
              color: buttonVariants.primary.text,
              border: buttonVariants.primary.border,
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onClick={noForm ? handleSubmit : undefined}
          >
            {isSubmitting && (
              <div style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${colors.common.white}`,
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}
    </>
  )

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
            color: colors.text.primary,
            margin: 0
          }}>
            Create {table.charAt(0).toUpperCase() + table.slice(1)}
          </h2>
          <button 
            type="button" 
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

        {errorMessage && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: colors.status.error + '20',
            color: colors.status.error,
            border: `1px solid ${colors.status.error}40`
          }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: colors.status.success + '20',
            color: colors.status.success,
            border: `1px solid ${colors.status.success}40`
          }}>
            {successMessage}
          </div>
        )}

        {noForm ? (
          <div>
            {formContent}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {formContent}
          </form>
        )}
      </div>
    </div>
  )
} 