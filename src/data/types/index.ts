export interface Address {
  id: string;
  created_at: string;
  latitude: number;
  longitude: number;
  address_line: string;
  city: string;
  state: string;
  zip: string;
}

export interface Client {
  id: string;
  created_at: string;
  user_id: string;
  first_name: string;
  last_name: string;
  home_address_id: string;
}

export interface Instructor {
  id: string;
  created_at: string;
  user_id: string;
  first_name: string;
  last_name: string;
  home_address_id: string;
}

export interface Availability {
  id: string;
  created_at: string;
  instructor_id: string;
  start_date: string;
  end_date: string;
  timerange: string;
  color: string;
}

export interface Booking {
  id: string;
  created_at: string;
  pool_address_id: string;
  client_id: string;
  instructor_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  recurrence_weeks: number;
  calendar_event_id?: string;
  google_event_link?: string;
  user_id?: string;
  booking_status?: string;
  payment_status?: string;
  status?: string;
}

export interface BookingWithRelations extends Booking {
  client: Pick<Client, 'first_name' | 'last_name'>;
  instructor: Pick<Instructor, 'first_name' | 'last_name'>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

// Insert types for creating new records
export type AddressInsert = Omit<Address, 'id' | 'created_at'>;
export type ClientInsert = Omit<Client, 'id' | 'created_at'>;
export type InstructorInsert = Omit<Instructor, 'id' | 'created_at'>;
export type AvailabilityInsert = Omit<Availability, 'id' | 'created_at'>;
export type BookingInsert = Omit<Booking, 'id' | 'created_at'> & {
  calendar_event_id?: string;
  google_event_link?: string;
  user_id?: string;
  booking_status?: string;
  payment_status?: string;
  status?: string;
}; 