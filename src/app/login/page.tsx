'use client'
import React from 'react'
import LoginForm from '@/components/forms/LoginForm'
import AdminOTPForm from '@/components/forms/AdminOTPForm'

export default function LoginPage() {
  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]
  const isAdmin = subdomain === 'admin'

  return (
    <main>
      {isAdmin ? <AdminOTPForm /> : <LoginForm />}
    </main>
  )
}