export type Database = {
  public: {
    Tables: {
      booking: {
        Row: {
          id: string
          created_at: string
          user_id: string
          client_id: string
          instructor_id: string
          pool_address: string
          start_time: string
          end_time: string
          duration: number
          recurrence_weeks: number
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string
          client_id: string
          instructor_id: string
          pool_address: string
          start_time: string
          end_time: string
          duration: number
          recurrence_weeks: number
          status: string
        }
      }
      client: {
        Row: {
          id: string
          created_at: string
          user_id: string
          first_name: string
          last_name: string
          email: string
        }
      }
      instructor: {
        Row: {
          id: string
          created_at: string
          user_id: string
          first_name: string
          last_name: string
          email: string
        }
      }
      address: {
        Row: {
          id: string
          created_at: string
          address_line: string
          city: string
          state: string
          zip: string
        }
        Insert: {
          id?: string
          created_at?: string
          address_line: string
          city: string
          state: string
          zip: string
        }
      }
    }
  }
}

export type Booking = Database['public']['Tables']['booking']['Row']
export type BookingInsert = Database['public']['Tables']['booking']['Insert']
export type Client = Database['public']['Tables']['client']['Row']
export type Instructor = Database['public']['Tables']['instructor']['Row']
export type Address = Database['public']['Tables']['address']['Row']
export type AddressInsert = Database['public']['Tables']['address']['Insert']

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