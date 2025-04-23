import { AddressAutofill } from "@mapbox/search-js-react";
import React, { useState, useEffect } from "react";

interface AutofillAddressProps {
  initialData?: {
    address_line?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  onChange?: (data: {
    address_line: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
}

export default function AutofillAddress({ initialData, onChange }: AutofillAddressProps) {
  const [formData, setFormData] = useState({
    address_line: initialData?.address_line || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || ''
  });

  // Update parent component when form data changes
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Map field names to our state keys
    const fieldMap: Record<string, keyof typeof formData> = {
      'address': 'address_line',
      'city': 'city',
      'state': 'state',
      'postcode': 'zip'
    };
    
    // Update the form data state
    setFormData({
      ...formData,
      [fieldMap[name] || name]: value
    });
  };

  return (
    <AddressAutofill accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}>
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            name="address"
            placeholder="Address"
            type="text"
            autoComplete="address-line1"
            value={formData.address_line}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '1rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              outline: 'none'
            }}
          />
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <input
            name="city"
            placeholder="City"
            type="text"
            autoComplete="address-level2"
            value={formData.city}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '1rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              outline: 'none'
            }}
          />
          <input
            name="state"
            placeholder="State"
            type="text"
            autoComplete="address-level1"
            value={formData.state}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '1rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              outline: 'none'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <input
            name="postcode"
            placeholder="ZIP Code"
            type="text"
            autoComplete="postal-code"
            value={formData.zip}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '1rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              outline: 'none'
            }}
          />
        </div>
      </div>
    </AddressAutofill>
  )
}