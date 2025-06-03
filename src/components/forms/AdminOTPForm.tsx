'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type AuthMethod = 'email' | 'phone' | 'email-otp' | 'phone-otp'

const ADMIN_EMAILS = [
  'kayla@happyswims.life',
  'santiago@happyswims.life',
  'team@agfarms.dev'
]

export default function AdminOTPForm() {
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedEmail, setSelectedEmail] = useState(ADMIN_EMAILS[0])
  const [step, setStep] = useState<AuthMethod>('email')
  const [error, setError] = useState<string | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)

  const handleSendEmailOTP = async () => {
    setError(null)
    try {
      const response = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail })
      })

      if (response.ok) {
        setStep('email-otp')
      } else {
        setError('Failed to send OTP')
      }
    } catch (err) {
      setError('An error occurred')
    }
  }

  const handleSendPhoneOTP = async () => {
    setError(null)
    if (!consentChecked) {
      setError('Please accept the terms and conditions')
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          data: {
            role: 'admin'
          }
        }
      })

      if (error) {
        setError('Failed to send OTP')
        return
      }

      setStep('phone-otp')
    } catch (err) {
      setError('An error occurred')
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 'email-otp') {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: selectedEmail,
          token: otp,
          type: 'magiclink'
        })

        if (error) {
          console.log(error)
          setError('Invalid or expired code')
          return
        }

        if (data?.session) {
          await supabase.auth.setSession(data.session)
          window.location.href = 'http://admin.happyswims.life'
        }
      } catch (err) {
        setError('An error occurred')
      }
      return
    }

    if (step === 'phone-otp') {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })

      if (error) {
        console.log(error)
        setError('Invalid or expired code')
        return
      }

      if (data?.session) {
        await supabase.auth.setSession(data.session)
        window.location.href = 'http://admin.happyswims.life'
      }
    } catch (err) {
      setError('An error occurred')
    }}
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
      
      {step === 'email-otp' || step === 'phone-otp' ? (
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
                backgroundColor: 'black',
                color: 'white',
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
      ) : (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <select
              value={step}
              onChange={(e) => setStep(e.target.value as AuthMethod)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            >
              <option value="email">Email Authentication</option>
              <option value="phone">Phone Authentication</option>
            </select>
          </div>

          {step === 'email' ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Select Admin Email:
                </label>
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  {ADMIN_EMAILS.map((adminEmail) => (
                    <option key={adminEmail} value={adminEmail}>
                      {adminEmail}
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                Click below to receive an OTP via email
              </p>
              {error && <div style={{ color: '#e11d48', marginBottom: '1rem' }}>{error}</div>}
              <button 
                onClick={handleSendEmailOTP}
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
                Receive Email OTP
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  required
                  style={{
                    width: '100%',
                    backgroundColor: 'black',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.875rem' }}>
                    I agree to the terms and conditions
                  </span>
                </label>
              </div>
              {error && <div style={{ color: '#e11d48', marginBottom: '1rem' }}>{error}</div>}
              <button 
                onClick={handleSendPhoneOTP}
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
                Receive SMS OTP
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}