'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sparkles, RefreshCw, Send, ArrowLeft, PenLine, Wand2, Image as ImageIcon, X } from 'lucide-react'
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

  // Writing mode selection
  const [writingMode, setWritingMode] = useState<'select' | 'manual' | 'ai'>('select')

  // Manual writing states
  const [manualTitle, setManualTitle] = useState('')
  const [manualExcerpt, setManualExcerpt] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; path: string }>>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI-assisted writing states
  // Step 1: Configuration
  const [tone, setTone] = useState<Tone>('professional')
  const [language, setLanguage] = useState<Language>('en')
  const [customInstructions, setCustomInstructions] = useState('')
  const [context, setContext] = useState('')

  // Step 2: Generated content
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [generatedExcerpt, setGeneratedExcerpt] = useState('')

  // Step 3: Refinement
  const [changeRequest, setChangeRequest] = useState('')

  // UI state
  const [step, setStep] = useState<'configure' | 'preview' | 'refine'>('configure')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const handleGenerate = async () => {
    if (context.trim().length < 10) {
      setError('Please provide more context (at least 10 characters)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tone,
          language,
          customInstructions: customInstructions || undefined,
          context,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate content')
        return
      }

      setGeneratedTitle(data.title)
      setGeneratedContent(data.content)
      setGeneratedExcerpt(data.excerpt)
      setStep('preview')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRefine = async () => {
    if (!changeRequest.trim()) {
      setError('Please describe what you want to change')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tone,
          language,
          customInstructions: customInstructions || undefined,
          context,
          existingContent: generatedContent,
          changeRequest,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to refine content')
        return
      }

      setGeneratedTitle(data.title)
      setGeneratedContent(data.content)
      setGeneratedExcerpt(data.excerpt)
      setChangeRequest('')
      setStep('preview')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
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

      // Create the blog
      const createResponse = await fetch('/api/blogs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomData.room.id,
          title: generatedTitle,
          content: generatedContent,
          excerpt: generatedExcerpt,
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

  const handleManualPublish = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) {
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

      // Convert manual content to block format and add images
      const contentBlocks: any[] = []
      
      // Add text content
      manualContent.split('\n\n').forEach((paragraph) => {
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
          title: manualTitle,
          content: contentBlocks,
          excerpt: manualExcerpt || manualContent.substring(0, 150) + '...',
          tone: 'professional',
          language: 'en',
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

  const renderContent = (content: any[]) => {
    return content.map((block, index) => {
      if (block._type === 'block') {
        const text = block.children?.map((child: any) => child.text).join('') || ''
        const style = block.style || 'normal'

        switch (style) {
          case 'h1':
            return <h1 key={index} className="text-3xl font-bold mt-6 mb-3 text-white">{text}</h1>
          case 'h2':
            return <h2 key={index} className="text-2xl font-bold mt-5 mb-2 text-white">{text}</h2>
          case 'h3':
            return <h3 key={index} className="text-xl font-bold mt-4 mb-2 text-white">{text}</h3>
          case 'h4':
            return <h4 key={index} className="text-lg font-bold mt-3 mb-2 text-white">{text}</h4>
          case 'blockquote':
            return (
              <blockquote key={index} className="border-l-4 border-indigo-500 pl-4 italic my-4 text-neutral-300">
                {text}
              </blockquote>
            )
          default:
            return <p key={index} className="mb-3 text-neutral-300">{text}</p>
        }
      }
      return null
    })
  }

  // Mode selection screen
  if (writingMode === 'select') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create a New Blog Post</h1>
          <p className="text-neutral-400">Choose how you want to write your blog</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Manual Writing Option */}
          <button
            onClick={() => setWritingMode('manual')}
            className="glass-card rounded-xl p-8 text-left hover:scale-[1.02] transition-all group"
          >
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
              <PenLine className="text-purple-400" size={28} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">Write Manually</h2>
            <p className="text-neutral-400 mb-4">
              Write your blog post from scratch using our simple editor. Perfect for when you know exactly what you want to say.
            </p>
            <div className="flex items-center gap-2 text-purple-400 font-medium">
              Start Writing
              <ArrowLeft className="rotate-180" size={16} strokeWidth={2} />
            </div>
          </button>

          {/* AI-Assisted Writing Option */}
          <button
            onClick={() => {
              setWritingMode('ai')
            }}
            className="glass-card rounded-xl p-8 text-left hover:scale-[1.02] transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <Wand2 className="text-indigo-400" size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">AI-Assisted</h2>
              <p className="text-neutral-400 mb-4">
                Let AI help you create amazing content. Provide a topic and preferences, and get a complete blog post in seconds.
              </p>
              <div className="flex items-center gap-2 text-indigo-400 font-medium">
                Use AI Writer
                <ArrowLeft className="rotate-180" size={16} strokeWidth={2} />
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Manual writing mode
  if (writingMode === 'manual') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <PenLine className="text-purple-400" size={28} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Write Your Blog</h1>
              <p className="text-neutral-400 text-sm">
                Create your blog post manually with full control
              </p>
            </div>
            <button
              onClick={() => setWritingMode('select')}
              className="px-4 py-2 border border-white/10 text-neutral-300 rounded-lg font-medium text-sm hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Back
            </button>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="manualTitle" className="text-sm font-medium text-neutral-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="manualTitle"
                type="text"
                placeholder="Enter your blog title..."
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="manualExcerpt" className="text-sm font-medium text-neutral-300">
                Excerpt <span className="text-neutral-500">(optional)</span>
              </label>
              <textarea
                id="manualExcerpt"
                placeholder="A brief summary of your blog post..."
                value={manualExcerpt}
                onChange={(e) => setManualExcerpt(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="manualContent" className="text-sm font-medium text-neutral-300">
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                id="manualContent"
                placeholder="Write your blog content here... Use double line breaks to create new paragraphs."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
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
                Upload images to include in your blog post. Max 5MB per image. Supported formats: JPEG, PNG, GIF, WebP.
              </p>
            </div>

            <button
              onClick={handleManualPublish}
              disabled={publishing || !manualTitle.trim() || !manualContent.trim()}
              className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={18} strokeWidth={1.5} />
              {publishing ? 'Publishing...' : 'Publish Blog'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // AI-assisted writing mode
  if (step === 'configure') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass-card rounded-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Sparkles className="text-indigo-400" size={28} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">AI Blog Writer</h1>
              <p className="text-neutral-400 text-sm">
                Configure your blog preferences and let AI help you create amazing content
              </p>
            </div>
            <button
              onClick={() => setWritingMode('select')}
              className="px-4 py-2 border border-white/10 text-neutral-300 rounded-lg font-medium text-sm hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Back
            </button>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Tone</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className={`p-3 text-sm border rounded-lg transition-all ${
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
              <label className="text-sm font-medium text-neutral-300">Language</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLanguage(l.value)}
                    className={`p-3 text-sm border rounded-lg transition-all ${
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
              <label htmlFor="customInstructions" className="text-sm font-medium text-neutral-300">
                Custom Instructions <span className="text-neutral-500">(optional)</span>
              </label>
              <textarea
                id="customInstructions"
                placeholder="e.g., Focus on practical examples, include statistics, use simple language..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="context" className="text-sm font-medium text-neutral-300">
                Topic / Context <span className="text-red-400">*</span>
              </label>
              <textarea
                id="context"
                placeholder="What do you want to write about? Provide as much context as possible..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={6}
                required
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
              <p className="text-xs text-neutral-500">
                The more context you provide, the better the AI can help you
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || context.trim().length < 10}
              className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles size={18} strokeWidth={1.5} />
              {loading ? 'Generating...' : 'Generate Blog Post'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'preview' || step === 'refine') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Preview Card */}
        <div className="glass-card rounded-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Preview</h2>
              <p className="text-sm text-neutral-400">Review your AI-generated blog post</p>
            </div>
            <button
              onClick={() => setStep('configure')}
              className="px-4 py-2 border border-white/10 text-neutral-300 rounded-lg font-medium text-sm hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Start Over
            </button>
          </div>

          <article className="prose prose-invert prose-lg max-w-none">
            <h1 className="text-4xl font-bold mb-4 text-white">{generatedTitle}</h1>
            <p className="text-lg text-neutral-400 italic mb-6">{generatedExcerpt}</p>
            <div className="space-y-4">{renderContent(generatedContent)}</div>
          </article>
        </div>

        {/* Refine Card */}
        <div className="glass-card rounded-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">Refine Your Blog</h2>
            <p className="text-sm text-neutral-400">
              What would you like to change about the generated content?
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="changeRequest" className="text-sm font-medium text-neutral-300">
                Change Request
              </label>
              <textarea
                id="changeRequest"
                placeholder="e.g., Make it shorter, add more examples, change the introduction..."
                value={changeRequest}
                onChange={(e) => setChangeRequest(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRefine}
                disabled={loading || !changeRequest.trim()}
                className="flex-1 px-6 py-3 border border-white/10 bg-neutral-900/50 text-neutral-300 rounded-lg font-medium hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} strokeWidth={1.5} />
                {loading ? 'Refining...' : 'Refine Content'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={18} strokeWidth={1.5} />
                {publishing ? 'Publishing...' : 'Publish Blog'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
