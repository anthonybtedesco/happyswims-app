import { supabase } from "./supbase/client"

export type UserRole = 'instructor' | 'client'

export async function signIn(emailOrProvider: string, password?: string) {
  let data, error

  if (password) {
    // Email/Password sign in
    const result = await supabase.auth.signInWithPassword({
      email: emailOrProvider,
      password,
    })
    data = result.data
    error = result.error

    if (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }

    // Ensure cookies are set with the correct domain
    await supabase.auth.getSession()

    if (data?.user) {
      const role = data.user.user_metadata.role
      let redirectUrl = '/'
      
      switch (role) {
        case 'instructor':
          redirectUrl = 'https://instructor.happyswims.life'
          break
        case 'client':
          redirectUrl = 'https://book.happyswims.life'
          break
      }
      
      window.location.href = redirectUrl
    }
  } else if (emailOrProvider === 'google') {
    // Google sign in with explicit scopes and queryParams
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'email profile',
      }
    })

    console.log('Google sign in result:', result.data)
    
    if (result.data?.url) {
      window.location.href = result.data.url
      return { data: result.data, error: null }
    }
    
    error = result.error
  }

  return { data, error }
}

export async function signUp(email: string, password: string, role: UserRole) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
    },
  })

  if (data?.user) {
    let redirectUrl = '/'
    
    switch (role) {
      case 'instructor':
        redirectUrl = 'https://instructor.happyswims.life'
        break
      case 'client':
        redirectUrl = 'https://book.happyswims.life'
        break
    }
    
    window.location.href = redirectUrl
  }

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Remove or comment out the separate signInWithGoogle function since it's no longer needed
// export async function signInWithGoogle(token: string, nonce: string) { ... } 