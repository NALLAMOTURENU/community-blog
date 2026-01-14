'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sparkles, Send, Image as ImageIcon, X, Wand2, Loader2 } from 'lucide-react'
import type { Tone, Language } from '@/types/blog'

const TONES: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'creative', label: 'Creative' },
  { value: 'academic', label: 'Academic' },
]

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
]

export default function WriteBlogPage() {
  const params = useParams()
  const router = useRouter()
  const roomSlug = params.roomSlug as string

  // Writing states
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; path: string }>>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI assistance states
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [tone, setTone] = useState<Tone>('professional')
  const [language, setLanguage] = useState<Language>('en')
  const [customInstructions, setCustomInstructions] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const handleAiGenerate = async () => {
    if (aiPrompt.trim().length < 10) {
      setError('Please provide more details (at least 10 characters)')
      return
    }

    setAiGenerating(true)
    setError(null)

    try {
      // Build context from existing content
      const existingContentBlocks = content ? content.split('\n\n').map(para => ({
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: para, marks: [] }]
      })) : undefined

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tone,
          language,
          customInstructions: customInstructions || undefined,
          context: aiPrompt,
          existingContent: existingContentBlocks,
          changeRequest: content ? aiPrompt : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate content')
        return
      }

      // Convert generated content blocks to plain text
      const generatedText = data.content
        .map((block: any) => {
          if (block._type === 'block') {
            return block.children?.map((child: any) => child.text).join('') || ''
          }
          return ''
        })
        .filter((text: string) => text.trim())
        .join('\n\n')

      // If we have existing content, append the new content
      if (content.trim()) {
        setContent(content + '\n\n' + generatedText)
      } else {
        setContent(generatedText)
      }

      // Set title and excerpt if they're empty
      if (!title.trim()) {
        setTitle(data.title)
      }
      if (!excerpt.trim()) {
        setExcerpt(data.excerpt)
      }

      // Clear the AI prompt
      setAiPrompt('')
      setShowAiPanel(false)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    try {
      // Get room ID first
      const roomResponse = await fetch(`/api/rooms/${roomSlug}`)
      if (!roomResponse.ok) {
        setError('Room not found')
        setUploadingImage(false)
        return
      }
      const roomData = await roomResponse.json()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', roomData.room.id)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload image')
        return
      }

      setUploadedImages((prev) => [...prev, { url: data.url, path: data.path }])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    setPublishing(true)
    setError(null)

    try {
      // First, get the room ID
      const roomResponse = await fetch(`/api/rooms/${roomSlug}`)
      if (!roomResponse.ok) {
        setError('Room not found')
        return
      }
      const roomData = await roomResponse.json()

      // Convert content to block format and add images
      const contentBlocks: any[] = []
      
      // Add text content
      content.split('\n\n').forEach((paragraph) => {
        if (paragraph.trim()) {
          contentBlocks.push({
            _type: 'block',
            style: 'normal',
            children: [{ _type: 'span', text: paragraph, marks: [] }],
          })
        }
      })

      // Add images at the end
      uploadedImages.forEach((image) => {
        contentBlocks.push({
          _type: 'image',
          url: image.url,
          alt: 'Blog image',
        })
      })

      // Create the blog
      const createResponse = await fetch('/api/blogs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomData.room.id,
          title: title,
          content: contentBlocks,
          excerpt: excerpt || content.substring(0, 150) + '...',
          tone,
          language,
        }),
      })

      const createData = await createResponse.json()

      if (!createResponse.ok) {
        setError(createData.error || 'Failed to create blog')
        return
      }

      // Publish the blog
      const publishResponse = await fetch(`/api/blogs/${createData.blog.id}/publish`, {
        method: 'POST',
      })

      if (!publishResponse.ok) {
        const publishData = await publishResponse.json()
        setError(publishData.error || 'Failed to publish blog')
        return
      }

      const publishData = await publishResponse.json()

      // Redirect to the published blog
      router.push(`/${roomSlug}/blog/${publishData.blog.slug}`)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Writing Area - 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-white mb-2">Write Your Blog</h1>
              <p className="text-neutral-400 text-sm">
                Create your blog post with optional AI assistance
              </p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg flex justify-between items-center">
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-300 hover:text-red-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-neutral-300">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="Enter your blog title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="excerpt" className="text-sm font-medium text-neutral-300">
                  Excerpt <span className="text-neutral-500">(optional)</span>
                </label>
                <textarea
                  id="excerpt"
                  placeholder="A brief summary of your blog post..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="content" className="text-sm font-medium text-neutral-300">
                    Content <span className="text-red-400">*</span>
                  </label>
                  <button
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="px-3 py-1.5 text-xs border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 rounded-lg font-medium hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles size={14} strokeWidth={1.5} />
                    {showAiPanel ? 'Hide' : 'Use'} AI
                  </button>
                </div>
                <textarea
                  id="content"
                  placeholder="Write your blog content here... Use double line breaks to create new paragraphs."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none font-mono text-sm"
                />
                <p className="text-xs text-neutral-500">
                  Use double line breaks (press Enter twice) to create separate paragraphs
                </p>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Images <span className="text-neutral-500">(optional)</span>
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full px-4 py-3 border border-white/10 bg-neutral-900/50 text-neutral-300 rounded-lg font-medium hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ImageIcon size={18} strokeWidth={1.5} />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>

                {/* Image Preview */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-neutral-500">
                  Upload images to include in your blog post. Max 5MB per image.
                </p>
              </div>

              <button
                onClick={handlePublish}
                disabled={publishing || !title.trim() || !content.trim()}
                className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={18} strokeWidth={1.5} />
                {publishing ? 'Publishing...' : 'Publish Blog'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Assistant Panel - 1 column on large screens, hidden on mobile unless toggled */}
        <div className={`lg:block ${showAiPanel ? 'block' : 'hidden'}`}>
          <div className="glass-card rounded-xl p-6 sticky top-6">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Wand2 className="text-indigo-400" size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">AI Assistant</h2>
              <p className="text-xs text-neutral-400">
                Let AI help you write or improve your content
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`p-2 text-xs border rounded-lg transition-all ${
                        tone === t.value
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLanguage(l.value)}
                      className={`p-2 text-xs border rounded-lg transition-all ${
                        language === l.value
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="customInstructions" className="text-xs font-medium text-neutral-300">
                  Custom Instructions <span className="text-neutral-500">(optional)</span>
                </label>
                <textarea
                  id="customInstructions"
                  placeholder="e.g., Focus on practical examples..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="aiPrompt" className="text-xs font-medium text-neutral-300">
                  What do you want AI to do? <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="aiPrompt"
                  placeholder={content 
                    ? "e.g., Expand on this topic, add more examples, make it more engaging..." 
                    : "e.g., Write about sustainable technology, explain blockchain basics..."}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                />
                <p className="text-xs text-neutral-500">
                  {content 
                    ? "AI will improve or add to your existing content" 
                    : "AI will generate new content from scratch"}
                </p>
              </div>

              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating || aiPrompt.trim().length < 10}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} strokeWidth={2} />
                    {content ? 'Improve Content' : 'Generate Content'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
