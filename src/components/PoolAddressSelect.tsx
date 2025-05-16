'use client';

import React, { useState } from 'react';
import { MapComponent } from '@/lib/mapbox';
import AutofillAddress from '@/lib/mapbox/AutofillAddress';
import { Address } from '@/lib/types/supabase';
import { supabase } from '@/lib/supabase/client';
import { geocodeNewAddress } from '@/lib/geocoding';
import { buttonVariants } from '@/lib/colors';


interface PoolAddressSelectProps {
  addresses: Address[];
  selectedAddressId: string;
  onAddressSelect: (addressId: string) => void;
}

export default function PoolAddressSelect({
  addresses,
  selectedAddressId,
  onAddressSelect
}: PoolAddressSelectProps) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressData, setAddressData] = useState({
    address_line: '',
    city: '',
    state: '',
    zip: ''
  });

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (!addressData.address_line || !addressData.city || !addressData.state || !addressData.zip) {
        throw new Error('All address fields are required');
      }
      
      // Get coordinates for the address
      const coordinates = await geocodeNewAddress(
        addressData.address_line,
        addressData.city,
        addressData.state,
        addressData.zip
      );
      
      // Create address record with coordinates
      const addressInsertData = {
        address_line: addressData.address_line,
        city: addressData.city,
        state: addressData.state,
        zip: addressData.zip,
        ...(coordinates && { 
          latitude: coordinates[1],
          longitude: coordinates[0]
        })
      };
      
      const { data, error: dbError } = await supabase
        .from('address')
        .insert([addressInsertData])
        .select('id, address_line, city, state, zip, latitude, longitude');

      if (dbError) throw dbError;

      if (data?.[0]) {
        onAddressSelect(data[0].id);
        setShowAddressForm(false);
        setAddressData({
          address_line: '',
          city: '',
          state: '',
          zip: ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  return (
    <div>
      <style jsx>{`
        .address-select {
          margin-bottom: 1rem;
        }

        .map-container {
          margin-top: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          height: 300px;
        }

        .address-form {
          margin-top: 1rem;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .error {
          margin-top: 0.5rem;
          padding: 0.5rem;
          color: #ef4444;
          background-color: #fee2e2;
          border-radius: 4px;
        }

        .add-address {
          margin-top: 0.5rem;
          color: #3b82f6;
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
        }

        .add-address:hover {
          text-decoration: underline;
        }
      `}</style>

      {!showAddressForm ? (
        <>
          <div className="address-select">
            <select
              value={selectedAddressId}
              onChange={(e) => onAddressSelect(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select Pool Location</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.address_line}, {address.city}, {address.state} {address.zip}
                </option>
              ))}
            </select>
            <button
              className="add-address"
              onClick={() => setShowAddressForm(true)}
            >
              + Add New Address
            </button>
          </div>

          <div className="map-container">
            <MapComponent 
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onAddressSelect={onAddressSelect}
            />
          </div>
        </>
      ) : (
        <div className="address-form">
          <form onSubmit={handleAddressSubmit}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <AutofillAddress
                initialData={addressData}
                onChange={setAddressData}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="submit"
                style={{
                  ...buttonVariants.primary,
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Save Address
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Canceling address form");
                  setShowAddressForm(false);
                }}
                style={{
                  ...buttonVariants.secondary,
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  );
} 