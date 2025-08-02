# Junie Architecture Guidelines

## Overview

These guidelines are based on the Explicit Architecture approach, combining Domain-Driven Design (DDD), Hexagonal Architecture, Onion Architecture, Clean Architecture, and CQRS patterns. As an autonomous programmer, follow these principles to create maintainable, loosely coupled, and highly cohesive codebases.

## Core Architectural Principles

### 1. Fundamental System Blocks

Every system should be organized into three fundamental blocks:

- **User Interface Layer**: What makes it possible to run any type of user interface (web, mobile, CLI, API)
- **Application Core**: The business logic that IS your application
- **Infrastructure Layer**: Code that connects the application core to external tools (databases, APIs, file systems)

**Rule**: The Application Core is the most important part - it should be independent of UI and infrastructure concerns.

### 2. Dependency Direction

**Critical Rule**: All dependencies must point inward toward the Application Core.

- Infrastructure depends on Application Core
- UI depends on Application Core  
- Application Core depends on nothing external
- This enables the Inversion of Control principle at the architectural level

## Ports & Adapters Pattern

### Ports (Interfaces)

- **Definition**: Specifications of how tools can use the Application Core or how the Application Core uses tools
- **Location**: Ports belong INSIDE the Application Core
- **Implementation**: Usually interfaces, but can include DTOs and multiple interfaces
- **Critical Rule**: Ports must be designed to fit Application Core needs, NOT to mimic external tool APIs

### Primary/Driving Adapters

- **Purpose**: Tell the Application Core what to do
- **Examples**: Controllers, Console Commands, Event Handlers
- **Pattern**: Wrap around a Port and translate external requests into Application Core method calls
- **Implementation**: Inject Port implementations (Services, Repositories, Command/Query Buses) into constructors

### Secondary/Driven Adapters  

- **Purpose**: Are told by the Application Core to do something
- **Examples**: Database repositories, Email services, File system handlers
- **Pattern**: Implement a Port interface and get injected into the Application Core
- **Benefit**: Easy to swap implementations (MySQL → PostgreSQL, SMTP → SendGrid)

## Application Core Organization

### Application Layer

**Responsibilities**:
1. Define use cases and business processes
2. Coordinate Domain Layer objects
3. Handle application-level concerns

**Components**:
- **Application Services**: Orchestrate use case execution
  - Find entities using repositories
  - Tell entities to execute domain logic
  - Persist entities back to repositories
- **Command/Query Handlers**: Handle CQRS commands and queries
- **Ports**: Interfaces for external dependencies
- **Application Events**: Represent use case outcomes

**Implementation Pattern**:
```typescript
class CreateUserService {
  constructor(
    private userRepository: UserRepositoryPort,
    private eventDispatcher: EventDispatcherPort
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    // 1. Create domain entity
    const user = User.create(command.email, command.name);
    
    // 2. Apply domain logic
    user.activate();
    
    // 3. Persist
    await this.userRepository.save(user);
    
    // 4. Dispatch events
    await this.eventDispatcher.dispatch(new UserCreatedEvent(user.id));
  }
}
```

### Domain Layer

**Responsibilities**:
- Contain business logic specific to the domain
- Be independent of application processes
- Encapsulate business rules and invariants

**Components**:
- **Domain Model**: Entities, Value Objects, Enums
- **Domain Services**: Logic that doesn't belong to a single entity
- **Domain Events**: Triggered when domain state changes

**Rules**:
- Domain objects should be unaware of Application Layer
- Domain logic should be reusable across different use cases
- Keep domain services minimal - prefer logic in entities when possible

## Component Organization

### Package by Component (Not by Layer)

**Approach**: Organize code by business components/bounded contexts, not technical layers.

**Structure**:
```
src/
├── shared/           # Shared Kernel
├── user/            # User Component
│   ├── application/
│   ├── domain/
│   └── infrastructure/
├── billing/         # Billing Component
│   ├── application/
│   ├── domain/
│   └── infrastructure/
└── authentication/  # Auth Component
    ├── application/
    ├── domain/
    └── infrastructure/
```

**Benefits**:
- Clear business boundaries
- Easier to understand and maintain
- Supports team organization
- Enables independent deployment

### Component Decoupling Strategies

#### 1. Event-Driven Communication

**Pattern**: Use events to trigger logic in other components without direct coupling.

```typescript
// Component A dispatches event
await this.eventDispatcher.dispatch(new OrderCreatedEvent(orderId));

// Component B listens to event
@EventHandler(OrderCreatedEvent)
class SendOrderConfirmationHandler {
  async handle(event: OrderCreatedEvent): Promise<void> {
    // Send confirmation email
  }
}
```

#### 2. Shared Kernel

**Purpose**: Minimal shared functionality between components
**Contents**: Application events, domain events, specifications, common value objects
**Rule**: Keep as minimal as possible - changes affect all components

#### 3. Data Access Patterns

**Read-Only Access**: Components can query any data but only modify data they own

```typescript
// Billing component reading user data (read-only)
class BillingService {
  constructor(private userQueryService: UserQueryServicePort) {}
  
  async generateInvoice(userId: string): Promise<Invoice> {
    const userData = await this.userQueryService.findById(userId); // Read-only
    // Generate invoice using user data
  }
}
```

## Flow of Control Patterns

### Without Command/Query Bus

**Structure**: Controllers → Application Services/Queries → Domain/Infrastructure

```typescript
class UserController {
  constructor(
    private createUserService: CreateUserServicePort,
    private userQuery: UserQueryPort
  ) {}

  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    await this.createUserService.execute(new CreateUserCommand(request));
    return this.userQuery.findById(userId);
  }
}
```

