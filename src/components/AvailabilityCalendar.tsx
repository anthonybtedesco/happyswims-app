'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Database } from '@/lib/types/supabase'
import styles from './AvailabilityCalendar.module.css'

type AvailabilityStatus = Database['public']['Enums']['AvailabilityStatus']

interface AvailabilitySlot {
  id: string
  instructor_id: string
  day_of_week: number
  timerange: string
  status: AvailabilityStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    availabilityId: string
    status: AvailabilityStatus
    timerange: string
  }
}

interface AvailabilityCalendarProps {
  instructorId?: string
  onEventClick?: (event: CalendarEvent) => void
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function AvailabilityCalendar({ instructorId, onEventClick }: AvailabilityCalendarProps) {
  const [availabilities, setAvailabilities] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(function subscribeRealtime() {
    if (!instructorId || !supabase) return
    
    const availabilitySub = supabase
      .channel('availability_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'availability', 
        filter: `instructor_id=eq.${instructorId}` 
      }, (payload: any) => {
        loadAvailabilities()
      })
      .subscribe()

    return function cleanup() {
      supabase.removeChannel(availabilitySub)
    }
  }, [instructorId])

  useEffect(function initialLoad() {
    if (instructorId) {
      loadAvailabilities()
    }
  }, [instructorId])

  async function loadAvailabilities() {
    if (!instructorId || !supabase) return
    
    setLoading(true)
    
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('day_of_week', { ascending: true })
      .order('timerange', { ascending: true })

    if (!error) {
      console.log('Loaded availabilities:', data)
      setAvailabilities(data || [])
    } else {
      console.error('Error loading availabilities:', error)
    }
    
    setLoading(false)
  }

  function generateEventsForDateRange(startDate: Date, endDate: Date): CalendarEvent[] {
    const events: CalendarEvent[] = []
    
    console.log('Generating events for date range:', startDate.toISOString(), 'to', endDate.toISOString())
    console.log('Available availabilities:', availabilities.length)
    
    availabilities.forEach(availability => {
      const [startTime, endTime] = availability.timerange.split('-')
      const dayOfWeek = availability.day_of_week
      
      const availabilityStartDate = availability.start_date ? new Date(availability.start_date) : new Date()
      const availabilityEndDate = availability.end_date ? new Date(availability.end_date) : new Date('2099-12-31')
      
      console.log(`Processing availability ${availability.id}:`, {
        dayOfWeek,
        timerange: availability.timerange,
        start_date: availability.start_date,
        end_date: availability.end_date,
        availabilityStartDate: availabilityStartDate.toISOString(),
        availabilityEndDate: availabilityEndDate.toISOString(),
        availabilityEndDateInclusive: availability.end_date ? 'Yes (end of day)' : 'No end date'
      })
      
      let currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        if (currentDate.getDay() === dayOfWeek) {
          const eventDate = new Date(currentDate)
          
          if (eventDate < availabilityStartDate) {
            console.log(`Skipping ${eventDate.toISOString()} - before start date ${availabilityStartDate.toISOString()}`)
            currentDate.setDate(currentDate.getDate() + 1)
            continue
          }
          
          if (availability.end_date) {
            const eventDateOnly = eventDate.toISOString().split('T')[0]
            const endDateOnly = availability.end_date
            
            if (eventDateOnly > endDateOnly) {
              console.log(`Skipping ${eventDate.toISOString()} - after end date ${availability.end_date}`)
              currentDate.setDate(currentDate.getDate() + 1)
              continue
            }
          }
          
          const [startHour, startMinute] = startTime.split(':').map(Number)
          const [endHour, endMinute] = endTime.split(':').map(Number)
          
          eventDate.setHours(startHour, startMinute, 0, 0)
          
          const endDate = new Date(eventDate)
          endDate.setHours(endHour, endMinute, 0, 0)
          
          const statusColors = {
            ACTIVE: { bg: '#10b981', border: '#059669', text: '#ffffff' },
            INACTIVE: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
            EXCEPTION: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }
          }
          
          const colors = statusColors[availability.status]
          
          let eventTitle = `${startTime} - ${endTime}`
          
          if (availability.start_date || availability.end_date) {
            const startDate = availability.start_date ? new Date(availability.start_date).toLocaleDateString() : 'Always'
            const endDate = availability.end_date ? new Date(availability.end_date).toLocaleDateString() : 'Ongoing'
            
            if (availability.start_date && availability.end_date) {
              eventTitle += ` (${startDate} - ${endDate})`
            } else if (availability.start_date) {
              eventTitle += ` (From ${startDate})`
            } else if (availability.end_date) {
              eventTitle += ` (Until ${endDate})`
            }
          }
          
          const event = {
            id: `${availability.id}-${eventDate.toISOString().split('T')[0]}`,
            title: eventTitle,
            start: eventDate.toISOString(),
            end: endDate.toISOString(),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.text,
            extendedProps: {
              availabilityId: availability.id,
              status: availability.status,
              timerange: availability.timerange
            }
          }
          
          console.log('Generated event:', event)
          events.push(event)
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })
    
    console.log('Total events generated:', events.length)
    return events
  }

