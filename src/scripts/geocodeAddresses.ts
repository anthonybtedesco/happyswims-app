import { geocodeAndUpdateAddresses } from '@/lib/utils/geocodeAddresses';

/**
 * Script to geocode all addresses in the database that have null coordinates
 */
async function main() {
  console.log('Starting address geocoding process...');
  
  try {
    const updatedCount = await geocodeAndUpdateAddresses();
    console.log(`Successfully geocoded ${updatedCount} addresses`);
  } catch (error) {
    console.error('Error in geocoding process:', error);
    process.exit(1);
  }
  
  console.log('Address geocoding process completed');
  process.exit(0);
}

// Run the script
main(); 