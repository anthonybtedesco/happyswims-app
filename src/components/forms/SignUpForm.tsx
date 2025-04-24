'use client'

import { useState } from 'react'
import { signUp, UserRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleSignUp = async () => {
    try {
      console.log('Starting Google sign up process...')
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email profile',
        }
      })

      console.log('Google OAuth response:', data, error)

      if (error) {
        console.error('Google OAuth error:', error)
        throw error
      }
      
      const currentUrl = window.location.href;
      if (currentUrl !== data.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error in Google sign up:', error)
      setError(error?.message || 'Failed to sign up with Google')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const { data, error } = await signUp(email, password, role)
      if (error) {
        setError(error.message)
        return
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      setError(error?.message || 'An error occurred during sign up')
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '28rem'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Create an Account
        </h1>

        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            color: '#b91c1c',
            backgroundColor: '#fee2e2',
            borderRadius: '0.5rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem',
              backgroundColor: 'white'
            }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                marginTop: '0.25rem',
                backgroundColor: 'white'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem',
              backgroundColor: 'white'
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                marginTop: '0.25rem',
                backgroundColor: 'white'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="role" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem',
              backgroundColor: 'white'
            }}>
              I am a:
            </label>
            <select 
              id="role"
              value={role} 
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                marginTop: '0.25rem',
                backgroundColor: 'white'
              }}
            >
              <option value="client">Client</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Sign Up
          </button>
        </form>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: 0, 
            right: 0, 
            borderTop: '1px solid #e5e7eb'
          }}></div>
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            justifyContent: 'center', 
            fontSize: '0.875rem'
          }}>
            <span style={{ 
              padding: '0 0.5rem', 
              backgroundColor: 'white', 
              color: '#6b7280'
            }}>
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          <svg style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 24 24">
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
          Sign up with Google
        </button>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#4b5563'
        }}>
          Already have an account?{' '}
          <Link href="/login" style={{
            color: '#2563eb',
            fontWeight: '500',
            textDecoration: 'none'
          }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
} 