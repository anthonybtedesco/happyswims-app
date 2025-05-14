'use client'
import React, { useState, useEffect, useRef } from 'react'
import JoinCreateOrSelect from './JoinCreateOrSelect'
import MapboxAddressAutofill from './MapboxAddressAutofill'
import UserIdSelect from './UserIdSelect'
import { useData } from '@/lib/context/DataContext'
import { AddressInput, ClientInput, InstructorInput, AvailabilityInput, BookingInput } from '@/lib/context/DataContext'

interface FormField {
  key: string
  label: string
  type: 'text' | 'email' | 'date' | 'select' | 'color' | 'time' | 'address'
  required?: boolean
  options?: { value: string; label: string }[]
  defaultValue?: any
  relatedTable?: string
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

export default function CreateItem({ table, onClose, onSuccess, options = {}, noForm = false, nestedSelections }: CreateItemProps) {
  const { 
    createClient, 
    createInstructor, 
    createAddress, 
    createAvailability, 
    createBooking,
    instructors: contextInstructors,
    clients: contextClients,
    addresses: contextAddresses
  } = useData()
  
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [localOptions, setLocalOptions] = useState(options)
  const isFirstRender = useRef(true)

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
          { key: 'first_name', label: 'First Name', type: 'text', required: true },
          { key: 'last_name', label: 'Last Name', type: 'text', required: true },
          { 
            key: 'home_address_id', 
            label: 'Home Address', 
            type: 'select',
            relatedTable: 'address',
            options: localOptions.addresses?.map(addr => ({
              value: addr.id,
              label: addr.address_line
            })) || []
          },
          {
            key: 'user_id',
            label: 'User ID',
            type: 'text',
            required: true
          }
        ]
      case 'instructor':
        return [
          { key: 'first_name', label: 'First Name', type: 'text', required: true },
          { key: 'last_name', label: 'Last Name', type: 'text', required: true },
          { key: 'user_id', label: 'User ID', type: 'text', required: true },
          { 
            key: 'home_address_id', 
            label: 'Home Address', 
            type: 'select',
            relatedTable: 'address',
            options: localOptions.addresses?.map(addr => ({
              value: addr.id,
              label: addr.address_line
            })) || []
          }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          break
        case 'instructor':
          // Verify required fields are present
          if (!dataWithDefaults.first_name || !dataWithDefaults.last_name || 
              !dataWithDefaults.user_id) {
            throw new Error('Missing required fields for instructor')
          }
          newItem = await createInstructor(dataWithDefaults as InstructorInput)
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
    
    // Special handling for user_id field in client form
    if (field.key === 'user_id' && table === 'client') {
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

  // Special handling for address form
  const isAddressForm = table === 'address'
  const visibleFields = isAddressForm 
    ? fields.filter(field => field.key !== 'city' && field.key !== 'state' && field.key !== 'zip')
    : fields

  // Render form content (fields and buttons)
  const formContent = (
    <>
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