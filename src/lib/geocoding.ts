import { supabase } from './supabase/client';

interface Address {
  id: string;
  address_line: string;
  coordinates?: [string, string];
  city: string;
  state: string;
  zip: string;
}

/**
 * Geocodes an address and updates the database with the coordinates
 * @param address The address object to geocode
 * @returns The address with coordinates if successful
 */
export const geocodeAndUpdateAddress = async (address: Address): Promise<Address> => {
  console.log('geocodeAndUpdateAddress called for:', address);
  
  // If address already has coordinates, return it
  if (address.coordinates && address.coordinates.length === 2) {
    console.log('Address already has coordinates, skipping geocoding', { 
      lng: address.coordinates[0], 
      lat: address.coordinates[1] 
    });
    return address;
  }
  
  try {
    // Create a full address string for more accurate geocoding
    const fullAddress = `${address.address_line}, ${address.city}, ${address.state} ${address.zip}`;
    console.log('Geocoding address:', fullAddress);
    
    // Use server-side API endpoint for geocoding
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: fullAddress }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Geocoding API error (${response.status}):`, errorData);
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Geocoding result:', data);
    
    // Check if coordinates were found
    if (data.lat && data.lng) {
      // Format coordinates as [string, string] tuple
      const coordinatesTuple: [string, string] = [
        data.lng.toString(),
        data.lat.toString()
      ];
      
      // Update address with coordinates
      const updatedAddress = {
        ...address,
        coordinates: coordinatesTuple
      };
      
      // Update the database
      console.log('Updating address in database with coordinates:', coordinatesTuple);
      const { error } = await supabase
        .from('address')
        .update({ coordinates: coordinatesTuple })
        .eq('id', address.id);
        
      if (error) {
        console.error('Failed to update address coordinates in database:', error);
      } else {
        console.log('Successfully updated address coordinates in database');
      }
      
      return updatedAddress;
    }
    
    console.warn(`No geocoding results found for address: ${fullAddress}`);
    return address;
  } catch (error) {
    console.error(`Error geocoding address:`, error);
    return address;
  }
};

/**
 * Geocodes an address when creating a new record, without updating the database
 * Used during address creation before an ID exists
 * @param addressLine Street address
 * @param city City
 * @param state State
 * @param zip ZIP code
 * @returns The coordinates tuple if found, or null
 */
export const geocodeNewAddress = async (
  addressLine: string,
  city: string,
  state: string,
  zip: string
): Promise<[string, string] | null> => {
  try {
    // Create a full address string for more accurate geocoding
    const fullAddress = `${addressLine}, ${city}, ${state} ${zip}`;
    console.log('Geocoding new address:', fullAddress);
    
    // Use server-side API endpoint for geocoding
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: fullAddress }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Geocoding API error (${response.status}):`, errorData);
      return null;
    }

    const data = await response.json();
    console.log('Geocoding result for new address:', data);
    
    // Check if coordinates were found
    if (data.lat && data.lng) {
      // Format coordinates as [string, string] tuple
      const coordinatesTuple: [string, string] = [
        data.lng.toString(),
        data.lat.toString()
      ];
      
      return coordinatesTuple;
    }
    
    console.warn(`No geocoding results found for address: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error(`Error geocoding new address:`, error);
    return null;
  }
}; 