'use client'

import React, { useState } from 'react'

type GeocodeStatus = 'idle' | 'loading' | 'success' | 'error'

interface StatusMessage {
  type: 'success' | 'error'
  text: string
}

export default function GeocodeAddressesButton() {
  const [status, setStatus] = useState<GeocodeStatus>('idle')
  const [message, setMessage] = useState<StatusMessage | null>(null)

  const geocodeAddresses = async () => {
    setStatus('loading')
    setMessage(null)
    
    try {
      const response = await fetch('/api/geocode')
      const data = await response.json()
      
      if (data.success) {
        setStatus('success')
        setMessage({
          type: 'success',
          text: data.message
        })
      } else {
        throw new Error(data.error || 'Failed to geocode addresses')
      }
    } catch (error) {
      setStatus('error')
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    }
  }

  return (
    <div className="geocode-addresses-container">
      <button 
        onClick={geocodeAddresses}
        disabled={status === 'loading'}
        className="geocode-button"
      >
        {status === 'loading' ? 'Processing...' : 'Geocode Missing Coordinates'}
      </button>
      
      {message && (
        <div className={`status-message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <style jsx>{`
        .geocode-addresses-container {
          margin: 20px 0;
        }
        
        .geocode-button {
          background-color: #4a90e2;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        
        .geocode-button:hover:not(:disabled) {
          background-color: #3a80d2;
        }
        
        .geocode-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .status-message {
          margin-top: 10px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .status-message.success {
          background-color: #e6f7e6;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }
        
        .status-message.error {
          background-color: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }
      `}</style>
    </div>
  )
} 