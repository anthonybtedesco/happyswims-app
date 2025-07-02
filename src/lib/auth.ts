import { supabase } from './supabase'
import type { Database } from './supabase'

type Admin = Database['public']['Tables']['admin']['Row']
type Instructor = Database['public']['Tables']['instructor']['Row']
type Client = Database['public']['Tables']['client']['Row']

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getUserRole(userId: string) {
  const [adminResult, instructorResult, clientResult] = await Promise.all([
    supabase.from('admin').select('*').eq('user_id', userId).single(),
    supabase.from('instructor').select('*').eq('user_id', userId).single(),
    supabase.from('client').select('*').eq('user_id', userId).single()
  ])

  if (adminResult.data) return { role: 'admin' as const, data: adminResult.data }
  if (instructorResult.data) return { role: 'instructor' as const, data: instructorResult.data }
  if (clientResult.data) return { role: 'client' as const, data: clientResult.data }
  
  return { role: 'none' as const, data: null }
}

export async function sendOTP(email: string, role?: 'admin' | 'instructor' | 'client') {
  if (role) {
    localStorage.setItem('signup_role', role)
  }
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signInWithGoogle(role?: 'admin' | 'instructor' | 'client') {
  if (role) {
    localStorage.setItem('signup_role', role)
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function assignUserRole(userId: string, role: 'admin' | 'instructor' | 'client') {
  const { data, error } = await supabase.from(role).insert({
    user_id: userId,
    created_at: new Date().toISOString()
  })
  return { data, error }
}

export async function verifyInstructorPhone(phoneNumber: string) {
  const { data, error } = await supabase
    .from('instructor')
    .select('id, first_name, last_name, phone_number, user_id')
    .eq('phone_number', phoneNumber)
    .single()
  
  if (error || !data) {
    return { data: null, error: { message: 'Invalid phone number' } }
  }
  
  if (data.user_id) {
    return { data: null, error: { message: 'This instructor account is already linked to a user' } }
  }
  
  return { data, error: null }
}

export const ADMIN_EMAILS = [
  'team@agfarms.dev',
  'santiago@happyswims.life',
  'kayla@happyswims.life'
] 