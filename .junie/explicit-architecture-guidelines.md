# Explicit Architecture Guidelines for AI Development

This document outlines programming guidelines for building AI systems using an Explicit Architecture approach. It distills key principles, best practices, and actionable recommendations to ensure clarity, maintainability, testability, and scalability in AI-driven applications. The guidelines are tailored for developers working with modern web stacks, emphasizing Dependency Injection (DI), layered architecture, and Domain-Driven Design (DDD) principles.

## 1. Core Principles

- **Clarity and Explicitness**: Declare all dependencies, interfaces, and data flows explicitly to minimize ambiguity and enhance code readability.
- **Separation of Concerns**: Organize code into distinct layers (Domain, Application, Infrastructure, Presentation) to isolate responsibilities.
- **Dependency Inversion**: Depend on abstractions (interfaces/ports) rather than concrete implementations to promote flexibility and testability.
- **Testability**: Design components to be easily testable through clear interfaces and mocked dependencies.
- **Scalability and Maintainability**: Structure code to support long-term growth, collaboration, and adaptation to changing requirements.

## 2. Layered Architecture Structure

Organize AI systems into four core layers:

### 2.1. Domain Layer

- **Purpose**: Encapsulate core business logic, entities, and rules independent of external systems or technologies.
- **Components**:
  - **Entities**: Use `class` to define entities with behavior and invariants (e.g., `User`, `Order`). Store in `src/core/domain/entities/`.
  - **Value Objects**: Define immutable objects for semantic attributes (e.g., `Email`, `Money`). Store in `src/core/domain/value-objects/`.
  - **Domain Services**: Handle complex business logic involving multiple entities. Store in `src/core/domain/services/`.
  - **Domain Events**: Represent significant business events (e.g., `OrderPlaced`). Store in `src/core/domain/events/`.
  - **Exceptions**: Define business-specific errors (e.g., `InvalidOrderError`). Store in `src/core/domain/errors/`.
- **Best Practices**:
  - Keep Domain layer independent of other layers.
  - Use `class` for entities to encapsulate behavior and ensure invariants.
  - Employ Value Objects for attributes to enforce business rules and immutability.
  - Use descriptive naming aligned with the Ubiquitous Language of the business domain.

### 2.2. Application Layer

- **Purpose**: Orchestrate business logic through Use Cases, defining interfaces (Ports) for external interactions.
- **Components**:
  - **Use Cases**: Implement business workflows (e.g., `CreateOrderUseCase`). Store in `src/core/application/use-cases/`.
  - **Ports**: Define interfaces for repositories and services (e.g., `UserRepository`, `EmailService`). Store in `src/core/application/ports/`.
  - **DTOs**: Use Data Transfer Objects with schema validation (e.g., Zod) for input/output. Store in `src/core/application/dtos/`.
- **Best Practices**:
  - Define clear input/output contracts using DTOs.
  - Use Ports to abstract external interactions, ensuring loose coupling.
  - Inject dependencies via DI to maintain flexibility.

### 2.3. Infrastructure Layer

- **Purpose**: Implement technical details (e.g., database access, external APIs) through Adapters.
- **Components**:
  - **Adapters**: Implement Ports (e.g., `DrizzleUserRepositoryAdapter`, `SendGridEmailServiceAdapter`). Store in `src/infrastructure/adapters/`.
  - **Workers**: Handle asynchronous tasks (e.g., event processing). Store in `src/infrastructure/workers/`.
  - **Jobs**: Define asynchronous job structures (e.g., queue jobs). Store in `src/infrastructure/jobs/`.
  - **Configuration**: Store constants and configurations (e.g., API timeouts). Store in `src/infrastructure/config/` or `src/infrastructure/constants/`.
- **Best Practices**:
  - Map Domain Entities to ORM schemas or external API responses in Adapters.
  - Use DI to inject infrastructure dependencies into Adapters.
  - Optimize database queries (e.g., selective `select()`, pagination) in Repository Adapters.

### 2.4. Presentation Layer

- **Purpose**: Handle user interface and API entry points, integrating with the Application layer.
- **Components**:
  - **Server Components**: Render server-side UI or data fetching logic. Store in `src/app/` (e.g., `page.tsx`).
  - **Client Components**: Handle interactive UI. Store in `src/app/.../_components/` or `src/presentation/components/`.
  - **Server Actions**: Define server-side logic callable from the client. Store in `src/app/.../_actions/`.
  - **API Routes**: Define RESTful endpoints. Store in `src/app/api/`.
- **Best Practices**:
  - Use Server Components for initial rendering and data fetching.
  - Leverage Client Components for interactivity, using hooks like `useSearchParams` or `useActionState`.
  - Co-locate feature-specific components and actions in `src/app/` for clarity.

## 3. Dependency Injection with InversifyJS

- **Purpose**: Manage dependencies explicitly using an Inversion of Control (IoC) container.
- **Implementation**:
  - Use InversifyJS (version 7+) for DI.
  - Centralize DI configuration in `src/di/` (e.g., `container.ts`, `types.ts`, `modules/`).
  - Define service identifiers as `Symbol` in `src/di/types.ts`.
  - Use `ContainerModule` in `src/di/modules/` to organize bindings by feature or layer.
  - Mark injectable classes with `@injectable` and inject dependencies with `@inject`.
- **Best Practices**:
  - Use `Singleton` scope for shared services, `Transient` for per-request instances.
  - Support asynchronous bindings for database connections or external services.
  - Use `@postConstruct` for initialization and `@preDestroy` for cleanup.
  - Organize bindings modularly to improve maintainability.

## 4. Event-Driven Architecture

