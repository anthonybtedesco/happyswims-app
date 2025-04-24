'use client'

import { useState } from 'react'

export default function SendPasswordResetEmailButton({ email }: { email: string | undefined }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSendEmail = async () => {
    if (!email) {
      console.log('No email provided to button')
      setError('No email address available')
      return
    }

    console.log('Initiating password reset for:', email)
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      console.log('Sending reset password request to API...')
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      console.log('API response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      console.log('Password reset email sent successfully')
      setMessage('Password reset email sent successfully')
    } catch (err: any) {
      console.error('Error in reset password button:', err)
      setError(err.message)
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
        onClick={handleSendEmail} 
        disabled={isLoading || !email}
        style={buttonStyle}
      >
        {isLoading ? 'Sending...' : 'Send Reset Password Email'}
      </button>
      
      {error && <div style={errorMessageStyle}>{error}</div>}
      {message && <div style={successMessageStyle}>{message}</div>}
    </div>
  )
}