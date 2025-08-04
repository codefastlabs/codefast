# Junie Development Guidelines

## Table of Contents

1. [Bounded Context Definitions](#bounded-context-definitions)
2. [Dependency Injection Patterns](#dependency-injection-patterns)
3. [Data Access Layer](#data-access-layer)
4. [Authentication & Authorization](#authentication--authorization)
5. [Testing Strategies](#testing-strategies)
6. [Performance Optimization](#performance-optimization)
7. [Security Hardening](#security-hardening)
8. [Deployment & Scalability](#deployment--scalability)

## Technology Stack

- **Framework**: Next.js 15 with App Router and Server Actions
- **UI Library**: React 19 with Server Components
- **Type Safety**: TypeScript with strict configuration
- **Dependency Injection**: Inversify v7
- **Validation**: Zod 4
- **Database**: Drizzle ORM
- **Caching**: Redis
- **Background Jobs**: BullMQ
- **Authentication**: Auth.js with Lucia patterns
- **Forms**: React Hook Form
- **Styling**: TailwindCSS
- **Notifications**: Sonner
- **Email**: React Email + Nodemailer

## File Naming Conventions

- Use kebab-case with dot-notation: `user-profile.service.ts`, `auth-middleware.controller.ts`
- Avoid "I" or "T" prefixes: Use `UserProfile` instead of `IUserProfile`
- Layer suffixes: `.service.ts`, `.repository.ts`, `.controller.ts`, `.middleware.ts`

## Bounded Context Definitions

### Core Bounded Contexts

#### 1. User Management Context
**Responsibility**: User lifecycle, profiles, preferences
**Boundaries**: 
- User registration and onboarding
- Profile management
- User preferences and settings
- Account deactivation/deletion

```typescript
// src/contexts/user-management/domain/user.entity.ts
export class User {
  constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private profile: UserProfile,
    private preferences: UserPreferences
  ) {}
}
```

#### 2. Authentication Context
**Responsibility**: Identity verification, session management
**Boundaries**:
- Login/logout processes
- Multi-factor authentication
- Session management
- Password reset flows

#### 3. Authorization Context
**Responsibility**: Access control, permissions, roles
**Boundaries**:
- Role-based access control (RBAC)
- Permission management
- Resource access validation
- Policy enforcement

#### 4. Content Management Context
**Responsibility**: Content creation, editing, publishing
**Boundaries**:
- Content lifecycle management
- Version control
- Publishing workflows
- Content metadata

#### 5. Notification Context
**Responsibility**: Message delivery, alerts, communications
**Boundaries**:
- Email notifications
- Push notifications
- In-app messaging
- Notification preferences

### Context Communication Patterns

```typescript
// Shared kernel for cross-context communication
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType: string;
}

export class UserRegisteredEvent implements DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly occurredOn: Date,
    public readonly userId: string,
    public readonly email: string
  ) {}
  
  readonly eventType = 'UserRegistered';
}
```

## Dependency Injection Patterns

### Inversify v7 Configuration

#### Container Setup

```typescript
// src/infrastructure/di/container.config.ts
import { Container } from 'inversify';
import { TYPES } from './types';
import { UserRepository } from '../contexts/user-management/infrastructure/user.repository';
import { UserService } from '../contexts/user-management/application/user.service';

export const container = new Container({
  defaultScope: 'Singleton',
  skipBaseClassChecks: true
});

// Bind repositories
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);

// Bind services
container.bind<UserService>(TYPES.UserService).to(UserService);

export { container };
```

#### Type Definitions

```typescript
// src/infrastructure/di/types.ts
export const TYPES = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  AuthRepository: Symbol.for('AuthRepository'),
  
  // Services
  UserService: Symbol.for('UserService'),
  AuthService: Symbol.for('AuthService'),
  
  // Infrastructure
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  RedisClient: Symbol.for('RedisClient'),
  EmailService: Symbol.for('EmailService'),
  
  // Event Bus
  EventBus: Symbol.for('EventBus'),
  CommandBus: Symbol.for('CommandBus'),
  QueryBus: Symbol.for('QueryBus')
} as const;
```

#### Service Implementation Pattern

```typescript
// src/contexts/user-management/application/user.service.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';
import { UserRepository } from '../infrastructure/user.repository';
import { EventBus } from '../../../shared/infrastructure/event-bus';

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  async createUser(userData: CreateUserData): Promise<User> {
    const user = User.create(userData);
    await this.userRepository.save(user);
    
    await this.eventBus.publish(
      new UserRegisteredEvent(
        crypto.randomUUID(),
        new Date(),
        user.id,
        user.email
      )
    );
    
    return user;
  }
}
```

#### Repository Pattern with Inversify

```typescript
// src/contexts/user-management/infrastructure/user.repository.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';
import { DatabaseConnection } from '../../../shared/infrastructure/database';

export interface UserRepositoryPort {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
}

@injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: DatabaseConnection
  ) {}

  async save(user: User): Promise<void> {
    // Drizzle ORM implementation
  }

  async findById(id: UserId): Promise<User | null> {
    // Drizzle ORM implementation
  }

  async findByEmail(email: Email): Promise<User | null> {
    // Drizzle ORM implementation
  }
}
```

#### Next.js Integration

```typescript
// src/app/api/users/route.ts
import { container } from '../../../infrastructure/di/container.config';
import { TYPES } from '../../../infrastructure/di/types';
import { UserService } from '../../../contexts/user-management/application/user.service';

export async function POST(request: Request) {
  const userService = container.get<UserService>(TYPES.UserService);
  
  try {
    const userData = await request.json();
    const user = await userService.createUser(userData);
    
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

#### Server Actions with DI

```typescript
// src/contexts/user-management/presentation/user.actions.ts
'use server';

import { container } from '../../../infrastructure/di/container.config';
import { TYPES } from '../../../infrastructure/di/types';
import { UserService } from '../application/user.service';
import { createUserSchema } from './user.schemas';

export async function createUserAction(formData: FormData) {
  const userService = container.get<UserService>(TYPES.UserService);
  
  const validatedData = createUserSchema.parse({
    email: formData.get('email'),
    name: formData.get('name')
  });
  
  try {
    const user = await userService.createUser(validatedData);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Data Access Layer

### Drizzle ORM Configuration

#### Database Schema Definition

```typescript
// src/shared/infrastructure/database/schema/users.schema.ts
import { pgTable, uuid, varchar, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false),
  profile: jsonb('profile').$type<UserProfile>(),
  preferences: jsonb('preferences').$type<UserPreferences>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type UserRecord = typeof usersTable.$inferSelect;
export type NewUserRecord = typeof usersTable.$inferInsert;
```

#### Database Connection Setup

```typescript
// src/shared/infrastructure/database/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { injectable } from 'inversify';

@injectable()
export class DatabaseConnection {
  private readonly db: ReturnType<typeof drizzle>;
  
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    const client = postgres(connectionString);
    this.db = drizzle(client);
  }
  
  get connection() {
    return this.db;
  }
  
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }
}
```

#### Repository Implementation with Drizzle

```typescript
// src/contexts/user-management/infrastructure/user.repository.ts
import { injectable, inject } from 'inversify';
import { eq } from 'drizzle-orm';
import { TYPES } from '../../../infrastructure/di/types';
import { DatabaseConnection } from '../../../shared/infrastructure/database/connection';
import { usersTable } from '../../../shared/infrastructure/database/schema/users.schema';
import { User } from '../domain/user.entity';
import { UserRepositoryPort } from '../domain/user.repository.port';

@injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @inject(TYPES.DatabaseConnection) private dbConnection: DatabaseConnection
  ) {}

  async save(user: User): Promise<void> {
    const db = this.dbConnection.connection;
    
    const userData = {
      id: user.id.value,
      email: user.email.value,
      name: user.profile.name,
      profile: user.profile.toJSON(),
      preferences: user.preferences.toJSON(),
      updatedAt: new Date()
    };

    await db.insert(usersTable)
      .values(userData)
      .onConflictDoUpdate({
        target: usersTable.id,
        set: userData
      });
  }

  async findById(id: UserId): Promise<User | null> {
    const db = this.dbConnection.connection;
    
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id.value))
      .limit(1);

    if (result.length === 0) return null;
    
    return this.toDomainEntity(result[0]);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const db = this.dbConnection.connection;
    
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email.value))
      .limit(1);

    if (result.length === 0) return null;
    
    return this.toDomainEntity(result[0]);
  }

  private toDomainEntity(record: UserRecord): User {
    return User.reconstitute(
      new UserId(record.id),
      new Email(record.email),
      UserProfile.fromJSON(record.profile),
      UserPreferences.fromJSON(record.preferences)
    );
  }
}
```

### Redis Caching Strategy

#### Cache Service Implementation

```typescript
// src/shared/infrastructure/cache/redis-cache.service.ts
import { injectable } from 'inversify';
import Redis from 'ioredis';

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

@injectable()
export class RedisCacheService implements CacheService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}
```

#### Cached Repository Pattern

```typescript
// src/contexts/user-management/infrastructure/cached-user.repository.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';
import { CacheService } from '../../../shared/infrastructure/cache/redis-cache.service';
import { UserRepository } from './user.repository';
import { User } from '../domain/user.entity';

@injectable()
export class CachedUserRepository implements UserRepositoryPort {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'user:';

  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.CacheService) private cacheService: CacheService
  ) {}

  async save(user: User): Promise<void> {
    await this.userRepository.save(user);
    
    // Update cache
    const cacheKey = `${this.CACHE_PREFIX}${user.id.value}`;
    await this.cacheService.set(cacheKey, user.toJSON(), this.CACHE_TTL);
    
    // Invalidate email-based cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}email:${user.email.value}`);
  }

  async findById(id: UserId): Promise<User | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id.value}`;
    
    // Try cache first
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return User.fromJSON(cached);
    }
    
    // Fallback to database
    const user = await this.userRepository.findById(id);
    if (user) {
      await this.cacheService.set(cacheKey, user.toJSON(), this.CACHE_TTL);
    }
    
    return user;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const cacheKey = `${this.CACHE_PREFIX}email:${email.value}`;
    
    // Try cache first
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return User.fromJSON(cached);
    }
    
    // Fallback to database
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      await this.cacheService.set(cacheKey, user.toJSON(), this.CACHE_TTL);
    }
    
    return user;
  }
}
```

### BullMQ Job Processing

#### Job Queue Setup

```typescript
// src/shared/infrastructure/jobs/job-queue.service.ts
import { Queue, Worker, Job } from 'bullmq';
import { injectable } from 'inversify';

export interface JobData {
  type: string;
  payload: any;
  userId?: string;
}

@injectable()
export class JobQueueService {
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();

  constructor() {
    this.setupQueues();
  }

  private setupQueues() {
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    };

    // Email queue
    const emailQueue = new Queue('email', { connection: redisConnection });
    this.queues.set('email', emailQueue);

    // Notification queue
    const notificationQueue = new Queue('notification', { connection: redisConnection });
    this.queues.set('notification', notificationQueue);

    // User processing queue
    const userQueue = new Queue('user-processing', { connection: redisConnection });
    this.queues.set('user-processing', userQueue);
  }

  async addJob(queueName: string, jobData: JobData, options?: any): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.add(jobData.type, jobData, {
      delay: options?.delay,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      ...options
    });
  }

  setupWorker(queueName: string, processor: (job: Job) => Promise<void>): void {
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    };

    const worker = new Worker(queueName, processor, {
      connection: redisConnection,
      concurrency: 5
    });

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });

    this.workers.set(queueName, worker);
  }
}
```

#### Email Job Handler

```typescript
// src/contexts/notification/infrastructure/email-job.handler.ts
import { injectable, inject } from 'inversify';
import { Job } from 'bullmq';
import { TYPES } from '../../../infrastructure/di/types';
import { EmailService } from './email.service';
import { JobQueueService } from '../../../shared/infrastructure/jobs/job-queue.service';

@injectable()
export class EmailJobHandler {
  constructor(
    @inject(TYPES.EmailService) private emailService: EmailService,
    @inject(TYPES.JobQueueService) private jobQueue: JobQueueService
  ) {
    this.setupWorker();
  }

  private setupWorker(): void {
    this.jobQueue.setupWorker('email', this.processEmailJob.bind(this));
  }

  private async processEmailJob(job: Job): Promise<void> {
    const { type, payload } = job.data;

    switch (type) {
      case 'welcome-email':
        await this.emailService.sendWelcomeEmail(payload.email, payload.name);
        break;
      case 'password-reset':
        await this.emailService.sendPasswordResetEmail(payload.email, payload.resetToken);
        break;
      case 'notification':
        await this.emailService.sendNotificationEmail(payload.email, payload.subject, payload.content);
        break;
      default:
        throw new Error(`Unknown email job type: ${type}`);
    }
  }
}
```

## Authentication & Authorization

### Auth.js Configuration with Lucia Patterns

#### Auth.js Setup

```typescript
// src/contexts/authentication/infrastructure/auth.config.ts
import { NextAuthConfig } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { container } from '../../../infrastructure/di/container.config';
import { TYPES } from '../../../infrastructure/di/types';
import { DatabaseConnection } from '../../../shared/infrastructure/database/connection';
import { AuthService } from '../application/auth.service';

const dbConnection = container.get<DatabaseConnection>(TYPES.DatabaseConnection);

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(dbConnection.connection),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const authService = container.get<AuthService>(TYPES.AuthService);
        const user = await authService.authenticateWithCredentials(
          credentials.email as string,
          credentials.password as string
        );
        
        return user ? {
          id: user.id,
          email: user.email,
          name: user.name
        } : null;
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.provider = token.provider as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  }
};
```

#### Session Management Service

```typescript
// src/contexts/authentication/application/session.service.ts
import { injectable, inject } from 'inversify';
import { cookies } from 'next/headers';
import { TYPES } from '../../../infrastructure/di/types';
import { CacheService } from '../../../shared/infrastructure/cache/redis-cache.service';
import { SessionRepository } from '../infrastructure/session.repository';

export interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  expiresAt: Date;
}

@injectable()
export class SessionService {
  private readonly SESSION_COOKIE_NAME = 'junie-session';
  private readonly SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(
    @inject(TYPES.SessionRepository) private sessionRepository: SessionRepository,
    @inject(TYPES.CacheService) private cacheService: CacheService
  ) {}

  async createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.SESSION_TTL * 1000);
    
    const sessionData: SessionData = {
      userId,
      email: '', // Will be populated from user data
      roles: [],
      permissions: [],
      createdAt: new Date(),
      expiresAt
    };

    // Store in database
    await this.sessionRepository.create({
      id: sessionId,
      userId,
      expiresAt,
      userAgent,
      ipAddress
    });

    // Cache session data
    await this.cacheService.set(
      `session:${sessionId}`,
      sessionData,
      this.SESSION_TTL
    );

    // Set HTTP-only cookie
    cookies().set(this.SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.SESSION_TTL,
      path: '/'
    });

    return sessionId;
  }

  async getSession(sessionId?: string): Promise<SessionData | null> {
    if (!sessionId) {
      const cookieStore = cookies();
      sessionId = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
    }

    if (!sessionId) return null;

    // Try cache first
    const cached = await this.cacheService.get<SessionData>(`session:${sessionId}`);
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return cached;
    }

    // Fallback to database
    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Rebuild session data and cache it
    const sessionData: SessionData = {
      userId: session.userId,
      email: session.user?.email || '',
      roles: session.user?.roles || [],
      permissions: session.user?.permissions || [],
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    };

    await this.cacheService.set(
      `session:${sessionId}`,
      sessionData,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    );

    return sessionData;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await Promise.all([
      this.sessionRepository.delete(sessionId),
      this.cacheService.delete(`session:${sessionId}`)
    ]);

    // Clear cookie
    cookies().delete(this.SESSION_COOKIE_NAME);
  }

  async refreshSession(sessionId: string): Promise<void> {
    const newExpiresAt = new Date(Date.now() + this.SESSION_TTL * 1000);
    
    await this.sessionRepository.updateExpiration(sessionId, newExpiresAt);
    
    // Update cache
    const sessionData = await this.getSession(sessionId);
    if (sessionData) {
      sessionData.expiresAt = newExpiresAt;
      await this.cacheService.set(
        `session:${sessionId}`,
        sessionData,
        this.SESSION_TTL
      );
    }
  }
}
```

#### Authentication Service

```typescript
// src/contexts/authentication/application/auth.service.ts
import { injectable, inject } from 'inversify';
import bcrypt from 'bcryptjs';
import { TYPES } from '../../../infrastructure/di/types';
import { UserRepository } from '../../user-management/infrastructure/user.repository';
import { SessionService } from './session.service';
import { EventBus } from '../../../shared/infrastructure/event-bus';
import { UserAuthenticatedEvent } from '../domain/events/user-authenticated.event';

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  async authenticateWithCredentials(email: string, password: string): Promise<any | null> {
    const user = await this.userRepository.findByEmail(new Email(email));
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!isValidPassword) return null;

    // Create session
    const sessionId = await this.sessionService.createSession(user.id.value);

    // Publish authentication event
    await this.eventBus.publish(
      new UserAuthenticatedEvent(
        crypto.randomUUID(),
        new Date(),
        user.id.value,
        'credentials'
      )
    );

    return {
      id: user.id.value,
      email: user.email.value,
      name: user.profile.name,
      sessionId
    };
  }

  async register(userData: RegisterUserData): Promise<any> {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create user
    const user = User.create({
      ...userData,
      hashedPassword
    });

    await this.userRepository.save(user);

    // Create session
    const sessionId = await this.sessionService.createSession(user.id.value);

    return {
      id: user.id.value,
      email: user.email.value,
      name: user.profile.name,
      sessionId
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.invalidateSession(sessionId);
  }
}
```

#### Authorization Middleware

```typescript
// src/contexts/authorization/infrastructure/auth.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../../infrastructure/di/container.config';
import { TYPES } from '../../../infrastructure/di/types';
import { SessionService } from '../../authentication/application/session.service';
import { AuthorizationService } from '../application/authorization.service';

export interface AuthMiddlewareOptions {
  requiredPermissions?: string[];
  requiredRoles?: string[];
  allowAnonymous?: boolean;
}

export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  return async function authMiddleware(request: NextRequest) {
    const sessionService = container.get<SessionService>(TYPES.SessionService);
    const authzService = container.get<AuthorizationService>(TYPES.AuthorizationService);

    // Get session
    const sessionId = request.cookies.get('junie-session')?.value;
    const session = await sessionService.getSession(sessionId);

    // Check if authentication is required
    if (!session && !options.allowAnonymous) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check permissions and roles
    if (session) {
      const hasPermission = await authzService.hasPermissions(
        session.userId,
        options.requiredPermissions || []
      );

      const hasRole = await authzService.hasRoles(
        session.userId,
        options.requiredRoles || []
      );

      if (!hasPermission || !hasRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Add user context to request headers
    const response = NextResponse.next();
    if (session) {
      response.headers.set('x-user-id', session.userId);
      response.headers.set('x-user-email', session.email);
      response.headers.set('x-user-roles', JSON.stringify(session.roles));
    }

    return response;
  };
}
```

#### WebAuthn Implementation

```typescript
// src/contexts/authentication/infrastructure/webauthn.service.ts
import { injectable, inject } from 'inversify';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { TYPES } from '../../../infrastructure/di/types';
import { CacheService } from '../../../shared/infrastructure/cache/redis-cache.service';
import { WebAuthnCredentialRepository } from './webauthn-credential.repository';

@injectable()
export class WebAuthnService {
  private readonly RP_NAME = 'Junie App';
  private readonly RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
  private readonly ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

  constructor(
    @inject(TYPES.CacheService) private cacheService: CacheService,
    @inject(TYPES.WebAuthnCredentialRepository) 
    private credentialRepository: WebAuthnCredentialRepository
  ) {}

  async generateRegistrationOptions(userId: string): Promise<any> {
    const userCredentials = await this.credentialRepository.findByUserId(userId);
    
    const options = await generateRegistrationOptions({
      rpName: this.RP_NAME,
      rpID: this.RP_ID,
      userID: userId,
      userName: `user-${userId}`,
      userDisplayName: `User ${userId}`,
      attestationType: 'none',
      excludeCredentials: userCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports as any[]
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    // Cache challenge
    await this.cacheService.set(
      `webauthn:challenge:${userId}`,
      options.challenge,
      300 // 5 minutes
    );

    return options;
  }

  async verifyRegistration(userId: string, response: any): Promise<boolean> {
    const expectedChallenge = await this.cacheService.get<string>(
      `webauthn:challenge:${userId}`
    );

    if (!expectedChallenge) {
      throw new Error('Challenge not found or expired');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.ORIGIN,
      expectedRPID: this.RP_ID
    });

    if (verification.verified && verification.registrationInfo) {
      // Save credential
      await this.credentialRepository.save({
        userId,
        credentialId: verification.registrationInfo.credentialID,
        publicKey: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter,
        transports: response.response.transports || []
      });

      // Clear challenge
      await this.cacheService.delete(`webauthn:challenge:${userId}`);
    }

    return verification.verified;
  }

  async generateAuthenticationOptions(userId?: string): Promise<any> {
    const allowCredentials = userId 
      ? await this.credentialRepository.findByUserId(userId)
      : [];

    const options = await generateAuthenticationOptions({
      rpID: this.RP_ID,
      allowCredentials: allowCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports as any[]
      })),
      userVerification: 'preferred'
    });

    // Cache challenge
    const challengeKey = userId 
      ? `webauthn:auth:${userId}` 
      : `webauthn:auth:${options.challenge}`;
      
    await this.cacheService.set(challengeKey, options.challenge, 300);

    return options;
  }

  async verifyAuthentication(userId: string, response: any): Promise<boolean> {
    const expectedChallenge = await this.cacheService.get<string>(
      `webauthn:auth:${userId}`
    );

    if (!expectedChallenge) {
      throw new Error('Challenge not found or expired');
    }

    const credential = await this.credentialRepository.findByCredentialId(
      response.id
    );

    if (!credential) {
      throw new Error('Credential not found');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.ORIGIN,
      expectedRPID: this.RP_ID,
      authenticator: {
        credentialID: credential.credentialId,
        credentialPublicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports as any[]
      }
    });

    if (verification.verified) {
      // Update counter
      await this.credentialRepository.updateCounter(
        credential.id,
        verification.authenticationInfo.newCounter
      );

      // Clear challenge
      await this.cacheService.delete(`webauthn:auth:${userId}`);
    }

    return verification.verified;
  }
}
```

## Testing Strategies

### Test-Driven Development (TDD) Methodology

#### TDD Cycle Implementation

```typescript
// Example: User registration feature using TDD

// 1. RED: Write failing test first
// src/contexts/user-management/application/__tests__/user.service.test.ts
import { UserService } from '../user.service';
import { UserRepository } from '../../infrastructure/user.repository';
import { EventBus } from '../../../../shared/infrastructure/event-bus';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn()
    } as any;
    
    mockEventBus = {
      publish: jest.fn()
    } as any;

    userService = new UserService(mockUserRepository, mockEventBus);
  });

  describe('createUser', () => {
    it('should create a new user and publish UserRegisteredEvent', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securePassword123'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email.value).toBe(userData.email);
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User));
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'UserRegistered'
        })
      );
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123'
      };

      const existingUser = User.create(userData);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('User already exists');
    });
  });
});
```

#### Domain Layer Testing

```typescript
// src/contexts/user-management/domain/__tests__/user.entity.test.ts
import { User } from '../user.entity';
import { Email } from '../value-objects/email';
import { UserId } from '../value-objects/user-id';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securePassword123'
      };

      // Act
      const user = User.create(userData);

      // Assert
      expect(user.id).toBeInstanceOf(UserId);
      expect(user.email).toBeInstanceOf(Email);
      expect(user.email.value).toBe(userData.email);
      expect(user.profile.name).toBe(userData.name);
    });

    it('should throw error for invalid email', () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'securePassword123'
      };

      // Act & Assert
      expect(() => User.create(userData))
        .toThrow('Invalid email format');
    });
  });

  describe('changeEmail', () => {
    it('should change user email and raise domain event', () => {
      // Arrange
      const user = User.create({
        email: 'old@example.com',
        name: 'Test User',
        password: 'password123'
      });
      const newEmail = new Email('new@example.com');

      // Act
      user.changeEmail(newEmail);

      // Assert
      expect(user.email.value).toBe('new@example.com');
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0]).toBeInstanceOf(UserEmailChangedEvent);
    });
  });
});
```

#### Application Layer Testing

```typescript
// src/contexts/user-management/application/__tests__/create-user.command-handler.test.ts
import { CreateUserCommandHandler } from '../create-user.command-handler';
import { CreateUserCommand } from '../create-user.command';
import { UserService } from '../user.service';

describe('CreateUserCommandHandler', () => {
  let handler: CreateUserCommandHandler;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn()
    } as any;

    handler = new CreateUserCommandHandler(mockUserService);
  });

  it('should handle CreateUserCommand successfully', async () => {
    // Arrange
    const command = new CreateUserCommand(
      'test@example.com',
      'Test User',
      'password123'
    );

    const expectedUser = User.create({
      email: command.email,
      name: command.name,
      password: command.password
    });

    mockUserService.createUser.mockResolvedValue(expectedUser);

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(result).toBe(expectedUser);
    expect(mockUserService.createUser).toHaveBeenCalledWith({
      email: command.email,
      name: command.name,
      password: command.password
    });
  });
});
```

#### Infrastructure Layer Testing

```typescript
// src/contexts/user-management/infrastructure/__tests__/user.repository.test.ts
import { UserRepository } from '../user.repository';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/connection';
import { User } from '../../domain/user.entity';
import { UserId } from '../../domain/value-objects/user-id';
import { Email } from '../../domain/value-objects/email';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockDbConnection: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDbConnection = {
      connection: {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            onConflictDoUpdate: jest.fn().mockResolvedValue(undefined)
          })
        }),
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      }
    } as any;

    repository = new UserRepository(mockDbConnection);
  });

  describe('save', () => {
    it('should save user to database', async () => {
      // Arrange
      const user = User.create({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      });

      // Act
      await repository.save(user);

      // Assert
      expect(mockDbConnection.connection.insert).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = new UserId('123');
      const mockUserRecord = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        profile: { name: 'Test User' },
        preferences: {}
      };

      mockDbConnection.connection.select().from().where().limit
        .mockResolvedValue([mockUserRecord]);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeInstanceOf(User);
      expect(result?.id.value).toBe('123');
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = new UserId('nonexistent');
      mockDbConnection.connection.select().from().where().limit
        .mockResolvedValue([]);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### Integration Testing

#### API Route Testing

```typescript
// src/app/api/users/__tests__/route.test.ts
import { POST } from '../route';
import { container } from '../../../../infrastructure/di/container.config';
import { TYPES } from '../../../../infrastructure/di/types';
import { UserService } from '../../../../contexts/user-management/application/user.service';

// Mock the container
jest.mock('../../../../infrastructure/di/container.config');
const mockContainer = container as jest.Mocked<typeof container>;

describe('/api/users', () => {
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn()
    } as any;

    mockContainer.get.mockImplementation((type) => {
      if (type === TYPES.UserService) return mockUserService;
      throw new Error(`Unknown type: ${String(type)}`);
    });
  });

  describe('POST', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      const mockUser = User.create(userData);
      mockUserService.createUser.mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(result.user).toBeDefined();
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        name: '',
        password: '123'
      };

      const request = new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });
  });
});
```

#### Database Integration Testing

```typescript
// src/contexts/user-management/infrastructure/__tests__/user.repository.integration.test.ts
import { UserRepository } from '../user.repository';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/connection';
import { User } from '../../domain/user.entity';
import { testDb } from '../../../../shared/testing/test-database';

