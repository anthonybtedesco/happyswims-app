import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>HappySwims</h1>
          <p className={styles.subtitle}>Choose your dashboard</p>
        </div>
        
        <div className={styles.grid}>
          <Link href="/admin/auth" className={`${styles.card} ${styles.adminCard}`}>
            <div className={styles.cardContent}>
              <div className={`${styles.iconContainer} ${styles.adminIcon}`}>
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Admin</h2>
              <p className={styles.cardDescription}>Manage instructors, clients, and system settings</p>
            </div>
          </Link>

          <Link href="/instructor/auth" className={`${styles.card} ${styles.instructorCard}`}>
            <div className={styles.cardContent}>
              <div className={`${styles.iconContainer} ${styles.instructorIcon}`}>
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Instructor</h2>
              <p className={styles.cardDescription}>Manage your availability and view booked classes</p>
            </div>
          </Link>

          <Link href="/client/auth" className={`${styles.card} ${styles.clientCard}`}>
            <div className={styles.cardContent}>
              <div className={`${styles.iconContainer} ${styles.clientIcon}`}>
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Client</h2>
              <p className={styles.cardDescription}>Book swimming classes and manage your schedule</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
