# Contributing to Community Blogging Platform

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Keep discussions on topic

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/multi-blog.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit: `git commit -m "Add your feature"`
7. Push: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

Follow the [SETUP_GUIDE.md](./SETUP_GUIDE.md) to set up your development environment.

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Export types for reusability
- Use interfaces for object shapes

```typescript
// Good
interface UserProfile {
  id: string
  username: string
  email: string
}

// Avoid
const user: any = {}
```

### File Structure

- Components in `components/` directory
- API routes in `app/api/`
- Utilities in `lib/utils/`
- Types in `types/`
- Keep files focused and single-purpose

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ROOM_MEMBERS`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use template literals for string interpolation
- Max line length: 100 characters (flexible)

```typescript
// Good
const greeting = `Hello, ${username}!`

// Avoid
const greeting = "Hello, " + username + "!"
```

### React Components

- Use functional components
- Use hooks for state management
- Extract complex logic into custom hooks
- Keep components small and focused

```typescript
// Good - Focused component
export function UserAvatar({ username }: { username: string }) {
  return (
    <div className="w-10 h-10 bg-blue-500 rounded-full">
      {username.charAt(0).toUpperCase()}
    </div>
  )
}
```

### API Routes

- Always validate input with Zod
- Check permissions before operations
- Return consistent error formats
- Use appropriate HTTP status codes
- Include try-catch blocks

```typescript
// Good - Proper validation and error handling
const schema = z.object({
  name: z.string().min(3).max(100),
})

const result = schema.safeParse(body)
if (!result.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: result.error.format() },
    { status: 400 }
  )
}
```

### Database Operations

- Always use parameterized queries (Supabase handles this)
- Check permissions with helper functions
- Handle errors gracefully
- Use transactions where needed

### Error Handling

- Always handle errors
- Log errors for debugging
- Return user-friendly messages
- Don't expose sensitive information

```typescript
// Good
try {
  await someOperation()
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  )
}
```

## Testing

Currently, we don't have automated tests, but you should:

1. Test all user flows manually
2. Check error cases
3. Verify permission checks work
4. Test on different screen sizes
5. Check browser console for errors

### Manual Testing Checklist

- [ ] Authentication (sign up, sign in, sign out)
- [ ] Room creation
- [ ] Room joining
- [ ] Member list viewing
- [ ] AI blog generation
- [ ] Blog refinement
- [ ] Blog publishing
- [ ] Blog viewing
- [ ] Permission checks
- [ ] Error messages display correctly

## Pull Request Process

1. **Update Documentation**: If you change functionality, update relevant docs
2. **Test Thoroughly**: Test all affected features
3. **Clean Commits**: Use clear, descriptive commit messages
4. **Description**: Explain what and why in the PR description
5. **Screenshots**: Include screenshots for UI changes
6. **Breaking Changes**: Clearly mark any breaking changes

### PR Title Format

```
[Type] Brief description

Examples:
[Feature] Add blog search functionality
[Fix] Resolve room join code validation bug
[Docs] Update API documentation
[Refactor] Improve slug generation logic
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How to test these changes

## Screenshots (if applicable)
[Add screenshots]

## Breaking Changes
None / [Describe breaking changes]
```

## Feature Requests

To request a feature:

1. Check existing issues first
2. Create a new issue with `[Feature Request]` tag
3. Describe the feature clearly
4. Explain the use case
5. Suggest implementation if possible

## Bug Reports

To report a bug:

1. Check existing issues first
2. Create a new issue with `[Bug]` tag
3. Describe the bug clearly
4. Include steps to reproduce
5. Include expected vs actual behavior
6. Add screenshots if helpful
7. Include environment details (OS, browser, etc.)

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
[Add if helpful]

## Environment
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17]
```

## Areas for Contribution

### High Priority
- Add automated tests (Jest, Playwright)
- Improve error messages
- Add loading states
- Implement blog search
- Add image upload for blogs

### Medium Priority
- Add user profile customization
- Implement blog drafts list
- Add room settings page
- Create email notifications
- Add blog tags/categories

### Low Priority
- Add dark mode
- Implement blog comments
- Add analytics dashboard
- Create mobile app
- Add more AI models

## Documentation

When adding features:

1. Update README.md if needed
2. Update API_DOCUMENTATION.md for API changes
3. Add comments for complex logic
4. Update SETUP_GUIDE.md if setup changes

## Questions?

- Open an issue with `[Question]` tag
- Check existing documentation
- Review closed issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉


