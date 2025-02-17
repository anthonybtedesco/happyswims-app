'use client'

import { createClient } from '@/lib/supbase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    
    const { error } = await supabase
      .from('client')
      .insert([
        {
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
        }
      ])

    if (!error) {
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />
      <button type="submit">Complete Profile</button>
    </form>
  )
} 