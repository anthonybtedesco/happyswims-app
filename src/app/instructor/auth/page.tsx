'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  verifyInstructorPhone, 
  sendOTP,
  signInWithGoogle
} from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from '@/lib/utils'
import styles from './page.module.css'

export default function InstructorAuth() {
  const [activeTab, setActiveTab] = useState<'claim' | 'signin'>('claim')
  const [step, setStep] = useState<'phone' | 'email' | 'otp'>('phone')
  const [signInStep, setSignInStep] = useState<'email' | 'otp'>('email')
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
      setMessage('OTP sent! Check your email for the verification code.')
      if (activeTab === 'claim') {
        setStep('otp')
      } else {
        setSignInStep('otp')
      }
    }
    
    setIsLoading(false)
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    setMessage('')
    
    if (activeTab === 'claim' && instructorData) {
      localStorage.setItem('claim_phone_number', normalizePhoneNumber(phoneNumber))
    }
    
    const { error } = await signInWithGoogle('instructor')
    
    if (error) {
      setMessage(`Error: ${error.message}`)
      setIsLoading(false)
    }
  }

  async function handleVerifyOTP() {
    if (!otp) {
      setMessage('Please enter the OTP code')
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })
    
    if (error) {
      setMessage(`Error: ${error.message}`)
      setIsLoading(false)
      return
    }

    if (data?.user) {
      if (activeTab === 'claim') {
        await linkInstructorAccount()
      } else {
        router.push('/instructor/dashboard')
      }
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
        {activeTab === 'claim' && (
          <div className={styles.instructorInfo}>
            <h3 className={styles.instructorName}>
              Welcome, {instructorData?.first_name}!
            </h3>
            <p className={styles.instructorPhone}>
              Phone: {formatPhoneNumber(instructorData?.phone_number || phoneNumber)}
            </p>
          </div>
        )}

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

        <div className={styles.divider}>
          <div className={styles.dividerText}>Or continue with</div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={styles.googleButton}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Google</span>
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
        {activeTab === 'claim' && (
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
        )}

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

  function renderSignInEmailStep() {
    return (
      <div className={styles.form}>
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

        <div className={styles.divider}>
          <div className={styles.dividerText}>Or continue with</div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={styles.googleButton}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Google</span>
        </button>

        {message && (
          <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}
      </div>
    )
  }

  function renderSignInOTPStep() {
    return (
      <div className={styles.form}>
        <div className={styles.instructorInfo}>
          <h3 className={styles.instructorName}>
            Check your email
          </h3>
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

  function resetForm() {
    setStep('phone')
    setSignInStep('email')
    setPhoneNumber('+1 ')
    setEmail('')
    setOtp('')
    setMessage('')
    setInstructorData(null)
    localStorage.removeItem('claim_phone_number')
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

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'claim' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('claim')
              resetForm()
            }}
          >
            Claim Account
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'signin' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('signin')
              resetForm()
            }}
          >
            Already Claimed Account
          </button>
        </div>

        {activeTab === 'claim' && (
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
        )}

        {activeTab === 'signin' && (
          <div className={styles.welcomeBox}>
            <h3 className={styles.welcomeTitle}>Welcome back!</h3>
            <p className={styles.welcomeText}>
              Sign in to access your instructor dashboard and manage your classes.
            </p>
          </div>
        )}

        {activeTab === 'claim' && step === 'phone' && renderPhoneStep()}
        {activeTab === 'claim' && step === 'email' && renderEmailStep()}
        {activeTab === 'claim' && step === 'otp' && renderOTPStep()}
        {activeTab === 'signin' && signInStep === 'email' && renderSignInEmailStep()}
        {activeTab === 'signin' && signInStep === 'otp' && renderSignInOTPStep()}
      </div>
    </div>
  )
} 