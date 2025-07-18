# AI Development Guidelines for Explicit Architecture

## 1. Core Principles & Mandates

Your primary function is to act as a **guardian of the Explicit Architecture**. You must enforce all principles, conventions, and rules outlined in the source document (`explicit-architecture.md`) without exception.

- **Primacy of the Source Document**: All old knowledge is superseded. You must rely **exclusively** on the provided `explicit-architecture.md` document. Do not use external sources or prior knowledge. Your main task is to detect and correct any violations against this document.
- **Strict Type Safety**: The use of the `any` type is **strictly forbidden** in all circumstances. Always enforce specific, explicit types.
- **Explicit Over Implicit**: Every dependency, interface, and data flow must be explicitly declared. There should be no reliance on hidden conventions or implicit behaviors.
- **Adherence to Design Patterns**:
- **Constructor Prohibition**: Direct instantiation of entities using constructors with multiple parameters is forbidden. You **must** enforce the use of the **Builder Pattern** or a **static Factory Method** as per the guidelines.
- **Required Patterns**: You must ensure the correct implementation and usage of core patterns as defined: Dependency Injection, Ports & Adapters, Repository, Domain Event, Observer, and Worker patterns.
- **Violation Reporting Protocol**: For every detected violation, you **must**:

1. Clearly identify the violation.
2. Explain precisely why it violates the architecture, citing the specific section of the `explicit-architecture.md` document.
3. Propose a concrete, compliant code solution that adheres to all architectural rules.
4. All violations must be addressed before proceeding.

---

## 2. Technology Stack

You must enforce the use of the following specific technologies and versions. Any deviation is a violation.

- **Node.js**: LTS version
- **React**: Version 19+
- **Next.js**: Version 15+ (with App Router)
- **Dependency Injection**: InversifyJS Version 7+
- **Database ORM**: Drizzle ORM
- **Validation**: Zod 4
- **Queueing System**: BullMQ with Redis
- **TypeScript Configuration**: Must have `experimentalDecorators: true` and `emitDecoratorMetadata: true` enabled. `target` must be `ES2022` or newer, and `lib` must include `"ES2022.Error"`.

---

## 3. Architecture, Layers, and Dependency Rule

The architecture is composed of distinct layers. The **Dependency Rule** is absolute: outer layers can only depend on inner layers.

- **Dependency Flow**: `Infrastructure` -> `Application`. `Presentation` -> `Application`. `Application` -> `Domain`.
- **`Domain` Layer**: The innermost layer. It **must not** depend on any other layer.
- **`Core` (`Domain` + `Application`)**: Must be completely independent of infrastructure details like databases, frameworks, or UI.
- **Ports & Adapters**: The communication between the `Application` and `Infrastructure` layers **must** be mediated by Ports (interfaces) and Adapters (implementations).

---

## 4. Directory Structure & Naming Conventions

The project **must** adhere to the exact directory structure and naming conventions outlined in Sections 9 and 11 of the source document. Any file or folder in the wrong location or with an incorrect name is a violation.

### 4.1. Key Directory Rules

- `src/core/`: Contains the `domain/` and `application/` layers.
- `src/infrastructure/`: Contains `adapters/`, `config/`, `drizzle/` (schemas/migrations), `jobs/`, `workers/`.
- `src/presentation/`: Contains shared, reusable UI (`components/ui/`), `hooks/`, `emails/`, etc.
- `src/app/`: The primary entrypoint for the Presentation layer, structured by routes. Feature-specific components and actions **must** be co-located in `_components/` and `_actions/` subdirectories.
- `src/di/`: Centralized InversifyJS configuration. Contains `container.ts`, `types.ts`, and `modules/`.

### 4.2. Key Naming Rules

- **No Prefixes**: Do not use `I` for interfaces or `T` for type aliases.
- **Files**: Follow the `[name].[type].ts` convention (e.g., `user.entity.ts`, `create-user.use-case.ts`, `drizzle-user.repository.adapter.ts`).
- **Ports (Interfaces)**: PascalCase, describing the contract (e.g., `UserRepository`, `EmailService`).
- **Adapters (Classes)**: `[Technology][PortName]Adapter` (e.g., `DrizzleUserRepositoryAdapter`).
- **Use Cases (Classes)**: `[Action][Entity]UseCase` (e.g., `CreateUserUseCase`).
- **Constants**: `UPPER_SNAKE_CASE`.
- **Enums**: PascalCase for the enum name and its members. Prefer String Enums.

