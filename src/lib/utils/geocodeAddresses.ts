import { supabase } from '@/lib/supabase/client';
import { geocodeAddress, formatFullAddress } from '@/lib/mapbox/geocodingApi';
import type { Address } from '@/lib/types/supabase';

/**
 * Fetches all addresses from the database, geocodes any with null coordinates,
 * and updates the database with the geocoded coordinates.
 * 
 * @returns The number of addresses that were updated with coordinates
 */
export async function geocodeAndUpdateAddresses(): Promise<number> {
  // Fetch all addresses from the database
  const { data: addresses, error } = await supabase
    .from('address')
    .select('*');
  
  if (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
  
  // Keep track of how many addresses were updated
  let updatedCount = 0;
  
  // Process each address
  for (const address of addresses) {
    // Skip addresses that already have coordinates
    if (address.coordinates !== null) {
      continue;
    }
    
    // Create a full address string for geocoding
    const fullAddress = formatFullAddress(address);
    
    try {
      // Get coordinates for the address
      const coordinates = await geocodeAddress(fullAddress);
      
      if (coordinates) {
        // Update the address in the database with the new coordinates
        const { error: updateError } = await supabase
          .from('address')
          .update({ coordinates })
          .eq('id', address.id);
        
        if (updateError) {
          console.error(`Error updating address ${address.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated coordinates for address ${address.id}`);
        }
      } else {
        console.warn(`No coordinates found for address: ${fullAddress}`);
      }
    } catch (error) {
      console.error(`Error geocoding address ${address.id}:`, error);
    }
  }
  
  return updatedCount;
} 