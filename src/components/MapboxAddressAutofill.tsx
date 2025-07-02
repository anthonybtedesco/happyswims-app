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

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

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
    context?: any[]
  }>>([])
  const [inputValue, setInputValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
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
    const addressParts = {
      address_line: '',
      city: '',
      state: '',
      zip: ''
    }
    
    try {
      const placeName = suggestion.place_name || ''
      const addressComponents = placeName.split(', ')
      
      if (addressComponents.length > 0) {
        addressParts.address_line = addressComponents[0]
      }
      
      if (addressComponents.length > 1) {
        addressParts.city = addressComponents[1]
      }
      
      if (addressComponents.length > 2) {
        const stateZip = addressComponents[2].split(' ')
        if (stateZip.length >= 1) {
          addressParts.state = stateZip[0]
        }
        if (stateZip.length >= 2) {
          addressParts.zip = stateZip.slice(1).join(' ')
        }
      }
      
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
      
      if (suggestion.address && suggestion.text) {
        addressParts.address_line = `${suggestion.address} ${suggestion.text}`
      }
    } catch (error) {
      console.error('Error parsing address parts:', error)
    }
    
    return addressParts
  }

  function handleSuggestionClick(suggestion: any) {
    setInputValue(suggestion.place_name)
    onChange(suggestion.place_name)
    setSuggestions([])
    setShowSuggestions(false)
    
    const addressParts = parseAddressParts(suggestion)
    
    if (onAddressPartsChange) {
      onAddressPartsChange(addressParts)
    }
    
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