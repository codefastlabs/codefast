# Next.js 15 Explicit Architecture Directory Structure

## Root Directory Structure

```
project-root/
├── src/
│   ├── app/                           # Next.js 15 App Router
│   ├── bounded-contexts/              # Domain Bounded Contexts
│   ├── shared/                        # Shared Kernel
│   ├── infrastructure/                # Cross-cutting Infrastructure
│   └── presentation/                  # Presentation Layer
├── cli/                               # Command-Line Tools
├── tools/                             # Build and Development Tools
├── tests/                             # Test Organization
├── docs/                              # Documentation
└── config/                            # Configuration Files
```

## Detailed Structure

### 1. Next.js App Router (`/src/app/`)

```
src/app/
├── (auth)/                            # Route Groups for Authentication
│   ├── login/
│   │   ├── page.tsx
│   │   └── actions.ts                 # Server Actions for login
│   ├── register/
│   │   ├── page.tsx
│   │   └── actions.ts
│   └── sso/
│       ├── [provider]/
│       │   └── callback/
│       │       └── page.tsx
├── (dashboard)/                       # Protected Dashboard Routes
│   ├── users/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   └── edit/
│   │   │       ├── page.tsx
│   │   │       └── actions.ts
│   │   └── actions.ts
│   └── orders/
│       ├── page.tsx
│       ├── [id]/
│       │   └── page.tsx
│       └── actions.ts
├── api/                               # API Routes (Queries)
│   ├── users/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   ├── orders/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── health/
│       └── route.ts
├── globals.css                        # Global Styles
├── layout.tsx                         # Root Layout
├── loading.tsx                        # Global Loading UI
├── error.tsx                          # Global Error UI
├── not-found.tsx                      # 404 Page
└── page.tsx                           # Home Page
```

### 2. Bounded Contexts (`/src/bounded-contexts/`)

Each bounded context follows hexagonal architecture principles with distinct layers:

