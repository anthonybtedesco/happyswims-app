"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/supabase';

// Define pagination state type
interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Define data state type for each table
interface DataState {
  addresses: {
    data: Database['public']['Tables']['address']['Row'][];
    pagination: PaginationState;
    loading: boolean;
    error: Error | null;
  };
  clients: {
    data: Database['public']['Tables']['client']['Row'][];
    pagination: PaginationState;
    loading: boolean;
    error: Error | null;
  };
  instructors: {
    data: Database['public']['Tables']['instructor']['Row'][];
    pagination: PaginationState;
    loading: boolean;
    error: Error | null;
  };
  availabilities: {
    data: Database['public']['Tables']['availability']['Row'][];
    pagination: PaginationState;
    loading: boolean;
    error: Error | null;
  };
  bookings: {
    data: Database['public']['Tables']['booking']['Row'][];
    pagination: PaginationState;
    loading: boolean;
    error: Error | null;
  };
  students: {
    data: Database['public']['Tables']['student']['Row'][];
    pagination: PaginationState;
    loading: boolean;
    error: Error | null;
  };
}

// Define context type
interface DataContextType {
  state: DataState;
  fetchAllData: () => Promise<void>;
  fetchAddresses: (page: number, pageSize: number) => Promise<void>;
  fetchClients: (page: number, pageSize: number) => Promise<void>;
  fetchInstructors: (page: number, pageSize: number) => Promise<void>;
  fetchAvailabilities: (page: number, pageSize: number) => Promise<void>;
  fetchBookings: (page: number, pageSize: number) => Promise<void>;
  fetchStudents: (page: number, pageSize: number) => Promise<void>;
}

const initialPaginationState: PaginationState = {
  page: 1,
  pageSize: 10,
  total: 0,
};

const initialState: DataState = {
  addresses: { data: [], pagination: { ...initialPaginationState }, loading: false, error: null },
  clients: { data: [], pagination: { ...initialPaginationState }, loading: false, error: null },
  instructors: { data: [], pagination: { ...initialPaginationState }, loading: false, error: null },
  availabilities: { data: [], pagination: { ...initialPaginationState }, loading: false, error: null },
  bookings: { data: [], pagination: { ...initialPaginationState }, loading: false, error: null },
  students: { data: [], pagination: { ...initialPaginationState }, loading: false, error: null },
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DataState>(initialState);

  const fetchAllData = useCallback(async () => {
    // Set loading state for all tables
    setState(prev => ({
      ...prev,
      addresses: { ...prev.addresses, loading: true, error: null },
      clients: { ...prev.clients, loading: true, error: null },
      instructors: { ...prev.instructors, loading: true, error: null },
      availabilities: { ...prev.availabilities, loading: true, error: null },
      bookings: { ...prev.bookings, loading: true, error: null },
      students: { ...prev.students, loading: true, error: null },
    }));

    try {
      const [clientData, instructorData, addressData, bookingData, availabilityData, studentData] = await Promise.all([
        supabase.from('client').select('*'),
        supabase.from('instructor').select('*'),
        supabase.from('address').select('*'),
        supabase.from('booking').select('*'),
        supabase.from('availability').select('*'),
        supabase.from('student').select('*')
      ]);

      setState(prev => ({
        ...prev,
        addresses: {
          data: addressData.data || [],
          pagination: { ...prev.addresses.pagination, total: addressData.data?.length || 0 },
          loading: false,
          error: addressData.error
        },
        clients: {
          data: clientData.data || [],
          pagination: { ...prev.clients.pagination, total: clientData.data?.length || 0 },
          loading: false,
          error: clientData.error
        },
        instructors: {
          data: instructorData.data || [],
          pagination: { ...prev.instructors.pagination, total: instructorData.data?.length || 0 },
          loading: false,
          error: instructorData.error
        },
        availabilities: {
          data: availabilityData.data || [],
          pagination: { ...prev.availabilities.pagination, total: availabilityData.data?.length || 0 },
          loading: false,
          error: availabilityData.error
        },
        bookings: {
          data: bookingData.data || [],
          pagination: { ...prev.bookings.pagination, total: bookingData.data?.length || 0 },
          loading: false,
          error: bookingData.error
        },
        students: {
          data: studentData.data || [],
          pagination: { ...prev.students.pagination, total: studentData.data?.length || 0 },
          loading: false,
          error: studentData.error
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        addresses: { ...prev.addresses, loading: false, error: error as Error },
        clients: { ...prev.clients, loading: false, error: error as Error },
        instructors: { ...prev.instructors, loading: false, error: error as Error },
        availabilities: { ...prev.availabilities, loading: false, error: error as Error },
        bookings: { ...prev.bookings, loading: false, error: error as Error },
        students: { ...prev.students, loading: false, error: error as Error }
      }));
    }
  }, []);

  const createFetchFunction = useCallback(<T extends keyof DataState>(
    tableName: T,
    supabaseTable: string
  ) => {
    return async (page: number, pageSize: number) => {
      setState(prev => ({
        ...prev,
        [tableName]: { ...prev[tableName], loading: true, error: null }
      }));

      try {
        // Calculate offset
        const offset = (page - 1) * pageSize;

        // Fetch data with pagination
        const { data, error, count } = await supabase
          .from(supabaseTable)
          .select('*', { count: 'exact' })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        setState(prev => ({
          ...prev,
          [tableName]: {
            data: data || [],
            pagination: {
              page,
              pageSize,
              total: count || 0
            },
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          [tableName]: {
            ...prev[tableName],
            loading: false,
            error: error as Error
          }
        }));
      }
    };
  }, []);

  const fetchAddresses = useCallback(createFetchFunction('addresses', 'address'), [createFetchFunction]);
  const fetchClients = useCallback(createFetchFunction('clients', 'client'), [createFetchFunction]);
  const fetchInstructors = useCallback(createFetchFunction('instructors', 'instructor'), [createFetchFunction]);
  const fetchAvailabilities = useCallback(createFetchFunction('availabilities', 'availability'), [createFetchFunction]);
  const fetchBookings = useCallback(createFetchFunction('bookings', 'booking'), [createFetchFunction]);
  const fetchStudents = useCallback(createFetchFunction('students', 'student'), [createFetchFunction]);

  const value = {
    state,
    fetchAllData,
    fetchAddresses,
    fetchClients,
    fetchInstructors,
    fetchAvailabilities,
    fetchBookings,
    fetchStudents,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Custom hooks for individual tables
export const useAddresses = () => {
  const { state, fetchAddresses } = useData();
  return { ...state.addresses, fetchAddresses };
};

export const useClients = () => {
  const { state, fetchClients } = useData();
  // Ensure data is always an array even if undefined
  const safeData = state.clients.data || [];
  return { ...state.clients, data: safeData, fetchClients };
};

export const useInstructors = () => {
  const { state, fetchInstructors } = useData();
  return { ...state.instructors, fetchInstructors };
};

export const useAvailabilities = () => {
  const { state, fetchAvailabilities } = useData();
  return { ...state.availabilities, fetchAvailabilities };
};

export const useBookings = () => {
  const { state, fetchBookings } = useData();
  return { ...state.bookings, fetchBookings };
};

export const useStudents = () => {
  const { state, fetchStudents } = useData();
  return { ...state.students, fetchStudents };
};

// Add a new custom hook for fetching all data
export const useAllData = () => {
  const { state, fetchAllData } = useData();
  return { state, fetchAllData };
};

// Export the provider and hooks
export default DataProvider;
