// Get the Mapbox token from environment variables
// Make sure to use a hardcoded fallback for development if needed
const envToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Log environment variable status
console.log('NEXT_PUBLIC_MAPBOX_TOKEN from process.env:', envToken ? 'Token exists' : 'Token is missing or empty');
console.log('Token length:', envToken?.length || 0);
console.log('Token prefix:', envToken?.substring(0, 5) || 'N/A');

// WARNING: Don't use secret tokens (sk.*) in client-side code - they should be kept secret on the server
// Using the provided token as a fallback, but this should be changed to a public token for production
export const MAPBOX_ACCESS_TOKEN = 
  envToken || 
  'pk.eyJ1IjoiYWdmYXJtcyIsImEiOiJjbTl1ODFnbHYwNzNqMmtvcHd5ZGY4dTFxIn0.9qWyE9M7AwGpzvz1Z2vGZQ';

// Check if token is available and log appropriate messages
console.log('Final MAPBOX_ACCESS_TOKEN being used:', MAPBOX_ACCESS_TOKEN.substring(0, 8) + '...');

if (!MAPBOX_ACCESS_TOKEN) {
  console.warn('MAPBOX_ACCESS_TOKEN is empty. Address autofill will not work.');
} else if (MAPBOX_ACCESS_TOKEN.startsWith('sk.')) {
  console.warn('WARNING: You appear to be using a secret token (sk.*) in client-side code. This is a security risk!');
  console.warn('Please use a public token (pk.*) for browser applications.');
} else if (MAPBOX_ACCESS_TOKEN.startsWith('pk.')) {
  console.log('Using a public Mapbox token (pk.*). This is the correct type for browser applications.');
} else {
  console.warn('Mapbox token does not start with expected prefix (pk.* or sk.*). Verify the token is correct.');
}

export default {
  accessToken: MAPBOX_ACCESS_TOKEN
}; 