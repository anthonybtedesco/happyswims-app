'use client'
import React, { useEffect, useState } from 'react'
import LoginForm from '@/components/forms/LoginForm'
import AdminOTPForm from '@/components/forms/AdminOTPForm'

export default function LoginPage() {

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const hostname = window.location.hostname
    const subdomain = hostname.split('.')[0]
    const isAdmin = subdomain === 'admin'
    setIsAdmin(isAdmin)
  }, [])


  return (
    <main>
      {isAdmin ? <AdminOTPForm /> : <LoginForm />}
    </main>
  )
}