describe('UserRepository Integration', () => {
  let repository: UserRepository;
  let dbConnection: DatabaseConnection;

  beforeAll(async () => {
    dbConnection = await testDb.setup();
    repository = new UserRepository(dbConnection);
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.cleanup();
  });

  it('should save and retrieve user', async () => {
    // Arrange
    const user = User.create({
      email: 'integration@example.com',
      name: 'Integration Test User',
      password: 'password123'
    });

    // Act
    await repository.save(user);
    const retrieved = await repository.findById(user.id);

    // Assert
    expect(retrieved).toBeDefined();
    expect(retrieved?.email.value).toBe(user.email.value);
    expect(retrieved?.profile.name).toBe(user.profile.name);
  });
});
```

### End-to-End Testing

#### Page Testing with Playwright

```typescript
// tests/e2e/user-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should register new user successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register');

    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'e2e@example.com');
    await page.fill('[data-testid="name-input"]', 'E2E Test User');
    await page.fill('[data-testid="password-input"]', 'securePassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'securePassword123');

    // Submit form
    await page.click('[data-testid="register-button"]');

    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]'))
      .toContainText('Welcome, E2E Test User');
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/auth/register');

    // Submit empty form
    await page.click('[data-testid="register-button"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('Email is required');
    await expect(page.locator('[data-testid="name-error"]'))
      .toContainText('Name is required');
    await expect(page.locator('[data-testid="password-error"]'))
      .toContainText('Password is required');
  });
});
```

### Test Configuration

#### Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/shared/testing/jest.setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

export default config;
```

