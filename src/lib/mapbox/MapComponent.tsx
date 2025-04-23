'use client'

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Required CSS import

// Explicitly disable Mapbox telemetry to prevent ad blocker issues
// This is an undocumented feature but helps with ad blockers
if (mapboxgl.config) {
  // @ts-ignore - The config may vary by version
  mapboxgl.config.TELEMETRY_DISABLED = true;
}

// Set Mapbox access token from environment variables
// Using the public token for client-side operations
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYWdmYXJtcyIsImEiOiJjbTVpanZpaHQwd2ZuMmlxMmRhdG8wYTkzIn0.dc2SJZlMTrhyJdYm-Ttp6A';
mapboxgl.accessToken = MAPBOX_TOKEN;

console.log('Mapbox GL using token:', mapboxgl.accessToken ? 'Token set' : 'Token missing');

// Private token is not used on client-side, but keeping reference for server-side operations
// process.env.MAPBOX_ACCESS_TOKEN is the private token for server operations

type Address = {
  id: string;
  address_line: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
};

type MapComponentProps = {
  addresses: Address[];
  onAddressSelect?: (addressId: string) => void;
  selectedAddressId?: string;
  height?: string;
  onAddressesGeocoded?: (addresses: Address[]) => void;
};

const MapComponent: React.FC<MapComponentProps> = ({
  addresses,
  onAddressSelect,
  selectedAddressId,
  height = '300px',
  onAddressesGeocoded
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Geocode the addresses using server-side API endpoint
  const geocodeAddresses = async () => {
    if (!mapboxgl.accessToken) {
      setMapError("Mapbox access token is missing. Please check your environment configuration.");
      console.error("Mapbox access token is missing");
      return addresses;
    }

    const geocodedAddresses = await Promise.all(
      addresses.map(async (address) => {
        // Skip if already has coordinates
        if (address.lat && address.lng) {
          return address;
        }
        
        // Create a full address string for more accurate geocoding
        const fullAddress = `${address.address_line}, ${address.city}, ${address.state} ${address.zip}`;
        
        try {
          // Use server-side API instead of direct Mapbox API call
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
          
          // Check if coordinates were found
          if (data.lat && data.lng) {
            return {
              ...address,
              lng: data.lng,
              lat: data.lat
            };
          }
          
          // If no results, return the address without coordinates
          console.warn(`No geocoding results found for address: ${fullAddress}`);
          return address;
        } catch (error) {
          console.error(`Error geocoding address: ${fullAddress}`, error);
          return address;
        }
      })
    );

    // Notify parent component of the geocoded addresses if callback provided
    if (onAddressesGeocoded) {
      onAddressesGeocoded(geocodedAddresses);
    }

    return geocodedAddresses;
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if Mapbox token is available
    if (!mapboxgl.accessToken) {
      console.error("Mapbox access token is missing. Please check your environment configuration.");
      setMapError("Mapbox access token is missing. Please check your environment configuration.");
      return;
    }

    try {
      console.log('Initializing Mapbox map with container:', mapContainer.current);
      
      // Initialize map - following Mapbox documentation at:
      // https://docs.mapbox.com/mapbox-gl-js/guides/install/
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Use latest style version
        center: [-80.1918, 25.7617], // Miami, FL as a default center
        zoom: 11
      });

      // Add navigation controls (zoom buttons)
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Set map as loaded when it's ready
      map.current.on('load', () => {
        console.log('Mapbox map loaded successfully');
        setMapLoaded(true);
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when addresses or map changes
  useEffect(() => {
    if (!map.current || !mapLoaded || addresses.length === 0 || mapError) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Load and geocode addresses
    geocodeAddresses().then(geocodedAddresses => {
      // Create a bounds object to fit all markers
      const bounds = new mapboxgl.LngLatBounds();
      let validAddressesFound = false;

      geocodedAddresses.forEach(address => {
        if (!address.lat || !address.lng || !map.current) return;
        
        validAddressesFound = true;

        // Create marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.style.width = '25px';
        markerElement.style.height = '25px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.backgroundColor = address.id === selectedAddressId ? '#0078FF' : '#4BB543';
        markerElement.style.border = '2px solid white';
        markerElement.style.cursor = 'pointer';

        // Create popup with address info
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 10px;">
            <strong>Pool Address</strong>
            <p style="margin: 5px 0;">
              <strong>${address.address_line}</strong><br>
              ${address.city}, ${address.state} ${address.zip}
            </p>
          </div>
        `);

        // Create and add the marker
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([address.lng, address.lat])
          .setPopup(popup)
          .addTo(map.current);

        // Add click handler if callback provided
        if (onAddressSelect) {
          markerElement.addEventListener('click', () => {
            onAddressSelect(address.id);
          });
        }

        // Add this point to the bounds
        bounds.extend([address.lng, address.lat]);

        // Store marker for later cleanup
        markers.current.push(marker);
      });

      // Fit map to all markers if there are any
      if (!bounds.isEmpty() && map.current && validAddressesFound) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    });
  }, [addresses, selectedAddressId, mapLoaded, onAddressSelect, onAddressesGeocoded, mapError]);

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      {mapError ? (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          color: '#dc3545',
          border: '1px solid #dee2e6'
        }}>
          <div>🗺️</div>
          <h3>Map Error</h3>
          <p>{mapError}</p>
          <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
            Please check your Mapbox access token configuration.
          </p>
        </div>
      ) : (
        <div 
          className="map-container" 
          ref={mapContainer} 
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
      )}
    </div>
  );
};

export default MapComponent; 