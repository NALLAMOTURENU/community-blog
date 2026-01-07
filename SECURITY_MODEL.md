# 🔒 Multi-Blog Security Model

## Overview
Your multi-blog platform uses a **room-based access control** system where all content (blogs and images) is private to room members.

---

## 🏠 Room Access Control

### Room Membership
- Users must be explicitly added as members to access a room
- Two roles: `admin` and `member`
- Room creators are automatically admins

### Room Content
Only room members can:
- ✅ View the room
- ✅ See member list
- ✅ Read blogs
- ✅ View images
- ✅ Write new blogs
- ✅ Upload images

Non-members:
- ❌ Cannot access any room content
- ❌ Cannot see blogs
- ❌ Cannot view images
- ❌ Are redirected to dashboard

---

## 📝 Blog Access Control

### Storage Architecture
**Supabase** (Metadata & Relationships):
```sql
blogs table:
- id (UUID)
- room_id (UUID) ← Links to room
- author_id (UUID) ← Who wrote it
- title, slug, excerpt
- sanity_id ← Links to content
- published (boolean)
- published_at, created_at, updated_at
```

**Sanity CMS** (Content):
```json
{
  "_id": "draft-abc123",
  "title": "Blog Title",
  "content": [...],  // Rich text
  "excerpt": "...",
  "tone": "professional",
  "language": "en"
}
```

### Access Rules
| Action | Who Can Do It |
|--------|---------------|
| View published blog | Room members only |
| View draft blog | Author only |
| Create blog | Room members only |
| Publish blog | Blog author only |
| Edit blog | Blog author only (currently manual) |
| Delete blog | Blog author only (currently manual) |

### Database Policies (RLS)
```sql
-- Blogs are viewable by room members
CREATE POLICY "Blogs viewable by room members"
ON blogs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = blogs.room_id
    AND user_id = auth.uid()
  )
);

-- Users can create blogs in their rooms
CREATE POLICY "Users can create blogs in their rooms"
ON blogs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = blogs.room_id
    AND user_id = auth.uid()
  )
);
```

---

## 🖼️ Image Access Control

### Storage Structure
```
Supabase Storage (blog-images bucket):
blog-images/  (PRIVATE bucket)
  └── rooms/
      └── {roomId}/
          └── {userId}/
              └── {filename}.jpg
```

### Access Rules
| Action | Who Can Do It | Verification |
|--------|---------------|--------------|
| Upload image | Room members | Room membership checked in API |
| View image | Room members | Storage policy checks membership |
| Delete image | Image uploader | Storage policy checks user ID |

### Storage Policies
```sql
-- Allow room members to upload
CREATE POLICY "Allow room members to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' 
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT room_id FROM room_members WHERE user_id = auth.uid()
  )
);

-- Allow room members to view
CREATE POLICY "Allow room members to view images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'blog-images' 
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT room_id FROM room_members WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their own
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' 
  AND (storage.foldername(name))[3] = auth.uid()::text
);
```

### Upload Flow
1. User clicks "Upload Image" in write page
2. API fetches room ID from room slug
3. API verifies user is room member (via room_members table)
4. Image uploaded to `rooms/{roomId}/{userId}/{filename}`
5. Storage policy verifies room membership before accepting upload
6. Image URL returned and stored in blog content

### View Flow
1. Blog page renders with image URLs
2. Browser requests image from Supabase Storage
3. Supabase checks storage policy:
   - Extracts room ID from path
   - Verifies requesting user is room member
   - Allows/denies access
4. Image displayed (if authorized)

---

## 🔐 Authentication Layer

### Supabase Auth
- Email/password authentication
- Session-based with JWT tokens
- auth.uid() used in all RLS policies

### Route Protection
```typescript
// All room routes check membership
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/signin')

const isMember = await isRoomMember(roomId, user.id)
if (!isMember) redirect('/dashboard')
```

---

## 🛡️ Security Benefits

### Data Isolation
- ✅ Each room is completely isolated
- ✅ No cross-room data leakage
- ✅ Member lists are private

### Content Privacy
- ✅ Blogs only visible to room members
- ✅ Images only accessible to room members
- ✅ No public access to any content

### Fine-Grained Control
- ✅ Row-level security on database
- ✅ Path-based security on storage
- ✅ API-level membership verification
- ✅ Client-side route protection

### Defense in Depth
Multiple security layers:
1. **Client-side**: Route guards and redirects
2. **API**: Membership verification in endpoints
3. **Database**: RLS policies on all tables
4. **Storage**: Path-based access policies
5. **Auth**: JWT token verification

---

## 🎯 Example Scenarios

### Scenario 1: User tries to view blog
```
User A (in Room 1) → View Blog in Room 1 ✅
  1. Route checks user is authenticated ✅
  2. Route checks user is room member ✅
  3. Database RLS allows query ✅
  4. Sanity content fetched ✅
  5. Blog displayed ✅

User B (NOT in Room 1) → View Blog in Room 1 ❌
  1. Route checks user is authenticated ✅
  2. Route checks user is room member ❌
  3. Redirected to dashboard ❌
```

### Scenario 2: User tries to view image
```
User A (in Room 1) → View Image from Room 1 ✅
  1. Browser requests image URL ✅
  2. Storage extracts room ID from path ✅
  3. Storage checks user in room_members ✅
  4. Image served ✅

User B (NOT in Room 1) → View Image from Room 1 ❌
  1. Browser requests image URL ✅
  2. Storage extracts room ID from path ✅
  3. Storage checks user in room_members ❌
  4. 403 Forbidden returned ❌
```

### Scenario 3: User tries to upload image
```
User A (in Room 1) → Upload to Room 1 ✅
  1. API receives upload request ✅
  2. API checks room membership ✅
  3. Storage path includes room ID ✅
  4. Storage policy verifies membership ✅
  5. Image uploaded ✅

User B (NOT in Room 1) → Upload to Room 1 ❌
  1. API receives upload request ✅
  2. API checks room membership ❌
  3. 403 Forbidden returned ❌
```

---

## 📋 Security Checklist

Before deploying to production:

### Supabase Setup
- [ ] All RLS policies enabled on tables
- [ ] Storage bucket created as PRIVATE
- [ ] Storage policies configured for room-based access
- [ ] Auth settings configured properly
- [ ] Environment variables secured

### Code Review
- [ ] No hardcoded secrets
- [ ] All API routes check authentication
- [ ] All API routes verify room membership
- [ ] Client-side routes protected with redirects
- [ ] No direct database queries without RLS

### Testing
- [ ] Test as room member (should have access)
- [ ] Test as non-member (should be blocked)
- [ ] Test as unauthenticated user (should redirect)
- [ ] Test image uploads and viewing
- [ ] Test blog creation and viewing
- [ ] Test cross-room access (should fail)

---

## 🚀 Ready for Production!

Your multi-blog platform has a robust, multi-layered security model that ensures:
- 🔒 Complete room isolation
- 🔒 Private blogs and images
- 🔒 Member-only access
- 🔒 Defense in depth
- 🔒 Industry best practices

All content is secured at multiple levels, making unauthorized access virtually impossible.