#### Test Database Setup

```typescript
// src/shared/testing/test-database.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

class TestDatabase {
  private client: postgres.Sql | null = null;
  private db: ReturnType<typeof drizzle> | null = null;

  async setup() {
    const connectionString = process.env.TEST_DATABASE_URL || 
      'postgresql://test:test@localhost:5432/junie_test';
    
    this.client = postgres(connectionString);
    this.db = drizzle(this.client);
    
    // Run migrations
    await migrate(this.db, { migrationsFolder: './drizzle/migrations' });
    
    return {
      connection: this.db,
      transaction: this.db.transaction.bind(this.db)
    };
  }

  async cleanup() {
    if (!this.db) return;
    
    // Truncate all tables
    await this.db.execute(sql`
      TRUNCATE TABLE users, sessions, webauthn_credentials 
      RESTART IDENTITY CASCADE
    `);
  }

  async teardown() {
    if (this.client) {
      await this.client.end();
    }
  }
}

export const testDb = new TestDatabase();
```

## Performance Optimization

### Performance Monitoring

#### Application Performance Monitoring (APM)

```typescript
// src/shared/infrastructure/monitoring/performance.service.ts
import { injectable } from 'inversify';

export interface PerformanceMetrics {
  requestDuration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: Date;
  endpoint?: string;
  userId?: string;
}

@injectable()
export class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000;

  startTimer(label: string): () => number {
    const start = process.hrtime.bigint();
    
    return () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
      
      console.log(`${label}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  recordMetrics(endpoint: string, duration: number, userId?: string): void {
    const metrics: PerformanceMetrics = {
      requestDuration: duration,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date(),
      endpoint,
      userId
    };

    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log performance warnings
    if (duration > 1000) { // > 1 second
      console.warn(`Slow request detected: ${endpoint} took ${duration}ms`);
    }

    if (metrics.memoryUsage.heapUsed > 100 * 1024 * 1024) { // > 100MB
      console.warn(`High memory usage: ${metrics.memoryUsage.heapUsed / 1024 / 1024}MB`);
    }
  }

  getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, m) => sum + m.requestDuration, 0);
    return total / relevantMetrics.length;
  }

  getMetricsSummary(): any {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      slowRequests: recentMetrics.filter(m => m.requestDuration > 1000).length,
      memoryUsage: recentMetrics.length > 0 
        ? recentMetrics[recentMetrics.length - 1].memoryUsage 
        : null
    };
  }
}
```

#### Performance Middleware

```typescript
// src/shared/infrastructure/middleware/performance.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../../infrastructure/di/container.config';
import { TYPES } from '../../../infrastructure/di/types';
import { PerformanceService } from '../monitoring/performance.service';