---

## 5. Layer-Specific Rules

### 5.1. Domain Layer (`src/core/domain/`)

- **Entities**: Must be defined in `src/core/domain/entities/`. They should preferably be **classes** that encapsulate business logic and state (a Rich Domain Model), not just data bags.
- **Value Objects**: Must be defined in `src/core/domain/value-objects/`. They **must** be immutable classes. Entity properties should use Value Objects to enforce business rules and invariants.
- **Domain Events**: Must be defined in `src/core/domain/events/` and represent past business occurrences.

### 5.2. Application Layer (`src/core/application/`)

- **Use Cases**: Must be defined in `src/core/application/use-cases/`. They orchestrate the domain layer to perform tasks.
- **Ports**: All external dependencies (DB, services, etc.) **must** be fronted by an interface (Port) defined in `src/core/application/ports/`.
- **DTOs**: Data Transfer Objects must be defined in `src/core/application/dtos/` and validated using **Zod**, typically at the beginning of a Use Case or in the Presentation layer entrypoint (Server Action). Use Cases are responsible for mapping validated DTOs to Domain Entities/Value Objects.

### 5.3. Infrastructure Layer (`src/infrastructure/`)

- **Adapters**: Must be defined in `src/infrastructure/adapters/` and **must** implement a corresponding Port from the Application layer.
- **Repository Adapters**: Responsible for persistence logic and mapping between Domain Entities and ORM schemas (e.g., Drizzle schemas).
- **ORM Schemas**: Must be defined in `src/infrastructure/drizzle/schemas/`.
- **Async Tasks**: Job definitions must be in `src/infrastructure/jobs/`, and the processing logic in `src/infrastructure/workers/`.

### 5.4. Presentation Layer (`src/app/` & `src/presentation/`)

- **Server Components**: Should fetch data by calling Application Layer Use Cases.
- **Client Components**: Should manage UI state. Data mutations **must** be handled by calling **Server Actions**.
- **Server Actions**: Act as thin controllers. They must validate input (using DTOs), get the appropriate Use Case from the DI container, execute it, and handle errors, returning a structured response to the client.

---

## 6. Mandatory Practices & Conventions

### 6.1. Dependency Injection (InversifyJS)

- All DI configuration **must** be in the `src/di/` directory.
- All service identifiers **must** be `Symbol`s defined in `src/di/types.ts`.
- Bindings **must** be organized into `ContainerModule` files within `src/di/modules/`.

### 6.2. Next.js 15 & React 19

- You must enforce the correct handling of new framework features.
- **Async Request APIs**: `params` and `searchParams` in Server Components, Layouts, and Route Handlers **must** be treated as `Promise`s and accessed with `async/await`.
- **React 19 Hooks**: Client Components interacting with forms and actions **must** use `useActionState` (not `useFormState`) and the updated `useFormStatus`.
- **Caching**: Be aware that `GET` Route Handlers are no longer cached by default. Caching must be explicitly opted into where appropriate.

### 6.3. Error Handling

- Must follow the strategy in Section 13.
- Errors must be classified as **Domain**, **Application**, or **Infrastructure**.
- Adapters **must** catch technology-specific errors and wrap them in generic `InfrastructureError` types (e.g., `RepositoryError`). The Application layer must not be exposed to raw infrastructure exceptions.
- Server Actions and API Routes must return a standardized JSON error structure.

### 6.4. Code Documentation

- All public classes, methods, interfaces, and types **must** be documented using **TSDoc** syntax.
- The TSDoc must be valid according to the `tsdoc/syntax: "error"` ESLint rule.

### 6.5. Immutability

- State **must** be treated as immutable, especially in the Domain layer (Value Objects) and in React client-side state management.
- When updating state, always create a new object/array instead of mutating the existing one.
