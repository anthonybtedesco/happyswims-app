export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      address: {
        Row: {
          id: string
          created_at: string
          latitude: number
          longitude: number 
          address_line: string
          city: string
          state: string
          zip: string
        }
        Insert: {
          id?: string
          created_at?: string
          latitude: number
          longitude: number 
          address_line: string
          city: string
          state: string
          zip: string
        }
      }
      client: {
        Row: {
          id: string
          created_at: string
          user_id: string
          first_name: string
          last_name: string
          home_address_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          first_name: string
          last_name: string
          home_address_id: string
        }
      }
      instructor: {
        Row: {
          id: string
          created_at: string
          user_id: string
          first_name: string
          last_name: string
          home_address_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          first_name: string
          last_name: string
          home_address_id: string
        }
      }
      availability: {
        Row: {
          id: string
          created_at: string
          instructor_id: string
          start_date: string
          end_date: string
          timerange: string
          color: string
        }
        Insert: {
          id?: string
          created_at?: string
          instructor_id: string
          start_date: string
          end_date: string
          timerange: string
          color: string
        }
      }
      booking: {
        Row: {
          id: string
          created_at: string
          pool_address_id: string
          client_id: string
          instructor_id: string
          start_time: string
          end_time: string
          duration: number
          recurrence_weeks: number
          calendar_event_id: string
          google_event_link: string
          user_id: string
          booking_status: string
          payment_status: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          pool_address_id: string
          client_id: string
          instructor_id: string
          start_time: string
          end_time: string
          duration: number
          recurrence_weeks: number
          calendar_event_id?: string
          google_event_link?: string
          user_id?: string
          booking_status?: string
          payment_status?: string
          status?: string
        }
      }
      student: {
        Row: {
          id: string
          created_at: string
          client_id: string
          first_name: string
          birthdate: string
        }
        Insert: {
          id?: string
          created_at?: string
          client_id: string
          first_name: string
          birthdate: string
        }
      }
    }
  }
}

export type Client = Database['public']['Tables']['client']['Row'] & {
  client_tag?: Array<{tag: {id: string, name: string, color: string}, tagId: string}>
}
export type Instructor = Database['public']['Tables']['instructor']['Row'] & {
  instructor_tag?: Array<{tag: {id: string, name: string, color: string}, tag_id: string}>
}
export type Address = Database['public']['Tables']['address']['Row'] & {
  address_tag?: Array<{tag: {id: string, name: string, color: string}, tag_id: string}>
}
export type Availability = Database['public']['Tables']['availability']['Row']
export type Booking = Database['public']['Tables']['booking']['Row'] & {
  booking_tag?: Array<{tag: {id: string, name: string, color: string}, tag_id: string}>
}
export type Student = Database['public']['Tables']['student']['Row'] & {
  student_tag?: Array<{tag: {id: string, name: string, color: string}, tag_id: string}>
}

export type ClientInsert = Database['public']['Tables']['client']['Insert']
export type InstructorInsert = Database['public']['Tables']['instructor']['Insert']
export type AddressInsert = Database['public']['Tables']['address']['Insert']
export type AvailabilityInsert = Database['public']['Tables']['availability']['Insert']
export type BookingInsert = Database['public']['Tables']['booking']['Insert']
export type StudentInsert = Database['public']['Tables']['student']['Insert']

export type BookingWithRelations = Booking & {
  client: Pick<Client, 'first_name' | 'last_name'>
  instructor: Pick<Instructor, 'first_name' | 'last_name'>
}

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
}
