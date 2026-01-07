# Community Blogging Platform

A modern, collaborative blogging platform built with Next.js, Supabase, and Sanity CMS. Features AI-powered writing assistance, room-based collaboration, and SEO-optimized blog posts.

## 🌟 Features

- **User Authentication**: Secure email + username-based authentication via Supabase
- **Room Management**: Create or join rooms using unique 4-digit codes
- **AI-Powered Writing**: Generate blog posts with customizable tone and language
- **Iterative Refinement**: Continuously improve your content with AI assistance
- **SEO-Optimized**: Clean URLs and metadata for better search engine visibility
- **Real-time Collaboration**: See room members and collaborate on content
- **Free-Tier Friendly**: Designed to work within free tier limits of all services

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication & Database**: Supabase
- **CMS**: Sanity
- **AI**: OpenAI GPT-4
- **Validation**: Zod

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account (free tier)
- A Sanity account (free tier)
- An OpenAI API key

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd multi-blog
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL and anon key

### 3. Set Up Sanity

1. Install Sanity CLI: `npm install -g @sanity/cli`
2. Create a new Sanity project: `sanity init`
3. Use the schema from `lib/sanity/schema.ts`
4. Deploy your studio: `sanity deploy`

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
multi-blog/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── rooms/                # Room management
│   │   ├── blogs/                # Blog CRUD operations
│   │   └── ai/                   # AI generation
│   ├── auth/                     # Auth pages (signin/signup)
│   ├── [roomSlug]/               # Dynamic room routes
│   │   ├── people/               # Room members page
│   │   ├── write/                # AI writing interface
│   │   └── blog/[blogSlug]/      # Blog display page
│   ├── create-room/              # Create room page
│   ├── join-room/                # Join room page
│   ├── dashboard/                # User dashboard
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   └── ui/                       # UI components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase clients
│   ├── sanity/                   # Sanity configuration
│   └── utils/                    # Helper functions
├── types/                        # TypeScript types
├── middleware.ts                 # Next.js middleware
└── supabase-schema.sql           # Database schema
```

## 🔐 Database Schema

### Tables

- **profiles**: User profiles with username
- **rooms**: Community spaces
- **room_members**: Junction table for memberships
- **blogs**: Blog metadata (content in Sanity)

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic triggers for profile creation
- Unique join code generation
- Comprehensive permission checks

## 🎨 URL Structure

- Home: `/`
- Authentication: `/auth/signin`, `/auth/signup`
- Dashboard: `/dashboard`
- Room Management: `/create-room`, `/join-room`
- Room Pages: `/{room-slug}/people`, `/{room-slug}/write`
- Blog Display: `/{room-slug}/blog/{blog-slug}`

Note: Tone and language preferences are NOT in URLs for SEO optimization.

## 🤖 AI Writing Flow

1. **Configuration**: Select tone, language, and provide context
2. **Generation**: AI creates initial blog post
3. **Preview**: Review generated content
4. **Refinement**: Iteratively improve with "What do you want to change?" input
5. **Publish**: Lock content and save to Sanity + Supabase

## 🔒 Permission System

- **Room Access**: Only members can view room content
- **Blog Writing**: All room members can write blogs
- **Blog Editing**: Only unpublished blogs can be edited by authors
- **Blog Publishing**: Only authors can publish their blogs
- **Room Admin**: Creators are automatically admins

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID`
- [ ] `NEXT_PUBLIC_SANITY_DATASET`
- [ ] `SANITY_API_TOKEN`
- [ ] `OPENAI_API_KEY`

## 🧪 Testing Workflow

1. Sign up with a new account
2. Create a room (note the join code)
3. Sign up with another account
4. Join the room using the code
5. Navigate to "Write Blog"
6. Configure AI preferences
7. Generate content
8. Refine iteratively
9. Publish
10. View the published blog

## 📚 API Routes

### Rooms

- `POST /api/rooms/create` - Create a new room
- `POST /api/rooms/join` - Join room with code
- `GET /api/rooms/[roomSlug]` - Get room details
- `GET /api/rooms/[roomSlug]/members` - Get room members

### Blogs

- `POST /api/blogs/create` - Create blog draft
- `PATCH /api/blogs/[blogId]/update` - Update draft
- `POST /api/blogs/[blogId]/publish` - Publish blog

### AI

- `POST /api/ai/generate` - Generate or refine content

## 🎯 Key Design Decisions

1. **Draft vs Published**: Sanity IDs use `draft-` and `published-` prefixes
2. **Dual Storage**: Metadata in Supabase, content in Sanity
3. **Permission Checks**: Every API route validates permissions
4. **SEO-Friendly**: Clean URLs without query parameters
5. **Free Tier**: Optimized for free tier usage across all services

## 🐛 Troubleshooting

### Database Issues

- Ensure RLS policies are properly set up
- Check if triggers are active
- Verify user has proper permissions

### Sanity Issues

- Confirm API token has write permissions
- Check project ID and dataset name
- Verify schema is deployed

### AI Generation Issues

- Validate OpenAI API key
- Check API rate limits
- Ensure proper JSON response format

## 🤝 Contributing

This is a production-quality codebase. Key principles:

- Strong typing with TypeScript
- Comprehensive error handling
- Permission checks on all operations
- Clean separation of concerns
- Descriptive variable and function names

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the excellent backend
- Sanity for the flexible CMS
- OpenAI for the powerful AI capabilities

---

Built with ❤️ using modern web technologies
