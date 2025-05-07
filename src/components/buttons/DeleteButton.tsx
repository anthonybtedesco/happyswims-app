import React, { useState } from 'react'

export interface DeleteButtonProps {
  selectedCount: number
  onDelete: () => Promise<void>
  selectedRows?: string[]
  tableName?: string
}

export default function DeleteButton({ selectedCount, onDelete, selectedRows = [], tableName = '' }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} selected ${selectedCount === 1 ? 'item' : 'items'}?`)) {
      setIsDeleting(true)
      try {
        await onDelete()
      } catch (error) {
        console.error('Error deleting items:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="delete-button-container">
      <button 
        className="delete-button" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <span className="delete-spinner"></span>
        ) : (
          <>
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
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete {selectedCount} selected {selectedCount === 1 ? 'item' : 'items'}
          </>
        )}
      </button>
    </div>
  )
} 