import { supabase } from '@/lib/supabase/client'
import type { 
  Booking, 
  Client, 
  Instructor, 
  Address, 
  BookingWithRelations,
  CalendarEvent 
} from '@/lib/types/supabase'

export const fetchBookingData = async (): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase
    .from('booking')
    .select<string, BookingWithRelations>(`
      *,
      client:client_id(first_name, last_name),
      instructor:instructor_id(first_name, last_name)
    `)
  
  if (error) throw error
  
  if (data) {
    return data.map(booking => ({
      id: booking.id,
      title: `${booking.client.first_name} ${booking.client.last_name} with ${booking.instructor.first_name} ${booking.instructor.last_name}`,
      start: booking.start_time,
      end: booking.end_time,
    }))
  }
  return []
}

export const fetchUserData = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from('client').select('*')
  if (error) throw error
  return data || []
}

export const fetchInstructorData = async (): Promise<Instructor[]> => {
  const { data, error } = await supabase.from('instructor').select('*')
  if (error) throw error
  return data || []
}

export const fetchClientData = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from('client').select('*')
  if (error) throw error
  return data || []
}

export const fetchAddressData = async (): Promise<Address[]> => {
  const { data, error } = await supabase.from('address').select('*')
  if (error) throw error
  return data || []
}

export const fetchAllData = async () => {
  try {
    const [users, instructors, clients, addresses, bookings] = await Promise.all([
      fetchUserData(),
      fetchInstructorData(),
      fetchClientData(),
      fetchAddressData(),
      fetchBookingData()
    ])

    return {
      users,
      instructors,
      clients,
      addresses,
      bookings
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
} 