'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './TimeOffModal.module.css'

interface TimeOffModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  instructorId: string
}

export default function TimeOffModal({ isOpen, onClose, onComplete, instructorId }: TimeOffModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!startDate) {
      setError('Start date is required')
      return
    }

    if (!supabase) {
      setError('Supabase client not initialized')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.rpc('create_time_off', {
        p_instructor_id: instructorId,
        p_start_date: startDate,
        p_end_date: endDate || null
      })

      if (error) {
        setError(error.message)
      } else {
        onComplete()
        onClose()
        setStartDate('')
        setEndDate('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    setStartDate('')
    setEndDate('')
    setError(null)
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Time Off</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate" className={styles.label}>
              Start Date *
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate" className={styles.label}>
              End Date (Optional)
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.input}
              min={startDate}
            />
            <p className={styles.helpText}>
              Leave empty for indefinite time off
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !startDate}
            >
              {isSubmitting ? 'Creating...' : 'Create Time Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 