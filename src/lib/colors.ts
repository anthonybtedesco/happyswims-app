export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f7ff',  // Light blue bg
    100: '#e0f0ff',
    200: '#bae0ff',
    300: '#7cc5ff',
    400: '#36a9ff',
    500: '#0090ff', // Main brand color
    600: '#0072cc',
    700: '#005799',
    800: '#003d66',
    900: '#002033'
  },

  // Secondary accent colors
  secondary: {
    50: '#f0fdf4',  // Light green bg
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main accent
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },

  // Status colors
  status: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  },

  // Common colors
  common: {
    white: '#f9fafb',
    black: '#00a0aa',
    background: '#fec320',
    paper: '#f9fafb'
  },

  // Text colors
  text: {
    primary: '#1f2937',
    secondary: '#4b5563',
    disabled: '#9ca3af'
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    main: '#d1d5db',
    dark: '#9ca3af'
  },

  // Action colors
  action: {
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    focus: 'rgba(0, 0, 0, 0.12)'
  }
}

// Common color combinations
export const colorCombos = {
  primary: {
    background: colors.primary[50],
    text: colors.primary[900],
    border: colors.primary[200]
  },
  secondary: {
    background: colors.secondary[50],
    text: colors.secondary[900],
    border: colors.secondary[200]
  },
  neutral: {
    background: colors.gray[50],
    text: colors.gray[900],
    border: colors.gray[200]
  }
}

// Button variants
export const buttonVariants = {
  primary: {
    background: colors.primary[500],
    hover: colors.primary[600],
    text: colors.common.white,
    border: 'none'
  },
  secondary: {
    background: colors.common.white,
    hover: colors.gray[50],
    text: colors.gray[900],
    border: colors.border.light
  },
  danger: {
    background: colors.status.error,
    hover: '#dc2626', // Darker red
    text: colors.common.white,
    border: 'none'
  }
} 