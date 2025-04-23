// Utility for debugging environment variables in Next.js applications

/**
 * Gets information about environment variables without revealing sensitive values
 * @returns Object with info about environment variables
 */
export function getEnvironmentInfo() {
  // Get all environment variables that start with NEXT_PUBLIC_
  const publicEnvVars = Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .reduce((obj, key) => {
      const value = process.env[key];
      // Don't include the actual values for security reasons
      obj[key] = {
        exists: value !== undefined && value !== '',
        length: value?.length || 0,
        prefix: value ? `${value.substring(0, 3)}...` : 'N/A'
      };
      return obj;
    }, {} as Record<string, { exists: boolean, length: number, prefix: string }>);

  return {
    publicEnvVars,
    nodeEnv: process.env.NODE_ENV
  };
}

/**
 * Logs information about environment variables to the console
 */
export function logEnvironmentInfo() {
  const info = getEnvironmentInfo();
  console.log('=== Environment Variables Debug ===');
  console.log('NODE_ENV:', info.nodeEnv);
  console.log('Public Environment Variables:');
  
  if (Object.keys(info.publicEnvVars).length === 0) {
    console.log('  No NEXT_PUBLIC_* environment variables found');
  } else {
    Object.entries(info.publicEnvVars).forEach(([key, data]) => {
      console.log(`  ${key}: ${data.exists ? 'exists' : 'missing'}, length: ${data.length}, prefix: ${data.prefix}`);
    });
  }
  
  // Special check for Mapbox token
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (mapboxToken) {
    console.log('Mapbox token: Present, starts with:', mapboxToken.substring(0, 5));
    
    if (mapboxToken.startsWith('sk.')) {
      console.warn('⚠️ WARNING: Using a secret token in client-side code! This is a security risk.');
    } else if (mapboxToken.startsWith('pk.')) {
      console.log('✓ Mapbox token is a public token (pk.*). This is correct for client-side use.');
    } else {
      console.warn('⚠️ Mapbox token has an unexpected format. Verify it is correct.');
    }
  } else {
    console.warn('⚠️ NEXT_PUBLIC_MAPBOX_TOKEN is missing or empty');
  }
  
  console.log('==============================');
}

// Auto-run when imported in development
if (process.env.NODE_ENV !== 'production') {
  logEnvironmentInfo();
}

export default {
  getEnvironmentInfo,
  logEnvironmentInfo
}; 