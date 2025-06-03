'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import JoinCreateOrSelect from './JoinCreateOrSelect'
import MapboxAddressAutofill from './MapboxAddressAutofill'
import UserIdSelect from './UserIdSelect'
import { useData } from '@/lib/context/DataContext'
import { AddressInput, ClientInput, InstructorInput, AvailabilityInput, BookingInput, StudentInput } from '@/lib/context/DataContext'

interface FormField {
  key: string
  label: string
  type: 'text' | 'email' | 'date' | 'select' | 'color' | 'time' | 'address'
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
        <h3 style={{ margin: 0, color: '#000' }}>Students</h3>
        <button
          type="button"
          onClick={onAddStudent}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
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
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          border: '1px dashed #d1d5db'
        }}>
          No students added yet. Click "Add Student" to create student records for this client.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map((student, index) => (
            <div key={student.id} style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: 0, color: '#000' }}>Student {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => onRemoveStudent(student.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
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
                    color: '#000',
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
                      padding: '0.5rem',
                      backgroundColor: '#fff',
                      color: '#000',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#000',
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
                      padding: '0.5rem',
                      backgroundColor: '#fff',
                      color: '#000',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
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
    addresses: contextAddresses
  } = useData()
  
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [localOptions, setLocalOptions] = useState(options)
  const isFirstRender = useRef(true)

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
          { key: 'start_time', label: 'Start Time', type: 'date', required: true },
          { key: 'end_time', label: 'End Time', type: 'date', required: true },
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
          { key: 'start_date', label: 'Start Date', type: 'date', required: true },
          { key: 'end_date', label: 'End Date', type: 'date', required: true },
          { key: 'timerange', label: 'Time Range (e.g., 14:00-16:00)', type: 'text' },
          { key: 'color', label: 'Color', type: 'color', defaultValue: '#10b981' }
        ]
      default:
        return []
    }
  }

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
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

      await onSuccess(newItem)
      onClose()
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
    
    // Check if the field is a foreign key relation (has '_id' in the name)
    if (field.key.includes('_id') && field.relatedTable) {
      // Skip rendering the home_address_id field if we have nested selections for addresses
      if (field.key === 'home_address_id' && nestedSelections?.some(nested => nested.table === 'address')) {
        return null
      }
      
      return (
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
      )
    }

    switch (field.type) {
      case 'address':
        return (
          <MapboxAddressAutofill
            value={value}
            onChange={(newValue) => handleChange(field.key, newValue)}
            onCoordinatesChange={handleCoordinatesChange}
            onAddressPartsChange={handleAddressPartsChange}
            required={field.required}
            placeholder={`Enter ${field.label}`}
          />
        )
      case 'select':
        return (
          <select
            id={field.key}
            name={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            className="form-select"
            style={{ backgroundColor: '#f5f5f5', color: '#000' }}
          >
            <option value="">Select {field.label}...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'date':
        return (
          <input
            type="datetime-local"
            id={field.key}
            name={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            className="form-input"
            style={{ backgroundColor: '#f5f5f5', color: '#000' }}
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
            className="form-input color-input"
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
            className="form-input"
            style={{ backgroundColor: '#f5f5f5', color: '#000' }}
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
                backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb',
                color: isCompleted || isActive ? 'white' : '#6b7280',
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
                color: isActive ? '#3b82f6' : '#6b7280'
              }}>
                {stepLabels[stepNum as keyof typeof stepLabels]}
              </div>
              {stepNum < totalSteps && (
                <div style={{
                  width: '30px',
                  height: '2px',
                  backgroundColor: stepNum < currentStep ? '#10b981' : '#e5e7eb',
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
        borderTop: '1px solid #e5e7eb'
      }}>
        <button 
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: currentStep === 1 ? '#f3f4f6' : '#6b7280',
            color: currentStep === 1 ? '#9ca3af' : 'white',
            border: 'none',
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
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
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
              backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
              color: 'white',
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
      
      {visibleFields.map((field) => (
        <div key={field.key} className="form-group">
          <label htmlFor={field.key} style={{ color: '#000' }}>{field.label}</label>
          {renderField(field)}
        </div>
      ))}
      
      {isAddressForm && (
        <div className="auto-populated-fields" style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
          <p>City, state, and ZIP will be auto-populated when you select an address</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
            <div style={{ flex: 2 }}>
              <input 
                type="text" 
                value={formData.city || ''} 
                readOnly 
                className="form-input"
                style={{ backgroundColor: '#f0f0f0', color: '#666', width: '100%' }}
                placeholder="City"
              />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                value={formData.state || ''} 
                readOnly 
                className="form-input"
                style={{ backgroundColor: '#f0f0f0', color: '#666', width: '100%' }}
                placeholder="State"
              />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                value={formData.zip || ''} 
                readOnly 
                className="form-input"
                style={{ backgroundColor: '#f0f0f0', color: '#666', width: '100%' }}
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
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onClose}
            className="cancel-button"
            disabled={isSubmitting}
            style={{ color: '#000' }}
          >
            Cancel
          </button>
          <button 
            type={noForm ? "button" : "submit"} 
            className="submit-button"
            disabled={isSubmitting}
            style={{ color: '#000' }}
            onClick={noForm ? handleSubmit : undefined}
          >
            {isSubmitting ? (
              <span className="loading-spinner"></span>
            ) : (
              'Create'
            )}
          </button>
        </div>
      )}
    </>
  )

  return (
    <div className="create-form-container" style={{ backgroundColor: '#fff', color: '#000' }}>
      <div className="create-form-header">
        <h2>Create {table.charAt(0).toUpperCase() + table.slice(1)}</h2>
        <button 
          type="button" 
          className="close-button"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {errorMessage && (
        <div className="error-message" style={{ color: 'red' }}>
          {errorMessage}
        </div>
      )}

      {noForm ? (
        <div style={{ backgroundColor: '#fff', color: '#000' }}>
          {formContent}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', color: '#000' }}>
          {formContent}
        </form>
      )}
    </div>
  )
} 