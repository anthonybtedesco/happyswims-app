import { supabase } from "./supabase/client"
import { SendMailClient } from "zeptomail"

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
      // Check if password needs to be changed
      if (data.user.user_metadata.passwordNeedsChange) {
        window.location.href = '/reset-password'
        return { data, error }
      }

      // Regular role-based redirect
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

/**
 * Regular user sign up function that redirects to the appropriate domain
 */
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

/**
 * Admin function to create new users (clients or instructors)
 * Does not redirect since it's used by admin to create accounts
 */
export async function adminSignUp(email: string, role: UserRole) {
  try {
    const response = await fetch('/api/auth/admin-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: new Error(result.error) };
    }

    return { data: result, error: null };
  } catch (error: any) {
    console.error('Admin signup error:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
export async function sendEmail(to: string, subject: string, htmlBody: string) {
  const url = "api.zeptomail.com/"
  const token = "Zoho-enczapikey wSsVR60g+0T4B/x8zTWpI+wwyFVRBl/0HUR52wCo6SL9FvGX8sdvlxKcV1WgSaMXEDNqRe1U4J3x17qnvhDzMWm9ZlxONJIoPxQ9qnGRgF88n+g=="

  const client = new SendMailClient({url, token})

  try {
    const response = await client.sendMail({
      from: {
        address: "noreply@agfarms.dev",
        name: "noreply"
      },
      to: [
        {
          email_address: {
            address: to,
            name: to.split('@')[0]
          }
        }
      ],
      subject,
      htmlbody: htmlBody
    })
    
    return { data: response, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Remove or comment out the separate signInWithGoogle function since it's no longer needed
// export async function signInWithGoogle(token: string, nonce: string) { ... } 