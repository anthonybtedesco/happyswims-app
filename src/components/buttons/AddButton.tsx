import React, { useState } from 'react'
import CreateItem from '../forms/CreateItem'

interface AddButtonProps {
  table: string
  fetchData: () => Promise<void>
  options?: {
    instructors?: any[]
    clients?: any[]
    addresses?: any[]
  }
}

export default function AddButton({ table, fetchData, options = {} }: AddButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleOpenModal() {
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
  }

  async function handleSuccess() {
    // First fetch the data to update the parent component
    await fetchData()
    return Promise.resolve()
  }

  return (
    <>
      <button 
        className="add-button" 
        onClick={handleOpenModal}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add {table.charAt(0).toUpperCase() + table.slice(1)}
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CreateItem 
              table={table}
              onClose={handleCloseModal}
              onSuccess={handleSuccess}
              options={options}
            />
          </div>
        </div>
      )}
    </>
  )
} 