  function generateCalendarEvents(): CalendarEvent[] {
    const currentDate = new Date(currentMonth)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const monthStartDate = new Date(year, month, 1)
    const monthEndDate = new Date(year, month + 1, 0)
    
    return generateEventsForDateRange(monthStartDate, monthEndDate)
  }

  function handleDateSet(dateInfo: any) {
    setCurrentMonth(dateInfo.start)
  }

  function handleEventClick(info: any) {
    if (onEventClick) {
      onEventClick(info.event)
    }
  }

  function getStatusColor(status: AvailabilityStatus) {
    switch (status) {
      case 'ACTIVE':
        return '#10b981'
      case 'INACTIVE':
        return '#ef4444'
      case 'EXCEPTION':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  function getAvailabilitySummary() {
    const events = generateCalendarEvents()
    const totalSlots = events.length
    const activeSlots = events.filter(event => event.extendedProps.status === 'ACTIVE').length
    const inactiveSlots = events.filter(event => event.extendedProps.status === 'INACTIVE').length
    const exceptionSlots = events.filter(event => event.extendedProps.status === 'EXCEPTION').length
    
    return {
      total: totalSlots,
      active: activeSlots,
      inactive: inactiveSlots,
      exception: exceptionSlots
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading availability...</p>
      </div>
    )
  }

  const summary = getAvailabilitySummary()

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <h3 className={styles.calendarTitle}>Availability Calendar</h3>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#10b981' }}></div>
            <span>Active</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#ef4444' }}></div>
            <span>Inactive</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Exception</span>
          </div>
        </div>
      </div>
      
      {summary.total > 0 && (
        <div className={styles.summarySection}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Slots:</span>
            <span className={styles.summaryValue}>{summary.total}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Active:</span>
            <span className={styles.summaryValue} style={{ color: '#10b981' }}>{summary.active}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Inactive:</span>
            <span className={styles.summaryValue} style={{ color: '#ef4444' }}>{summary.inactive}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Exceptions:</span>
            <span className={styles.summaryValue} style={{ color: '#f59e0b' }}>{summary.exception}</span>
          </div>
        </div>
      )}
      
      <div className={styles.calendarWrapper}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={function(info, successCallback, failureCallback) {
            const startDate = info.start
            const endDate = info.end
            
            const events = generateEventsForDateRange(startDate, endDate)
            successCallback(events)
          }}
          datesSet={handleDateSet}
          eventClick={handleEventClick}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          dayMaxEvents={true}
          moreLinkClick="popover"
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
        />
      </div>
      
      {availabilities.length === 0 && (
        <div className={styles.emptyState}>
          <p>No availability set for this month</p>
          <p className={styles.emptyStateSubtext}>
            Add availability slots to see them displayed on the calendar
          </p>
        </div>
      )}
    </div>
  )
}

export default AvailabilityCalendar 