'use client'

import { useState } from 'react'

interface SendLoginEmailButtonProps {
  userId: string
  userEmail: string
}

export default function SendLoginEmailButton({ userId, userEmail }: SendLoginEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSendLoginEmail = async () => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/send-login-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send login credentials')
      }

      setMessage('Login credentials sent successfully')
    } catch (err: any) {
      console.error('Error sending login email:', err)
      setError(err.message || 'Failed to send login credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
  }

  const messageStyle = {
    marginTop: '8px',
    padding: '8px',
    borderRadius: '4px',
  }

  const errorMessageStyle = {
    ...messageStyle,
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  }

  const successMessageStyle = {
    ...messageStyle,
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  }

  return (
    <div>
      <button
        onClick={handleSendLoginEmail}
        disabled={isLoading}
        style={buttonStyle}
      >
        {isLoading ? 'Sending...' : 'Send Login Credentials'}
      </button>

      {error && (
        <div style={errorMessageStyle}>
          {error}
        </div>
      )}

      {message && (
        <div style={successMessageStyle}>
          {message}
        </div>
      )}
    </div>
  )
}
