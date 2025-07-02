'use client'

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './MapComponent.module.css';

interface Address {
  id: string;
  address_line: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

type MapComponentProps = {
  addresses: Address[];
  onAddressSelect?: (addressId: string) => void;
  selectedAddressId?: string;
  height?: string;
  defaultMarkerColor?: string;
};

function MapComponent({
  addresses,
  onAddressSelect,
  selectedAddressId,
  height = '300px',
  defaultMarkerColor = '#4BB543',
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      console.error("Mapbox access token is missing. Please check your environment configuration.");
      setMapError("Mapbox access token is missing. Please check your environment configuration.");
      return;
    }

    try {
      console.log('Initializing Mapbox map with container:', mapContainer.current);
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-80.1918, 25.7617],
        zoom: 11
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Mapbox map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : String(error)}`);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  function getMarkerColor(address: Address) {
    if (address.id === selectedAddressId) {
      return '#0078FF';
    }
    return defaultMarkerColor;
  }

  useEffect(() => {
    if (!map.current || !mapLoaded || mapError) return;

    console.log('MapComponent: Creating markers for addresses:', addresses)
    console.log('MapComponent: Map loaded:', mapLoaded)
    console.log('MapComponent: Map error:', mapError)

    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let validAddressesFound = false;

    addresses.forEach(address => {
      if (!address.latitude || !address.longitude || !map.current) {
        console.log('MapComponent: Skipping address due to missing data:', address)
        return;
      }
      
      console.log('MapComponent: Creating marker for address:', address)
      validAddressesFound = true;

      const markerElement = document.createElement('div');
      markerElement.className = styles.customMarker;
      markerElement.style.width = '25px';
      markerElement.style.height = '25px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = getMarkerColor(address);
      markerElement.style.border = '2px solid white';
      markerElement.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 10px;">
          <p style="margin: 5px 0;">
            <strong>${address.address_line}</strong><br>
            ${address.city}, ${address.state} ${address.zip}
          </p>
        </div>
      `);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([address.longitude, address.latitude])
        .setPopup(popup)
        .addTo(map.current);

      if (onAddressSelect) {
        markerElement.addEventListener('click', () => {
          onAddressSelect(address.id);
        });
      }

      bounds.extend([address.longitude, address.latitude]);
      markers.current.push(marker);
    });

    if (!bounds.isEmpty() && map.current && validAddressesFound) {
      console.log('MapComponent: Positioning map with valid addresses')
      // If we have valid addresses, fit bounds to show all markers
      if (addresses.length === 1) {
        // For single address, center directly on it with appropriate zoom
        const address = addresses[0];
        console.log('MapComponent: Centering on single address:', address)
        map.current.setCenter([address.longitude!, address.latitude!]);
        map.current.setZoom(14);
      } else {
        // For multiple addresses, fit bounds
        console.log('MapComponent: Fitting bounds for multiple addresses')
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    } else if (map.current && addresses.length > 0) {
      console.log('MapComponent: No valid coordinates, showing default view')
      // If we have addresses but no valid coordinates, show a default view
      map.current.setCenter([-80.1918, 25.7617]);
      map.current.setZoom(11);
    } else if (map.current) {
      console.log('MapComponent: No addresses, showing default view')
      // If no addresses at all, show a default view
      map.current.setCenter([-80.1918, 25.7617]);
      map.current.setZoom(11);
    }
  }, [addresses, selectedAddressId, mapLoaded, onAddressSelect, mapError, defaultMarkerColor]);

  return (
    <div className={styles.mapWrapper} style={{ height, width: '100%' }}>
      {mapError ? (
        <div className={styles.mapError}>
          <div className={styles.mapErrorIcon}>🗺️</div>
          <h3 className={styles.mapErrorTitle}>Map Error</h3>
          <p className={styles.mapErrorText}>{mapError}</p>
          <p className={styles.mapErrorHelp}>
            Please check your Mapbox access token configuration.
          </p>
        </div>
      ) : (
        <div 
          className={styles.mapContainer} 
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
}

export default MapComponent; 