```
src/bounded-contexts/
├── user-management/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── user-profile.entity.ts
│   │   │   └── user-role.entity.ts
│   │   ├── value-objects/
│   │   │   ├── email.value-object.ts
│   │   │   ├── password.value-object.ts
│   │   │   └── user-id.value-object.ts
│   │   ├── aggregates/
│   │   │   └── user.aggregate.ts
│   │   ├── repositories/
│   │   │   └── user.repository.ts      # Port (Interface)
│   │   ├── services/
│   │   │   ├── user-validation.service.ts
│   │   │   └── password-hashing.service.ts
│   │   └── events/
│   │       ├── user-created.event.ts
│   │       ├── user-updated.event.ts
│   │       └── user-deleted.event.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-user.command.ts
│   │   │   ├── update-user.command.ts
│   │   │   ├── delete-user.command.ts
│   │   │   └── handlers/
│   │   │       ├── create-user.handler.ts
│   │   │       ├── update-user.handler.ts
│   │   │       └── delete-user.handler.ts
│   │   ├── queries/
│   │   │   ├── get-user.query.ts
│   │   │   ├── get-users.query.ts
│   │   │   └── handlers/
│   │   │       ├── get-user.handler.ts
│   │   │       └── get-users.handler.ts
│   │   ├── use-cases/
│   │   │   ├── create-user.use-case.ts
│   │   │   ├── authenticate-user.use-case.ts
│   │   │   └── update-user-profile.use-case.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── ports/
│   │       ├── user-notification.port.ts
│   │       ├── user-cache.port.ts
│   │       └── user-search.port.ts
│   ├── infrastructure/
│   │   ├── adapters/
│   │   │   ├── user.repository.adapter.ts  # Drizzle Implementation
│   │   │   ├── user-cache.adapter.ts       # Redis Implementation
│   │   │   ├── user-email.adapter.ts       # Nodemailer Implementation
│   │   │   └── user-search.adapter.ts      # Search Implementation
│   │   ├── schemas/
│   │   │   ├── user.schema.ts              # Drizzle Schema
│   │   │   └── user-validation.schema.ts   # Zod Schema
│   │   └── config/
│   │       └── user-context.config.ts
│   └── presentation/
│       ├── components/
│       │   ├── user-form.component.tsx
│       │   ├── user-list.component.tsx
│       │   └── user-profile.component.tsx
│       ├── hooks/
│       │   ├── use-user.hook.ts
│       │   └── use-user-form.hook.ts
│       └── server-actions/
│           ├── create-user.action.ts
│           ├── update-user.action.ts
│           └── delete-user.action.ts
├── order-processing/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   ├── order-item.entity.ts
│   │   │   └── payment.entity.ts
│   │   ├── value-objects/
│   │   │   ├── order-id.value-object.ts
│   │   │   ├── money.value-object.ts
│   │   │   └── order-status.value-object.ts
│   │   ├── aggregates/
│   │   │   └── order.aggregate.ts
│   │   ├── repositories/
│   │   │   └── order.repository.ts
│   │   ├── services/
│   │   │   ├── order-calculation.service.ts
│   │   │   └── inventory-check.service.ts
│   │   └── events/
│   │       ├── order-placed.event.ts
│   │       ├── order-shipped.event.ts
│   │       └── order-cancelled.event.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── place-order.command.ts
│   │   │   ├── cancel-order.command.ts
│   │   │   └── handlers/
│   │   │       ├── place-order.handler.ts
│   │   │       └── cancel-order.handler.ts
│   │   ├── queries/
│   │   │   ├── get-order.query.ts
│   │   │   ├── get-orders.query.ts
│   │   │   └── handlers/
│   │   │       ├── get-order.handler.ts
│   │   │       └── get-orders.handler.ts
│   │   ├── use-cases/
│   │   │   ├── place-order.use-case.ts
│   │   │   ├── process-payment.use-case.ts
│   │   │   └── ship-order.use-case.ts
│   │   ├── dto/
│   │   │   ├── place-order.dto.ts
│   │   │   ├── order-response.dto.ts
│   │   │   └── order-summary.dto.ts
│   │   └── ports/
│   │       ├── payment-gateway.port.ts
│   │       ├── inventory.port.ts
│   │       └── shipping.port.ts
│   ├── infrastructure/
│   │   ├── adapters/
│   │   │   ├── order.repository.adapter.ts
│   │   │   ├── payment-gateway.adapter.ts
│   │   │   ├── inventory.adapter.ts
│   │   │   └── shipping.adapter.ts
│   │   ├── schemas/
│   │   │   ├── order.schema.ts
│   │   │   └── order-validation.schema.ts
│   │   └── config/
│   │       └── order-context.config.ts
│   └── presentation/
│       ├── components/
│       │   ├── order-form.component.tsx
│       │   ├── order-list.component.tsx
│       │   └── order-details.component.tsx
│       ├── hooks/
│       │   ├── use-order.hook.ts
│       │   └── use-checkout.hook.ts
│       └── server-actions/
│           ├── place-order.action.ts
│           ├── cancel-order.action.ts
│           └── update-order.action.ts
└── notification/
    ├── domain/
    │   ├── entities/
    │   │   └── notification.entity.ts
    │   ├── value-objects/
    │   │   ├── notification-type.value-object.ts
    │   │   └── recipient.value-object.ts
    │   └── services/
    │       └── notification-routing.service.ts
    ├── application/
    │   ├── commands/
    │   │   ├── send-notification.command.ts
    │   │   └── handlers/
    │   │       └── send-notification.handler.ts
    │   ├── use-cases/
    │   │   ├── send-email.use-case.ts
    │   │   ├── send-push.use-case.ts
    │   │   └── send-sms.use-case.ts
    │   └── ports/
    │       ├── email-service.port.ts
    │       ├── push-service.port.ts
    │       └── sms-service.port.ts
    ├── infrastructure/
    │   ├── adapters/
    │   │   ├── email.adapter.ts           # Nodemailer + React Email
    │   │   ├── push.adapter.ts
    │   │   └── sms.adapter.ts
    │   ├── templates/
    │   │   ├── welcome-email.template.tsx  # React Email
    │   │   ├── order-confirmation.template.tsx
    │   │   └── password-reset.template.tsx
    │   └── config/
    │       └── notification-context.config.ts
    └── presentation/
        ├── components/
        │   └── toast-notification.component.tsx  # Sonner integration
        └── hooks/
            └── use-notifications.hook.ts
```

### 3. Shared Kernel (`/src/shared/`)

