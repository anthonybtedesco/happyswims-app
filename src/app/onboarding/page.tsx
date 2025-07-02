'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import styles from './page.module.css'

export default function Onboarding() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Loading...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to HappySwims!</h1>
          <p className={styles.subtitle}>We need to set up your account</p>
        </div>

        <div className={styles.content}>
          <div className={styles.infoBox}>
            <h3 className={styles.infoTitle}>Account Setup Required</h3>
            <p className={styles.infoText}>
              Your email ({user?.email}) is not associated with any role yet. 
              Please contact an administrator to set up your account.
            </p>
          </div>

          <div className={styles.buttonContainer}>
            <button
              onClick={handleSignOut}
              className={styles.signOutButton}
            >
              Sign Out
            </button>
          </div>

          <div className={styles.supportLink}>
            <a href="mailto:team@agfarms.dev">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 