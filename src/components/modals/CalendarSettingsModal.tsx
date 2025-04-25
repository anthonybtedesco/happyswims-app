'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { initGoogleCalendarAuth, syncEventsToGoogleCalendar } from '@/lib/utils/googleCalendar'
import { Booking, Availability } from '@/lib/types/supabase'

interface CalendarSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  bookings: Booking[]
  availabilities: Availability[]
}

const CalendarSettingsModal: React.FC<CalendarSettingsModalProps> = ({ 
  isOpen, 
  onClose,
  bookings,
  availabilities 
}) => {
  const [emails, setEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({})

  // Load saved emails and connection status from localStorage
  useEffect(() => {
    const savedEmails = localStorage.getItem('google_calendar_emails')
    if (savedEmails) {
      const emailList = JSON.parse(savedEmails)
      setEmails(emailList)
      
      // Check connection status for each email
      const status: Record<string, boolean> = {}
      emailList.forEach((email: string) => {
        status[email] = !!localStorage.getItem(`google_calendar_token_${email}`)
      })
      setConnectionStatus(status)
    }
  }, [])

  // Save emails to localStorage when they change
  useEffect(() => {
    localStorage.setItem('google_calendar_emails', JSON.stringify(emails))
  }, [emails])

  const handleAddEmail = () => {
    setError(null)
    if (!newEmail) {
      setError('Please enter an email address')
      return
    }
    if (!newEmail.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (emails.includes(newEmail)) {
      setError('This email is already added')
      return
    }
    setEmails([...emails, newEmail])
    setNewEmail('')
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove))
    localStorage.removeItem(`google_calendar_token_${emailToRemove}`)
    const newStatus = { ...connectionStatus }
    delete newStatus[emailToRemove]
    setConnectionStatus(newStatus)
  }

  const handleGoogleAuth = async (email: string) => {
    setError(null)
    try {
      setConnecting(email)
      await initGoogleCalendarAuth(email)
      await syncEventsToGoogleCalendar(bookings, availabilities, email)
      setConnectionStatus({ ...connectionStatus, [email]: true })
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Google Calendar'
      setError(errorMessage)
      setConnectionStatus({ ...connectionStatus, [email]: false })
    } finally {
      setConnecting(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Calendar Settings</DialogTitle>
        </DialogHeader>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input
              type="email"
              placeholder="Add Google Calendar email"
              value={newEmail}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setError(null)
                setNewEmail(e.target.value)
              }}
              style={{ flex: 1 }}
            />
            <Button onClick={handleAddEmail}>Add</Button>
          </div>

          {error && (
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: '#fee2e2', 
              color: '#dc2626',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {emails.map((email) => (
              <div 
                key={email} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  backgroundColor: connectionStatus[email] ? '#f0fdf4' : '#f3f4f6',
                  borderRadius: '0.375rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{email}</span>
                  {connectionStatus[email] && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#16a34a'
                    }}>
                      Connected
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button 
                    onClick={() => handleGoogleAuth(email)}
                    variant={connectionStatus[email] ? "outline" : "default"}
                    disabled={connecting === email}
                  >
                    {connecting === email ? 'Connecting...' : 
                     connectionStatus[email] ? 'Reconnect' : 'Connect'}
                  </Button>
                  <Button 
                    onClick={() => handleRemoveEmail(email)}
                    variant="destructive"
                    disabled={connecting === email}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CalendarSettingsModal 