```
src/shared/
├── domain/
│   ├── base/
│   │   ├── entity.base.ts
│   │   ├── aggregate-root.base.ts
│   │   ├── value-object.base.ts
│   │   └── domain-event.base.ts
│   ├── errors/
│   │   ├── domain.error.ts
│   │   ├── validation.error.ts
│   │   └── business-rule.error.ts
│   └── types/
│       ├── identifier.type.ts
│       ├── pagination.type.ts
│       └── result.type.ts
├── application/
│   ├── base/
│   │   ├── command.base.ts
│   │   ├── query.base.ts
│   │   ├── handler.base.ts
│   │   └── use-case.base.ts
│   ├── decorators/
│   │   ├── transaction.decorator.ts
│   │   ├── cache.decorator.ts
│   │   └── retry.decorator.ts
│   └── patterns/
│       ├── unit-of-work.pattern.ts
│       ├── specification.pattern.ts
│       └── repository.pattern.ts
├── infrastructure/
│   ├── base/
│   │   ├── repository.base.ts
│   │   ├── event-handler.base.ts
│   │   └── adapter.base.ts
│   ├── utilities/
│   │   ├── logger.utility.ts
│   │   ├── cache.utility.ts
│   │   └── encryption.utility.ts
│   └── middleware/
│       ├── auth.middleware.ts
│       ├── rate-limit.middleware.ts
│       └── cors.middleware.ts
└── presentation/
    ├── base/
    │   ├── controller.base.ts
    │   └── response.base.ts
    ├── validation/
    │   ├── validation.pipe.ts
    │   └── transform.pipe.ts
    └── types/
        ├── api-response.type.ts
        └── pagination-request.type.ts
```

### 4. Infrastructure (`/src/infrastructure/`)

```
src/infrastructure/
├── database/
│   ├── drizzle/
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   └── connection.config.ts
│   │   ├── migrations/
│   │   │   ├── 0001_initial.sql
│   │   │   └── migration.config.ts
│   │   └── schemas/
│   │       ├── users.schema.ts
│   │       ├── orders.schema.ts
│   │       └── index.ts
│   └── redis/
│       ├── config/
│       │   ├── redis.config.ts
│       │   └── connection.config.ts
│       └── adapters/
│           ├── cache.adapter.ts
│           └── session.adapter.ts
├── auth/
│   ├── config/
│   │   ├── auth.config.ts
│   │   └── providers.config.ts
│   ├── adapters/
│   │   ├── credentials.adapter.ts
│   │   ├── oauth.adapter.ts
│   │   └── webauthn.adapter.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   ├── session.strategy.ts
│   │   └── webauthn.strategy.ts
│   └── middleware/
│       ├── auth-guard.middleware.ts
│       └── role-guard.middleware.ts
├── email/
│   ├── config/
│   │   ├── nodemailer.config.ts
│   │   └── smtp.config.ts
│   ├── adapters/
│   │   └── email.adapter.ts
│   └── templates/
│       └── react-email/
│           ├── components/
│           │   ├── email-layout.component.tsx
│           │   ├── button.component.tsx
│           │   └── header.component.tsx
│           └── templates/
│               ├── welcome.template.tsx
│               └── reset-password.template.tsx
├── queue/
│   ├── config/
│   │   ├── bullmq.config.ts
│   │   └── redis-queue.config.ts
│   ├── jobs/
│   │   ├── email.job.ts
│   │   ├── order-processing.job.ts
│   │   └── cleanup.job.ts
│   ├── processors/
│   │   ├── email.processor.ts
│   │   ├── order.processor.ts
│   │   └── cleanup.processor.ts
│   └── workers/
│       ├── email.worker.ts
│       ├── order.worker.ts
│       └── cleanup.worker.ts
├── monitoring/
│   ├── config/
│   │   ├── logger.config.ts
│   │   └── metrics.config.ts
│   ├── adapters/
│   │   ├── logger.adapter.ts
│   │   └── metrics.adapter.ts
│   └── middleware/
│       ├── request-logger.middleware.ts
│       └── error-handler.middleware.ts
└── dependency-injection/
    ├── config/
    │   └── inversify.config.ts
    ├── modules/
    │   ├── user-management.module.ts
    │   ├── order-processing.module.ts
    │   ├── notification.module.ts
    │   └── infrastructure.module.ts
    ├── types/
    │   └── dependency.types.ts
    └── container/
        └── container.ts
```

### 5. Presentation Layer (`/src/presentation/`)

