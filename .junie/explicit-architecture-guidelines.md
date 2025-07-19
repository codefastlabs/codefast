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

### 7.1. Testing Strategy Overview

- **Purpose**: Ensure high code quality, reliability, and maintainability across all architectural layers.
- **Testing Pyramid**: Follow a balanced approach with more unit tests at the base, fewer integration tests in the middle, and minimal E2E tests at the top.
- **Layer Isolation**: Test each layer independently using mocks and stubs to ensure true unit testing and faster feedback loops.

### 7.2. Domain Layer Testing

- **Focus**: Test business logic, entity behavior, and domain rules in complete isolation.
- **Components to Test**:
  - **Entities**: Test business methods, invariants, and state transitions
  - **Value Objects**: Test immutability, validation, and equality
  - **Domain Services**: Test complex business logic involving multiple entities
  - **Domain Events**: Test event creation and payload structure
- **Implementation**:
  ```typescript
  // Example: Entity testing
  describe('User Entity', () => {
    it('should create user with valid email', () => {
      const user = new User('john@example.com', 'John Doe');
      expect(user.email.value).toBe('john@example.com');
      expect(user.isActive()).toBe(true);
    });

    it('should throw error for invalid email', () => {
      expect(() => new User('invalid-email', 'John')).toThrow(InvalidEmailError);
    });
  });
  ```
- **Best Practices**:
  - No external dependencies or mocks needed
  - Test all business rules and edge cases
  - Use descriptive test names that reflect business scenarios
  - Test both happy path and error conditions

### 7.3. Application Layer Testing

- **Focus**: Test use case orchestration and business workflow coordination.
- **Components to Test**:
  - **Use Cases**: Test business workflows and port interactions
  - **DTOs**: Test data validation and transformation
  - **Application Services**: Test coordination logic
- **Implementation**:
  ```typescript
  // Example: Use Case testing with mocked ports
  describe('CreateOrderUseCase', () => {
    let useCase: CreateOrderUseCase;
    let mockUserRepository: jest.Mocked<UserRepository>;
    let mockOrderRepository: jest.Mocked<OrderRepository>;
    let mockEventPublisher: jest.Mocked<EventPublisher>;

    beforeEach(() => {
      mockUserRepository = createMock<UserRepository>();
      mockOrderRepository = createMock<OrderRepository>();
      mockEventPublisher = createMock<EventPublisher>();
      
      useCase = new CreateOrderUseCase(
        mockUserRepository,
        mockOrderRepository,
        mockEventPublisher
      );
    });

    it('should create order successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const orderData = { productId: 'prod-456', quantity: 2 };
      const mockUser = new User('user@example.com', 'John Doe');
      
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockOrderRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute({ userId, ...orderData });

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.any(Order)
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.any(OrderCreatedEvent)
      );
    });
  });
  ```
- **Best Practices**:
  - Mock all Ports (repository interfaces, external services)
  - Test use case orchestration logic, not implementation details
  - Verify interactions with mocked dependencies
  - Test error handling and validation scenarios
  - Use dependency injection container for test setup when needed

### 7.4. Infrastructure Layer Testing

- **Focus**: Test technical implementations and external system integrations.
- **Components to Test**:
  - **Repository Adapters**: Test data persistence and retrieval
  - **External Service Adapters**: Test API integrations
  - **Event Publishers**: Test message queue interactions
  - **Configuration**: Test environment-specific settings
- **Implementation**:
  ```typescript
  // Example: Repository Adapter integration testing
  describe('DrizzleUserRepositoryAdapter', () => {
    let repository: DrizzleUserRepositoryAdapter;
    let testDb: Database;

    beforeEach(async () => {
      testDb = await createTestDatabase();
      repository = new DrizzleUserRepositoryAdapter(testDb);
    });

    afterEach(async () => {
      await cleanupTestDatabase(testDb);
    });

    it('should save and retrieve user', async () => {
      // Arrange
      const user = new User('test@example.com', 'Test User');

      // Act
      await repository.save(user);
      const retrievedUser = await repository.findById(user.id);

      // Assert
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser!.email.value).toBe('test@example.com');
    });
  });

  // Example: External Service Adapter testing
  describe('SendGridEmailServiceAdapter', () => {
    let emailService: SendGridEmailServiceAdapter;
    let mockHttpClient: jest.Mocked<HttpClient>;

    beforeEach(() => {
      mockHttpClient = createMock<HttpClient>();
      emailService = new SendGridEmailServiceAdapter(mockHttpClient);
    });

    it('should send email successfully', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValue({ status: 202 });
      const email = new Email('to@example.com', 'Subject', 'Body');

      // Act
      const result = await emailService.send(email);

      // Assert
      expect(result.success).toBe(true);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/mail/send',
        expect.objectContaining({
          to: [{ email: 'to@example.com' }]
        })
      );
    });
  });
  ```
- **Best Practices**:
  - Use test databases or in-memory alternatives for repository tests
  - Mock external HTTP clients and third-party services
  - Test error handling and retry mechanisms
  - Verify data mapping between domain entities and persistence models
  - Use integration test environment configurations

### 7.5. Presentation Layer Testing

