'use client'

import { useState } from 'react'
import { signUp, UserRole } from '@/lib/auth'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { data, error } = await signUp(email, password, role)
    if (error) {
      setError(error.message)
      return
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
      </div>
      <div>
        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="client">Client</option>
          <option value="instructor">Instructor</option>
        </select>
      </div>
      {error && <div>{error}</div>}
      <button type="submit">Sign Up</button>
    </form>
  )
} 