export function performanceMiddleware(request: NextRequest) {
  const performanceService = container.get<PerformanceService>(TYPES.PerformanceService);
  const timer = performanceService.startTimer(`${request.method} ${request.nextUrl.pathname}`);
  
  const response = NextResponse.next();
  
  // Add performance headers
  response.headers.set('X-Response-Time', Date.now().toString());
  
  // Record metrics after response
  const duration = timer();
  const userId = request.headers.get('x-user-id') || undefined;
  
  performanceService.recordMetrics(
    `${request.method} ${request.nextUrl.pathname}`,
    duration,
    userId
  );
  
  return response;
}
```

### Database Optimization

#### Query Optimization with Drizzle

```typescript
// src/shared/infrastructure/database/query-optimizer.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';
import { DatabaseConnection } from './connection';
import { CacheService } from '../cache/redis-cache.service';

@injectable()
export class QueryOptimizer {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: DatabaseConnection,
    @inject(TYPES.CacheService) private cache: CacheService
  ) {}

  async executeWithCache<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try cache first
    const cached = await this.cache.get<T>(queryKey);
    if (cached) {
      return cached;
    }

    // Execute query
    const result = await queryFn();
    
    // Cache result
    await this.cache.set(queryKey, result, ttl);
    
    return result;
  }

  async batchQuery<T, K>(
    items: K[],
    queryFn: (batch: K[]) => Promise<T[]>,
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await queryFn(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  async executeInTransaction<T>(
    operations: ((tx: any) => Promise<T>)[]
  ): Promise<T[]> {
    return this.db.transaction(async (tx) => {
      const results: T[] = [];
      
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      
      return results;
    });
  }
}
```

#### Connection Pooling

```typescript
// src/shared/infrastructure/database/connection-pool.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { injectable } from 'inversify';

@injectable()
export class DatabaseConnectionPool {
  private pools: Map<string, ReturnType<typeof drizzle>> = new Map();
  
  getConnection(connectionString: string, options?: postgres.Options): ReturnType<typeof drizzle> {
    if (!this.pools.has(connectionString)) {
      const client = postgres(connectionString, {
        max: 20, // Maximum connections
        idle_timeout: 20, // Close idle connections after 20 seconds
        connect_timeout: 10, // Connection timeout
        prepare: false, // Disable prepared statements for better performance in some cases
        ...options
      });
      
      const db = drizzle(client);
      this.pools.set(connectionString, db);
    }
    
    return this.pools.get(connectionString)!;
  }

  async closeAll(): Promise<void> {
    for (const [connectionString, db] of this.pools) {
      // Close the underlying postgres connection
      await (db as any).client?.end();
    }
    this.pools.clear();
  }
}
```

### Caching Strategies

#### Multi-Level Caching

```typescript
// src/shared/infrastructure/cache/multi-level-cache.service.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';
import { RedisCacheService } from './redis-cache.service';

interface CacheLevel {
  name: string;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

@injectable()
export class MultiLevelCacheService {
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private readonly MEMORY_CACHE_SIZE = 1000;

  constructor(
    @inject(TYPES.RedisCacheService) private redisCache: RedisCacheService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Level 2: Redis cache
    const redisResult = await this.redisCache.get<T>(key);
    if (redisResult !== null) {
      // Populate memory cache
      this.setInMemory(key, redisResult, 60); // 1 minute in memory
      return redisResult;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Set in both levels
    await Promise.all([
      this.redisCache.set(key, value, ttl),
      this.setInMemoryAsync(key, value, Math.min(ttl, 300)) // Max 5 minutes in memory
    ]);
  }

  async delete(key: string): Promise<void> {
    await Promise.all([
      this.redisCache.delete(key),
      this.deleteFromMemory(key)
    ]);
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value;
  }

  private setInMemory(key: string, value: any, ttlSeconds: number): void {
    // Implement LRU eviction
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  private async setInMemoryAsync(key: string, value: any, ttlSeconds: number): Promise<void> {
    this.setInMemory(key, value, ttlSeconds);
  }

  private async deleteFromMemory(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }
}
```

### Next.js Optimization

#### Server Component Optimization

```typescript
// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { UserDashboard } from './components/user-dashboard';
import { RecentActivity } from './components/recent-activity';
import { DashboardSkeleton } from './components/dashboard-skeleton';

// Server Component - runs on server, no JavaScript sent to client
export default async function DashboardPage() {
  return (
    <div className="dashboard-layout">
      <Suspense fallback={<DashboardSkeleton />}>
        <UserDashboard />
      </Suspense>
      
      <Suspense fallback={<div>Loading activity...</div>}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

// Separate data fetching for better performance
async function UserDashboard() {
  // This runs on the server
  const userData = await getUserData();
  
  return (
    <div>
      <h1>Welcome, {userData.name}</h1>
      {/* Render user data */}
    </div>
  );
}
```

#### Image Optimization

```typescript
// src/components/optimized-image.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85} // Optimize quality vs file size
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        onLoad={() => setIsLoading(false)}
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
    </div>
  );
}
```

### API Optimization

#### Response Compression and Caching

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../../infrastructure/di/container.config';
import { TYPES } from '../../../infrastructure/di/types';
import { UserService } from '../../../contexts/user-management/application/user.service';
import { CacheService } from '../../../shared/infrastructure/cache/redis-cache.service';

export async function GET(request: NextRequest) {
  const cacheService = container.get<CacheService>(TYPES.CacheService);
  const userService = container.get<UserService>(TYPES.UserService);
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  // Create cache key
  const cacheKey = `users:page:${page}:limit:${limit}`;
  
  // Try cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Cache': 'HIT'
      }
    });
  }
  
  // Fetch from service
  const users = await userService.getUsers({ page, limit });
  
  // Cache result
  await cacheService.set(cacheKey, users, 300);
  
  return NextResponse.json(users, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'X-Cache': 'MISS'
    }
  });
}
```

#### Request Batching

```typescript
// src/shared/infrastructure/api/batch-processor.ts
import { injectable } from 'inversify';

interface BatchRequest {
  id: string;
  operation: string;
  params: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

@injectable()
export class BatchProcessor {
  private batches = new Map<string, BatchRequest[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 50; // 50ms

  async addToBatch<T>(operation: string, params: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: crypto.randomUUID(),
        operation,
        params,
        resolve,
        reject
      };

      if (!this.batches.has(operation)) {
        this.batches.set(operation, []);
      }

      const batch = this.batches.get(operation)!;
      batch.push(request);

      // Process batch if it reaches the size limit
      if (batch.length >= this.BATCH_SIZE) {
        this.processBatch(operation);
      } else {
        // Set timer to process batch after timeout
        if (!this.timers.has(operation)) {
          const timer = setTimeout(() => {
            this.processBatch(operation);
          }, this.BATCH_TIMEOUT);
          
          this.timers.set(operation, timer);
        }
      }
    });
  }

  private async processBatch(operation: string): Promise<void> {
    const batch = this.batches.get(operation);
    if (!batch || batch.length === 0) return;

    // Clear timer and batch
    const timer = this.timers.get(operation);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(operation);
    }
    this.batches.set(operation, []);

    try {
      // Process all requests in the batch
      const results = await this.executeBatch(operation, batch);
      
      // Resolve individual requests
      batch.forEach((request, index) => {
        request.resolve(results[index]);
      });
    } catch (error) {
      // Reject all requests in the batch
      batch.forEach(request => {
        request.reject(error);
      });
    }
  }

  private async executeBatch(operation: string, requests: BatchRequest[]): Promise<any[]> {
    // Implement batch execution logic based on operation type
    switch (operation) {
      case 'getUsersByIds':
        return this.batchGetUsers(requests.map(r => r.params.id));
      case 'updateUsers':
        return this.batchUpdateUsers(requests.map(r => r.params));
      default:
        throw new Error(`Unknown batch operation: ${operation}`);
    }
  }

  private async batchGetUsers(userIds: string[]): Promise<any[]> {
    // Implement batch user retrieval
    // This would typically use a single database query with IN clause
    return [];
  }

  private async batchUpdateUsers(updates: any[]): Promise<any[]> {
    // Implement batch user updates
    // This would typically use a single database transaction
    return [];
  }
}
```

## Security Hardening

### Input Validation and Sanitization

#### Zod Schema Validation

```typescript
// src/shared/validation/schemas/user.schemas.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(email => email.toLowerCase().trim()),
  
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
    .transform(name => name.trim()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character')
});

export const updateUserSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
    .transform(name => name.trim())
    .optional(),
  
  bio: z.string()
    .max(500, 'Bio too long')
    .transform(bio => bio.trim())
    .optional()
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
```

#### Request Validation Middleware

```typescript
// src/shared/infrastructure/middleware/validation.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return async function validationMiddleware(
    request: NextRequest,
    handler: (validatedData: T) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      let data: any;
      
      if (request.method === 'GET') {
        // Validate query parameters
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        data = schema.parse(searchParams);
      } else {
        // Validate request body
        const body = await request.json();
        data = schema.parse(body);
      }
      
      return await handler(data);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
  };
}
```

### SQL Injection Prevention

#### Parameterized Queries with Drizzle

```typescript
// src/contexts/user-management/infrastructure/secure-user.repository.ts
import { injectable, inject } from 'inversify';
import { eq, and, like, sql } from 'drizzle-orm';
import { TYPES } from '../../../infrastructure/di/types';
import { DatabaseConnection } from '../../../shared/infrastructure/database/connection';
import { usersTable } from '../../../shared/infrastructure/database/schema/users.schema';

@injectable()
export class SecureUserRepository {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: DatabaseConnection
  ) {}

  async searchUsers(query: string, limit: number = 10): Promise<any[]> {
    // Safe parameterized query - Drizzle handles escaping
    const sanitizedQuery = `%${query.replace(/[%_]/g, '\\$&')}%`;
    
    return this.db.connection
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        createdAt: usersTable.createdAt
      })
      .from(usersTable)
      .where(
        and(
          like(usersTable.name, sanitizedQuery),
          eq(usersTable.emailVerified, true)
        )
      )
      .limit(limit);
  }

  async getUserStats(userId: string): Promise<any> {
    // Use sql template for complex queries while maintaining safety
    const result = await this.db.connection.execute(
      sql`
        SELECT 
          COUNT(*) as total_posts,
          AVG(rating) as avg_rating,
          MAX(created_at) as last_activity
        FROM posts 
        WHERE user_id = ${userId}
        AND deleted_at IS NULL
      `
    );
    
    return result.rows[0];
  }
}
```

### Cross-Site Scripting (XSS) Prevention

#### Content Security Policy

```typescript
// src/shared/infrastructure/security/csp.middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function cspMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com https://api.google.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
```

#### HTML Sanitization

```typescript
// src/shared/infrastructure/security/sanitizer.service.ts
import { injectable } from 'inversify';
import DOMPurify from 'isomorphic-dompurify';

@injectable()
export class SanitizerService {
  sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  }

  sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return parsed.toString();
    } catch {
      return '';
    }
  }
}
```

### Authentication Security

#### Rate Limiting

```typescript
// src/shared/infrastructure/security/rate-limiter.service.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';
import { CacheService } from '../cache/redis-cache.service';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
}

@injectable()
export class RateLimiterService {
  constructor(
    @inject(TYPES.CacheService) private cache: CacheService
  ) {}

  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = config.keyGenerator 
      ? config.keyGenerator(identifier)
      : `rate_limit:${identifier}`;
    
    const window = Math.floor(Date.now() / config.windowMs);
    const windowKey = `${key}:${window}`;
    
    const current = await this.cache.get<number>(windowKey) || 0;
    
    if (current >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: (window + 1) * config.windowMs
      };
    }
    
    // Increment counter
    await this.cache.set(
      windowKey,
      current + 1,
      Math.ceil(config.windowMs / 1000)
    );
    
    return {
      allowed: true,
      remaining: config.maxRequests - current - 1,
      resetTime: (window + 1) * config.windowMs
    };
  }

  async createRateLimitMiddleware(config: RateLimitConfig) {
    return async (request: Request, identifier: string) => {
      const result = await this.checkRateLimit(identifier, config);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Too many requests',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString()
            }
          }
        );
      }
      
      return null; // Continue processing
    };
  }
}
```

#### Secure Password Handling

```typescript
// src/contexts/authentication/infrastructure/password.service.ts
import { injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

@injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 12;
  private readonly PEPPER = process.env.PASSWORD_PEPPER || '';

  async hashPassword(password: string): Promise<string> {
    // Add pepper for additional security
    const pepperedPassword = password + this.PEPPER;
    return bcrypt.hash(pepperedPassword, this.SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const pepperedPassword = password + this.PEPPER;
    return bcrypt.compare(pepperedPassword, hash);
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateResetToken(): { token: string; expires: Date } {
    const token = this.generateSecureToken(32);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    return { token, expires };
  }

  isPasswordCompromised(password: string): boolean {
    // Check against common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    if (this.isPasswordCompromised(password)) {
      score = 0;
      feedback.push('This password is commonly used and not secure');
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }
}
```

### Data Encryption

#### Encryption Service

```typescript
// src/shared/infrastructure/security/encryption.service.ts
import { injectable } from 'inversify';
import crypto from 'crypto';

@injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly key: Buffer;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    this.key = crypto.scryptSync(keyString, 'salt', this.keyLength);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('junie-app', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();
    
    // Combine iv, tag, and encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('junie-app', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hashSensitiveData(data: string): string {
    return crypto
      .createHmac('sha256', this.key)
      .update(data)
      .digest('hex');
  }

  generateSecureId(): string {
    return crypto.randomUUID();
  }
}
```

### API Security

#### CORS Configuration

```typescript
// src/shared/infrastructure/security/cors.middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin'
];

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = NextResponse.next();

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : '',
        'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
        'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
        'Access-Control-Max-Age': '86400', // 24 hours
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }

  // Set CORS headers for actual requests
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}
```

### Security Monitoring

#### Security Event Logger

```typescript
// src/shared/infrastructure/security/security-logger.service.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';

export enum SecurityEventType {
  FAILED_LOGIN = 'FAILED_LOGIN',
  SUCCESSFUL_LOGIN = 'SUCCESSFUL_LOGIN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT'
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@injectable()
export class SecurityLoggerService {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 10000;

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console for immediate visibility
    console.warn('Security Event:', JSON.stringify(securityEvent, null, 2));

    // Send alerts for critical events
    if (event.severity === 'critical') {
      this.sendSecurityAlert(securityEvent);
    }
  }

  getSecurityEvents(filters?: {
    type?: SecurityEventType;
    userId?: string;
    severity?: string;
    since?: Date;
  }): SecurityEvent[] {
    let filteredEvents = this.events;

    if (filters) {
      if (filters.type) {
        filteredEvents = filteredEvents.filter(e => e.type === filters.type);
      }
      if (filters.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
      }
      if (filters.severity) {
        filteredEvents = filteredEvents.filter(e => e.severity === filters.severity);
      }
      if (filters.since) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.since!);
      }
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implement alerting mechanism (email, Slack, etc.)
    console.error('CRITICAL SECURITY EVENT:', event);
    
    // In production, you would send this to your monitoring system
    // await this.notificationService.sendSecurityAlert(event);
  }
}
```

## Deployment & Scalability

### Container Configuration

#### Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/junie_dev
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: junie_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### Infrastructure as Code

#### Terraform Configuration

```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}
```

### Kubernetes Deployment

#### Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: junie-app

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: junie-config
  namespace: junie-app
data:
  NODE_ENV: "production"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: junie-secrets
  namespace: junie-app
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  ENCRYPTION_KEY: <base64-encoded-encryption-key>
  PASSWORD_PEPPER: <base64-encoded-pepper>

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: junie-app
  namespace: junie-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: junie-app
  template:
    metadata:
      labels:
        app: junie-app
    spec:
      containers:
      - name: junie-app
        image: junie-app:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: junie-config
        - secretRef:
            name: junie-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: junie-service
  namespace: junie-app
spec:
  selector:
    app: junie-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: junie-ingress
  namespace: junie-app
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: junie-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: junie-service
            port:
              number: 80

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: junie-hpa
  namespace: junie-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: junie-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: junie_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Run type checking
      run: pnpm type-check
    
    - name: Run linting
      run: pnpm lint
    
    - name: Run tests
      run: pnpm test:coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/junie_test
        REDIS_HOST: localhost
        REDIS_PORT: 6379
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster junie-cluster \
          --service junie-service \
          --force-new-deployment
```

### Monitoring and Observability

#### Health Check Endpoints

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { container } from '../../../infrastructure/di/container.config';
import { TYPES } from '../../../infrastructure/di/types';
import { DatabaseConnection } from '../../../shared/infrastructure/database/connection';
import { CacheService } from '../../../shared/infrastructure/cache/redis-cache.service';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown'
    }
  };

  try {
    // Database health check
    const db = container.get<DatabaseConnection>(TYPES.DatabaseConnection);
    await db.connection.execute('SELECT 1');
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'unhealthy';
  }

  try {
    // Redis health check
    const cache = container.get<CacheService>(TYPES.CacheService);
    await cache.set('health-check', 'ok', 10);
    const result = await cache.get('health-check');
    checks.checks.redis = result === 'ok' ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.checks.redis = 'unhealthy';
    checks.status = 'unhealthy';
  }

  // Memory health check
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
  checks.checks.memory = memoryUsageMB < 500 ? 'healthy' : 'warning';

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

#### Metrics Collection

```typescript
// src/shared/infrastructure/monitoring/metrics.service.ts
import { injectable } from 'inversify';

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

@injectable()
export class MetricsService {
  private metrics: Metric[] = [];
  private readonly MAX_METRICS = 10000;

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // In production, send to monitoring service (Prometheus, DataDog, etc.)
    this.sendToMonitoringService(metric);
  }

  increment(name: string, tags?: Record<string, string>): void {
    this.recordMetric(name, 1, tags);
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, tags);
  }

  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric(`${name}.duration`, duration, tags);
  }

  getMetrics(name?: string, since?: Date): Metric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === name);
    }

    if (since) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= since);
    }

    return filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private sendToMonitoringService(metric: Metric): void {
    // Implementation depends on your monitoring service
    // Example: Prometheus, DataDog, CloudWatch, etc.
    console.log('Metric:', JSON.stringify(metric));
  }
}
```

### Scalability Patterns

#### Database Scaling

```typescript
// src/shared/infrastructure/database/read-replica.service.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';
import { DatabaseConnectionPool } from './connection-pool';

