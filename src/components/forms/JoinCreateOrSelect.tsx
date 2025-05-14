import React, { useState, useEffect } from 'react'
import CreateItem from './CreateItem'
import { useData } from '@/lib/context/DataContext'

interface JoinCreateOrSelectProps {
  value: string
  onChange: (value: string) => void
  relatedTable: string
  options: { value: string; label: string }[]
  label: string
  required?: boolean
  onItemCreated?: (newItem: any) => void
  nestedSelections?: {
    table: string
    label: string
    options: { value: string; label: string }[]
    onItemCreated?: (newItem: any) => void
  }[]
  addresses?: any[]
}

export default function JoinCreateOrSelect({
  value,
  onChange,
  relatedTable,
  options,
  label,
  required,
  onItemCreated,
  nestedSelections,
  addresses
}: JoinCreateOrSelectProps) {
  const { clients, instructors, addresses: contextAddresses } = useData();
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [selectedNestedValue, setSelectedNestedValue] = useState<string>('')
  const [localOptions, setLocalOptions] = useState(options)
  
  useEffect(() => {
    setLocalOptions(options)
  }, [options])

  // Update options when data changes in context
  useEffect(() => {
    if (relatedTable === 'client' && clients.length > 0) {
      const clientOptions = clients.map(client => ({
        value: client.id,
        label: `${client.first_name} ${client.last_name}`
      }))
      setLocalOptions(clientOptions)
    } else if (relatedTable === 'instructor' && instructors.length > 0) {
      const instructorOptions = instructors.map(instructor => ({
        value: instructor.id,
        label: `${instructor.first_name} ${instructor.last_name}`
      }))
      setLocalOptions(instructorOptions)
    } else if (relatedTable === 'address' && contextAddresses.length > 0) {
      const addressOptions = contextAddresses.map(address => ({
        value: address.id,
        label: `${address.address_line}, ${address.city}, ${address.state} ${address.zip}`
      }))
      setLocalOptions(addressOptions)
    }
  }, [relatedTable, clients, instructors, contextAddresses])
  
  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value
    if (newValue === 'create_new') {
      setIsCreatingNew(true)
    } else {
      onChange(newValue)
    }
  }
  
  function handleNestedSelectChange(value: string) {
    setSelectedNestedValue(value)
  }
  
  function handleCloseCreate() {
    setIsCreatingNew(false)
  }
  
  async function handleCreateSuccess(newItem: any) {
    setIsCreatingNew(false)
    
    // Create the new option
    const newOption = {
      value: newItem.id,
      label: relatedTable === 'address' 
        ? newItem.address_line 
        : `${newItem.first_name} ${newItem.last_name}`
    }
    
    // Update local options immediately
    setLocalOptions(prev => {
      const exists = prev.some(opt => opt.value === newOption.value)
      if (!exists) {
        return [...prev, newOption]
      }
      return prev
    })
    
    // Select the new item
    onChange(newItem.id)
    
    if (onItemCreated) {
      onItemCreated(newItem)
    }
    
    return Promise.resolve()
  }
  
  if (isCreatingNew) {
    return (
      <div className="join-create-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div className="join-create-overlay" style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <CreateItem 
            table={relatedTable}
            onClose={handleCloseCreate}
            onSuccess={handleCreateSuccess}
            noForm={true}
            nestedSelections={nestedSelections}
            options={{addresses: addresses || contextAddresses}}
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className="join-select-container">
      <select
        value={value}
        onChange={handleSelectChange}
        required={required}
        className="form-select"
        style={{ backgroundColor: '#f5f5f5', color: '#000' }}
      >
        <option value="">Select {label}...</option>
        {localOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value="create_new">+ Create New {label}</option>
      </select>
      
      {nestedSelections && nestedSelections.map((nested, index) => (
        <div key={index} style={{ marginTop: '1rem' }}>
          <JoinCreateOrSelect
            value={selectedNestedValue}
            onChange={handleNestedSelectChange}
            relatedTable={nested.table}
            options={nested.options}
            label={nested.label}
            onItemCreated={nested.onItemCreated}
          />
        </div>
      ))}
    </div>
  )
} 