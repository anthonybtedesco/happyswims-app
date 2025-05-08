'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { colors, buttonVariants } from '@/lib/colors'
import { MapComponent, calculateMatrix, formatDuration } from '@/lib/mapbox'
import '@/styles/map.css'
import AutofillAddress from '@/lib/mapbox/AutofillAddress'
import { Address, Instructor, Client, BookingInsert, Availability } from '@/lib/types/supabase'
import InstructorList from '../InstructorList'
import { geocodeNewAddress } from '@/lib/geocoding'
import DateTimePicker from '@/components/DateTimePicker'

// Extended instructor type that includes travel time
type InstructorWithTravelTime = Instructor & {
  travel_time_seconds?: number | null;
  specialties?: string;
}

type BookingCreateModalProps = {
  isOpen: boolean
  onClose: () => void
  instructors: Instructor[]
  clients: Client[]
  addresses: Address[]
  availabilities: Availability[]
}

export default function BookingCreateModal({ isOpen, onClose, instructors, clients, addresses, availabilities }: BookingCreateModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [instructorsWithTravelTime, setInstructorsWithTravelTime] = useState<InstructorWithTravelTime[]>(instructors)
  const [formData, setFormData] = useState<Omit<BookingInsert, 'end_time'> & { duration: number }>({
    client_id: '',
    instructor_id: '',
    pool_address_id: '',
    start_time: '',
    duration: 30,
    recurrence_weeks: 0,
    status: 'scheduled'
  })

  const [addressData, setAddressData] = useState({
    address_line: '',
    city: '',
    state: '',
    zip: ''
  })

  // Use a ref to track processing state to prevent infinite loops
  const isCalculatingRef = useRef(false);
  // Track which addresses have been processed
  const processedAddressesRef = useRef<Set<string>>(new Set());

  // Log when modal opens or closes
  useEffect(() => {
    console.log(`BookingCreateModal ${isOpen ? 'opened' : 'closed'}`);
    console.log('Initial instructors:', instructors);
    console.log('Initial clients:', clients);
    console.log('Initial addresses:', addresses);
  }, [isOpen, instructors, clients, addresses]);

  // Log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  // Update the calculation of travel times when pool address is selected
  useEffect(() => {
    async function calculateTravelTimes() {
      // Avoid reprocessing if already calculating or missing required data
      if (isCalculatingRef.current) {
        console.log('Already calculating travel times, skipping');
        return;
      }
      
      if (!formData.pool_address_id || instructors.length === 0) {
        console.log('Cannot calculate travel times - missing pool address or instructors');
        setInstructorsWithTravelTime(instructors);
        return;
      }
      
      // Check if we've already processed this address to avoid infinite loops
      if (processedAddressesRef.current.has(formData.pool_address_id)) {
        console.log('Already processed this pool address, using cached results');
        return;
      }

      try {
        isCalculatingRef.current = true;
        console.log('Calculating travel times for instructors to pool:', formData.pool_address_id);
        
        // Find selected pool address
        let selectedPool: Address | undefined;
        const selectedPoolRaw = addresses.find(addr => addr.id === formData.pool_address_id);
        
        // If not found in addressesWithCoordinates, try finding in original addresses prop
        if (!selectedPoolRaw) {
          console.log('Address not found in addresses, trying original addresses');
          const originalAddress = addresses.find(addr => addr.id === formData.pool_address_id);
          
          if (!originalAddress) {
            console.error('Pool address not found in any address list:', formData.pool_address_id);
            setInstructorsWithTravelTime(instructors);
            isCalculatingRef.current = false;
            return;
          }
          
          // Process this address without updating state immediately to avoid loops
          console.log('Found address in original addresses:', originalAddress);
          selectedPool = originalAddress;
        } else {
          // Ensure the selected pool has coordinates
          console.log('Ensuring pool address has coordinates');
          selectedPool = selectedPoolRaw;
        }
        
        if (!selectedPool || !selectedPool.latitude || !selectedPool.longitude) {
          console.error('Failed to get coordinates for pool address:', selectedPool);
          setInstructorsWithTravelTime(instructors);
          isCalculatingRef.current = false;
          return;
        }

        // Mark this address as processed to avoid repeated processing
        processedAddressesRef.current.add(formData.pool_address_id);
        
        // Get instructors with home addresses and ensure they have coordinates
        console.log('Processing instructor home addresses');

        if (instructors.length === 0) {
          console.warn('No instructors have valid home address coordinates after processing');
          setInstructorsWithTravelTime(instructors);
          isCalculatingRef.current = false;
          return;
        }

        console.log(`Found ${instructors.length} instructors with valid home addresses`);

        // Process instructors in batches of 10
        const BATCH_SIZE = 10;
        const updatedInstructors: InstructorWithTravelTime[] = [...instructors];
        const destination = [{ lat: selectedPool.latitude!, lng: selectedPool.longitude! }];

        for (let i = 0; i < instructors.length; i += BATCH_SIZE) {
          const batch = instructors.slice(i, i + BATCH_SIZE);
          const sources = batch.map(inst => {
            const homeAddress = addresses.find(addr => addr.id === inst.home_address_id);
            return {
              lat: homeAddress?.latitude,
              lng: homeAddress?.longitude
            };
          }).filter(coord => coord.lat !== undefined && coord.lng !== undefined);

          console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} with ${sources.length} instructors`);
          const result = await calculateMatrix(sources as {lat: number, lng: number}[], destination as {lat: number, lng: number}[]);
          
          // Update instructors in this batch with their travel times
          batch.forEach((instructor, batchIndex) => {
            const index = i + batchIndex;
            if (result.durations && result.durations[batchIndex]) {
              updatedInstructors[index] = {
                ...instructor,
                travel_time_seconds: result.durations[batchIndex][0]
              };
            }
          });

          // Add a small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < instructors.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Sort instructors by travel time (instructors without travel time at the end)
        updatedInstructors.sort((a, b) => {
          const aTravelTime = 'travel_time_seconds' in a ? a.travel_time_seconds : undefined;
          const bTravelTime = 'travel_time_seconds' in b ? b.travel_time_seconds : undefined;
          
          if (aTravelTime === undefined && bTravelTime === undefined) return 0;
          if (aTravelTime === undefined) return 1;
          if (bTravelTime === undefined) return -1;
          return aTravelTime! - bTravelTime!;
        });

        console.log('Updated instructors with travel times:', updatedInstructors);
        setInstructorsWithTravelTime(updatedInstructors);
      } catch (err) {
        console.error('Error calculating travel times:', err);
        setError(`Failed to calculate travel times: ${err instanceof Error ? err.message : String(err)}`);
        setInstructorsWithTravelTime(instructors);
      } finally {
        isCalculatingRef.current = false;
      }
    }

    calculateTravelTimes();
  // Only depend on pool_address changes to avoid infinite loops
  }, [formData.pool_address_id, instructors]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log("Submitting new address:", addressData);
      setError(null);
      
      if (!addressData.address_line || !addressData.city || !addressData.state || !addressData.zip) {
        const errorMsg = "All address fields are required";
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      // Get coordinates for the address using our new utility
      console.log('Geocoding address before creating record');
      const coordinates = await geocodeNewAddress(
        addressData.address_line,
        addressData.city,
        addressData.state,
        addressData.zip
      );
      
      console.log('Geocoding results:', coordinates);
      
      // Create address record with coordinates if available
      const addressInsertData = {
        ...addressData,
        ...(coordinates && { 
          latitude: coordinates[1],  // Latitude is the second element in the tuple
          longitude: coordinates[0]  // Longitude is the first element in the tuple
        })
      };
      
      console.log("Inserting address into database with data:", addressInsertData);
      const { data, error: dbError } = await supabase
        .from('address')
        .insert([addressInsertData])
        .select();

      if (dbError) {
        console.error("Database error when inserting address:", dbError);
        throw dbError;
      }

      console.log("Address saved successfully:", data);

      if (data) {
        // Add the new address to the addressesWithCoordinates state
        const newAddress = {
          ...data[0]
        };
        
        console.log("Adding new address to state:", newAddress);
        setFormData({ ...formData, pool_address_id: data[0].id });
        setShowAddressForm(false);
      }
    } catch (err: any) {
      const errorMsg = `Failed to save address: ${err.message || String(err)}`;
      console.error(errorMsg, err);
      setError(errorMsg);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      console.log("Submitting booking form:", formData);
      
      // Validate form data
      if (!formData.client_id) {
        const errorMsg = "Please select a client";
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      if (!formData.instructor_id) {
        const errorMsg = "Please select an instructor";
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      if (!formData.pool_address_id) {
        const errorMsg = "Please select a pool address";
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      if (!formData.start_time) {
        const errorMsg = "Please select a start time";
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      const startTime = new Date(formData.start_time);
      if (isNaN(startTime.getTime())) {
        const errorMsg = "Invalid start time";
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      const endTime = new Date(startTime.getTime() + formData.duration * 60000);
      console.log("Calculated times:", { 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString(), 
        duration: formData.duration 
      });

      const bookingData: BookingInsert = {
        client_id: formData.client_id,
        instructor_id: formData.instructor_id,
        pool_address_id: formData.pool_address_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: formData.duration,
        recurrence_weeks: formData.recurrence_weeks,
        status: formData.status
      };
      
      console.log("Saving booking to database:", bookingData);
      const { data, error: dbError } = await supabase
        .from('booking')
        .insert([bookingData]);

      if (dbError) {
        console.error("Database error when creating booking:", dbError);
        throw dbError;
      }

      console.log("Booking created successfully:", data);
      setSuccess(true);
      setFormData({
        client_id: '',
        instructor_id: '',
        pool_address_id: '',
        start_time: '',
        duration: 30,
        recurrence_weeks: 0,
        status: 'scheduled'
      });
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      const errorMsg = `Failed to create booking: ${err.message || String(err)}`;
      console.error(errorMsg, err);
      setError(errorMsg);
    }
  }

  // Log when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      console.log("BookingCreateModal opened");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: colors.common.white,
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: colors.text.primary
          }}>
            Create New Booking
          </h2>
          <button
            onClick={() => {
              console.log("Closing BookingCreateModal");
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: colors.text.secondary
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Client
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => {
                  console.log("Selected client:", e.target.value);
                  const selectedClient = clients.find(client => client.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    client_id: e.target.value, 
                    pool_address_id: selectedClient?.home_address_id || ''
                  });
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Pool Address
              </label>
              {!showAddressForm ? (
                <>
                  <select
                    value={formData.pool_address_id}
                    onChange={(e) => {
                      console.log("Selected pool address:", e.target.value);
                      setFormData({ ...formData, pool_address_id: e.target.value });
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border.light}`,
                      backgroundColor: colors.common.white
                    }}
                  >
                    <option value="">Select Pool</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.address_line}, {address.city}, {address.state} {address.zip}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Showing address form");
                      setShowAddressForm(true);
                    }}
                    style={{
                      marginTop: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    + Add New Address
                  </button>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <MapComponent 
                      addresses={addresses} 
                      selectedAddressId={formData.pool_address_id}
                      onAddressSelect={(addressId) => {
                        console.log("Address selected from map:", addressId);
                        setFormData({ ...formData, pool_address_id: addressId });
                      }}
                      height="250px"
                    />
                    <div style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.75rem', 
                      color: colors.text.secondary,
                      textAlign: 'right' 
                    }}>
                      If the map doesn't load, please check the Mapbox API token configuration.
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ border: `1px solid ${colors.border.light}`, padding: '1rem', borderRadius: '6px' }}>
                  <form onSubmit={handleAddressSubmit}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <AutofillAddress />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        type="submit"
                        style={{
                          ...buttonVariants.primary,
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("Canceling address form");
                          setShowAddressForm(false);
                        }}
                        style={{
                          ...buttonVariants.secondary,
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Start Time
              </label>
              <DateTimePicker
                selectedDateTime={formData.start_time}
                onChange={(dateTime) => {
                  console.log("Selected date and time:", dateTime);
                  setFormData({ ...formData, start_time: dateTime });
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Duration (minutes)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => {
                  const duration = Number(e.target.value);
                  console.log("Selected duration:", duration, "minutes");
                  setFormData({ ...formData, duration });
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (i + 1) * 5).map(minutes => (
                  <option key={minutes} value={minutes}>{minutes} minutes</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Recurrence (weeks)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={formData.recurrence_weeks}
                onChange={(e) => {
                  const weeks = Number(e.target.value);
                  console.log("Selected recurrence:", weeks, "weeks");
                  setFormData({ ...formData, recurrence_weeks: weeks });
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
                }}
              />
            </div>
          </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Instructor
              </label>
              <InstructorList
                instructors={instructorsWithTravelTime}
                availabilities={availabilities}
                selectedInstructorId={formData.instructor_id}
                onInstructorSelect={(id) => {
                  console.log("Selected instructor:", id);
                  setFormData({ ...formData, instructor_id: id });
                }}
                poolAddressId={formData.pool_address_id}
                startDateTime={formData.start_time}
                duration={formData.duration}
                recurrenceWeeks={formData.recurrence_weeks}
              />
            </div>


          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              backgroundColor: colors.status.error + '20',
              color: colors.status.error
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              backgroundColor: colors.status.success + '20',
              color: colors.status.success
            }}>
              Booking created successfully!
            </div>
          )}

          <button
            type="submit"
            style={{
              ...buttonVariants.primary,
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Create Booking
          </button>
        </form>
      </div>
    </div>
  )
}