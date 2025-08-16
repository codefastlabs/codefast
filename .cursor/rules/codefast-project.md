# CodeFast Project Rules

## Project Overview
CodeFast is a monorepo containing a comprehensive UI component library built with React, TypeScript, and Tailwind CSS. The project follows modern development practices with a focus on reusability, performance, and maintainability.

## Repository Structure
- **Root**: Monorepo configuration with Turbo, pnpm workspace, and shared tooling
- **`packages/`**: Individual packages (UI components, hooks, utilities)
- **`apps/`**: Applications (documentation site)
- **`.cursor/rules/`**: Cursor IDE configuration and rules

## Technology Stack
- **Frontend**: React 19, Next.js 15, TypeScript 5
- **Styling**: Tailwind CSS 4, Tailwind Variants
- **UI Framework**: Radix UI primitives
- **Build Tools**: Turbo, pnpm, rslib
- **Testing**: Jest
- **Linting**: ESLint with custom configs
- **Formatting**: Prettier

## Coding Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer explicit types over inference when clarity is needed
- Use proper type imports/exports
- Follow TypeScript best practices for React components

### React Components
- Use functional components with hooks
- Implement proper prop interfaces with TypeScript
- Follow Radix UI patterns for accessibility
- Use Tailwind Variants for component styling variants
- Export components from index files for clean imports

### Styling
- Use Tailwind CSS utility classes
- Implement component variants using Tailwind Variants
- Follow design system principles
- Ensure responsive design patterns
- Use CSS custom properties when needed

### File Organization
- Group related components in directories
- Use index files for clean exports
- Follow consistent naming conventions
- Separate types, utilities, and components

## Package Development

### Package Structure
Each package should have:
- `src/` directory with source code
- `__tests__/` directory for tests
- `index.ts` for exports
- Proper package.json configuration
- README.md with usage examples

### Dependencies
- Use workspace dependencies (`workspace:*`) for internal packages
- Minimize external dependencies
- Keep dependencies up to date
- Use exact versions for critical dependencies

## Testing Requirements
- Write unit tests for all components
- Use Jest as the testing framework
- Aim for high test coverage
- Test component variants and edge cases
- Mock external dependencies appropriately

## Build and Development
- Use Turbo for build orchestration
- Implement proper caching strategies
- Use pnpm for package management
- Follow monorepo best practices
- Implement proper build dependencies

## Code Quality
- Use ESLint for code linting
- Follow Prettier formatting rules
- Implement proper error handling
- Write clear and concise code
- Use meaningful variable and function names

## Documentation
- Maintain comprehensive README files
- Document component APIs and usage
- Include code examples
- Keep documentation up to date
- Use proper JSDoc comments

## Performance Considerations
- Implement proper code splitting
- Optimize bundle sizes
- Use React.memo when appropriate
- Implement proper lazy loading
- Monitor performance metrics

## Accessibility
- Follow WCAG guidelines
- Use Radix UI primitives for accessibility
- Implement proper ARIA attributes
- Test with screen readers
- Ensure keyboard navigation support

## Git Workflow
- Use conventional commit messages
- Implement proper branching strategies
- Use changesets for versioning
- Follow semantic versioning
- Maintain clean git history

## Development Commands
- `pnpm dev`: Start development servers
- `pnpm build`: Build all packages
- `pnpm test`: Run tests
- `pnpm lint`: Lint code
- `pnpm format`: Format code with Prettier
- `pnpm type-check`: Run TypeScript checks

## Best Practices
- Keep components small and focused
- Implement proper error boundaries
- Use React DevTools for debugging
- Follow React performance best practices
- Implement proper loading states
- Use proper TypeScript strict mode
- Implement proper error handling
- Follow React hooks best practices
- Use proper state management patterns
- Implement proper form handling

## Common Patterns
- Use compound components when appropriate
- Implement proper prop spreading
- Use forwardRef for ref forwarding
- Implement proper event handling
- Use proper React patterns for state updates
- Implement proper cleanup in useEffect
- Use proper React patterns for conditional rendering
- Implement proper React patterns for lists
- Use proper React patterns for forms
- Implement proper React patterns for modals

## Troubleshooting
- Check package.json for correct dependencies
- Verify workspace configuration
- Check Turbo configuration
- Verify TypeScript configuration
- Check ESLint configuration
- Verify Prettier configuration
- Check build outputs
- Verify test configuration
- Check linting errors
- Verify formatting issues