- **Focus**: Test user interfaces, API endpoints, and user interactions.
- **Components to Test**:
  - **React Components**: Test rendering, user interactions, and accessibility
  - **API Routes**: Test request/response handling and validation
  - **Server Actions**: Test form submissions and server-side logic
  - **Client-side Logic**: Test hooks and interactive behavior
- **Implementation**:
  ```typescript
  // Example: React Component testing
  describe('UserProfile Component', () => {
    it('should render user information', () => {
      const user = { name: 'John Doe', email: 'john@example.com' };
      
      render(React.createElement(UserProfile, { user }));
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should be accessible', async () => {
      const user = { name: 'John Doe', email: 'john@example.com' };
      const { container } = render(React.createElement(UserProfile, { user }));
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Example: API Route testing
  describe('/api/users', () => {
    it('should create user successfully', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });
  ```
- **Best Practices**:
  - Use React Testing Library for component testing
  - Include accessibility testing with jest-axe
  - Mock API calls and external dependencies
  - Test user interactions and form submissions
  - Use MSW (Mock Service Worker) for API mocking in integration tests

### 7.6. Testing with Dependency Injection

- **Purpose**: Leverage InversifyJS container for test isolation and dependency management.
- **Implementation**:
  ```typescript
  // Test container setup
  const createTestContainer = (): Container => {
    const container = new Container();
    
    // Bind mocks for testing
    container.bind<UserRepository>(TYPES.UserRepository)
      .toConstantValue(createMock<UserRepository>());
    container.bind<EmailService>(TYPES.EmailService)
      .toConstantValue(createMock<EmailService>());
    
    // Bind real implementations under test
    container.bind<CreateUserUseCase>(TYPES.CreateUserUseCase)
      .to(CreateUserUseCase);
    
    return container;
  };

  describe('DI Integration Tests', () => {
    let container: Container;

    beforeEach(() => {
      container = createTestContainer();
    });

    it('should resolve use case with mocked dependencies', () => {
      const useCase = container.get<CreateUserUseCase>(TYPES.CreateUserUseCase);
      expect(useCase).toBeInstanceOf(CreateUserUseCase);
    });
  });
  ```
- **Best Practices**:
  - Create separate test containers with mocked dependencies
  - Use `@injectable` decorator for testable classes
  - Leverage container modules for organized test setup
  - Mock external dependencies at the container level

### 7.7. Test Organization and Structure

- **File Structure**:
  ```
  src/
  ├── core/
  │   ├── domain/
  │   │   ├── entities/
  │   │   │   ├── user.entity.ts
  │   │   │   └── user.entity.test.ts
  │   │   └── services/
  │   │       ├── user.service.ts
  │   │       └── user.service.test.ts
  │   └── application/
  │       └── use-cases/
  │           ├── create-user.use-case.ts
  │           └── create-user.use-case.test.ts
  ├── infrastructure/
  │   └── adapters/
  │       ├── user-repository.adapter.ts
  │       └── user-repository.adapter.test.ts
  └── presentation/
      └── components/
          ├── user-profile.tsx
          └── user-profile.test.tsx
  ```

### 7.8. Testing Best Practices

- **Naming Conventions**:
  - Use descriptive test names that explain the scenario: `should create user when valid data provided`
  - Group related tests using `describe` blocks by feature or component
  - Use Vietnamese for business-specific test descriptions when appropriate

- **Test Data Management**:
  - Use factory functions or builders for test data creation
  - Create reusable test fixtures for common scenarios
  - Use `beforeEach` and `afterEach` for setup and cleanup

- **Mocking Strategy**:
  - Mock at the boundary of your system (Ports/Interfaces)
  - Avoid mocking implementation details
  - Use type-safe mocks with proper TypeScript support

- **Coverage Guidelines**:
  - Aim for 80%+ code coverage across all layers
  - Focus on critical business logic and edge cases
  - Use coverage reports to identify untested code paths

- **Performance**:
  - Keep unit tests fast (< 100ms each)
  - Use parallel test execution for large test suites
  - Isolate slow integration tests from fast unit tests

### 7.9. Testing Tools and Frameworks

- **Core Testing Stack**:
  - **Jest**: Primary testing framework with TypeScript support
  - **React Testing Library**: For component testing
  - **jest-axe**: For accessibility testing
  - **MSW**: For API mocking in integration tests
  - **Supertest**: For API endpoint testing

- **Configuration**:
  ```typescript
  // jest.config.ts
  export default {
    preset: 'ts-jest',
    testEnvironment: 'node', // or 'jsdom' for React components
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testMatch: ['**/?(*.)+(test|spec|e2e).[jt]s?(x)'],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.test.{ts,tsx}'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };
  ```

### 7.10. Continuous Integration Testing

- **Pipeline Integration**:
  - Run tests on every pull request
  - Generate and publish coverage reports
  - Fail builds on coverage threshold violations
  - Run different test suites in parallel (unit, integration, E2E)

- **Test Commands**:
  ```bash
  pnpm test              # Run all tests
  pnpm test:watch        # Run tests in watch mode
  pnpm test:coverage     # Run tests with coverage
  pnpm test:coverage:ci  # Run tests with CI-optimized coverage
  ```

By following these comprehensive testing guidelines, teams can ensure robust, maintainable, and reliable AI systems built with explicit architecture principles. The layered approach to testing mirrors the architectural structure, making it easier to identify issues and maintain code quality over time.

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
