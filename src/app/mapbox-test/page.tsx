'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYWdmYXJtcyIsImEiOiJjbTVpanZpaHQwd2ZuMmlxMmRhdG8wYTkzIn0.dc2SJZlMTrhyJdYm-Ttp6A';
mapboxgl.accessToken = mapboxToken;

export default function MapboxTest() {
  const mapContainer = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Following the official Mapbox documentation
    // https://docs.mapbox.com/mapbox-gl-js/guides/install/
    try {
      console.log('Initializing basic Mapbox map with token:', mapboxToken ? 'Token exists' : 'No token');
      
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.5, 40], // Default coordinates from Mapbox docs
        zoom: 9
      });
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl());
      
      // Log when map loads
      map.on('load', () => {
        console.log('Test map loaded successfully');
      });
      
      // Handle errors
      map.on('error', (e) => {
        console.error('Test map error:', e.error);
      });
      
      // Clean up on unmount
      return () => {
        map.remove();
      };
    } catch (error) {
      console.error('Error initializing test map:', error);
    }
  }, []);
  
  return (
    <div className="container">
      <h1>Mapbox Test Page</h1>
      <p>This page tests basic Mapbox integration following the official documentation.</p>
      
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '500px',
          border: '1px solid #ccc',
          borderRadius: '8px'
        }}
      />
      
      <div style={{ marginTop: '1rem' }}>
        <h2>Debug Information</h2>
        <ul>
          <li>Mapbox Token Set: {mapboxgl.accessToken ? 'Yes ✅' : 'No ❌'}</li>
          <li>Token: {mapboxgl.accessToken ? mapboxgl.accessToken.substring(0, 12) + '...' : 'None'}</li>
        </ul>
      </div>
    </div>
  );
} 