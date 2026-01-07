# Complete Setup Guide

This guide will walk you through setting up the Community Blogging Platform from scratch.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose an organization (or create one)
4. Fill in:
   - Name: `multi-blog`
   - Database Password: (generate a strong one and save it)
   - Region: (choose closest to you)
5. Click "Create new project"
6. Wait for the project to be ready (~2 minutes)

## Step 2: Set Up Database

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. Verify success: You should see "Success. No rows returned"

### Verify Tables

Go to "Table Editor" in the sidebar. You should see:
- `profiles`
- `rooms`
- `room_members`
- `blogs`

## Step 3: Get Supabase Credentials

1. In Supabase dashboard, go to "Settings" → "API"
2. Copy these values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 4: Create Sanity Project

### Install Sanity CLI

```bash
npm install -g @sanity/cli
```

### Initialize Sanity

In a **separate directory** (not in your project yet):

```bash
mkdir my-blog-studio
cd my-blog-studio
sanity init
```

Follow the prompts:
- Login with your Sanity account
- Create new project
- Name: `multi-blog`
- Use default dataset: `production`
- Project template: Clean (empty)

### Set Up Schema

1. After initialization, open `schemas/index.ts` (or create it)
2. Copy the schema from `lib/sanity/schema.ts` in this project
3. Add it to your schemas:

```typescript
import { blogPostSchema } from './blogPost'

export const schemaTypes = [blogPostSchema]
```

4. Create `schemas/blogPost.ts` and paste the schema

### Deploy Studio

```bash
sanity deploy
```

Choose a studio hostname (e.g., `my-multi-blog`)

### Get Sanity Credentials

1. Project ID: Found in `sanity.json` or `sanity.config.ts`
2. Create API Token:
   - Go to [sanity.io/manage](https://sanity.io/manage)
   - Select your project
   - Go to "API" → "Tokens"
   - Click "Add New Token"
   - Name: `blog-api`
   - Permissions: **Editor**
   - Copy the token immediately (you won't see it again!)

## Step 5: Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or sign in
3. Go to "API Keys"
4. Click "Create new secret key"
5. Name it: `blog-platform`
6. Copy the key immediately

### Add Credits

If you're a new user:
1. Go to "Billing" → "Payment methods"
2. Add a payment method
3. Add credits ($5 minimum, should last a long time)

## Step 6: Configure Environment Variables

In your project root, create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123def
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=sk...xyz

# OpenAI
OPENAI_API_KEY=sk-proj-...
```

## Step 7: Install Dependencies

```bash
npm install
```

## Step 8: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 9: Test the Application

### Test Authentication

1. Click "Get Started"
2. Fill in:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
3. Click "Sign Up"
4. You should be redirected to the dashboard

### Test Room Creation

1. Click "Create New Room"
2. Fill in:
   - Name: `My First Room`
   - Description: `Testing the platform`
3. Click "Create Room"
4. You should see a 4-digit join code

### Test Room Joining

1. Open an incognito window
2. Sign up with a different account
3. Click "Join Room"
4. Enter the 4-digit code from step above
5. Click "Join Room"
6. You should see the room's people page

### Test Blog Writing

1. In the room, click "Write Blog"
2. Select:
   - Tone: Professional
   - Language: English
3. Context: `Write about the benefits of Next.js`
4. Click "Generate Blog Post"
5. Wait for generation (~10-30 seconds)
6. Review the content
7. Try refining: "Make it shorter"
8. Click "Publish Blog"

### Verify in Database

1. Go to Supabase → Table Editor → `blogs`
2. You should see your blog with `published = true`
3. Go to Sanity Studio (your deployed URL)
4. You should see the blog post content

## Common Issues

### "Unauthorized" errors

- Check that your Supabase keys are correct
- Verify the user is signed in
- Check browser console for specific errors

### "Room not found"

- Verify the join code is correct (4 digits)
- Check that the room exists in Supabase

### "Failed to generate content"

- Verify OpenAI API key is correct
- Check you have credits in your OpenAI account
- Look at the API logs in OpenAI dashboard

### Sanity errors

- Verify API token has Editor permissions
- Check project ID matches
- Ensure schema is deployed

## Production Deployment

### Prepare for Production

1. Review all environment variables
2. Test all features thoroughly
3. Enable any additional Supabase security

### Deploy to Vercel

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables (all 6 from `.env.local`)
6. Click "Deploy"
7. Wait for deployment (~2 minutes)

### Post-Deployment

1. Test all features on production URL
2. Update any hardcoded URLs if necessary
3. Set up custom domain (optional)

## Security Checklist

- [ ] All environment variables are set
- [ ] Supabase RLS policies are active
- [ ] API routes have permission checks
- [ ] No secrets in client-side code
- [ ] HTTPS is enabled (automatic on Vercel)

## Performance Tips

1. **Supabase**: Use indexes on frequently queried columns
2. **Sanity**: Enable CDN for faster content delivery
3. **OpenAI**: Cache frequently generated content (future enhancement)
4. **Next.js**: Use static generation where possible

## Cost Estimates (Monthly)

- **Supabase Free Tier**: $0 (500MB database, 2GB bandwidth)
- **Sanity Free Tier**: $0 (3 users, unlimited documents)
- **OpenAI**: ~$5-20 (depending on usage)
- **Vercel Free Tier**: $0 (100GB bandwidth)

**Total**: $5-20/month for moderate usage

## Next Steps

1. Customize the UI/branding
2. Add more AI tones and languages
3. Implement blog search
4. Add image upload for blogs
5. Create email notifications
6. Add analytics

## Getting Help

- Check the main README.md
- Review the code comments
- Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Check Sanity docs: [sanity.io/docs](https://sanity.io/docs)
- Check Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)

---

Happy building! 🚀