```
src/presentation/
├── components/
│   ├── ui/                            # Reusable UI Components
│   │   ├── button/
│   │   │   ├── button.component.tsx
│   │   │   ├── button.types.ts
│   │   │   └── button.styles.ts
│   │   ├── input/
│   │   │   ├── input.component.tsx
│   │   │   ├── input.types.ts
│   │   │   └── input.styles.ts
│   │   ├── modal/
│   │   │   ├── modal.component.tsx
│   │   │   ├── modal.types.ts
│   │   │   └── modal.styles.ts
│   │   └── toast/
│   │       ├── toast.component.tsx     # Sonner wrapper
│   │       ├── toast.types.ts
│   │       └── toast.provider.tsx
│   ├── forms/                         # React Hook Form Components
│   │   ├── base/
│   │   │   ├── form.component.tsx
│   │   │   ├── field.component.tsx
│   │   │   └── validation.component.tsx
│   │   ├── user/
│   │   │   ├── user-form.component.tsx
│   │   │   └── user-form.types.ts
│   │   └── order/
│   │       ├── order-form.component.tsx
│   │       └── order-form.types.ts
│   ├── layout/
│   │   ├── header/
│   │   │   ├── header.component.tsx
│   │   │   └── navigation.component.tsx
│   │   ├── sidebar/
│   │   │   └── sidebar.component.tsx
│   │   └── footer/
│   │       └── footer.component.tsx
│   └── auth/
│       ├── login-form.component.tsx
│       ├── register-form.component.tsx
│       ├── social-login.component.tsx
│       └── webauthn.component.tsx
├── hooks/
│   ├── use-auth.hook.ts
│   ├── use-toast.hook.ts
│   ├── use-api.hook.ts
│   └── use-form-validation.hook.ts
├── providers/
│   ├── auth.provider.tsx
│   ├── toast.provider.tsx
│   ├── theme.provider.tsx
│   └── query.provider.tsx
├── styles/
│   ├── globals.css
│   ├── components.css
│   └── utilities.css
└── utils/
    ├── format.util.ts
    ├── validation.util.ts
    └── constants.util.ts
```

### 6. Command-Line Interface (`/cli/`)

```
cli/
├── commands/
│   ├── generate/
│   │   ├── bounded-context.command.ts
│   │   ├── entity.command.ts
│   │   ├── use-case.command.ts
│   │   └── component.command.ts
│   ├── database/
│   │   ├── migrate.command.ts
│   │   ├── seed.command.ts
│   │   └── reset.command.ts
│   ├── auth/
│   │   ├── create-user.command.ts
│   │   └── setup-auth.command.ts
│   └── deployment/
│       ├── build.command.ts
│       └── deploy.command.ts
├── templates/
│   ├── bounded-context/
│   │   ├── domain.template.ts
│   │   ├── application.template.ts
│   │   └── infrastructure.template.ts
│   ├── entity/
│   │   ├── entity.template.ts
│   │   ├── repository.template.ts
│   │   └── schema.template.ts
│   └── component/
│       ├── component.template.tsx
│       └── hook.template.ts
├── utils/
│   ├── file-system.util.ts           # fast-glob integration
│   ├── template-processor.util.ts    # ts-morph integration
│   ├── logger.util.ts                # chalk integration
│   └── validation.util.ts
├── config/
│   ├── cli.config.ts
│   └── template.config.ts
└── index.ts                          # Commander setup
```

### 7. Testing Structure (`/tests/`)

