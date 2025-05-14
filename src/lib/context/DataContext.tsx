'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Instructor, Client, Address, Availability, Booking } from '@/lib/types/supabase'

// Type aliases for data insert operations
export type AddressInput = Partial<Omit<Address, 'id'>> & {
  address_line: string;
  city: string;
  state: string;
  zip: string;
}

export type ClientInput = Partial<Omit<Client, 'id'>> & {
  first_name: string;
  last_name: string;
  user_id: string;
  home_address_id: string;
}

export type InstructorInput = Partial<Omit<Instructor, 'id'>> & {
  first_name: string;
  last_name: string;
  user_id: string;
}

export type AvailabilityInput = Partial<Omit<Availability, 'id'>> & {
  instructor_id: string;
}

export type BookingInput = Partial<Omit<Booking, 'id'>> & {
  client_id: string;
  instructor_id: string;
  pool_address_id: string;
  start_time: string;
  end_time: string;
}

interface DataContextType {
  // Data collections
  instructors: Instructor[]
  clients: Client[]
  addresses: Address[]
  availabilities: Availability[]
  bookings: Booking[]
  
  // Loading states
  loading: {
    instructors: boolean
    clients: boolean
    addresses: boolean
    availabilities: boolean
    bookings: boolean
  }
  
  // Actions
  createClient: (clientData: ClientInput) => Promise<Client | null>
  createInstructor: (instructorData: InstructorInput) => Promise<Instructor | null>
  createAddress: (addressData: AddressInput) => Promise<Address | null>
  createAvailability: (availabilityData: AvailabilityInput) => Promise<Availability | null>
  createBooking: (bookingData: BookingInput) => Promise<Booking | null>
}

// Create context with default values
const DataContext = createContext<DataContextType>({
  instructors: [],
  clients: [],
  addresses: [],
  availabilities: [],
  bookings: [],
  loading: {
    instructors: true,
    clients: true,
    addresses: true,
    availabilities: true,
    bookings: true
  },
  createClient: async () => null,
  createInstructor: async () => null,
  createAddress: async () => null,
  createAvailability: async () => null,
  createBooking: async () => null
})

