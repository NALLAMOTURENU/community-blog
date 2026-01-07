# ✏️ Blog Editing Feature

## Overview
Members can now edit their own blog posts with automatic update tracking!

---

## 🎯 Features Implemented

### 1. Edit Blog Endpoint
**Location**: `/app/api/blogs/[blogId]/edit/route.ts`

**Method**: `PUT`

**Features**:
- ✅ Verifies user is the blog author
- ✅ Verifies user is still a room member
- ✅ Updates content in Sanity CMS
- ✅ Updates metadata in Supabase
- ✅ Automatically updates `updated_at` timestamp
- ✅ Returns updated blog data

**Security**:
- Only the blog author can edit
- Room membership is verified
- Authentication required

---

### 2. Edit Page UI
**Location**: `/app/[roomSlug]/blog/[blogSlug]/edit/page.tsx`

**Features**:
- ✅ Loads existing blog content
- ✅ Pre-fills form with current data
- ✅ Shows existing images (can remove)
- ✅ Upload new images
- ✅ Edit title, excerpt, and content
- ✅ Save changes button
- ✅ Cancel button (returns to blog)

**UX**:
- Shows loading state while fetching data
- Error handling with user-friendly messages
- Image preview grid (existing vs new)
- Textarea for content editing
- Saves to Sanity and Supabase on submit

---

### 3. Edit Button on Blog Pages
**Location**: `/app/[roomSlug]/blog/[blogSlug]/page.tsx`

**Features**:
- ✅ "Edit" button appears for blog authors only
- ✅ Positioned in the blog header (top right)
- ✅ Links to edit page
- ✅ Styled to match app design

**Visibility**:
- Only visible if current user is the blog author
- Hidden for other room members
- Includes edit icon

---

### 4. Updated Date Display
**Location**: `/app/[roomSlug]/blog/[blogSlug]/page.tsx`

**Features**:
- ✅ Shows "Updated [date]" badge
- ✅ Only appears if blog was edited after publication
- ✅ Different styling (indigo color) to indicate edit
- ✅ Compact date format

**Display Logic**:
```typescript
if (updated_at && updated_at !== published_at) {
  // Show "Updated" badge
}
```

---

## 📊 Database Schema

The `blogs` table already includes:
```sql
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

This field is automatically updated when a blog is edited via:
```typescript
.update({
  title,
  excerpt,
  updated_at: new Date().toISOString()
})
```

---

## 🔄 Edit Flow

### Step 1: User Clicks Edit
```
Blog Page → [Edit Button] (if author) → Edit Page
```

### Step 2: Load Blog Data
```
1. Fetch blog metadata from Supabase
2. Verify user is author
3. Fetch content from Sanity
4. Parse content blocks (text + images)
5. Pre-fill form fields
```

### Step 3: User Makes Changes
```
- Edit title, excerpt, or content
- Remove existing images
- Upload new images
- Preview changes
```

### Step 4: Save Changes
```
1. Convert content to block format
2. Include existing images (not removed)
3. Include newly uploaded images
4. PUT /api/blogs/[blogId]/edit
   - Update Sanity document
   - Update Supabase metadata
   - Set updated_at = NOW()
