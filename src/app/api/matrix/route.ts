import { NextRequest, NextResponse } from 'next/server';

// Use server-side environment variable (not exposed to client)
const MAPBOX_SECRET_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

// Type definitions for coordinate data
type Coordinate = {
  lat: number;
  lng: number;
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { sources, destinations } = body;
    
    if (!sources || !destinations || !Array.isArray(sources) || !Array.isArray(destinations)) {
      return NextResponse.json(
        { error: 'Valid sources and destinations arrays are required' }, 
        { status: 400 }
      );
    }

    if (sources.length === 0 || destinations.length === 0) {
      return NextResponse.json(
        { error: 'Sources and destinations arrays cannot be empty' }, 
        { status: 400 }
      );
    }

    if (!MAPBOX_SECRET_TOKEN) {
      console.error('MAPBOX_ACCESS_TOKEN is not defined in environment variables');
      return NextResponse.json(
        { error: 'Matrix API configuration error' }, 
        { status: 500 }
      );
    }

    // Combine all coordinates for the API request
    const allCoordinates = [...sources, ...destinations];
    
    // Create the coordinate string for the API
    const coordinatesString = allCoordinates
      .map((coord: Coordinate) => `${coord.lng},${coord.lat}`)
      .join(';');

    // Create sources indices string (from 0 to sources.length-1)
    const sourcesIndices = Array.from(
      { length: sources.length }, 
      (_, i) => i
    ).join(';');

    // Create destinations indices string (from sources.length to allCoordinates.length-1)
    const destinationsIndices = Array.from(
      { length: destinations.length }, 
      (_, i) => i + sources.length
    ).join(';');

    // Form the URL with server-side token
    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinatesString}?annotations=duration,distance&sources=${sourcesIndices}&destinations=${destinationsIndices}&access_token=${MAPBOX_SECRET_TOKEN}`;

    // Call the Mapbox Matrix API
    const response = await fetch(url, { 
      cache: 'force-cache' // Enable caching for identical requests
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mapbox Matrix API error (${response.status}):`, errorText);
      throw new Error(`Matrix API failed with status: ${response.status}`);
    }

    // Return the Matrix API response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in Matrix API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'error',
        durations: [] // Empty durations array as fallback
      }, 
      { status: 500 }
    );
  }
} 