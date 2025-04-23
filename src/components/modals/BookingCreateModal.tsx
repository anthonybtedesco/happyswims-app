'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { colors, buttonVariants } from '@/lib/colors'
import { MapComponent, calculateMatrix, formatDuration } from '@/lib/mapbox'
import { geocodeNewAddress, geocodeAndUpdateAddress } from '@/lib/geocoding'
import AddressAutofillInput from '@/components/AddressAutofillInput'
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox/config'
import '@/styles/map.css'
import { AddressAutofill } from '@mapbox/search-js-react'
import AutofillAddress from '@/lib/mapbox/AutofillAddress'

type Address = {
  id: string
  address_line: string
  city: string
  state: string
  zip: string
  latitude?: number
  longitude?: number
}

type Instructor = {
  id: string
  first_name: string
  last_name: string
  home_address?: Address
  specialties?: string[]
  travel_time_seconds?: number | null
}

type Client = {
  id: string
  first_name: string
  last_name: string
}

type BookingCreateModalProps = {
  isOpen: boolean
  onClose: () => void
  instructors: Instructor[]
  clients: Client[]
  addresses: Address[]
}

// Component to display instructors in a table with travel times
const InstructorTable = ({ 
  instructors, 
  selectedInstructorId,
  onInstructorSelect,
  poolAddressId
}: { 
  instructors: Instructor[], 
  selectedInstructorId: string,
  onInstructorSelect: (id: string) => void,
  poolAddressId: string
}) => {
  return (
    <div style={{ 
      maxHeight: '250px', 
      overflowY: 'auto',
      border: `1px solid ${colors.border.light}`,
      borderRadius: '6px'
    }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: '0.875rem'
      }}>
        <thead style={{
          position: 'sticky',
          top: 0,
          backgroundColor: colors.common.white,
          borderBottom: `1px solid ${colors.border.light}`,
          zIndex: 10
        }}>
          <tr>
            <th style={{ 
              padding: '0.75rem', 
              textAlign: 'left',
              color: colors.text.secondary
            }}>Instructor</th>
            <th style={{ 
              padding: '0.75rem', 
              textAlign: 'left',
              color: colors.text.secondary 
            }}>Specialties</th>
            <th style={{ 
              padding: '0.75rem', 
              textAlign: 'left',
              color: colors.text.secondary 
            }}>Drive Time</th>
          </tr>
        </thead>
        <tbody>
          {instructors.map(instructor => (
            <tr 
              key={instructor.id}
              onClick={() => onInstructorSelect(instructor.id)}
              style={{
                cursor: 'pointer',
                backgroundColor: instructor.id === selectedInstructorId ? `${colors.primary[300]}40` : 'transparent',
                borderBottom: `1px solid ${colors.border.light}`
              }}
            >
              <td style={{ padding: '0.75rem' }}>
                {instructor.first_name} {instructor.last_name}
              </td>
              <td style={{ padding: '0.75rem' }}>
                {instructor.specialties?.join(', ') || 'N/A'}
              </td>
              <td style={{ 
                padding: '0.75rem',
                color: instructor.travel_time_seconds !== undefined && instructor.travel_time_seconds !== null ? (
                  instructor.travel_time_seconds > 1800 ? colors.status.error : // Over 30 min
                  instructor.travel_time_seconds > 900 ? colors.status.warning : // Over 15 min
                  colors.status.success
                ) : colors.text.secondary
              }}>
                {poolAddressId ? (
                  formatDuration(instructor.travel_time_seconds || null)
                ) : (
                  'Select a pool first'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Helper function to ensure address has coordinates
const ensureAddressCoordinates = async (address: Address, forceGeocode: boolean = false): Promise<Address> => {
  console.log('ensureAddressCoordinates called for address:', address);
  
  // EMERGENCY FIX: Return the address as-is without geocoding to prevent API requests
  console.log('EMERGENCY MODE: Skipping geocoding to prevent API requests');
  return address;
  
  // The below code is temporarily disabled to prevent API call loops
  /*
  // Use our new utility function instead
  return await geocodeAndUpdateAddress(address);
  */
};

export default function BookingCreateModal({ isOpen, onClose, instructors, clients, addresses }: BookingCreateModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [instructorsWithTravelTime, setInstructorsWithTravelTime] = useState<Instructor[]>(instructors)
  const [formData, setFormData] = useState({
    client_id: '',
    instructor_id: '',
    pool_address: '',
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

  const [addressesWithCoordinates, setAddressesWithCoordinates] = useState<Address[]>(addresses);
  
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

  // Ensure addressesWithCoordinates stays in sync with addresses prop
  useEffect(() => {
    console.log('Updating addressesWithCoordinates from addresses prop');
    
    // Create a map of existing addresses for quick lookup
    const existingAddressMap = new Map(
      addressesWithCoordinates.map(addr => [addr.id, addr])
    );
    
    // Merge addresses with existingAddresses, preferring existing when available
    const mergedAddresses = addresses.map(address => {
      // If we already have this address with coordinates, keep it
      if (existingAddressMap.has(address.id)) {
        return existingAddressMap.get(address.id)!;
      }
      // Otherwise use the new address
      return address;
    });
    
    console.log('Merged addresses:', mergedAddresses);
    setAddressesWithCoordinates(mergedAddresses);
    // Only run when addresses prop changes, not when addressesWithCoordinates changes
  }, [addresses]);

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
      
      if (!formData.pool_address || instructors.length === 0) {
        console.log('Cannot calculate travel times - missing pool address or instructors');
        setInstructorsWithTravelTime(instructors);
        return;
      }
      
      // Check if we've already processed this address to avoid infinite loops
      if (processedAddressesRef.current.has(formData.pool_address)) {
        console.log('Already processed this pool address, using cached results');
        return;
      }

      try {
        isCalculatingRef.current = true;
        console.log('Calculating travel times for instructors to pool:', formData.pool_address);
        
        // Find selected pool address
        let selectedPool: Address | undefined;
        const selectedPoolRaw = addressesWithCoordinates.find(addr => addr.id === formData.pool_address);
        
        // If not found in addressesWithCoordinates, try finding in original addresses prop
        if (!selectedPoolRaw) {
          console.log('Address not found in addressesWithCoordinates, trying original addresses');
          const originalAddress = addresses.find(addr => addr.id === formData.pool_address);
          
          if (!originalAddress) {
            console.error('Pool address not found in any address list:', formData.pool_address);
            setInstructorsWithTravelTime(instructors);
            isCalculatingRef.current = false;
            return;
          }
          
          // Process this address without updating state immediately to avoid loops
          console.log('Found address in original addresses:', originalAddress);
          selectedPool = await ensureAddressCoordinates(originalAddress);
        } else {
          // Ensure the selected pool has coordinates
          console.log('Ensuring pool address has coordinates');
          selectedPool = await ensureAddressCoordinates(selectedPoolRaw);
        }
        
        if (!selectedPool || !selectedPool.latitude || !selectedPool.longitude) {
          console.error('Failed to get coordinates for pool address:', selectedPool);
          setInstructorsWithTravelTime(instructors);
          isCalculatingRef.current = false;
          return;
        }

        // Mark this address as processed to avoid repeated processing
        processedAddressesRef.current.add(formData.pool_address);
        
        // Get instructors with home addresses and ensure they have coordinates
        console.log('Processing instructor home addresses');
        const instructorsWithCoordinates = await Promise.all(
          instructors
            .filter(inst => inst.home_address)
            .map(async (inst) => {
              if (!inst.home_address) return inst;
              
              const homeWithCoordinates = await ensureAddressCoordinates(inst.home_address);
              return {
                ...inst,
                home_address: homeWithCoordinates
              };
            })
        );

        const validInstructors = instructorsWithCoordinates.filter(
          inst => inst.home_address?.latitude && inst.home_address?.longitude
        );

        if (validInstructors.length === 0) {
          console.warn('No instructors have valid home address coordinates after processing');
          setInstructorsWithTravelTime(instructors);
          isCalculatingRef.current = false;
          return;
        }

        console.log(`Found ${validInstructors.length} instructors with valid home addresses`);

        // Prepare coordinates for Matrix API
        const sources = validInstructors.map(inst => ({ 
          lat: inst.home_address!.latitude!,
          lng: inst.home_address!.longitude!
        }));
        
        const destinations = [{ lat: selectedPool.latitude!, lng: selectedPool.longitude! }];

        // Call Matrix API
        console.log('Calling Matrix API with sources:', sources, 'and destinations:', destinations);
        const result = await calculateMatrix(sources, destinations);
        console.log('Matrix API result:', result);

        // Update instructors with travel times
        const updatedInstructors = instructors.map((instructor) => {
          // Find index in validInstructors to map to Matrix API result
          const validIndex = validInstructors.findIndex(i => i.id === instructor.id);
          
          if (validIndex !== -1 && result.durations && result.durations[validIndex]) {
            return {
              ...instructor,
              travel_time_seconds: result.durations[validIndex][0]
            };
          }
          
          return instructor;
        });

        // Sort instructors by travel time (instructors without travel time at the end)
        updatedInstructors.sort((a, b) => {
          if (a.travel_time_seconds === undefined && b.travel_time_seconds === undefined) return 0;
          if (a.travel_time_seconds === undefined) return 1;
          if (b.travel_time_seconds === undefined) return -1;
          return a.travel_time_seconds! - b.travel_time_seconds!;
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
  }, [formData.pool_address, instructors]);

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
        setAddressesWithCoordinates([...addressesWithCoordinates, newAddress]);
        setFormData({ ...formData, pool_address: data[0].id });
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
      
      if (!formData.pool_address) {
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

      const bookingData = {
        ...formData,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
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
        pool_address: '',
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
                  setFormData({ ...formData, client_id: e.target.value });
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
                    value={formData.pool_address}
                    onChange={(e) => {
                      console.log("Selected pool address:", e.target.value);
                      setFormData({ ...formData, pool_address: e.target.value });
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
                      addresses={addressesWithCoordinates} 
                      selectedAddressId={formData.pool_address}
                      onAddressSelect={(addressId) => {
                        console.log("Address selected from map:", addressId);
                        setFormData({ ...formData, pool_address: addressId });
                      }}
                      onAddressesGeocoded={(geocodedAddresses) => {
                        // EMERGENCY FIX: Disable geocoding callbacks to prevent API request loops
                        console.log("MapComponent geocoding callback received - DISABLED FOR SAFETY");
                        return; // Early return to prevent any state updates
                        
                        /*
                        console.log("Addresses geocoded callback received:", geocodedAddresses);
                        console.log("Number of geocoded addresses:", geocodedAddresses?.length || 0);
                        
                        if (geocodedAddresses && geocodedAddresses.length > 0) {
                          // Log first few addresses to see their structure
                          console.log("Sample geocoded address:", JSON.stringify(geocodedAddresses[0]));
                          
                          // Create a map for quick lookup
                          const addressMap = new Map(
                            addressesWithCoordinates.map(addr => [addr.id, addr])
                          );
                          
                          // Update addresses with geocoded information
                          const updatedAddresses = geocodedAddresses.map(geocoded => {
                            const existingAddress = addressMap.get(geocoded.id);
                            if (!existingAddress) return geocoded;
                            
                            if (geocoded.lat && geocoded.lng) {
                              console.log(`Found geocoded data for address ${geocoded.id}: lat=${geocoded.lat}, lng=${geocoded.lng}`);
                              return {
                                ...existingAddress,
                                lat: geocoded.lat,
                                lng: geocoded.lng
                              };
                            }
                            return existingAddress;
                          });
                          
                          console.log("Updating addressesWithCoordinates with geocoded data");
                          setAddressesWithCoordinates(updatedAddresses);
                          
                          // If we have coordinates for the currently selected address, trigger recalculation
                          if (formData.pool_address) {
                            const selectedWithCoords = updatedAddresses.find(
                              addr => addr.id === formData.pool_address && addr.lat && addr.lng
                            );
                            if (selectedWithCoords) {
                              console.log("Selected address now has coordinates, clearing processed cache to force recalculation");
                              // Clear processed addresses to force recalculation
                              processedAddressesRef.current.delete(formData.pool_address);
                            }
                          }
                        } else {
                          console.warn("No geocoded addresses received from MapComponent");
                        }
                        */
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
                Instructor
              </label>
              <InstructorTable 
                instructors={instructorsWithTravelTime}
                selectedInstructorId={formData.instructor_id}
                onInstructorSelect={(id) => {
                  console.log("Selected instructor:", id);
                  setFormData({ ...formData, instructor_id: id });
                }}
                poolAddressId={formData.pool_address}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.text.secondary }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => {
                  console.log("Selected start time:", e.target.value);
                  setFormData({ ...formData, start_time: e.target.value });
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.common.white
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