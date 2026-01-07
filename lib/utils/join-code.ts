/**
 * Generates a random 4-digit join code
 * @returns A 4-digit string
 */
export function generateJoinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Validates if a string is a valid join code (4 digits)
 * @param code - The code to validate
 * @returns true if valid, false otherwise
 */
export function isValidJoinCode(code: string): boolean {
  return /^[0-9]{4}$/.test(code)
}

/**
 * Formats a join code for display (adds spacing)
 * @param code - The join code
 * @returns Formatted code (e.g., "12 34")
 */
export function formatJoinCode(code: string): string {
  if (!isValidJoinCode(code)) {
    return code
  }
  return `${code.substring(0, 2)} ${code.substring(2)}`
}

/**
 * Normalizes a join code (removes spacing, non-digits)
 * @param input - The user input
 * @returns Normalized 4-digit code or empty string if invalid
 */
export function normalizeJoinCode(input: string): string {
  const digits = input.replace(/\D/g, '')
  return digits.substring(0, 4)
}


