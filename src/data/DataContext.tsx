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
}

// Define context type
interface DataContextType {
  state: DataState;
  fetchAddresses: (page: number, pageSize: number) => Promise<void>;
  fetchClients: (page: number, pageSize: number) => Promise<void>;
  fetchInstructors: (page: number, pageSize: number) => Promise<void>;
  fetchAvailabilities: (page: number, pageSize: number) => Promise<void>;
  fetchBookings: (page: number, pageSize: number) => Promise<void>;
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
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DataState>(initialState);

  const createFetchFunction = <T extends keyof DataState>(
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
  };

  const fetchAddresses = createFetchFunction('addresses', 'address');
  const fetchClients = createFetchFunction('clients', 'client');
  const fetchInstructors = createFetchFunction('instructors', 'instructor');
  const fetchAvailabilities = createFetchFunction('availabilities', 'availability');
  const fetchBookings = createFetchFunction('bookings', 'booking');

  const value = {
    state,
    fetchAddresses,
    fetchClients,
    fetchInstructors,
    fetchAvailabilities,
    fetchBookings,
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
  return { ...state.clients, fetchClients };
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

// Export the provider and hooks
export default DataProvider;
