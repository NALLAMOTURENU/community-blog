import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Force Node.js runtime for Gemini compatibility
export const runtime = 'nodejs'

const generateSchema = z.object({
  tone: z.enum(['professional', 'casual', 'technical', 'creative', 'academic']),
  language: z.enum(['en', 'es', 'fr', 'de', 'hi', 'zh']),
  customInstructions: z.string().optional(),
  context: z.string().min(10),
  existingContent: z.array(z.any()).optional(),
  changeRequest: z.string().optional(),
})

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  zh: 'Chinese',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const result = generateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { tone, language, customInstructions, context, existingContent, changeRequest } = result.data

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    // Build prompt
    let systemPrompt = `You are an expert blog writer. Generate high-quality blog content in ${languageNames[language]} with a ${tone} tone.`
    
    if (customInstructions) {
      systemPrompt += `\n\nAdditional instructions: ${customInstructions}`
    }

    systemPrompt += `\n\nYour response must be valid JSON with this structure:
{
  "title": "Blog title",
  "excerpt": "Brief 1-2 sentence summary",
  "content": [
    {
      "_type": "block",
      "style": "normal",
      "children": [{"_type": "span", "text": "Paragraph text", "marks": []}]
    }
  ]
}

Use these block styles: normal, h1, h2, h3, h4, blockquote
Use these marks for inline formatting: strong, em, code
Create well-structured, engaging content with proper headings and paragraphs.`

    let userPrompt = ''
    
    if (existingContent && changeRequest) {
      // Iterative refinement
      userPrompt = `Here's the existing content:\n${JSON.stringify(existingContent, null, 2)}\n\nUser wants to change: ${changeRequest}\n\nModify the content according to the user's request while maintaining the overall structure and quality.`
    } else {
      // Initial generation
      userPrompt = `Context/Topic: ${context}\n\nGenerate a complete blog post about this topic.`
    }

    // Call Gemini API (use v1beta endpoint with gemini-1.5-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\n${userPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    const aiResponse = await response.json()
    
    // Extract text from Gemini response
    const generatedText = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!generatedText) {
      console.error('Invalid Gemini response:', aiResponse)
      return NextResponse.json(
        { error: 'Invalid AI response' },
        { status: 500 }
      )
    }

    const generatedContent = JSON.parse(generatedText)

    // Validate the structure
    if (!generatedContent.title || !generatedContent.content || !generatedContent.excerpt) {
      return NextResponse.json(
        { error: 'Invalid AI response structure' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      title: generatedContent.title,
      content: generatedContent.content,
      excerpt: generatedContent.excerpt,
    }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

