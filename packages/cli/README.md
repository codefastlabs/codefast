# @codefast/cli

Command line interface tools for CodeFast development, built with explicit architecture principles.

## Overview

The CodeFast CLI is a TypeScript-based command-line tool designed to analyze and validate CodeFast projects. It provides powerful analysis capabilities for TypeScript projects and React component type checking, following explicit architecture guidelines for maintainability, testability, and scalability.

## Features

- **TypeScript Project Analysis**: Analyze TypeScript codebases and generate detailed statistics
- **React Component Type Checking**: Validate React component type correspondence across packages
- **Explicit Architecture**: Clean, maintainable codebase following DDD and SOLID principles
- **Dependency Injection**: Fully testable with InversifyJS container
- **Rich CLI Experience**: Colorful output with chalk and comprehensive help system

## Installation

```bash
# Install globally
npm install -g @codefast/cli

# Or use with npx
npx @codefast/cli --help
```

## Usage

### Available Commands

#### Hello Command

```bash
codefast hello [options]
codefast hello --name "Developer"
```

Simple greeting command for testing CLI functionality.

**Options:**

- `-n, --name <name>`: Name to greet (default: "World")

#### Analyze Command

```bash
codefast analyze [options]
codefast analyze --pattern "src/**/*.ts" --config "./tsconfig.json"
```

Analyze TypeScript project and generate statistics about classes, functions, and interfaces.

**Options:**

- `-p, --pattern <pattern>`: File pattern to analyze (default: "src/**/*.ts")
- `-c, --config <path>`: Path to tsconfig.json file

**Example Output:**

```
🔍 Analyzing TypeScript project...
✅ Found 45 TypeScript files
⚠️  Loaded 45 source files for analysis
📊 Project Statistics:
  Classes: 12
  Functions: 89
  Interfaces: 23
```

#### Check Component Types Command

```bash
codefast check-component-types [options]
codefast check-component-types --packages-dir "packages"
```

Check React component type correspondence across packages in a monorepo.

**Options:**

- `-d, --packages-dir <dir>`: Packages directory to analyze (default: "packages")

## Architecture

This CLI follows **Explicit Architecture** principles, ensuring clear separation of concerns, testability, and maintainability.

### Directory Structure

```
src/
├── core/                           # Core business logic
│   └── application/               # Application layer
│       ├── ports/                 # Interface definitions
│       │   ├── analysis/          # Analysis service interfaces
│       │   ├── services/          # Service interfaces
│       │   └── system/            # System service interfaces
│       └── use-cases/             # Business workflows
├── infrastructure/                # Technical implementations
│   └── adapters/                  # Port implementations
│       ├── analysis/              # Analysis service adapters
│       ├── services/              # Service adapters
│       └── system/                # System service adapters
├── commands/                      # CLI command handling
├── di/                           # Dependency injection
│   └── modules/                  # DI module configurations
└── index.ts                      # CLI entry point
```

### Architectural Layers

#### 1. Core/Application Layer

Contains business logic and defines interfaces (ports) for external dependencies.

**Use Cases:**

- `AnalyzeProjectUseCase`: Orchestrates TypeScript project analysis
- `CheckComponentTypesUseCase`: Handles React component type validation
- `GreetUserUseCase`: Simple greeting functionality

**Ports (Interfaces):**

- **Analysis Ports**: `TypeScriptAnalysisPort`, `ComponentAnalysisPort`
- **Service Ports**: `LoggingServicePort`
- **System Ports**: `FileSystemSystemPort`, `PathSystemPort`, `UrlSystemPort`

#### 2. Infrastructure Layer

Implements the ports using concrete technologies and external libraries.

**Adapters:**

- `TsMorphTypescriptAnalysisAdapter`: TypeScript analysis using ts-morph
- `ReactComponentAnalysisAdapter`: React component analysis
- `ChalkLoggingServiceAdapter`: Colored console logging with chalk
- `FastGlobFileSystemSystemAdapter`: File system operations with fast-glob
- `NodePathSystemAdapter`: Path operations using Node.js path module
- `NodeUrlSystemAdapter`: URL operations using Node.js url module

#### 3. Commands Layer

Handles CLI interface using Commander.js framework.

- `CommandHandler`: Main command orchestrator with dependency injection

#### 4. Dependency Injection Layer

Manages dependencies using InversifyJS container.

**Modules:**

- `infrastructureModule`: Binds infrastructure adapters
- `applicationModule`: Binds use cases and application services
- `commandsModule`: Binds command handlers

### Key Design Principles

