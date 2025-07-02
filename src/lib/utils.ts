export function formatPhoneNumber(phoneNumber: string): string {
  const digitsAfterPrefix = phoneNumber.replace(/^\+1\s*/, '').replace(/\D/g, '')
  
  if (digitsAfterPrefix.length === 0) return '+1 '
  if (digitsAfterPrefix.length <= 3) return `+1 (${digitsAfterPrefix}`
  if (digitsAfterPrefix.length <= 6) return `+1 (${digitsAfterPrefix.slice(0, 3)})-${digitsAfterPrefix.slice(3)}`
  if (digitsAfterPrefix.length <= 10) return `+1 (${digitsAfterPrefix.slice(0, 3)})-${digitsAfterPrefix.slice(3, 6)}-${digitsAfterPrefix.slice(6)}`
  
  return `+1 (${digitsAfterPrefix.slice(0, 3)})-${digitsAfterPrefix.slice(3, 6)}-${digitsAfterPrefix.slice(6, 10)}`
}

export function normalizePhoneNumber(phoneNumber: string): string {
  const digitsAfterPrefix = phoneNumber.replace(/^\+1\s*/, '').replace(/\D/g, '')
  
  if (digitsAfterPrefix.length === 10) {
    return `+1 (${digitsAfterPrefix.slice(0, 3)})-${digitsAfterPrefix.slice(3, 6)}-${digitsAfterPrefix.slice(6)}`
  }
  
  return phoneNumber
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const digitsAfterPrefix = phoneNumber.replace(/^\+1\s*/, '').replace(/\D/g, '')
  return digitsAfterPrefix.length === 10
} 