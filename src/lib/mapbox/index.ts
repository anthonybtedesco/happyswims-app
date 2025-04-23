/**
 * Mapbox API utilities index file
 * Consolidates all Mapbox-related functionality for easy import
 */

// Export Mapbox tokens for convenient access
export const MAPBOX_PUBLIC_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYWdmYXJtcyIsImEiOiJjbTVpanZpaHQwd2ZuMmlxMmRhdG8wYTkzIn0.dc2SJZlMTrhyJdYm-Ttp6A';
export const MAPBOX_SECRET_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

// Re-export everything from the API modules
export * from './matrixApi';
export * from './geocodingApi';

// Re-export the Map component
export { default as MapComponent } from './MapComponent'; 