"use client";

import React, { useEffect } from 'react';
import {
  useAddresses,
  useClients,
  useInstructors,
  useAvailabilities,
  useBookings,
} from '@/data/DataContext';

import styles from './BookingPortal.module.css';
import { DataCalendar, DataList, DataMap, DataSearch } from '@/data/DataComponents';

const DataSection = ({ title, data, loading, error }: {
  title: string;
  data: any[];
  loading: boolean;
  error: Error | null;
}) => (
  <div className={styles.section}>
    <h2>{title}</h2>
    {loading && <div className={styles.loading}>Loading {title.toLowerCase()}...</div>}
    {error && <div className={styles.error}>Error: {error.message}</div>}
    {!loading && !error && (
      <>
        <div className={styles.count}>Count: {data.length}</div>
        <pre className={styles.data}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </>
    )}
  </div>
);

const BookingPortal: React.FC = () => {
  const addresses = useAddresses();
  const clients = useClients();
  const instructors = useInstructors();
  const availabilities = useAvailabilities();
  const bookings = useBookings();

  useEffect(() => {
    // Load first page of each data type
    const fetchData = async () => {
      try {
        await Promise.all([
          addresses.fetchAddresses(1, 50),
          clients.fetchClients(1, 50),
          instructors.fetchInstructors(1, 50),
          availabilities.fetchAvailabilities(1, 50),
          bookings.fetchBookings(1, 50)
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const isLoading = 
    addresses.loading || 
    clients.loading || 
    instructors.loading || 
    availabilities.loading || 
    bookings.loading;

  const hasError = 
    addresses.error || 
    clients.error || 
    instructors.error || 
    availabilities.error || 
    bookings.error;

  return (
    <div className={styles.container}>
      <DataSearch />
      
      {hasError && (
        <div className={styles.error}>
          Error loading data. Please try again later.
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>
          Loading data...
        </div>
      ) : (
        <>
          <DataMap />
          <DataList />
          <DataCalendar 
            availabilities={availabilities.data} 
            bookings={bookings.data}
            height="600px"
          />
        </>
      )}
    </div>
  );
};

export default BookingPortal;
