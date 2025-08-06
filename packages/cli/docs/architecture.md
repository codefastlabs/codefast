# CLI Architecture Design

## Overview
The CLI follows Explicit Architecture principles with bounded contexts for maintainability and extensibility.

## Bounded Contexts

### 1. Component Validation Context
- **Purpose**: Validate React components follow project standards
- **Domain**: Component export patterns, naming conventions, structure validation
- **Use Cases**: 
  - Check named exports for components and interfaces
  - Validate component structure
  - Report violations

### 2. CLI Infrastructure Context
- **Purpose**: Handle CLI operations, commands, and user interaction
- **Domain**: Command parsing, output formatting, error handling
- **Use Cases**:
  - Parse CLI arguments
  - Execute commands
  - Format and display results

## Architecture Layers

### Application Core
```
src/
├── domain/                     # Domain Layer
│   ├── component-validation/   # Component Validation Bounded Context
│   │   ├── entities/
│   │   │   ├── component.ts
│   │   │   └── validation-result.ts
│   │   ├── value-objects/
│   │   │   ├── export-pattern.ts
│   │   │   └── component-path.ts
│   │   └── services/
│   │       └── component-validator.service.ts
│   └── shared/                 # Shared Domain
│       ├── errors/
│       └── types/
├── application/                # Application Layer
│   ├── use-cases/
│   │   ├── validate-components.use-case.ts
│   │   └── scan-project.use-case.ts
│   ├── ports/                  # Ports (Interfaces)
│   │   ├── file-system.port.ts
│   │   ├── typescript-parser.port.ts
│   │   └── output-formatter.port.ts
│   └── dto/
│       ├── validation-request.dto.ts
│       └── validation-response.dto.ts
└── infrastructure/             # Infrastructure Layer (Adapters)
    ├── adapters/
    │   ├── file-system.adapter.ts
    │   ├── ts-morph.adapter.ts
    │   └── console-output.adapter.ts
    ├── cli/
    │   ├── commands/
    │   │   └── validate-components.command.ts
    │   └── cli.ts
    └── di/
        └── container.ts
```

### Dependency Flow
- Infrastructure → Application → Domain
- Ports defined in Application layer
- Adapters implement Ports
- Domain is pure business logic

## Command Structure

### Primary Command: `validate-components`
```bash
codefast validate-components [options]
```

Options:
- `--path <path>`: Target directory (default: current directory)
- `--pattern <pattern>`: File pattern to match (default: **/*.tsx)
- `--fix`: Auto-fix violations where possible
- `--format <format>`: Output format (table, json, junit)

## Implementation Plan

1. **Domain Layer**: Define entities, value objects, and domain services
2. **Application Layer**: Create use cases and define ports
3. **Infrastructure Layer**: Implement adapters and CLI commands
4. **Dependency Injection**: Set up IoC container with inversify
5. **Testing**: Unit tests for each layer
