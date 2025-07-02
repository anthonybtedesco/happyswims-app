'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendOTP, signInWithGoogle, ADMIN_EMAILS } from '@/lib/auth'
import styles from './page.module.css'

export default function AdminAuth() {
  const [selectedEmail, setSelectedEmail] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showCustomEmail, setShowCustomEmail] = useState(false)
  const router = useRouter()

  async function handleSendOTP() {
    setIsLoading(true)
    setMessage('')
    
    const email = showCustomEmail ? customEmail : selectedEmail
    
    if (!email) {
      setMessage('Please select or enter an email address')
      setIsLoading(false)
      return
    }

    const { error } = await sendOTP(email, 'admin')
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('OTP sent! Check your email for the magic link.')
    }
    
    setIsLoading(false)
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    const { error } = await signInWithGoogle('admin')
    
    if (error) {
      setMessage(`Error: ${error.message}`)
      setIsLoading(false)
    }
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
          <h1 className={styles.title}>Admin Access</h1>
          <p className={styles.subtitle}>Sign in to manage the HappySwims platform</p>
        </div>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Select Admin Email
            </label>
            <select
              value={selectedEmail}
              onChange={(e) => {
                setSelectedEmail(e.target.value)
                setShowCustomEmail(e.target.value === 'custom')
              }}
              className={styles.select}
              disabled={isLoading}
            >
              <option value="">Choose an admin email...</option>
              {ADMIN_EMAILS.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
              <option value="custom">Enter custom email</option>
            </select>
          </div>

          {showCustomEmail && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Custom Email
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Enter admin email"
                className={styles.input}
                disabled={isLoading}
              />
            </div>
          )}

          <button
            onClick={handleSendOTP}
            disabled={isLoading || (!selectedEmail && !customEmail)}
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
      </div>
    </div>
  )
} 