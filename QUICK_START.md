# Quick Start Guide

Get up and running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Git installed
- A code editor (VS Code recommended)

## 1. Clone & Install (2 minutes)

```bash
git clone <your-repo-url>
cd multi-blog
npm install
```

## 2. Set Up Supabase (3 minutes)

1. Go to [supabase.com](https://supabase.com) → Sign up/Sign in
2. Create new project (name: `multi-blog`)
3. Go to SQL Editor → Run `supabase-schema.sql`
4. Go to Settings → API → Copy URL and anon key

## 3. Set Up Sanity (3 minutes)

Option A: Quick Setup (Existing Project)
```bash
# Use test/demo credentials for quick testing
```

Option B: Full Setup
```bash
npm install -g @sanity/cli
mkdir sanity-studio && cd sanity-studio
sanity init
# Follow prompts, copy schema from lib/sanity/schema.ts
sanity deploy
cd ..
```

## 4. Get OpenAI Key (1 minute)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up → API Keys → Create new key
3. Copy the key

## 5. Configure Environment (1 minute)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here
```

## 6. Run! (1 second)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Drive (5 minutes)

### Create Account
1. Click "Get Started"
2. Sign up with email + username
3. You'll land on dashboard

### Create Your First Room
1. Click "Create New Room"
2. Name: "Test Room"
3. Note the 4-digit code
4. You'll see the room's People tab

### Write Your First Blog
1. Click "Write Blog" tab
2. Choose tone: Professional
3. Choose language: English
4. Context: "Benefits of walking daily"
5. Click "Generate Blog Post"
6. Wait ~10 seconds
7. Review the generated content
8. Try refining: "Make it more casual"
9. Click "Publish Blog"
10. View your published blog!

### Invite Others (Optional)
1. Share the 4-digit code
2. Others can join via "Join Room"
3. They'll see all members and can write too

## Common First-Time Issues

### "Unauthorized" Error
- Check your Supabase URL and key
- Make sure they're in `.env.local`
- Restart dev server after adding env vars

### "Room not found"
- The database schema might not be loaded
- Go to Supabase → SQL Editor
- Re-run `supabase-schema.sql`

### "AI generation failed"
- Verify OpenAI API key is correct
- Check you have credits in OpenAI account
- API key should start with `sk-`

### "Cannot find module"
- Run `npm install` again
- Delete `node_modules` and run `npm install`

## What's Next?

- Read [README.md](./README.md) for full documentation
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API details
- Review [PROJECT_STATUS.md](./PROJECT_STATUS.md) for features
- See [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute

## Architecture Overview

```
┌─────────────┐
│   Next.js   │  Frontend + API Routes
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌─▼────┐
│Supa-│ │Sanity│  Database + CMS
│base │ │ CMS  │
└─────┘ └──────┘
   │       │
   └───┬───┘
       │
    ┌──▼───┐
    │OpenAI│  AI Generation
    └──────┘
```

- **Supabase**: User data, rooms, blog metadata
- **Sanity**: Blog content (rich text)
- **OpenAI**: AI content generation
- **Next.js**: Everything else

## Key Features

✅ **Authentication**: Email + unique username
✅ **Rooms**: Create or join with 4-digit codes
✅ **AI Writing**: Generate blogs with custom tone/language
✅ **Refinement**: Iteratively improve with simple prompts
✅ **Publishing**: Lock and display SEO-friendly blogs
✅ **Permissions**: Only members can view, only authors can publish

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **CMS**: Sanity
- **AI**: OpenAI GPT-4
- **Hosting**: Vercel (recommended)

## Folder Structure

```
multi-blog/
├── app/              # Pages & API routes
├── components/       # UI components
├── lib/              # Utilities & configs
├── types/            # TypeScript types
└── public/           # Static assets
```

## Support

- 📖 Check documentation files
- 🐛 Open an issue on GitHub
- 💬 Review closed issues for solutions
- 📧 Contact maintainers

## Quick Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run linter
```

## Pro Tips

1. **Username**: Lowercase only, 3-30 chars
2. **Join Codes**: Always 4 digits, case-sensitive
3. **AI Generation**: More context = better results
4. **Refinement**: Be specific in change requests
5. **Published Blogs**: Cannot be edited after publishing

## Troubleshooting Commands

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat .env.local

# Verify Node version
node --version  # Should be 18+

# Check for port conflicts
lsof -i :3000
```

## Security Notes

- Never commit `.env.local`
- Keep API keys secret
- Use environment variables for all secrets
- Review Supabase RLS policies

## Performance

- Initial load: ~2s
- AI generation: 10-30s
- Page navigation: instant
- API calls: <500ms

## Limits (Free Tier)

- **Supabase**: 500MB DB, 2GB bandwidth
- **Sanity**: 3 users, unlimited docs
- **Vercel**: 100GB bandwidth
- **OpenAI**: Pay per use (~$0.01 per generation)

## Ready to Deploy?

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for production deployment instructions.

---

Built with ❤️ using Next.js, Supabase, Sanity, and OpenAI

Happy Blogging! 🚀

