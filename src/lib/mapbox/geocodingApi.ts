/**
 * Utility functions for Mapbox Geocoding API
 */

// Get access token from environment or use a default for development
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN

type Address = {
  address_line: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
  [key: string]: any; // Allow for additional properties
};

/**
 * Geocodes an address string to get latitude and longitude coordinates
 * 
 * @param address The address to geocode
 * @returns A Promise resolving to coordinates or null if not found
 */
export async function geocodeAddress(address: string) {
  try {
    // Call our server-side API endpoint instead of Mapbox directly
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Geocoding API error (${response.status}):`, errorData);
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if coordinates were found
    if (data.lat && data.lng) {
      return {
        lat: data.lat,
        lng: data.lng
      };
    }
    
    // Return null if no results found
    return null;
  } catch (error) {
    console.error(`Error geocoding address: ${address}`, error);
    return null;
  }
}

/**
 * Geocode multiple address objects
 * 
 * @param addresses Array of address objects to geocode
 * @returns Promise with geocoded address objects
 */
export async function batchGeocodeAddresses<T extends Address>(addresses: T[]): Promise<T[]> {
  return Promise.all(
    addresses.map(async (address) => {
      // Skip if already has coordinates
      if (address.lat && address.lng) {
        return address;
      }
      
      // Create a full address string for more accurate geocoding
      const fullAddress = `${address.address_line}, ${address.city}, ${address.state} ${address.zip}`;
      
      try {
        const coordinates = await geocodeAddress(fullAddress);
        
        if (coordinates) {
          return {
            ...address,
            ...coordinates
          };
        }
        
        return address;
      } catch (error) {
        console.error(`Error batch geocoding address: ${fullAddress}`, error);
        return address;
      }
    })
  );
}

/**
 * Format a full address from address components
 */
export function formatFullAddress(address: Address): string {
  return `${address.address_line}, ${address.city}, ${address.state} ${address.zip}`;
} 