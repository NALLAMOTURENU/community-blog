import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
}

export const sanityClient = createClient({
  ...sanityConfig,
  token: process.env.SANITY_API_TOKEN,
})

export const sanityClientPublic = createClient({
  ...sanityConfig,
  useCdn: true,
})

const builder = imageUrlBuilder(sanityClientPublic)

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}

