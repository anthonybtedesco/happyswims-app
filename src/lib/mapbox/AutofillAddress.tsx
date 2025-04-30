import { useState, useEffect, useRef } from "react";

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
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
  const [formData, setFormData] = useState({
    address_line: initialData?.address_line || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });
  
  const isInternalUpdate = useRef(false);
  const prevFormDataRef = useRef(formData);
  
  useEffect(() => {
    if (initialData) {
      const needsUpdate = 
        initialData.address_line !== formData.address_line ||
        initialData.city !== formData.city ||
        initialData.state !== formData.state ||
        initialData.zip !== formData.zip;

      if (needsUpdate) {
        isInternalUpdate.current = false;
        setFormData(prev => ({
          ...prev,
          address_line: initialData.address_line || prev.address_line,
          city: initialData.city || prev.city,
          state: initialData.state || prev.state,
          zip: initialData.zip || prev.zip
        }));
      }
    }
  }, [initialData]);

  useEffect(() => {
    const hasChanged = 
      formData.address_line !== prevFormDataRef.current.address_line ||
      formData.city !== prevFormDataRef.current.city ||
      formData.state !== prevFormDataRef.current.state ||
      formData.zip !== prevFormDataRef.current.zip ||
      formData.latitude !== prevFormDataRef.current.latitude ||
      formData.longitude !== prevFormDataRef.current.longitude;
    
    prevFormDataRef.current = formData;
    
    if (onChange && isInternalUpdate.current && hasChanged) {
      onChange(formData);
    }
    
    isInternalUpdate.current = false;
  }, [formData, onChange]);

  async function handleAddressSearch(query: string) {
    if (!query) return;

    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: mapboxToken,
        types: 'address',
        country: 'US',
        limit: '5'
      });

      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      return data.features;
    } catch (error) {
      console.error("Error searching address:", error);
      return [];
    }
  }

  async function handleAddressSelect(feature: any) {
    if (!feature || !feature.properties) return;

    try {
      const props = feature.properties;
      const addressLine = props.address || '';
      let city = '';
      let state = '';
      let zip = '';
      
      if (props.context && Array.isArray(props.context)) {
        props.context.forEach((item: any) => {
          if (item.id && item.id.startsWith('place')) {
            city = item.text || '';
          } else if (item.id && item.id.startsWith('region')) {
            state = item.text || '';
          } else if (item.id && item.id.startsWith('postcode')) {
            zip = item.text || '';
          }
        });
      }
      
      const coordinates = feature.geometry?.coordinates;
      let latitude: number | undefined = undefined;
      let longitude: number | undefined = undefined;
      
      if (coordinates && coordinates.length >= 2) {
        longitude = coordinates[0];
        latitude = coordinates[1];
      }
      
      isInternalUpdate.current = true;
      
      setFormData(prev => ({
        ...prev,
        address_line: addressLine,
        city,
        state,
        zip,
        latitude,
        longitude
      }));
    } catch (error) {
      console.error("Error processing address selection:", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    const fieldMap: Record<string, keyof typeof formData> = {
      'address': 'address_line',
      'city': 'city',
      'state': 'state',
      'postcode': 'zip'
    };
    
    isInternalUpdate.current = true;
    
    setFormData(prev => ({
      ...prev,
      [fieldMap[name] || name]: value
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          name="address"
          placeholder="Address"
          type="text"
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
  );
}