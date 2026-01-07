'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PenLine, ArrowLeft, Save, Image as ImageIcon, X } from 'lucide-react'

export default function EditBlogPage() {
  const params = useParams()
  const router = useRouter()
  const roomSlug = params.roomSlug as string
  const blogSlug = params.blogSlug as string

  // Blog data
  const [blogId, setBlogId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [existingImages, setExistingImages] = useState<Array<{ url: string; alt?: string }>>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; path: string }>>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Load blog data
  useEffect(() => {
    const loadBlog = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch blog and room data directly from the page
        const response = await fetch(`/api/blogs/fetch-for-edit?roomSlug=${roomSlug}&blogSlug=${blogSlug}`)
        
        if (!response.ok) {
          setError('Blog not found or you do not have permission to edit')
          return
        }
        
        const data = await response.json()
        
        setBlogId(data.blog.id)
        setRoomId(data.blog.room_id)

        // Populate form from fetched data
        setTitle(data.blog.title)
        setExcerpt(data.blog.excerpt || '')

        // Extract text and images from content
        const textBlocks: string[] = []
        const imageBlocks: Array<{ url: string; alt?: string }> = []

        data.content.content.forEach((block: any) => {
          if (block._type === 'block' && block.children) {
            const text = block.children.map((child: any) => child.text || '').join('')
            if (text.trim()) {
              textBlocks.push(text)
            }
          } else if (block._type === 'image') {
            imageBlocks.push({ url: block.url, alt: block.alt })
          }
        })

        setContent(textBlocks.join('\n\n'))
        setExistingImages(imageBlocks)
      } catch (err) {
        console.error('Error loading blog:', err)
        setError('Failed to load blog')
      } finally {
        setLoading(false)
      }
    }

    loadBlog()
  }, [roomSlug, blogSlug])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', roomId)

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
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveNewImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Convert content to block format
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

      // Add existing images
      existingImages.forEach((image) => {
        contentBlocks.push({
          _type: 'image',
          url: image.url,
          alt: image.alt || 'Blog image',
        })
      })

      // Add newly uploaded images
      uploadedImages.forEach((image) => {
        contentBlocks.push({
          _type: 'image',
          url: image.url,
          alt: 'Blog image',
        })
      })

      // Update the blog
      const response = await fetch(`/api/blogs/${blogId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: contentBlocks,
          excerpt: excerpt || content.substring(0, 150) + '...',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update blog')
        return
      }

      // Redirect to the blog
      router.push(`/${roomSlug}/blog/${blogSlug}`)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-xl p-8">
          <p className="text-neutral-400">Loading blog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card rounded-xl p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <PenLine className="text-purple-400" size={28} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Edit Your Blog</h1>
            <p className="text-neutral-400 text-sm">
              Update your blog post and save changes
            </p>
          </div>
          <Link
            href={`/${roomSlug}/blog/${blogSlug}`}
            className="px-4 py-2 border border-white/10 text-neutral-300 rounded-lg font-medium text-sm hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Cancel
          </Link>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
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
            <label htmlFor="content" className="text-sm font-medium text-neutral-300">
              Content <span className="text-red-400">*</span>
            </label>
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
              {uploadingImage ? 'Uploading...' : 'Upload New Image'}
            </button>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-sm text-neutral-400 mb-2">Existing Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.alt || `Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {uploadedImages.length > 0 && (
              <div>
                <p className="text-sm text-neutral-400 mb-2">New Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-indigo-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-neutral-500">
              Upload new images or remove existing ones. Max 5MB per image. Supported formats: JPEG, PNG, GIF, WebP.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={18} strokeWidth={1.5} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

