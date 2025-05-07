import React, { useState } from 'react'
import CreateItem from './CreateItem'
import { supabase } from '@/lib/supabase/client'

interface JoinCreateOrSelectProps {
  value: string
  onChange: (value: string) => void
  relatedTable: string
  options: { value: string; label: string }[]
  label: string
  required?: boolean
  onItemCreated?: (newItem: any) => void
}

export default function JoinCreateOrSelect({
  value,
  onChange,
  relatedTable,
  options,
  label,
  required,
  onItemCreated
}: JoinCreateOrSelectProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  
  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value
    if (newValue === 'create_new') {
      setIsCreatingNew(true)
    } else {
      onChange(newValue)
    }
  }
  
  function handleCloseCreate() {
    setIsCreatingNew(false)
  }
  
  async function handleCreateSuccess() {
    setIsCreatingNew(false)
    
    // Fetch the latest record based on the related table
    try {
      let query = supabase
        .from(relatedTable)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Adapt query based on table type to get the right fields
      if (relatedTable === 'client' || relatedTable === 'instructor') {
        query = supabase
          .from(relatedTable)
          .select('id, first_name, last_name')
          .order('created_at', { ascending: false })
          .limit(1);
      } else if (relatedTable === 'address') {
        query = supabase
          .from(relatedTable)
          .select('id, address_line')
          .order('created_at', { ascending: false })
          .limit(1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching newly created item:', error);
        return Promise.resolve();
      }
      
      if (data && data.length > 0) {
        const newItem = data[0];
        // Set the value to the newly created item's ID
        onChange(newItem.id);
        
        // Notify parent component that a new item was created
        if (onItemCreated) {
          onItemCreated(newItem);
        }
      }
    } catch (error) {
      console.error('Error in handleCreateSuccess:', error);
    }
    
    return Promise.resolve();
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
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value="create_new">+ Create New {label}</option>
      </select>
    </div>
  )
} 