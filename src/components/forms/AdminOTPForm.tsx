'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supbase/client'

export default function AdminOTPForm() {
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState<string | null>(null)

  const handleSendOTP = async () => {
    setError(null)
    try {
      const response = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: process.env.NEXT_PUBLIC_ADMIN_EMAIL })
      })

      if (response.ok) {
        setStep('otp')
      } else {
        setError('Failed to send OTP')
      }
    } catch (err) {
      setError('An error occurred')
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email!,
        token: otp,
        type: 'magiclink'
      })

      if (error) {
        setError('Invalid or expired code')
        return
      }

      if (data?.session) {
        // Set the session
        await supabase.auth.setSession(data.session)
        window.location.href = 'http://admin.happyswims.life'
      }
    } catch (err) {
      setError('An error occurred')
    }
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      backgroundColor: 'white'
    }}>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Admin Access</h1>
      
      {step === 'email' ? (
        <div>
          {error && <div style={{ color: '#e11d48', marginBottom: '1rem' }}>{error}</div>}
          <button 
            onClick={handleSendOTP}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Receive OTP
          </button>
        </div>
      ) : (
        <form onSubmit={handleOTPSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>
          {error && <div style={{ color: '#e11d48', marginBottom: '1rem' }}>{error}</div>}
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Verify OTP
          </button>
        </form>
      )}
    </div>
  )
}