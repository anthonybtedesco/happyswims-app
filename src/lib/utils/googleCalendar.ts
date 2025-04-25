import { Booking, Availability } from '@/lib/types/supabase'

declare global {
  interface Window {
    __GOOGLE_API_STATUS?: 'loading' | 'loaded' | 'error'
  }
}

interface GoogleTokenClient {
  requestAccessToken: () => void
}

interface GoogleOAuthConfig {
  client_id: string
  scope: string
  callback: (response: { access_token?: string }) => void
  error_callback?: (error: { type: string; message: string }) => void
  hint?: string
  auto_select?: boolean
  prompt?: string
}

interface GoogleOAuth2 {
  initTokenClient: (config: GoogleOAuthConfig) => GoogleTokenClient
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2
}

interface GoogleAPI {
  accounts: GoogleAccounts
}

declare global {
  interface Window {
    google: GoogleAPI
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]

const waitForGoogleLoad = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load Google API in server environment'))
      return
    }

    if (window.google) {
      resolve()
      return
    }

    let attempts = 0
    const maxAttempts = 20
    const checkInterval = setInterval(() => {
      attempts++
      
      if (window.__GOOGLE_API_STATUS === 'error') {
        clearInterval(checkInterval)
        reject(new Error('Google API failed to load'))
        return
      }

      if (window.google) {
        clearInterval(checkInterval)
        resolve()
        return
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        reject(new Error('Timeout waiting for Google API to load'))
      }
    }, 500)
  })
}

export const initGoogleCalendarAuth = async (email: string) => {
  try {
    await waitForGoogleLoad()
    
    return new Promise<void>((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope: SCOPES.join(' '),
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              localStorage.setItem(`google_calendar_token_${email}`, response.access_token)
              await createHappyswimsCal(response.access_token)
              resolve()
            } catch (error) {
              reject(error)
            }
          } else {
            reject(new Error('No access token received'))
          }
        },
        error_callback: (error) => {
          reject(new Error(`Google OAuth Error: ${error.message}`))
        },
        hint: email,
        auto_select: true,
        prompt: ''  // Don't show the consent screen if the user has already granted permission
      })

      // Use a timeout to ensure we're not in the same call stack as the click event
      setTimeout(() => {
        client.requestAccessToken()
      }, 0)
    })
  } catch (error) {
    console.error('Error initializing Google Calendar auth:', error)
    throw error
  }
}

export const createHappyswimsCal = async (accessToken: string) => {
  try {
    // First, try to find an existing Happyswims calendar
    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (!calendarsResponse.ok) {
      throw new Error('Failed to fetch calendars')
    }

    const calendars = await calendarsResponse.json()
    const existingCalendar = calendars.items?.find((cal: any) => cal.summary === 'Happyswims')

    if (existingCalendar) {
      localStorage.setItem('happyswims_calendar_id', existingCalendar.id)
      return existingCalendar.id
    }

    // If no existing calendar found, create a new one
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Happyswims',
        description: 'Happyswims Calendar for bookings and availabilities',
        timeZone: 'UTC'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create calendar')
    }

    const calendar = await response.json()
    localStorage.setItem('happyswims_calendar_id', calendar.id)
    return calendar.id
  } catch (error) {
    console.error('Error creating Happyswims calendar:', error)
    throw error
  }
}

export const syncEventsToGoogleCalendar = async (
  bookings: Booking[],
  availabilities: Availability[],
  email: string
) => {
  const accessToken = localStorage.getItem(`google_calendar_token_${email}`)
  const calendarId = localStorage.getItem('happyswims_calendar_id')

  if (!accessToken || !calendarId) {
    throw new Error('Google Calendar not connected')
  }

  try {
    // Convert bookings to Google Calendar events
    const bookingEvents = bookings.map(booking => ({
      summary: `Booking`,
      description: `Happyswims booking`,
      start: {
        dateTime: booking.start_time,
        timeZone: 'UTC',
      },
      end: {
        dateTime: booking.end_time,
        timeZone: 'UTC',
      },
      colorId: '1', // Blue
    }))

    // Convert availabilities to Google Calendar events
    const availabilityEvents = availabilities.map(availability => {
      const [startTime, endTime] = availability.timerange.split('-')
      const startDate = new Date(availability.start_date)
      const endDate = new Date(availability.end_date)
      
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      
      startDate.setHours(startHours, startMinutes, 0)
      endDate.setHours(endHours, endMinutes, 0)

      return {
        summary: `Available`,
        description: `Happyswims availability`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC',
        },
        colorId: '2', // Green
      }
    })

    // Combine all events
    const allEvents = [...bookingEvents, ...availabilityEvents]

    // Batch create events
    for (const event of allEvents) {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      })
    }
  } catch (error) {
    console.error('Error syncing events to Google Calendar:', error)
    throw error
  }
} 