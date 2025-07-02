'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserRole, signOut } from '@/lib/auth'
import styles from '../../dashboard.module.css'

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/client/auth')
        return
      }

      const { role } = await getUserRole(currentUser.id)
      if (role !== 'client') {
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
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={`${styles.spinner} ${styles.clientSpinner}`}></div>
          <p className={styles.loadingText}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navBar}>
            <h1 className={styles.navTitle}>Book Class</h1>
            <div className={styles.navRight}>
              <span className={styles.userEmail}>{user?.email}</span>
              <button
                onClick={handleSignOut}
                className={styles.signOutButton}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.placeholder}>
            <div className={styles.placeholderContent}>
              <h2 className={styles.placeholderTitle}>Book Your Swimming Class</h2>
              <p className={styles.placeholderText}>Browse available classes and book your lessons</p>
              <p className={styles.placeholderSubtext}>Coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 