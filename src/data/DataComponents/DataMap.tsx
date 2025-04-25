"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAddresses } from '../DataContext';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function DataMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { data: addresses, loading, error } = useAddresses();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-80.1918, 25.7617], // Miami coordinates
      zoom: 11
    });

    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    newMap.on('load', () => setMapLoaded(true));
    map.current = newMap;

    return () => {
      markers.current.forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when addresses change
  useEffect(() => {
    if (!map.current || !mapLoaded || !addresses?.length) return;

    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const currentMap = map.current;
    const bounds = new mapboxgl.LngLatBounds();

    addresses.forEach(({ longitude, latitude, address_line, city, state, zip }) => {
      const markerElement = document.createElement('div');
      Object.assign(markerElement.style, {
        width: '25px',
        height: '25px',
        borderRadius: '50%',
        backgroundColor: '#4BB543',
        border: '2px solid white',
        cursor: 'pointer'
      });

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 10px;">
              <strong>${address_line}</strong><br>
              ${city}, ${state} ${zip}
            </div>
          `))
        .addTo(currentMap);

      markers.current.push(marker);
      bounds.extend([longitude, latitude]);
    });

    if (!bounds.isEmpty()) {
      currentMap.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [addresses, mapLoaded]);

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        Error loading addresses: {error.message}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '500px', width: '100%' }}>
      <div ref={mapContainer} style={{
        height: '100%',
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '1rem 2rem',
            borderRadius: '4px',
            zIndex: 1
          }}>
            Loading addresses...
          </div>
        )}
      </div>
    </div>
  );
}