- **Purpose**: Enable loose coupling and asynchronous processing for AI-driven workflows.
- **Implementation**:
  - Define Domain Events in `src/core/domain/events/` to capture significant business events.
  - Use an `EventPublisher` Port (`src/core/application/ports/event-publisher/`) and implement with an Adapter (e.g., `BullMQEventPublisherAdapter` in `src/infrastructure/adapters/`).
  - Process events asynchronously using Workers in `src/infrastructure/workers/`.
- **Best Practices**:
  - Emit Domain Events from Entities or Use Cases.
  - Use a message queue (e.g., BullMQ) for reliable event delivery.
  - Handle errors in Workers with retry strategies or Dead-Letter Queues.

## 5. Constants and Enums

- **Purpose**: Ensure consistency and readability for fixed values.
- **Implementation**:
  - Store domain-specific constants/enums in `src/core/domain/[feature]/constants/` or `enums/`.
  - Store application-wide constants/enums in `src/core/application/constants/` or `enums/`.
  - Store infrastructure-specific constants in `src/infrastructure/constants/` or `config/`.
  - Store presentation-specific constants in `src/presentation/constants/` or `src/app/.../_constants/`.
- **Best Practices**:
  - Use `UPPER_SNAKE_CASE` for constants (e.g., `DEFAULT_PAGE_SIZE`).
  - Use string enums with `PascalCase` members for semantic clarity (e.g., `enum OrderStatus { Pending = 'PENDING' }`).
  - Prefer string enums over numeric enums for readability and debugging.
  - Use object literals with `as const` for lightweight string literal unions when enums are unnecessary.

## 6. Error Handling and Logging

- **Purpose**: Ensure robust error management and traceability.
- **Implementation**:
  - Define business-specific errors in `src/core/domain/errors/` (e.g., `InvalidOrderError`).
  - Use a `LoggingService` Port (`src/core/application/ports/logging/`) with an Adapter (e.g., `WinstonLoggingAdapter` in `src/infrastructure/adapters/`).
  - Implement error boundaries in the Presentation layer for UI resilience.
- **Best Practices**:
  - Throw domain-specific errors for business rule violations.
  - Log errors at appropriate levels (e.g., `error` for critical issues, `warn` for recoverable issues).
  - Avoid exposing sensitive information in error responses.

## 7. Testing Guidelines

- **Purpose**: Ensure high code quality and reliability.
- **Implementation**:
  - Write unit tests for Domain Entities, Value Objects, and Use Cases.
  - Mock dependencies using InversifyJS for isolated testing.
  - Write integration tests for Infrastructure Adapters and API routes.
  - Use end-to-end (E2E) tests for critical user flows in the Presentation layer.
- **Best Practices**:
  - Mock Ports in unit tests to isolate layers.
  - Test error scenarios and edge cases thoroughly.
  - Use testing frameworks like Jest or Vitest with TypeScript support.

## 8. Asynchronous Processing for AI Workflows

- **Purpose**: Handle compute-intensive AI tasks (e.g., model inference) without blocking the main thread.
- **Implementation**:
  - Use Workers (`src/infrastructure/workers/`) and Queues (e.g., BullMQ) for background tasks.
  - Define job structures in `src/infrastructure/jobs/` for AI-related tasks (e.g., `ProcessInferenceJob`).
  - Use Server Actions or API Routes in `src/app/` to trigger asynchronous tasks.
- **Best Practices**:
  - Prioritize jobs for critical AI tasks (e.g., real-time predictions).
  - Implement retry and error-handling strategies for job failures.
  - Monitor queue performance with dashboards or metrics.

## 9. Next.js 15 Integration

- **Purpose**: Leverage Next.js 15 features for optimal AI system performance.
- **Implementation**:
  - Use Server Components (`src/app/.../page.tsx`) for initial rendering and data fetching.
  - Handle asynchronous `params` and `searchParams` with `async/await` in Server Components.
  - Use Client Components with React 19 hooks (e.g., `useActionState`, `useSearchParams`) for interactivity.
  - Enable Turbopack for faster development (`next dev --turbo`).
  - Use `unstable_after` for non-critical post-response tasks (e.g., logging).
- **Best Practices**:
  - Define precise TypeScript types for `params` and `searchParams` (e.g., `Promise<{ id: string }>`).
  - Opt-in to caching for `GET` Route Handlers if needed (`dynamic = 'force-static'`).
  - Update to `next/font` and ESLint 9 for compatibility.

## 10. Evolving the Architecture

- **Purpose**: Ensure the architecture adapts to new requirements and technologies.
- **Implementation**:
  - Refactor within layers to improve Entities, Use Cases, or Adapters.
  - Introduce new features as modular "feature slices" in `src/app/` and `src/core/`.
  - Consider Domain-Driven Design Bounded Contexts for large systems.
  - Transition to microservices only when justified by scale or team needs.
- **Best Practices**:
  - Maintain automated tests to validate refactors.
  - Document architectural changes and update conventions.
  - Avoid premature optimization or premature microservices.

## 11. Anti-Patterns to Avoid

- **Breaking Layer Boundaries**: Avoid direct dependencies between non-adjacent layers (e.g., Presentation accessing Infrastructure directly).
- **Fat Controllers/Use Cases**: Keep Use Cases focused and delegate complex logic to Domain Services.
- **Magic Values**: Always define constants or enums for fixed values.
- **Neglecting Tests**: Ensure comprehensive test coverage for all layers.
- **Overusing Global Constants**: Limit global constants/enums to maintain modularity.

## 12. Conclusion

By adhering to these guidelines, developers can build AI systems that are clear, maintainable, and scalable. The Explicit Architecture approach, with its emphasis on DI, layered structure, and DDD principles, ensures that AI-driven applications remain robust and adaptable. Leveraging tools like InversifyJS, Next.js 15, and modern TypeScript practices enhances developer productivity and system reliability, paving the way for sustainable growth and innovation.
