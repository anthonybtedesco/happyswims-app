import { NextRequest, NextResponse } from 'next/server';
import { geocodeAndUpdateAddresses } from '@/lib/utils/geocodeAddresses';

// Use server-side environment variable (not exposed to client)
const MAPBOX_SECRET_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

/**
 * API endpoint to manually trigger geocoding of all addresses with null coordinates
 */
export async function GET() {
  try {
    // Run geocoding process
    const updatedCount = await geocodeAndUpdateAddresses();
    
    // Return success response with number of addresses updated
    return NextResponse.json({ 
      success: true,
      message: `Successfully geocoded ${updatedCount} addresses`,
      updatedCount 
    });
  } catch (error) {
    // Return error response
    console.error('Error geocoding addresses:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error geocoding addresses',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the address
    const body = await request.json();
    const { address } = body;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' }, 
        { status: 400 }
      );
    }

    if (!MAPBOX_SECRET_TOKEN) {
      console.error('MAPBOX_ACCESS_TOKEN is not defined in environment variables');
      return NextResponse.json(
        { error: 'Geocoding configuration error' }, 
        { status: 500 }
      );
    }

    // Encode the address for the URL
    const encodedAddress = encodeURIComponent(address);
    
    // Make request to Mapbox Geocoding API with the secret token
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_SECRET_TOKEN}&limit=1`,
      { cache: 'force-cache' } // Enable caching for identical requests
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract coordinates if available
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return NextResponse.json({ lat, lng });
    }
    
    // Return null if no results found
    return NextResponse.json({ lat: null, lng: null });
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' }, 
      { status: 500 }
    );
  }
} 