### With Command/Query Bus

**Structure**: Controllers → Bus → Handlers → Application Services/Domain

```typescript
class UserController {
  constructor(
    private commandBus: CommandBusPort,
    private queryBus: QueryBusPort
  ) {}

  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    await this.commandBus.execute(new CreateUserCommand(request));
    return await this.queryBus.execute(new GetUserQuery(userId));
  }
}
```

## Implementation Guidelines for Junie

### 1. Project Structure Setup

When creating a new project or component:

1. **Create clear layer separation**:
   ```
   component/
   ├── application/
   │   ├── services/
   │   ├── handlers/
   │   └── ports/
   ├── domain/
   │   ├── entities/
   │   ├── services/
   │   └── events/
   └── infrastructure/
       ├── adapters/
       └── repositories/
   ```

2. **Define ports before adapters**
3. **Implement domain logic first, then application services**
4. **Add infrastructure adapters last**

### 2. Dependency Injection Setup

- Use a DI container to wire dependencies
- Register ports and their implementations
- Ensure all dependencies flow inward
- Example container configuration:

```typescript
// Infrastructure Module
container.bind<UserRepositoryPort>('UserRepository').to(MySQLUserRepository);
container.bind<EmailServicePort>('EmailService').to(SMTPEmailService);

// Application Module  
container.bind<CreateUserServicePort>('CreateUserService').to(CreateUserService);
```

### 3. Testing Strategy

**Unit Tests**: Test domain logic in isolation
**Integration Tests**: Test application services with real adapters
**Contract Tests**: Verify port implementations meet contracts

```typescript
// Domain unit test
describe('User Entity', () => {
  it('should activate user when created', () => {
    const user = User.create('test@example.com', 'Test User');
    user.activate();
    expect(user.isActive).toBe(true);
  });
});

// Application integration test
describe('CreateUserService', () => {
  it('should create and persist user', async () => {
    const service = new CreateUserService(mockRepository, mockEventDispatcher);
    await service.execute(new CreateUserCommand('test@example.com', 'Test'));
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### 4. Error Handling

- **Domain Errors**: Use domain exceptions for business rule violations
- **Application Errors**: Handle and translate domain errors for use cases
- **Infrastructure Errors**: Catch and wrap external service errors

```typescript
// Domain
class User {
  activate(): void {
    if (this.isDeleted) {
      throw new UserCannotBeActivatedException('Deleted users cannot be activated');
    }
    this.status = UserStatus.ACTIVE;
  }
}

// Application
class CreateUserService {
  async execute(command: CreateUserCommand): Promise<void> {
    try {
      const user = User.create(command.email, command.name);
      user.activate();
      await this.userRepository.save(user);
    } catch (e: UserCannotBeActivatedException) {
      throw new ApplicationException('Cannot create user', e);
    }
  }
}
```

### 5. Event Handling

- **Domain Events**: Triggered by domain state changes
- **Application Events**: Triggered by use case completion
- **Integration Events**: For communication between components

```typescript
// Domain Event
class UserActivatedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super();
  }
}

// Application Event Handler
@EventHandler(UserActivatedEvent)
class SendWelcomeEmailHandler {
  constructor(private emailService: EmailServicePort) {}
  
  async handle(event: UserActivatedEvent): Promise<void> {
    await this.emailService.sendWelcomeEmail(event.userId);
  }
}
```

## Quality Assurance Rules

### 1. Architecture Validation

Before submitting code, verify:
- [ ] All dependencies point inward
- [ ] Ports are defined in Application Core
- [ ] Adapters implement ports correctly
- [ ] Components are properly decoupled
- [ ] Domain logic is in Domain Layer
- [ ] Use case logic is in Application Layer

### 2. Code Organization

- [ ] Components are organized by business capability
- [ ] Shared code is minimal and well-justified
- [ ] Layer responsibilities are clear and respected
- [ ] Naming reflects business concepts, not technical details

### 3. Testing Coverage

- [ ] Domain logic has comprehensive unit tests
- [ ] Application services have integration tests
- [ ] Port contracts are verified
- [ ] End-to-end scenarios are covered

## Common Anti-Patterns to Avoid

### 1. **Anemic Domain Model**
❌ Don't put all logic in application services
✅ Put business logic in domain entities and services

### 2. **Leaky Abstractions**
❌ Don't let infrastructure concerns leak into domain
✅ Use proper ports and adapters to isolate external dependencies

### 3. **God Services**
❌ Don't create large services that do everything
✅ Create focused services with single responsibilities

### 4. **Direct Component Coupling**
❌ Don't directly call methods between components
✅ Use events, shared kernel, or discovery services

### 5. **Database-Driven Design**
❌ Don't design domain around database structure
✅ Design domain around business needs, adapt persistence

## Conclusion

These guidelines provide a framework for building maintainable, testable, and evolvable software systems. Remember:

> "Plans are worthless, but planning is everything." - Eisenhower

These are guidelines, not rigid rules. Always consider the specific context, requirements, and constraints of your project. The goal is to create code that is:

- **Loosely Coupled**: Components can change independently
- **Highly Cohesive**: Related functionality is grouped together  
- **Easy to Test**: Business logic is isolated and testable
- **Easy to Understand**: Architecture reflects business concepts
- **Easy to Change**: New requirements can be accommodated with minimal impact

Apply these principles thoughtfully, and adapt them to the specific needs of each project while maintaining the core architectural integrity.