// Hook for using the data context
export function useData() {
  return useContext(DataContext)
}

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  // State for each data collection
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  
  // Loading states
  const [loading, setLoading] = useState({
    instructors: true,
    clients: true,
    addresses: true,
    availabilities: true,
    bookings: true
  })

  // Initial data loading
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Load addresses first as they're needed for other data
        const { data: addressData } = await supabase
          .from('address')
          .select('*')
        setAddresses(addressData || [])
        setLoading(prev => ({ ...prev, addresses: false }))
        
        // Load instructors
        const { data: instructorData } = await supabase
          .from('instructor')
          .select('*')
        setInstructors(instructorData || [])
        setLoading(prev => ({ ...prev, instructors: false }))
        
        // Load clients
        const { data: clientData } = await supabase
          .from('client')
          .select('*')
        setClients(clientData || [])
        setLoading(prev => ({ ...prev, clients: false }))
        
        // Load availabilities
        const { data: availabilityData } = await supabase
          .from('availability')
          .select('*')
        setAvailabilities(availabilityData || [])
        setLoading(prev => ({ ...prev, availabilities: false }))
        
        // Load bookings
        const { data: bookingData } = await supabase
          .from('booking')
          .select('*')
        setBookings(bookingData || [])
        setLoading(prev => ({ ...prev, bookings: false }))
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }
    
    fetchInitialData()
  }, [])
  
  // Set up realtime subscriptions
  useEffect(() => {
    // Address subscription
    const addressSubscription = supabase
      .channel('address_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'address' },
        (payload) => {
          const newAddress = payload.new as Address
          setAddresses(prev => [...prev, newAddress])
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'address' },
        (payload) => {
          const updatedAddress = payload.new as Address
          setAddresses(prev => prev.map(addr => 
            addr.id === updatedAddress.id ? updatedAddress : addr
          ))
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'address' },
        (payload) => {
          const deletedAddress = payload.old as Address
          setAddresses(prev => prev.filter(addr => addr.id !== deletedAddress.id))
        }
      )
      .subscribe()
    
    // Client subscription
    const clientSubscription = supabase
      .channel('client_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'client' },
        (payload) => {
          const newClient = payload.new as Client
          setClients(prev => [...prev, newClient])
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'client' },
        (payload) => {
          const updatedClient = payload.new as Client
          setClients(prev => prev.map(client => 
            client.id === updatedClient.id ? updatedClient : client
          ))
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'client' },
        (payload) => {
          const deletedClient = payload.old as Client
          setClients(prev => prev.filter(client => client.id !== deletedClient.id))
        }
      )
      .subscribe()
      
    // Instructor subscription
    const instructorSubscription = supabase
      .channel('instructor_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'instructor' },
        (payload) => {
          const newInstructor = payload.new as Instructor
          setInstructors(prev => [...prev, newInstructor])
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'instructor' },
        (payload) => {
          const updatedInstructor = payload.new as Instructor
          setInstructors(prev => prev.map(instructor => 
            instructor.id === updatedInstructor.id ? updatedInstructor : instructor
          ))
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'instructor' },
        (payload) => {
          const deletedInstructor = payload.old as Instructor
          setInstructors(prev => prev.filter(instructor => instructor.id !== deletedInstructor.id))
        }
      )
      .subscribe()
      
    // Availability subscription
    const availabilitySubscription = supabase
      .channel('availability_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'availability' },
        (payload) => {
          const newAvailability = payload.new as Availability
          setAvailabilities(prev => [...prev, newAvailability])
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'availability' },
        (payload) => {
          const updatedAvailability = payload.new as Availability
          setAvailabilities(prev => prev.map(availability => 
            availability.id === updatedAvailability.id ? updatedAvailability : availability
          ))
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'availability' },
        (payload) => {
          const deletedAvailability = payload.old as Availability
          setAvailabilities(prev => prev.filter(availability => availability.id !== deletedAvailability.id))
        }
      )
      .subscribe()
      
    // Booking subscription
    const bookingSubscription = supabase
      .channel('booking_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'booking' },
        (payload) => {
          const newBooking = payload.new as Booking
          setBookings(prev => [...prev, newBooking])
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'booking' },
        (payload) => {
          const updatedBooking = payload.new as Booking
          setBookings(prev => prev.map(booking => 
            booking.id === updatedBooking.id ? updatedBooking : booking
          ))
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'booking' },
        (payload) => {
          const deletedBooking = payload.old as Booking
          setBookings(prev => prev.filter(booking => booking.id !== deletedBooking.id))
        }
      )
      .subscribe()
    
    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(addressSubscription)
      supabase.removeChannel(clientSubscription)
      supabase.removeChannel(instructorSubscription)
      supabase.removeChannel(availabilitySubscription)
      supabase.removeChannel(bookingSubscription)
    }
  }, [])
  
  // Data mutation functions
  async function createClient(clientData: ClientInput) {
    try {
      const { data, error } = await supabase
        .from('client')
        .insert([clientData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating client:', error)
      return null
    }
  }
  
  async function createInstructor(instructorData: InstructorInput) {
    try {
      const { data, error } = await supabase
        .from('instructor')
        .insert([instructorData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating instructor:', error)
      return null
    }
  }
  
  async function createAddress(addressData: AddressInput) {
    try {
      const { data, error } = await supabase
        .from('address')
        .insert([addressData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating address:', error)
      return null
    }
  }
  
  async function createAvailability(availabilityData: AvailabilityInput) {
    try {
      const { data, error } = await supabase
        .from('availability')
        .insert([availabilityData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating availability:', error)
      return null
    }
  }
  
  async function createBooking(bookingData: BookingInput) {
    try {
      const { data, error } = await supabase
        .from('booking')
        .insert([bookingData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating booking:', error)
      return null
    }
  }
  
  const value = {
    // Data
    instructors,
    clients,
    addresses,
    availabilities,
    bookings,
    // Loading states
    loading,
    // Actions
    createClient,
    createInstructor,
    createAddress,
    createAvailability,
    createBooking
  }
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
} 