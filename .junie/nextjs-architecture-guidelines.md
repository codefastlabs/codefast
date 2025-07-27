# Next.js 15 Explicit Architecture Development Guidelines

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure Standards](#project-structure-standards)
3. [Bounded Context Development](#bounded-context-development)
4. [Layer Responsibilities](#layer-responsibilities)
5. [File Naming Conventions](#file-naming-conventions)
6. [Technology Integration](#technology-integration)
7. [Development Workflows](#development-workflows)
8. [Testing Standards](#testing-standards)
9. [Security Implementation](#security-implementation)
10. [Performance Guidelines](#performance-guidelines)
11. [Code Quality Standards](#code-quality-standards)
12. [Deployment Practices](#deployment-practices)

## Architecture Overview

### Core Principles

This architecture implements Explicit Architecture principles combining Domain-Driven Design (DDD), Hexagonal Architecture, Clean Architecture, and CQRS patterns for enterprise-level Next.js 15 applications.

#### Primary Objectives

- **Separation of Concerns**: Each layer has distinct responsibilities with minimal coupling
- **Business Logic Isolation**: Domain logic remains independent of technical implementation details
- **Testability**: Architecture supports comprehensive testing strategies at all levels
- **Scalability**: Structure enables horizontal scaling and microservice evolution
- **Maintainability**: Clear organization facilitates long-term code maintenance and team collaboration

#### Architectural Layers

1. **Domain Layer**: Pure business logic and domain models
2. **Application Layer**: Use cases, commands, queries, and orchestration logic
3. **Infrastructure Layer**: Technical implementations and external service integrations
4. **Presentation Layer**: User interface components and API endpoints

## Project Structure Standards

### Root Directory Organization

```
project-root/
├── src/                    # Source code
│   ├── app/               # Next.js 15 App Router
│   ├── bounded-contexts/  # Domain Bounded Contexts
│   ├── shared/           # Shared Kernel
│   ├── infrastructure/   # Cross-cutting Infrastructure
│   └── presentation/     # Presentation Layer
├── cli/                  # Command-Line Tools
├── tests/               # Test Organization
├── docs/                # Documentation
└── config/              # Configuration Files
```

### Bounded Context Structure

Each bounded context follows a standardized structure:

```
bounded-context-name/
├── domain/              # Business logic and domain models
├── application/         # Use cases and application services
├── infrastructure/      # Technical implementations
└── presentation/        # UI components and hooks
```

## Bounded Context Development

### Context Identification Guidelines

#### When to Create a New Bounded Context

- **Distinct Business Domain**: Represents a separate business capability
- **Independent Data Model**: Requires unique entity relationships and business rules
- **Separate Team Ownership**: Can be developed and maintained by different teams
- **Different Change Frequencies**: Evolves at different rates than other contexts

#### Context Naming Standards

- Use descriptive, business-oriented names (e.g., `user-management`, `order-processing`)
- Apply kebab-case for directory names
- Ensure names reflect business terminology, not technical concepts

### Domain Layer Guidelines

#### Entity Development

```typescript
// user.entity.ts
export class User extends EntityBase<UserId> {
  private constructor(
    id: UserId,
    private _email: Email,
    private _profile: UserProfile,
    private _roles: UserRole[]
  ) {
    super(id);
  }

  public static create(
    email: Email,
    profile: UserProfile,
    roles: UserRole[]
  ): User {
    const id = UserId.generate();
    const user = new User(id, email, profile, roles);
    user.addDomainEvent(new UserCreatedEvent(user));
    return user;
  }

  // Business logic methods
  public changeEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) {
      throw new BusinessRuleError('Email must be different');
    }
    this._email = newEmail;
    this.addDomainEvent(new UserEmailChangedEvent(this.id, newEmail));
  }
}
```

#### Value Object Implementation

```typescript
// email.value-object.ts
export class Email extends ValueObjectBase {
  private constructor(private readonly _value: string) {
    super();
    this.validate();
  }

  public static create(value: string): Email {
    return new Email(value);
  }

  private validate(): void {
    if (!this.isValidEmail(this._value)) {
      throw new ValidationError('Invalid email format');
    }
  }

  public get value(): string {
    return this._value;
  }
}
```

#### Repository Interface Definition

```typescript
// user.repository.ts
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;

  findByEmail(email: Email): Promise<User | null>;

  save(user: User): Promise<void>;

  delete(id: UserId): Promise<void>;
}
```

### Application Layer Guidelines

#### Use Case Implementation

```typescript
// create-user.use-case.ts
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.EmailService) private emailService: EmailService
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponse> {
    // Validation
    const email = Email.create(command.email);

    // Business rule validation
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BusinessRuleError('User already exists');
    }

    // Create entity
    const user = User.create(
      email,
      UserProfile.create(command.profile),
      [UserRole.create('USER')]
    );

    // Persist
    await this.userRepository.save(user);

    // Side effects
    await this.emailService.sendWelcomeEmail(email);

    return UserResponse.fromEntity(user);
  }
}
```

#### Command and Query Separation

```typescript
// Commands (Write Operations)
export interface CreateUserCommand {
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

// Queries (Read Operations)
export interface GetUserQuery {
  userId: string;
}

export interface GetUsersQuery {
  page: number;
  limit: number;
  filters?: UserFilters;
}
```

### Infrastructure Layer Guidelines

#### Repository Implementation

```typescript
// user.repository.adapter.ts
@injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: DatabaseConnection
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const result = await this.db.select().from(usersTable).where(eq(usersTable.id, id.value));

    return result.length > 0 ? this.toDomain(result[0]) : null;
  }

  async save(user: User): Promise<void> {
    const data = this.toPersistence(user);
    await this.db.insert(usersTable).values(data).onDuplicateKeyUpdate({ set: data });
  }

  private toDomain(raw: any): User {
    // Convert database record to domain entity
  }

  private toPersistence(user: User): any {
    // Convert domain entity to database record
  }
}
```

## Layer Responsibilities

### Domain Layer

**Responsibilities:**

- Define business entities, value objects, and aggregates
- Implement business rules and domain logic
- Define repository interfaces (ports)
- Raise domain events for significant business occurrences

**Restrictions:**

- No dependencies on external frameworks or libraries
- No infrastructure concerns (database, HTTP, etc.)
- No application workflow logic

### Application Layer

**Responsibilities:**

- Orchestrate use cases and business workflows
- Handle application-specific validation
- Coordinate between domain objects
- Manage transactions and unit of work
- Transform between DTOs and domain objects

**Restrictions:**

- No direct infrastructure dependencies
- No UI-specific logic
- No framework-specific implementations

### Infrastructure Layer

**Responsibilities:**

- Implement repository interfaces
- Handle external service integrations
- Manage database connections and configurations
- Implement caching strategies
- Handle messaging and event publishing

**Restrictions:**

- Should not contain business logic
- Must implement domain-defined interfaces

### Presentation Layer

**Responsibilities:**

- Handle HTTP requests and responses
- Implement UI components and interactions
- Manage form validation and submission
- Handle authentication and authorization

**Restrictions:**

- No direct domain object manipulation
- Communication through application services only

## File Naming Conventions

### Directory Naming

- Use kebab-case for all directory names
- Use descriptive, business-oriented names
- Organize by feature/context, not by technical layer

### File Naming Standards

- Use kebab-case with dot-notation: `user-profile.service.ts`
- Include layer suffix: `.entity.ts`, `.service.ts`, `.repository.ts`
- Component files: `.component.tsx`
- Test files: `.test.ts` or `.spec.ts`

### TypeScript Naming

- Interfaces and types: PascalCase without prefixes (`UserProfile`, not `IUserProfile`)
- Classes: PascalCase (`UserService`)
- Methods and variables: camelCase (`createUser`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)

## Technology Integration

### Next.js 15 Integration

#### Server Actions for Commands

```typescript
// create-user.action.ts
'use server';

import { container } from '@/infrastructure/dependency-injection/container';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';

export async function createUserAction(formData: FormData) {
  const useCase = container.get<CreateUserUseCase>('CreateUserUseCase');

  const command = {
    email: formData.get('email') as string,
    profile: {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
    }
  };

  return await useCase.execute(command);
}
```

#### API Routes for Queries

```typescript
// app/api/users/route.ts
import { NextRequest } from 'next/server';
import { container } from '@/infrastructure/dependency-injection/container';
import { GetUsersUseCase } from '@/bounded-contexts/user-management/application/use-cases/get-users.use-case';

export async function GET(request: NextRequest) {
  const useCase = container.get<GetUsersUseCase>('GetUsersUseCase');
  const searchParams = request.nextUrl.searchParams;

  const query = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
  };

  const result = await useCase.execute(query);
  return Response.json(result);
}
```

### Drizzle ORM Integration

#### Schema Definition

```typescript
// users.schema.ts
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Inversify Dependency Injection

#### Container Configuration

```typescript
// inversify.config.ts
const container = new Container();

// Domain services
container.bind<UserRepository>('UserRepository').to(DrizzleUserRepository);
container.bind<EmailService>('EmailService').to(NodemailerEmailService);

// Use cases
container.bind<CreateUserUseCase>('CreateUserUseCase').to(CreateUserUseCase);
container.bind<GetUserUseCase>('GetUserUseCase').to(GetUserUseCase);

export { container };
```

### Zod Validation Integration

#### Schema Definition

```typescript
// user-validation.schema.ts
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  profile: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  }),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

## Development Workflows

### Creating a New Bounded Context

1. **Identify Business Domain**
  - Analyze business requirements
  - Define context boundaries
  - Identify key entities and workflows

2. **Generate Structure**
   ```bash
   npm run cli generate:bounded-context user-management
   ```

3. **Define Domain Model**
  - Create entities and value objects
  - Define aggregates and business rules
  - Implement domain services

4. **Implement Application Layer**
  - Create use cases for business workflows
  - Define commands and queries
  - Implement DTOs and mappers

5. **Build Infrastructure**
  - Implement repository adapters
  - Configure database schemas
  - Set up external service integrations

6. **Create Presentation Layer**
  - Build UI components
  - Implement forms and validation
  - Create Server Actions and API routes

### Code Generation Workflow

#### Generate Entity

```bash
npm run cli generate:entity User --context user-management
```

#### Generate Use Case

```bash
npm run cli generate:use-case CreateUser --context user-management --type command
```

#### Generate Component

```bash
npm run cli generate:component UserForm --context user-management
```

## Testing Standards

### Unit Testing Guidelines

#### Domain Entity Tests

```typescript
// user.entity.test.ts
describe('User Entity', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create({ firstName: 'John', lastName: 'Doe' });
      const roles = [UserRole.create('USER')];

      const user = User.create(email, profile, roles);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should raise UserCreatedEvent when created', () => {
      const user = User.create(
        Email.create('test@example.com'),
        UserProfile.create({ firstName: 'John', lastName: 'Doe' }),
        [UserRole.create('USER')]
      );

      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
    });
  });
});
```

#### Use Case Tests

```typescript
// create-user.use-case.test.ts
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockEmailService = createMockEmailService();
    useCase = new CreateUserUseCase(mockUserRepository, mockEmailService);
  });

  it('should create user successfully', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const command: CreateUserCommand = {
      email: 'test@example.com',
      profile: { firstName: 'John', lastName: 'Doe' }
    };

    const result = await useCase.execute(command);

    expect(result).toBeDefined();
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing Guidelines

#### Repository Tests

```typescript
// user.repository.adapter.test.ts
describe('DrizzleUserRepository', () => {
  let repository: DrizzleUserRepository;
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
    repository = new DrizzleUserRepository(testDb.connection);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it('should save and retrieve user', async () => {
    const user = createTestUser();

    await repository.save(user);
    const retrieved = await repository.findById(user.id);

    expect(retrieved).toEqual(user);
  });
});
```

### End-to-End Testing Guidelines

#### User Flow Tests

```typescript
// user-registration.e2e.test.ts
describe('User Registration Flow', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('should complete user registration successfully', async () => {
    await page.goto('/register');

    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=firstName]', 'John');
    await page.fill('[data-testid=lastName]', 'Doe');

    await page.click('[data-testid=submit]');

    await expect(page.locator('[data-testid=success-message]')).toBeVisible();

    // Verify user was created in database
    const user = await testDb.findUserByEmail('test@example.com');
    expect(user).toBeDefined();
  });
});
```

## Security Implementation

### Authentication Implementation

#### Credential-Based Authentication

```typescript
// credentials.adapter.ts
export class CredentialsAdapter {
  async authenticateUser(credentials: Credentials): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(credentials.email);

    if (!user || !await this.verifyPassword(credentials.password, user.passwordHash)) {
      throw new AuthenticationError('Invalid credentials');
    }

    return {
      user: user.toAuthUser(),
      session: await this.createSession(user.id)
    };
  }
}
```

#### WebAuthn Integration

```typescript
// webauthn.adapter.ts
export class WebAuthnAdapter {
  async beginRegistration(userId: UserId): Promise<RegistrationOptions> {
    const user = await this.userRepository.findById(userId);

    return await generateRegistrationOptions({
      rpName: 'Your App',
      rpID: 'your-domain.com',
      userID: user.id.value,
      userName: user.email.value,
      userDisplayName: user.profile.fullName,
    });
  }

  async verifyRegistration(response: RegistrationResponse): Promise<VerificationResult> {
    return await verifyRegistrationResponse({
      response,
      expectedChallenge: await this.getStoredChallenge(response.userId),
      expectedOrigin: 'https://your-domain.com',
      expectedRPID: 'your-domain.com',
    });
  }
}
```

### Authorization Implementation

#### Role-Based Access Control

```typescript
// auth-guard.middleware.ts
export function requireRole(roles: string[]) {
  return async (request: NextRequest) => {
    const session = await getSession(request);

    if (!session) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRoles = await this.getUserRoles(session.userId);
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenError('Insufficient permissions');
    }

    return session;
  };
}
```

## Performance Guidelines

### Caching Strategy

#### Redis Integration

```typescript
// cache.adapter.ts
export class RedisCacheAdapter implements CachePort {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }
}
```

#### Query Optimization

```typescript
// Implement caching decorator for use cases
@Cache({ ttl: 300, key: 'user:{{userId}}' })
async
getUserById(userId
:
string
):
Promise < UserResponse > {
  // Implementation
}
```

### Background Job Processing

#### BullMQ Integration

```typescript
// email.job.ts
export class EmailJob {
  async process(job: Job<EmailData>): Promise<void> {
    const { to, subject, template, data } = job.data;

    const html = await this.renderTemplate(template, data);

    await this.emailService.send({
      to,
      subject,
      html
    });
  }
}
```

## Code Quality Standards

### ESLint Configuration

```javascript
// eslint.config.js
module.exports = {
  extends: [
    '@next/eslint-config-next',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript'
  ],
  rules: {
    'import/order': [
      'error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always'
      }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error'
  }
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Git Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

## Deployment Practices

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY ../../../../Downloads .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Configuration

```typescript
// environment.config.ts
export const environmentConfig = {
  development: {
    database: {
      url: process.env.DATABASE_URL,
      ssl: false
    },
    redis: {
      url: process.env.REDIS_URL,
      retryDelayOnFailover: 100
    }
  },
  production: {
    database: {
      url: process.env.DATABASE_URL,
      ssl: true,
      pool: {
        min: 2,
        max: 10
      }
    },
    redis: {
      url: process.env.REDIS_URL,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    }
  }
};
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t app .
      - run: docker push registry/app:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deployment/app app=registry/app:latest
```

---

## Conclusion

These guidelines provide a comprehensive framework for developing enterprise-level Next.js 15 applications using Explicit Architecture principles. Following these standards ensures maintainable, scalable, and testable codebases that can evolve with business requirements while maintaining architectural integrity.

Regular review and adaptation of these guidelines should be conducted as the project evolves and new requirements emerge. The architecture should serve the business needs while providing a solid foundation for long-term development and maintenance.