```
tests/
├── unit/
│   ├── bounded-contexts/
│   │   ├── user-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.test.ts
│   │   │   │   └── services/
│   │   │   │       └── user-validation.service.test.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   └── create-user.use-case.test.ts
│   │   │   │   └── handlers/
│   │   │   │       └── create-user.handler.test.ts
│   │   │   └── infrastructure/
│   │   │       └── adapters/
│   │   │           └── user.repository.adapter.test.ts
│   │   └── order-processing/
│   │       └── domain/
│   │           └── aggregates/
│   │               └── order.aggregate.test.ts
│   ├── shared/
│   │   ├── domain/
│   │   │   └── base/
│   │   │       └── entity.base.test.ts
│   │   └── utilities/
│   │       └── logger.utility.test.ts
│   └── presentation/
│       ├── components/
│       │   └── ui/
│       │       └── button/
│       │           └── button.component.test.tsx
│       └── hooks/
│           └── use-auth.hook.test.ts
├── integration/
│   ├── api/
│   │   ├── users/
│   │   │   └── user.api.test.ts
│   │   └── orders/
│   │       └── order.api.test.ts
│   ├── database/
│   │   ├── repositories/
│   │   │   ├── user.repository.test.ts
│   │   │   └── order.repository.test.ts
│   │   └── migrations/
│   │       └── migration.test.ts
│   ├── auth/
│   │   ├── authentication.test.ts
│   │   ├── authorization.test.ts
│   │   └── webauthn.test.ts
│   └── queue/
│       ├── email.job.test.ts
│       └── order-processing.job.test.ts
├── e2e/
│   ├── user-flows/
│   │   ├── user-registration.e2e.test.ts
│   │   ├── user-authentication.e2e.test.ts
│   │   └── user-profile.e2e.test.ts
│   ├── order-flows/
│   │   ├── place-order.e2e.test.ts
│   │   ├── order-fulfillment.e2e.test.ts
│   │   └── order-cancellation.e2e.test.ts
│   └── auth-flows/
│       ├── social-login.e2e.test.ts
│       ├── webauthn.e2e.test.ts
│       └── sso.e2e.test.ts
├── fixtures/
│   ├── users/
│   │   ├── user.fixture.ts
│   │   └── user-profile.fixture.ts
│   ├── orders/
│   │   ├── order.fixture.ts
│   │   └── order-item.fixture.ts
│   └── auth/
│       ├── credentials.fixture.ts
│       └── tokens.fixture.ts
├── mocks/
│   ├── repositories/
│   │   ├── user.repository.mock.ts
│   │   └── order.repository.mock.ts
│   ├── services/
│   │   ├── email.service.mock.ts
│   │   └── payment.service.mock.ts
│   └── adapters/
│       ├── database.adapter.mock.ts
│       └── cache.adapter.mock.ts
├── helpers/
│   ├── test-container.helper.ts      # Inversify test container
│   ├── database.helper.ts
│   ├── auth.helper.ts
│   └── cleanup.helper.ts
└── setup/
    ├── jest.config.ts
    ├── test-setup.ts
    └── global-teardown.ts
```

### 8. Configuration Files (`/config/`)

```
config/
├── environment/
│   ├── development.config.ts
│   ├── staging.config.ts
│   ├── production.config.ts
│   └── test.config.ts
├── database/
│   ├── drizzle.config.ts
│   └── redis.config.ts
├── auth/
│   ├── auth.config.ts
│   ├── oauth-providers.config.ts
│   └── webauthn.config.ts
├── queue/
│   ├── bullmq.config.ts
│   └── job-schedules.config.ts
├── email/
│   ├── nodemailer.config.ts
│   └── templates.config.ts
├── build/
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── eslint.config.js
└── deployment/
    ├── docker/
    │   ├── Dockerfile
    │   ├── docker-compose.yml
    │   └── docker-compose.prod.yml
    └── k8s/
        ├── deployment.yaml
        ├── service.yaml
        └── ingress.yaml
```

## Key Architectural Principles

### Bounded Context Organization
Each bounded context maintains complete autonomy with its own domain model, application services, and infrastructure adapters. Cross-context communication occurs through well-defined interfaces and domain events.

### Hexagonal Architecture Implementation
- **Domain Layer**: Contains pure business logic without external dependencies
- **Application Layer**: Orchestrates use cases and coordinates domain operations
- **Infrastructure Layer**: Implements technical concerns and external integrations
- **Presentation Layer**: Handles user interface and API concerns

### CQRS Pattern Integration
Commands are handled through Next.js 15 Server Actions for write operations, while queries utilize API routes for read operations. This separation enables optimized data access patterns and independent scaling.

### Dependency Injection Strategy
Inversify v7 manages dependency resolution across all layers, enabling testability and loose coupling. Each bounded context registers its dependencies in dedicated modules.

### Testing Architecture
The structure supports comprehensive testing strategies:
- **Unit Tests**: Focus on individual components and business logic
- **Integration Tests**: Verify adapter implementations and cross-boundary interactions
- **End-to-End Tests**: Validate complete user workflows and system behavior

### Security and Scalability Considerations
- Auth.js integration with multiple authentication strategies
- Redis-based caching and session management
- BullMQ for background job processing
- Rate limiting and CORS middleware
- Structured logging and monitoring capabilities

This architecture ensures maintainable, scalable, and testable enterprise applications while adhering to explicit architecture principles and modern Next.js 15 capabilities.