1. **Dependency Inversion**: All dependencies flow inward toward the core business logic
2. **Interface Segregation**: Small, focused interfaces for each concern
3. **Single Responsibility**: Each class has one reason to change
4. **Testability**: All dependencies are injected and can be mocked
5. **Explicit Dependencies**: No hidden dependencies or global state

## Development

### Prerequisites

- Node.js 20.0.0+
- pnpm 10.13.1+

### Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run in development mode
pnpm dev
```

### Available Scripts

```bash
# Development
pnpm dev                    # Build and watch for changes
pnpm build                  # Build for production
pnpm clean                  # Clean build artifacts

# Code Quality
pnpm lint                   # Run ESLint
pnpm lint:fix              # Fix ESLint issues
pnpm type-check            # TypeScript type checking
pnpm format                # Format code with Prettier
pnpm format:check          # Check code formatting

# Testing
pnpm test                  # Run tests
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Run tests with coverage
pnpm test:coverage:ci     # Run tests with CI coverage
```

### Testing Strategy

The CLI follows a comprehensive testing approach aligned with the explicit architecture:

#### Unit Testing

- **Domain/Application Layer**: Test use cases with mocked ports
- **Infrastructure Layer**: Test adapters with real or mocked external dependencies
- **Commands Layer**: Test command handlers with mocked use cases

#### Test Structure

```
src/
├── core/application/use-cases/
│   ├── analyze-project.use-case.ts
│   └── analyze-project.use-case.test.ts
├── infrastructure/adapters/
│   ├── ts-morph.typescript.analysis.adapter.ts
│   └── ts-morph.typescript.analysis.adapter.test.ts
└── commands/
    ├── command-handler.ts
    └── command-handler.test.ts
```

#### Testing Best Practices

- Mock at the port boundaries (interfaces)
- Use dependency injection for test isolation
- Test business logic independently of technical details
- Maintain high coverage for critical paths

### Adding New Features

#### 1. Define the Port (Interface)

```typescript
// src/core/application/ports/new-feature.port.ts
export interface NewFeaturePort {
  performAction(input: string): Promise<string>;
}
```

#### 2. Create the Use Case

```typescript
// src/core/application/use-cases/new-feature.use-case.ts
@injectable()
export class NewFeatureUseCase {
  constructor(
    @inject(TYPES.NewFeaturePort)
    private readonly newFeatureService: NewFeaturePort,
  ) {}

  async execute(input: string): Promise<void> {
    const result = await this.newFeatureService.performAction(input);
    // Handle result...
  }
}
```

#### 3. Implement the Adapter

```typescript
// src/infrastructure/adapters/new-feature.adapter.ts
@injectable()
export class NewFeatureAdapter implements NewFeaturePort {
  async performAction(input: string): Promise<string> {
    // Implementation using external library
    return `Processed: ${ input }`;
  }
}
```

#### 4. Configure Dependency Injection

```typescript
// src/di/types.ts
export const TYPES = {
  // ... existing types
  NewFeaturePort: Symbol.for('NewFeaturePort'),
  NewFeatureUseCase: Symbol.for('NewFeatureUseCase'),
};

// src/di/modules/infrastructure.module.ts
infrastructureModule.bind<NewFeaturePort>(TYPES.NewFeaturePort).to(NewFeatureAdapter);

// src/di/modules/application.module.ts
applicationModule.bind<NewFeatureUseCase>(TYPES.NewFeatureUseCase).to(NewFeatureUseCase);
```

#### 5. Add CLI Command

```typescript
// src/commands/command-handler.ts
this.program.command('new-feature').description('Description of new feature').action(async (options) => {
  await this.newFeatureUseCase.execute(options.input);
});
```

## Dependencies

### Core Dependencies

- **chalk**: Terminal styling and colors
- **commander**: CLI framework and argument parsing
- **fast-glob**: Fast file globbing for file system operations
- **inversify**: Dependency injection container
- **reflect-metadata**: Metadata reflection for decorators
- **ts-morph**: TypeScript compiler API wrapper
- **zod**: Schema validation and type safety

### Development Dependencies

- **@rslib/core**: Modern build tool for libraries
- **TypeScript**: Type checking and compilation
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Contributing

1. Follow the explicit architecture guidelines
2. Write tests for new features
3. Ensure all quality checks pass (`pnpm lint`, `pnpm type-check`, `pnpm test`)
4. Update documentation for new commands or features

## License

MIT License - see LICENSE file for details.

## Related

- [CodeFast UI Components](../ui/README.md)
- [Explicit Architecture Guidelines](../../.junie/explicit-architecture-guidelines.md)
