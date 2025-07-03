'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserRole, assignUserRole } from '@/lib/auth'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(function() {
    async function handleAuthCallback() {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth error:', error)
        router.push('/')
        return
      }

      if (!session?.user) {
        router.push('/')
        return
      }

      const { role } = await getUserRole(session.user.id)

      if (role === 'none') {
        const signupRole = localStorage.getItem('signup_role') as 'admin' | 'instructor' | 'client' | null
        
        if (signupRole) {
          const { error: assignError } = await assignUserRole(session.user.id, signupRole)
          
          if (assignError) {
            console.error('Error assigning role:', assignError)
            router.push('/onboarding')
            return
          }
          
          localStorage.removeItem('signup_role')
          
          switch (signupRole) {
            case 'admin':
              router.push('/admin/dashboard')
              break
            case 'instructor':
              router.push('/instructor/dashboard')
              break
            case 'client':
              router.push('/client/dashboard')
              break
            default:
              router.push('/onboarding')
              break
          }
          return
        } else {
          router.push('/onboarding')
          return
        }
      }

      switch (role) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'instructor':
          router.push('/instructor/dashboard')
          break
        case 'client':
          router.push('/client/dashboard')
          break
        default:
          router.push('/onboarding')
          break
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing authentication...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
} 