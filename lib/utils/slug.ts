/**
 * Generates a URL-friendly slug from text
 * @param text - The text to convert to a slug
 * @returns A URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 60)
}

/**
 * Validates if a string is a valid slug
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug)
}

/**
 * Ensures slug uniqueness by appending a number if needed
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug
  let counter = 1

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Generates a slug from title with uniqueness check
 * @param title - The title to convert
 * @param existingSlugs - Array of existing slugs
 * @returns A unique slug
 */
export function generateUniqueSlug(
  title: string,
  existingSlugs: string[]
): string {
  const baseSlug = generateSlug(title)
  return ensureUniqueSlug(baseSlug, existingSlugs)
}


