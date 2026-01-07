# API Documentation

Complete API reference for the Community Blogging Platform.

## Base URL

Development: `http://localhost:3000`
Production: `https://your-domain.vercel.app`

## Authentication

All API routes (except public endpoints) require authentication via Supabase session cookies. The middleware automatically handles authentication.

### Headers

```
Content-Type: application/json
Cookie: sb-access-token=...; sb-refresh-token=...
```

---

## Authentication Endpoints

### Sign Out

```http
POST /api/auth/signout
```

Signs out the current user and redirects to sign-in page.

**Response**: Redirect to `/auth/signin`

---

## Room Endpoints

### Create Room

```http
POST /api/rooms/create
```

Creates a new room with a unique join code.

**Request Body**:
```json
{
  "name": "My Awesome Room",
  "description": "A space for tech bloggers" // optional
}
```

**Validation**:
- `name`: 3-100 characters
- `description`: optional string

**Response** (201):
```json
{
  "room": {
    "id": "uuid",
    "name": "My Awesome Room",
    "slug": "my-awesome-room",
    "join_code": "1234",
    "description": "A space for tech bloggers",
    "created_by": "user-uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors**:
- `401`: Unauthorized (not signed in)
- `400`: Invalid input
- `500`: Failed to create room

---

### Join Room

```http
POST /api/rooms/join
```

Joins an existing room using a 4-digit code.

**Request Body**:
```json
{
  "joinCode": "1234"
}
```

**Validation**:
- `joinCode`: exactly 4 digits

**Response** (200):
```json
{
  "room": {
    "id": "uuid",
    "name": "My Awesome Room",
    "slug": "my-awesome-room"
  }
}
```

**Errors**:
- `401`: Unauthorized
- `400`: Invalid join code format
- `404`: Room not found
- `409`: Already a member (but returns room info)

---

### Get Room Details

```http
GET /api/rooms/[roomSlug]
```

Gets room information by slug.

**Response** (200):
```json
{
  "room": {
    "id": "uuid",
    "name": "My Awesome Room",
    "slug": "my-awesome-room",
    "join_code": "1234",
    "description": "...",
    "created_by": "user-uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors**:
- `404`: Room not found

---

### Get Room Members

```http
GET /api/rooms/[roomSlug]/members
```

Gets all members of a room with their profile information.

**Authorization**: Must be a room member

**Response** (200):
```json
{
  "members": [
    {
      "id": "uuid",
      "room_id": "room-uuid",
      "user_id": "user-uuid",
      "role": "admin",
      "joined_at": "2024-01-01T00:00:00Z",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar_url": null
    }
  ]
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Forbidden (not a member)
- `404`: Room not found

---

## Blog Endpoints

### Create Blog

```http
POST /api/blogs/create
```

Creates a new blog post (draft) with content stored in Sanity.

**Authorization**: Must be a room member

**Request Body**:
```json
{
  "roomId": "room-uuid",
  "title": "My First Blog Post",
  "content": [
    {
      "_type": "block",
      "style": "normal",
      "children": [
        {
          "_type": "span",
          "text": "This is the content",
          "marks": []
        }
      ]
    }
  ],
  "excerpt": "Brief summary",
  "tone": "professional",
  "language": "en"
}
```

**Validation**:
- `roomId`: valid UUID
- `title`: 3-200 characters
- `content`: array of Sanity blocks
- `tone`: one of: professional, casual, technical, creative, academic
- `language`: one of: en, es, fr, de, hi, zh
- `excerpt`: optional string

**Response** (201):
```json
{
  "blog": {
    "id": "uuid",
    "room_id": "room-uuid",
    "author_id": "user-uuid",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "sanity_id": "draft-abc123",
    "excerpt": "Brief summary",
    "published": false,
    "published_at": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors**:
- `401`: Unauthorized
- `403`: No permission to write in room
- `400`: Invalid input
- `404`: Room not found
- `500`: Failed to create blog

---

### Update Blog

```http
PATCH /api/blogs/[blogId]/update
```

Updates an unpublished blog post.

**Authorization**: Must be the blog author and blog must be unpublished

**Request Body**:
```json
{
  "title": "Updated Title", // optional
  "content": [...], // optional
  "excerpt": "Updated excerpt" // optional
}
```

**Response** (200):
```json
{
  "blog": {
    // updated blog object
  }
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Cannot edit (published or not author)
- `404`: Blog not found
- `400`: Invalid input

---

### Publish Blog

```http
POST /api/blogs/[blogId]/publish
```

Publishes a blog post, making it visible and locking it from edits.

**Authorization**: Must be the blog author

**Response** (200):
```json
{
  "blog": {
    "id": "uuid",
    "published": true,
    "published_at": "2024-01-01T00:00:00Z",
    "sanity_id": "published-abc123",
    // other fields...
  }
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Only author can publish
- `400`: Already published
- `404`: Blog not found

---

## AI Endpoints

### Generate Content

```http
POST /api/ai/generate
```

Generates or refines blog content using AI.

**Request Body**:

For initial generation:
```json
{
  "tone": "professional",
  "language": "en",
  "customInstructions": "Focus on practical examples", // optional
  "context": "Write about the benefits of TypeScript in large projects"
}
```

For refinement:
```json
{
  "tone": "professional",
  "language": "en",
  "customInstructions": "...", // optional
  "context": "Original context",
  "existingContent": [...], // Sanity blocks
  "changeRequest": "Make it shorter and add more examples"
}
```

**Validation**:
- `tone`: required enum
- `language`: required enum
- `context`: min 10 characters
- `existingContent`: optional array (for refinement)
- `changeRequest`: optional string (for refinement)

**Response** (200):
```json
{
  "title": "The Power of TypeScript",
  "content": [
    {
      "_type": "block",
      "style": "h2",
      "children": [...]
    },
    {
      "_type": "block",
      "style": "normal",
      "children": [...]
    }
  ],
  "excerpt": "Discover how TypeScript improves large-scale applications"
}
```

**Errors**:
- `401`: Unauthorized
- `400`: Invalid input
- `503`: AI service not configured
- `500`: Failed to generate content

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "details": {} // optional, for validation errors
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not signed in)
- `403`: Forbidden (no permission)
- `404`: Not Found
- `409`: Conflict (e.g., already exists)
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Rate Limits

Currently, no rate limits are enforced. For production, consider:

- Room creation: 5 per hour per user
- Blog creation: 10 per hour per user
- AI generation: 20 per hour per user

Implement using Upstash Redis or similar.

---

## Webhooks

Currently not implemented. Future webhooks could include:

- `blog.published`: When a blog is published
- `room.member_joined`: When a user joins a room
- `user.registered`: When a new user signs up

---

## SDK Example (TypeScript)

```typescript
// Create a room
const createRoom = async (name: string, description?: string) => {
  const response = await fetch('/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
  return await response.json()
}

// Generate blog content
const generateContent = async (
  tone: string,
  language: string,
  context: string
) => {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tone, language, context }),
  })
  return await response.json()
}
```

---

## Testing

Use tools like:
- **Postman**: Import endpoints and test
- **curl**: Command-line testing
- **Thunder Client**: VS Code extension

Example curl request:

```bash
curl -X POST http://localhost:3000/api/rooms/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"name":"Test Room","description":"Testing"}'
```

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Room management endpoints
- Blog CRUD operations
- AI generation endpoint
- Full authentication flow

---

For more information, see the main [README.md](./README.md) or [SETUP_GUIDE.md](./SETUP_GUIDE.md).


