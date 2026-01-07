# Image Upload Setup Guide

## 🎯 Overview
Your blog now supports image uploads with **room-based access control**! Only room members can upload and view images from their room, matching the security model of your blogs.

## 📦 What's Been Added

### 1. **Image Upload API** (`/app/api/upload/image/route.ts`)
- Handles file uploads to Supabase Storage
- Validates file type (JPEG, PNG, GIF, WebP)
- Validates file size (max 5MB)
- Returns public URL for the uploaded image

### 2. **Updated Manual Blog Editor**
- Image upload button
- Image preview with delete option
- Images are included in published blogs

### 3. **Updated Blog Display**
- Renders images in blog posts
- Responsive image display
- Supports captions (optional)

## 🔧 Setup Instructions

### Step 1: Run the SQL Setup Script (EASIEST METHOD! ⭐)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Setup Script**
   - Copy ALL the contents from `SETUP_STORAGE_BUCKET.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - ✅ Done! Bucket and policies are created automatically

---

### Alternative: Manual Setup (UI Method)

If you prefer using the Supabase UI:

1. **Go to Storage**
   - Click "Storage" in the left sidebar
   - Click "New bucket"

2. **Create the bucket**
   - **Name**: `blog-images`
   - **Public bucket**: Toggle **ON** ✅ (IMPORTANT: Required for browser image loading!)
   - **File size limit**: 5MB (5242880 bytes)
   - **Note**: Public bucket + RLS policies = Secure room-based access
   - **Allowed MIME types**: 
     - image/jpeg
     - image/jpg
     - image/png
     - image/gif
     - image/webp
   - Click "Create bucket"

3. **Set Storage Policies** (Critical for Room-Based Access!)
   
   Click on the `blog-images` bucket, then go to "Policies" tab.
   
   Click "New Policy" for each of these:

   **Policy 1: Allow room members to upload images**
   - Operation: INSERT
   - Target roles: authenticated
   ```sql
   (bucket_id = 'blog-images'::text) 
   AND ((storage.foldername(name))[1] = 'rooms'::text)
   AND (((storage.foldername(name))[2])::uuid IN 
     ( SELECT room_members.room_id
       FROM room_members
       WHERE (room_members.user_id = auth.uid())))
   ```

   **Policy 2: Allow room members to view images**
   - Operation: SELECT
   - Target roles: authenticated
   ```sql
   (bucket_id = 'blog-images'::text) 
   AND ((storage.foldername(name))[1] = 'rooms'::text)
   AND (((storage.foldername(name))[2])::uuid IN 
     ( SELECT room_members.room_id
       FROM room_members
       WHERE (room_members.user_id = auth.uid())))
   ```

   **Policy 3: Allow users to delete their own images**
   - Operation: DELETE
   - Target roles: authenticated
   ```sql
   (bucket_id = 'blog-images'::text) 
   AND ((storage.foldername(name))[1] = 'rooms'::text)
   AND ((storage.foldername(name))[3] = (auth.uid())::text)
   ```

### Step 2: Verify Setup

1. **Restart your development server** (if needed):
   ```bash
   npm run dev
   ```

2. **Test image upload**:
   - Go to: http://localhost:3000/[your-room-slug]/write
   - Choose "Write Manually"
   - Fill in title and content
   - Click "Upload Image"
   - Select an image file (max 5MB)
   - The image should appear in the preview
   - Publish the blog
   - View the blog to see the image displayed

## 📝 How to Use

### For Manual Blog Writing:

1. Go to any room and click "Write Blog"
2. Choose "Write Manually"
3. Fill in your blog details:
   - Title (required)
   - Excerpt (optional)
   - Content (required)
4. **Upload images**:
   - Click "Upload Image" button
   - Select an image (JPEG, PNG, GIF, or WebP)
   - Image preview appears below
   - Upload multiple images if needed
   - Remove images by hovering and clicking the X button
5. Click "Publish Blog"
6. Images will appear at the end of your blog post

### Image Specifications:
- **Max file size**: 5MB
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Storage**: Images organized by room and user: `rooms/{roomId}/{userId}/{filename}`
- **Access**: 🔒 **Private** - Only room members can view images from their room

## 🎨 Features

### Upload UI:
- ✅ Drag-and-drop ready button
- ✅ File type validation
- ✅ File size validation
- ✅ Upload progress indication
- ✅ Image preview grid
- ✅ Remove images before publishing

### Display:
- ✅ Responsive images
- ✅ Rounded corners with border
- ✅ Optional captions (can be added to content structure)
- ✅ Proper spacing and layout

## 🔒 Security (Room-Based Access Control)

### Storage Structure:
```
blog-images/
  └── rooms/
      └── {roomId}/
          └── {userId}/
              └── {filename}.jpg
```

### Access Rules:
- ✅ **Upload**: Only authenticated room members can upload to their room
- ✅ **View**: Only room members can view images from their room
- ✅ **Delete**: Users can only delete their own images
- ❌ **Public Access**: None - bucket is private
- ❌ **Non-Members**: Cannot view any images from rooms they're not in

### Security Features:
- 🔒 Room membership verified before upload
- 🔒 Room membership required to view images
- 🔒 File type and size validation on server-side
- 🔒 No anonymous access
- 🔒 Matches blog security model exactly

### Example Access Flow:
1. User A is in "Room 1"
2. User A uploads image → stored in `rooms/room1-id/userA-id/image.jpg`
3. User B (also in Room 1) can view the image ✅
4. User C (not in Room 1) CANNOT view the image ❌
5. User A can delete their own image ✅
6. User B cannot delete User A's image ❌

## 🚀 Future Enhancements

Consider adding:
- Image captions in the editor
- Image positioning (left, center, right)
- Image resizing/cropping
- Multiple image selection at once
- AI-generated image suggestions
- Image optimization/compression

## 📖 Content Structure

Images are stored in the content as:

```json
{
  "_type": "image",
  "url": "https://[project].supabase.co/storage/v1/object/public/blog-images/[path]",
  "alt": "Blog image",
  "caption": "Optional caption"
}
```

Text blocks remain as:

```json
{
  "_type": "block",
  "style": "normal",
  "children": [
    {
      "_type": "span",
      "text": "Your text content",
      "marks": []
    }
  ]
}
```

## 🐛 Troubleshooting

### Upload fails:
1. Check Supabase Storage bucket exists and is named `blog-images`
2. Verify bucket is set to "Public"
3. Check storage policies are correctly set
4. Ensure user is authenticated
5. Check file size is under 5MB
6. Verify file type is supported

### Images don't display:
1. Check the image URL is accessible
2. Verify storage policies allow public reads
3. Check browser console for errors
4. Ensure blog content includes image blocks

## ✅ Complete!

Your blog now has full image upload support! 🎉

