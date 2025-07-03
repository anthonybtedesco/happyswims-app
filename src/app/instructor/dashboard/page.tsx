'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserRole, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import InstructorOnboardingModal from '@/components/InstructorOnboardingModal'
import InstructorCard from '@/components/InstructorCard'
import Availability from '@/components/Availability'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import BookingList from '@/components/BookingList'
import styles from '../../dashboard.module.css'

export default function InstructorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [instructor, setInstructor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [viewMode, setViewMode] = useState<'weekly' | 'calendar'>('weekly')
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/instructor/auth')
        return
      }

      const { role, data } = await getUserRole(currentUser.id)
      if (role !== 'instructor') {
        router.push('/')
        return
      }

      setUser(currentUser)
      setInstructor(data)

      if (data) {
        const needsOnboarding = !data.first_name || !data.last_name || !data.phone_number || !data.home_address_id
        setShowOnboarding(needsOnboarding)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  async function handleOnboardingComplete() {
    setShowOnboarding(false)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('instructor')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setInstructor(data)
      }
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={`${styles.spinner} ${styles.instructorSpinner}`}></div>
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
            <h1 className={styles.navTitle}>Instructor Dashboard</h1>
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
          {instructor && (
            <>
              <div className={styles.instructorCardSection}>
                <InstructorCard instructorId={instructor.id} />
              </div>
              
              <div className={styles.availabilitySection}>
                <div className={styles.availabilityHeader}>
                  <h2 className={styles.sectionTitle}>Manage Availability</h2>
                  <div className={styles.viewToggle}>
                    <button
                      className={`${styles.toggleButton} ${viewMode === 'weekly' ? styles.activeToggle : ''}`}
                      onClick={() => setViewMode('weekly')}
                    >
                      Weekly View
                    </button>
                    <button
                      className={`${styles.toggleButton} ${viewMode === 'calendar' ? styles.activeToggle : ''}`}
                      onClick={() => setViewMode('calendar')}
                    >
                      Calendar View
                    </button>
                  </div>
                </div>
                
                {viewMode === 'weekly' ? (
                  <Availability instructorId={instructor.id} />
                ) : (
                  <AvailabilityCalendar instructorId={instructor.id} />
                )}
              </div>

              <div className={styles.bookingsSection}>
                <BookingList instructorId={instructor.id} />
              </div>
            </>
          )}
        </div>
      </main>

      {showOnboarding && instructor && (
        <InstructorOnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
          instructorId={instructor.id}
        />
      )}
    </div>
  )
} 