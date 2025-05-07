import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import JoinCreateOrSelect from './JoinCreateOrSelect'
import MapboxAddressAutofill from './MapboxAddressAutofill'
import UserIdSelect from './UserIdSelect'

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
  onSuccess: () => Promise<void>
  options?: {
    instructors?: { id: string; first_name: string; last_name: string }[]
    clients?: { id: string; first_name: string; last_name: string }[]
    addresses?: { id: string; address_line: string }[]
  }
  noForm?: boolean
}

export default function CreateItem({ table, onClose, onSuccess, options = {}, noForm = false }: CreateItemProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [localOptions, setLocalOptions] = useState(options)
  const isFirstRender = useRef(true)

  // Update local options only on initial render or when options actually change
  useEffect(() => {
    // Skip the first render since we already initialized with options
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Compare options using JSON.stringify to avoid referencing localOptions directly
    const optionsString = JSON.stringify({
      instructorsLength: options.instructors?.length || 0,
      clientsLength: options.clients?.length || 0,
      addressesLength: options.addresses?.length || 0
    })
    
    const currentOptionsString = JSON.stringify({
      instructorsLength: localOptions.instructors?.length || 0,
      clientsLength: localOptions.clients?.length || 0,
      addressesLength: localOptions.addresses?.length || 0
    })
    
    if (optionsString !== currentOptionsString) {
      setLocalOptions(options)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options, 
    options.instructors?.length, 
    options.clients?.length, 
    options.addresses?.length
  ])

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
          { key: 'start', label: 'Start Time', type: 'date', required: true },
          { key: 'end', label: 'End Time', type: 'date', required: true },
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
      // Set default values for fields that have them but weren't filled in
      const fields = getFormFields()
      const dataWithDefaults = { ...formData }
      
      fields.forEach(field => {
        if (field.defaultValue && !dataWithDefaults[field.key]) {
          dataWithDefaults[field.key] = field.defaultValue
        }
      })

      const { data, error } = await supabase
        .from(table)
        .insert([dataWithDefaults])
        .select()

      if (error) throw error

      console.log('Item created:', data)
      
      // After successful creation, update related data if needed
      if (data && data.length > 0) {
        const newItem = data[0]
        
        // Update local options based on the type of item created
        if (table === 'client' && newItem.id) {
          const newClient = {
            id: newItem.id,
            first_name: newItem.first_name,
            last_name: newItem.last_name
          }
          setLocalOptions(prev => ({
            ...prev,
            clients: [...(prev.clients || []), newClient]
          }))
        } else if (table === 'instructor' && newItem.id) {
          const newInstructor = {
            id: newItem.id,
            first_name: newItem.first_name,
            last_name: newItem.last_name
          }
          setLocalOptions(prev => ({
            ...prev,
            instructors: [...(prev.instructors || []), newInstructor]
          }))
        } else if (table === 'address' && newItem.id) {
          const newAddress = {
            id: newItem.id,
            address_line: newItem.address_line
          }
          setLocalOptions(prev => ({
            ...prev,
            addresses: [...(prev.addresses || []), newAddress]
          }))
        }
      }
      
      await onSuccess()
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
      return (
        <JoinCreateOrSelect
          value={value}
          onChange={(newValue) => handleChange(field.key, newValue)}
          relatedTable={field.relatedTable}
          options={field.options || []}
          label={field.label}
          required={field.required}
          onItemCreated={(newItem) => {
            // Update local options when a related item is created
            if (field.relatedTable === 'client') {
              setLocalOptions(prev => ({
                ...prev,
                clients: [...(prev.clients || []), newItem]
              }))
            } else if (field.relatedTable === 'instructor') {
              setLocalOptions(prev => ({
                ...prev,
                instructors: [...(prev.instructors || []), newItem]
              }))
            } else if (field.relatedTable === 'address') {
              setLocalOptions(prev => ({
                ...prev,
                addresses: [...(prev.addresses || []), newItem]
              }))
            }
          }}
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