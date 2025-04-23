import React from 'react';
import AutofillAddress from '@/lib/mapbox/AutofillAddress';

interface AddressAutofillInputProps {
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

/**
 * A component that wraps the AutofillAddress component for reusability
 */
export default function AddressAutofillInput({ initialData, onChange }: AddressAutofillInputProps) {
  return (
    <AutofillAddress 
      initialData={initialData}
      onChange={onChange}
    />
  );
} 