@injectable()
export class ReadReplicaService {
  private readonly writeConnection: any;
  private readonly readConnections: any[];

  constructor(
    @inject(TYPES.DatabaseConnectionPool) private connectionPool: DatabaseConnectionPool
  ) {
    // Primary database for writes
    this.writeConnection = this.connectionPool.getConnection(
      process.env.DATABASE_WRITE_URL!
    );

    // Read replicas for read operations
    this.readConnections = [
      this.connectionPool.getConnection(process.env.DATABASE_READ_URL_1!),
      this.connectionPool.getConnection(process.env.DATABASE_READ_URL_2!),
      this.connectionPool.getConnection(process.env.DATABASE_READ_URL_3!)
    ].filter(Boolean);
  }

  getWriteConnection() {
    return this.writeConnection;
  }

  getReadConnection() {
    // Simple round-robin load balancing
    const index = Math.floor(Math.random() * this.readConnections.length);
    return this.readConnections[index] || this.writeConnection;
  }

  async executeWrite<T>(operation: (db: any) => Promise<T>): Promise<T> {
    return operation(this.writeConnection);
  }

  async executeRead<T>(operation: (db: any) => Promise<T>): Promise<T> {
    return operation(this.getReadConnection());
  }
}
```

#### Caching Strategy for Scale

```typescript
// src/shared/infrastructure/cache/distributed-cache.service.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/di/types';

