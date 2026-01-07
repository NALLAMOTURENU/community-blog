export type Tone = 'professional' | 'casual' | 'technical' | 'creative' | 'academic'
export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'zh'

export interface BlogMetadata {
  tone: Tone
  language: Language
  customInstructions?: string
  context: string
}

export interface BlogDraft {
  title: string
  content: any[] // Sanity portable text
  excerpt?: string
  metadata: BlogMetadata
}

export interface BlogPost extends BlogDraft {
  id: string
  roomId: string
  roomSlug: string
  slug: string
  authorId: string
  sanityId: string
  published: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AIGenerationRequest {
  tone: Tone
  language: Language
  customInstructions?: string
  context: string
  existingContent?: any[]
  changeRequest?: string
}

export interface AIGenerationResponse {
  title: string
  content: any[]
  excerpt: string
}