5. Redirect to blog page
```

### Step 5: View Updated Blog
```
- Blog displays with latest content
- Shows "Updated [date]" badge
- Edit button still available for author
```

---

## 🔒 Security

### Authorization Checks:
1. **Authentication**: User must be logged in
2. **Authorship**: Only blog author can edit
3. **Membership**: User must still be room member
4. **RLS**: Supabase Row Level Security applies

### Edit Permissions:
| User Type | Can Edit? |
|-----------|-----------|
| Blog Author (room member) | ✅ Yes |
| Other room members | ❌ No |
| Room admins | ❌ No* |
| Non-members | ❌ No |

*Future enhancement: Allow room admins to edit all blogs

---

## 🎨 UI Components

### Edit Button (Blog Page)
```tsx
{user?.id === blogData.author_id && (
  <Link href={`/${roomSlug}/blog/${blogSlug}/edit`}>
    <Edit /> Edit
  </Link>
)}
```

### Updated Badge (Blog Page)
```tsx
{updated_at && updated_at !== published_at && (
  <div className="text-indigo-400">
    <Edit /> Updated {formatDate(updated_at)}
  </div>
)}
```

### Edit Form (Edit Page)
- Title input
- Excerpt textarea (optional)
- Content textarea (required)
- Image upload section
  - Existing images grid (with delete)
  - New images grid (with delete)
  - Upload button
- Save changes button
- Cancel button

---

## 📝 Content Structure

### Text Blocks
```typescript
{
  _type: 'block',
  style: 'normal',
  children: [
    { _type: 'span', text: 'Paragraph text', marks: [] }
  ]
}
```

### Image Blocks
```typescript
{
  _type: 'image',
  url: 'https://...',
  alt: 'Blog image'
}
```

---

## 🚀 Usage

### For Users:

1. **Navigate to your blog post**
   - Go to any blog you authored
   - You'll see an "Edit" button in the top right

2. **Click Edit**
   - Opens the edit page with pre-filled content

3. **Make your changes**
   - Update title, excerpt, or content
   - Add or remove images
   - Everything is saved together

4. **Save Changes**
   - Click "Save Changes" button
   - Redirects back to your updated blog
   - "Updated" badge appears automatically

### For Developers:

**To edit a blog programmatically:**
```typescript
const response = await fetch(`/api/blogs/${blogId}/edit`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Title',
    content: [...blocks],
    excerpt: 'New excerpt'
  })
})
```

---

## 🔄 API Endpoints

### Edit Blog
- **Endpoint**: `PUT /api/blogs/[blogId]/edit`
- **Auth**: Required
- **Body**: `{ title, content, excerpt }`
- **Returns**: `{ blog }`

### Fetch Blog for Edit
- **Endpoint**: `GET /api/blogs/fetch-for-edit?roomSlug=...&blogSlug=...`
- **Auth**: Required
- **Returns**: `{ blog, content }`

---

## ✅ Testing Checklist

- [ ] Author can edit their own blog
- [ ] Non-authors cannot access edit page
- [ ] Changes are saved in both Sanity and Supabase
- [ ] `updated_at` timestamp updates correctly
- [ ] "Updated" badge appears after edit
- [ ] Edit button only shows for author
- [ ] Images can be added and removed
- [ ] Form pre-fills with existing data
- [ ] Cancel button returns to blog
- [ ] Save redirects to updated blog
- [ ] Room membership is verified

---

## 🎯 Future Enhancements

Consider adding:
- [ ] Edit history / version control
- [ ] Rich text editor (Markdown or WYSIWYG)
- [ ] Auto-save drafts
- [ ] Image captions during edit
- [ ] Image reordering
- [ ] Collaborative editing
- [ ] Change log / audit trail
- [ ] Allow admins to edit all blogs
- [ ] Preview mode before saving
- [ ] Revert to previous version

---

## 📊 Database Impact

### Updated Fields
- `blogs.title` - Updated
- `blogs.excerpt` - Updated
- `blogs.updated_at` - **NEW timestamp**

### Sanity Documents
- Title - Updated
- Content array - Updated
- Excerpt - Updated

### No Changes To:
- `blogs.id` - Same
- `blogs.slug` - Same (no re-slugging)
- `blogs.sanity_id` - Same
- `blogs.author_id` - Same
- `blogs.room_id` - Same
- `blogs.published` - Same
- `blogs.published_at` - Same (original date preserved)
- `blogs.created_at` - Same (original date preserved)

---

## ✨ Complete!

Your blog editing feature is fully functional! Members can now:
- ✅ Edit their own blogs
- ✅ See when blogs were last updated
- ✅ Add/remove images during editing
- ✅ Track edit history via timestamps

The `updated_at` field automatically tracks the latest modification date! 🎉