@injectable()
export class DistributedCacheService {
  private readonly cacheNodes: any[];

  constructor() {
    // Multiple Redis instances for horizontal scaling
    this.cacheNodes = [
      process.env.REDIS_NODE_1_URL,
      process.env.REDIS_NODE_2_URL,
      process.env.REDIS_NODE_3_URL
    ].filter(Boolean).map(url => {
      // Initialize Redis connections
      return new Redis(url);
    });
  }

  private getNodeForKey(key: string): any {
    // Consistent hashing to distribute keys across nodes
    const hash = this.hashKey(key);
    const nodeIndex = hash % this.cacheNodes.length;
    return this.cacheNodes[nodeIndex];
  }

  private hashKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async get<T>(key: string): Promise<T | null> {
    const node = this.getNodeForKey(key);
    try {
      const value = await node.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const node = this.getNodeForKey(key);
    try {
      await node.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const node = this.getNodeForKey(key);
    try {
      await node.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}
```

## Conclusion

This comprehensive guide provides the foundation for building scalable, secure, and maintainable applications using the Junie architecture. The patterns and practices outlined here ensure:

- **Clear separation of concerns** through bounded contexts
- **Testable and maintainable code** through dependency injection
- **High performance** through optimized data access and caching
- **Enterprise-level security** through comprehensive hardening measures
- **Scalable deployment** through modern infrastructure practices

Remember to adapt these guidelines to your specific use case and requirements while maintaining the core architectural principles.
