import React, { useState, useEffect, useRef } from 'react'

interface MapboxAddressAutofillProps {
  value: string
  onChange: (value: string) => void
  onCoordinatesChange?: (lat: number, lng: number) => void
  onAddressPartsChange?: (parts: {
    address_line: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
  required?: boolean
  placeholder?: string
}

// You should store your Mapbox API key in an environment variable
// and access it via process.env.NEXT_PUBLIC_MAPBOX_API_KEY
const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

export default function MapboxAddressAutofill({
  value,
  onChange,
  onCoordinatesChange,
  onAddressPartsChange,
  required,
  placeholder = 'Enter an address'
}: MapboxAddressAutofillProps) {
  const [suggestions, setSuggestions] = useState<Array<{
    id: string,
    place_name: string,
    center: [number, number],
    context?: any[] // For accessing address components
  }>>([])
  const [inputValue, setInputValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    // Add event listener to close suggestions when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function fetchAddressSuggestions(query: string) {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    
    // Use the Mapbox Geocoding API
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_API_KEY}&types=address&autocomplete=true&country=us`)
      .then(response => response.json())
      .then(data => {
        if (data.features) {
          setSuggestions(data.features.map((feature: any) => ({
            id: feature.id,
            place_name: feature.place_name,
            center: feature.center,
            context: feature.context,
            address: feature.address,
            text: feature.text
          })))
        }
      })
      .catch(error => {
        console.error('Error fetching address suggestions:', error)
        setSuggestions([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setInputValue(query)
    setShowSuggestions(true)
    fetchAddressSuggestions(query)
  }

  function parseAddressParts(suggestion: any): {
    address_line: string;
    city: string;
    state: string;
    zip: string;
  } {
    // Initialize with empty values
    const addressParts = {
      address_line: '',
      city: '',
      state: '',
      zip: ''
    }
    
    try {
      // Parse the Mapbox response to extract address components
      const placeName = suggestion.place_name || ''
      const addressComponents = placeName.split(', ')
      
      // The first component is usually the street address
      if (addressComponents.length > 0) {
        addressParts.address_line = addressComponents[0]
      }
      
      // The second component is usually the city
      if (addressComponents.length > 1) {
        addressParts.city = addressComponents[1]
      }
      
      // The third component usually contains state and zip code
      if (addressComponents.length > 2) {
        const stateZip = addressComponents[2].split(' ')
        if (stateZip.length >= 1) {
          addressParts.state = stateZip[0]
        }
        if (stateZip.length >= 2) {
          addressParts.zip = stateZip.slice(1).join(' ')
        }
      }
      
      // More precise extraction using context if available
      if (suggestion.context) {
        suggestion.context.forEach((ctx: any) => {
          if (ctx.id.startsWith('place.')) {
            addressParts.city = ctx.text
          } else if (ctx.id.startsWith('region.')) {
            addressParts.state = ctx.text
          } else if (ctx.id.startsWith('postcode.')) {
            addressParts.zip = ctx.text
          }
        })
      }
      
      // If we have the more specific address components from Mapbox
      if (suggestion.address && suggestion.text) {
        addressParts.address_line = `${suggestion.address} ${suggestion.text}`
      }
    } catch (error) {
      console.error('Error parsing address parts:', error)
    }
    
    return addressParts
  }

  function handleSuggestionClick(suggestion: any) {
    // Update the input value with the full address
    setInputValue(suggestion.place_name)
    onChange(suggestion.place_name)
    setSuggestions([])
    setShowSuggestions(false)
    
    // Parse the address into components
    const addressParts = parseAddressParts(suggestion)
    
    // If callback for address parts is provided, pass the parsed components
    if (onAddressPartsChange) {
      onAddressPartsChange(addressParts)
    }
    
    // If coordinates callback is provided, pass the lat/lng
    if (onCoordinatesChange) {
      const [lng, lat] = suggestion.center
      onCoordinatesChange(lat, lng)
    }
  }

  return (
    <div className="mapbox-address-autofill" ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
        placeholder={placeholder}
        required={required}
        className="form-input"
        style={{ backgroundColor: '#f5f5f5', color: '#000', width: '100%' }}
      />
      
      {isLoading && (
        <div className="address-loading-indicator">
          <span>Loading...</span>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <ul 
          className="address-suggestions" 
          style={{
            listStyle: 'none',
            padding: '0',
            margin: '0',
            border: '1px solid #ddd',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            position: 'absolute',
            width: '100%',
            backgroundColor: '#fff',
            zIndex: 10,
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {suggestions.map(suggestion => (
            <li 
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                color: '#000'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLLIElement).style.backgroundColor = '#f5f5f5'
              }}
              onMouseOut={(e) => {
                (e.target as HTMLLIElement).style.backgroundColor = 'transparent'
              }}
            >
              {suggestion.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 