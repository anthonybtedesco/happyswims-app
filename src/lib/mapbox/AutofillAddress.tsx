import { useState, useEffect } from "react";

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
    latitude?: number;
    longitude?: number;
  }) => void;
}

export default function AutofillAddress({ initialData, onChange }: AutofillAddressProps) {
  const [formData, setFormData] = useState({
    address_line: initialData?.address_line || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });
  
  // Update parent component when form data changes
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  // Handle input changes for all fields
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
    setFormData(prev => ({
      ...prev,
      [fieldMap[name] || name]: value
    }));
  };

  // Function to manually geocode an address
  const geocodeAddress = async () => {
    try {
      if (!formData.address_line || !formData.city || !formData.state || !formData.zip) {
        return;
      }
      
      const fullAddress = `${formData.address_line}, ${formData.city}, ${formData.state} ${formData.zip}`;
      
      console.log('Geocoding address:', fullAddress);
      
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: fullAddress }),
      });
      
      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Geocoding result:', data);
      
      if (data.lat && data.lng) {
        setFormData(prev => ({
          ...prev,
          latitude: data.lat,
          longitude: data.lng
        }));
        
        console.log(`Coordinates found: lat=${data.lat}, lng=${data.lng}`);
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }
  };

  // Geocode address when all fields are filled out but we don't have coordinates
  useEffect(() => {
    if (formData.address_line && formData.city && formData.state && formData.zip && 
        formData.latitude === undefined && formData.longitude === undefined) {
      geocodeAddress();
    }
  }, [formData.address_line, formData.city, formData.state, formData.zip]);

  return (
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
  )
}