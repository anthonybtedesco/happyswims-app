'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      
      // The user will be redirected to Google's consent page
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to sign in with Google')
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      setIsOtpSent(true)
      setError(null)
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'magiclink'
      })

      if (error) throw error

      const userRole = data.user?.user_metadata?.role
      const currentUrl = window.location.href;
      switch (userRole) {
        case 'instructor':
          if (currentUrl !== 'https://instructor.happyswims.life') {
            window.location.href = 'https://instructor.happyswims.life';
          }
          break;
        case 'client':
          if (currentUrl !== 'https://book.happyswims.life') {
            window.location.href = 'https://book.happyswims.life';
          }
          break;
        default:
          if (currentUrl !== 'https://book.happyswims.life') {
            window.location.href = 'https://book.happyswims.life';
          }
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    },
    formContainer: {
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '28rem'
    },
    error: {
      marginBottom: '1rem',
      padding: '1rem',
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      borderRadius: '0.5rem'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      outline: 'none',
      fontSize: '1rem',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    button: {
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: '#2563eb',
      color: 'white',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      marginTop: '0.5rem'
    },
    divider: {
      position: 'relative',
      marginTop: '1.5rem',
      marginBottom: '1.5rem'
    },
    dividerLine: {
      width: '100%',
      height: '1px',
      backgroundColor: '#e5e7eb'
    },
    dividerText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '0 0.75rem',
      color: '#6b7280',
      fontSize: '0.875rem'
    },
    googleButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      color: '#374151',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s, border-color 0.2s'
    }
  } as const

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}
        
        <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={isOtpSent}
              required
            />
          </div>

          {isOtpSent && (
            <div style={styles.inputGroup}>
              <label htmlFor="otp" style={styles.label}>
                Enter OTP from Email
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          )}

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Loading...' : isOtpSent ? 'Verify OTP' : 'Send Magic Link'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <div style={styles.dividerText}>Or continue with</div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          style={styles.googleButton}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}