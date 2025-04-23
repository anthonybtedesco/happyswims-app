/**
 * Utility function to calculate the driving matrix between multiple points using Mapbox API
 */

// Type definitions for coordinates and response
type Coordinates = { lat: number; lng: number };
export type MatrixResponse = {
  code: string;
  durations: (number | null)[][];
  distances?: (number | null)[][];
};

/**
 * Calculate distance and duration matrix between sources and destinations
 * 
 * @param sources Array of source coordinates
 * @param destinations Array of destination coordinates
 * @returns Promise with matrix response
 */
export async function calculateMatrix(
  sources: Coordinates[],
  destinations: Coordinates[]
): Promise<MatrixResponse> {
  try {
    // Create the request body with coordinates
    const requestBody = {
      sources,
      destinations
    };

    // Call our server-side API endpoint instead of Mapbox directly
    const response = await fetch('/api/matrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Matrix API error (${response.status}):`, errorData);
      throw new Error(`Matrix calculation failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calculating distance matrix:', error);
    // Return a default response with null durations
    return {
      code: 'error',
      durations: sources.map(() => destinations.map(() => null))
    };
  }
}

/**
 * Helper function to format duration in seconds to a human-readable format
 */
export function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null || durationSeconds === undefined) {
    return 'Unknown';
  }
  
  if (durationSeconds < 60) {
    return `${Math.round(durationSeconds)} sec`;
  }
  
  const minutes = Math.floor(durationSeconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes} min`;
} 