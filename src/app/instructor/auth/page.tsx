'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  verifyInstructorPhone, 
  sendOTP
} from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from '@/lib/utils'
import styles from './page.module.css'

export default function InstructorAuth() {
  const [step, setStep] = useState<'phone' | 'email' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('+1 ')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [instructorData, setInstructorData] = useState<any>(null)
  const router = useRouter()

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    
    if (!value.startsWith('+1')) {
      setPhoneNumber('+1 ')
      return
    }
    
    const digitsAfterPrefix = value.replace(/^\+1\s*/, '').replace(/\D/g, '')
    
    if (digitsAfterPrefix.length <= 10) {
      const formatted = formatPhoneNumber(value)
      setPhoneNumber(formatted)
    }
  }

  async function handlePhoneVerification() {
    setIsLoading(true)
    setMessage('')
    
    if (!phoneNumber) {
      setMessage('Please enter your phone number')
      setIsLoading(false)
      return
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setMessage('Please enter a valid 10-digit US phone number')
      setIsLoading(false)
      return
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    const { data, error } = await verifyInstructorPhone(normalizedPhone)
    
    if (error) {
      setMessage(`Error: ${error.message}`)
      setIsLoading(false)
      return
    }

    setInstructorData(data)
    setStep('email')
    setIsLoading(false)
  }

  async function handleSendOTP() {
    setIsLoading(true)
    setMessage('')
    
    if (!email) {
      setMessage('Please enter your email address')
      setIsLoading(false)
      return
    }

    const { error } = await sendOTP(email, 'instructor')
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('OTP sent! Check your email for the magic link.')
      setStep('otp')
    }
    
    setIsLoading(false)
  }

  async function handleVerifyOTP() {
    setIsLoading(true)
    setMessage('')
    
    if (!otp) {
      setMessage('Please enter the OTP code')
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'magiclink'
    })
    
    if (error) {
      setMessage(`Error: ${error.message}`)
      setIsLoading(false)
      return
    }

    if (data?.user) {
      await linkInstructorAccount()
    }
    
    setIsLoading(false)
  }

  async function linkInstructorAccount() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setMessage('Error: No valid session found')
        return
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber)
      const response = await fetch('/api/instructor/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ phoneNumber: normalizedPhone })
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(`Error: ${result.error}`)
        return
      }

      router.push('/instructor/dashboard')
    } catch (error) {
      setMessage('Error: Failed to link instructor account')
    }
  }

  function renderPhoneStep() {
    return (
      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="+1 (562)-576-3892"
            className={styles.input}
            disabled={isLoading}
            maxLength={17}
          />
          <p className={styles.helperText}>
            Enter your 10-digit phone number (US only)
          </p>
        </div>

        <button
          onClick={handlePhoneVerification}
          disabled={isLoading || !validatePhoneNumber(phoneNumber)}
          className={styles.primaryButton}
        >
          {isLoading ? 'Verifying...' : 'Verify Phone Number'}
        </button>

        {message && (
          <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}
      </div>
    )
  }

  function renderEmailStep() {
    return (
      <div className={styles.form}>
        <div className={styles.instructorInfo}>
          <h3 className={styles.instructorName}>
            Welcome, {instructorData?.first_name}!
          </h3>
          <p className={styles.instructorPhone}>
            Phone: {formatPhoneNumber(instructorData?.phone_number || phoneNumber)}
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={styles.input}
            disabled={isLoading}
          />
          <p className={styles.helperText}>
            We'll send a verification code to this email
          </p>
        </div>

        <button
          onClick={handleSendOTP}
          disabled={isLoading || !email}
          className={styles.primaryButton}
        >
          {isLoading ? 'Sending...' : 'Send OTP'}
        </button>

        {message && (
          <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}
      </div>
    )
  }

  function renderOTPStep() {
    return (
      <div className={styles.form}>
        <div className={styles.instructorInfo}>
          <h3 className={styles.instructorName}>
            Welcome, {instructorData?.first_name}!
          </h3>
          <p className={styles.instructorPhone}>
            Phone: {formatPhoneNumber(instructorData?.phone_number || phoneNumber)}
          </p>
          <p className={styles.instructorEmail}>
            Email: {email}
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter the 6-digit code"
            className={styles.input}
            disabled={isLoading}
            maxLength={6}
          />
        </div>

        <button
          onClick={handleSendOTP}
          disabled={isLoading}
          className={styles.secondaryButton}
        >
          Resend Code
        </button>

        <button
          onClick={handleVerifyOTP}
          disabled={isLoading || !otp}
          className={styles.primaryButton}
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>

        {message && (
          <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className={styles.title}>Instructor Portal</h1>
          <p className={styles.subtitle}>Welcome to your teaching dashboard</p>
        </div>

        <div className={styles.welcomeBox}>
          <h3 className={styles.welcomeTitle}>Welcome to HappySwims!</h3>
          <p className={styles.welcomeText}>
            This is your home to manage your availability and view your booked classes. 
            You'll be able to:
          </p>
          <ul className={styles.welcomeList}>
            <li>• Update your teaching availability</li>
            <li>• View upcoming booked classes</li>
            <li>• Manage your schedule</li>
            <li>• Track your earnings</li>
          </ul>
        </div>

        {step === 'phone' && renderPhoneStep()}
        {step === 'email' && renderEmailStep()}
        {step === 'otp' && renderOTPStep()}
      </div>
    </div>
  )
} 