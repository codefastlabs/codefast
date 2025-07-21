# Scalable Command Organization in CLI Package

## Overview

This document explains how to organize CLI commands in the `packages/cli` following **Explicit Architecture** principles. The solution provides a scalable approach for managing multiple `*.command.ts` files without modifying existing code when adding new commands.

## Architecture Principles Applied

- **Open/Closed Principle**: Add new commands without modifying existing code
- **Single Responsibility Principle**: Each command has one specific responsibility
- **Dependency Inversion Principle**: Commands depend on abstractions (use cases) not concrete implementations
- **Interface Segregation Principle**: Clear command interface contract

## Directory Structure

```text
packages/cli/src/commands/
├── interfaces/
│   └── command.interface.ts          # Base interface for all commands
├── implementations/
│   ├── hello.command.ts              # Hello command implementation
│   ├── analyze.command.ts            # Analyze command implementation
│   ├── check-component-types.command.ts  # Check component types command
│   └── [new-command].command.ts      # Future commands follow this pattern
├── registry/
│   └── command.registry.ts           # Command discovery and registration
└── command-handler.ts                # Main command handler using registry
```

## Key Components

### 1. Command Interface (`interfaces/command.interface.ts`)

Defines the contract that all commands must implement:

```typescript
export interface CommandInterface {
  readonly name: string;
  readonly description: string;

  register(program: Command): void;
}
```

### 2. Command Registry (`registry/command.registry.ts`)

Automatically discovers and manages all registered commands using InversifyJS's `multiInject`:

```typescript

@injectable()
export class CommandRegistry {
  constructor(
    @multiInject(TYPES.Command) private readonly commandList: CommandInterface[],
  ) {
    this.registerCommands();
  }
}
```

### 3. Individual Command Implementations

Each command is a separate class following the naming convention `[name].command.ts`:

```typescript

@injectable()
export class HelloCommand implements CommandInterface {
  readonly name = "hello";
  readonly description = "Say hello";

  constructor(
    @inject(TYPES.GreetUserUseCase)
    private readonly greetUserUseCase: GreetUserUseCase,
  ) {}

  register(program: Command): void {
    program.command(this.name).description(this.description).option("-n, --name <name>", "name to greet", "World").action((options: { name: string }) => {
      this.greetUserUseCase.execute({ name: options.name });
    });
  }
}
```

## How to Add a New Command

### Step 1: Create Command Implementation

Create a new file `packages/cli/src/commands/implementations/[command-name].command.ts`:

```typescript
/**
 * [CommandName] Command
 *
 * CLI command for [description].
 * Following explicit architecture guidelines for command organization.
 */

import type { Command } from "commander";
import { inject, injectable } from "inversify";

import type { CommandInterface } from "@/commands/interfaces/command.interface";
import type {

[YourUseCase]
}
from
"@/core/application/use-cases/[your-use-case]";
import { TYPES } from "@/di/types";

@injectable()
export class

[CommandName]
Command
implements
CommandInterface
{
  readonly
  name = "[command-name]";
  readonly
  description = "[Command description]";

  constructor(
    @inject(TYPES.[YourUseCase])
private readonly
  [yourUseCase]
:
  [YourUseCase],
)
  {}

  register(program
:
  Command
):
  void {
    program
    .command(this.name).description(this.description).option("-o, --option <value>", "option description", "default").action(async (options: { option?: string }) => {
      await this.[yourUseCase].execute({
        option: options.option,
      });
    });
  }
}
```

### Step 2: Register Command in DI Container

Add the command binding to `packages/cli/src/di/modules/commands.module.ts`:

```typescript
import {

[CommandName]
Command
}
from
"@/commands/implementations/[command-name].command";

export const commandsModule = new ContainerModule((options) => {
  // ... existing bindings

  // Add your new command
  options.bind<CommandInterface>(TYPES.Command).to([CommandName]
  Command
)
  ;
});
```

### Step 3: That's It!

The command will be automatically discovered and registered by the `CommandRegistry`. No need to modify the `CommandHandler` or any other existing code.

## Benefits of This Approach

### 1. **Scalability**

- Add unlimited commands without modifying existing code
- Each command is isolated and independently testable
- Clear separation of concerns

### 2. **Maintainability**

- Easy to find and modify specific commands
- Consistent structure across all commands
- Self-documenting code organization

### 3. **Testability**

- Each command can be unit tested in isolation
- Mock dependencies easily with DI
- Test command registration separately from business logic

### 4. **Flexibility**

- Commands can have different complexity levels
- Easy to add command-specific options and validation
- Support for async/sync operations

## Example: Adding a "Build" Command

1. **Create the command file** `packages/cli/src/commands/implementations/build.command.ts`:

```typescript

@injectable()
export class BuildCommand implements CommandInterface {
  readonly name = "build";
  readonly description = "Build the project";

  constructor(
    @inject(TYPES.BuildProjectUseCase)
    private readonly buildProjectUseCase: BuildProjectUseCase,
  ) {}

  register(program: Command): void {
    program.command(this.name).description(this.description).option("-e, --env <environment>", "build environment", "production").option("--watch", "watch for changes").action(async (options: { env?: string; watch?: boolean }) => {
      await this.buildProjectUseCase.execute({
        environment: options.env,
        watch: options.watch,
      });
    });
  }
}
```

2. **Register in DI container**:

```typescript
// In commands.module.ts
options.bind<CommandInterface>(TYPES.Command).to(BuildCommand);
```

3. **Done!** The command is now available: `codefast build --env development --watch`

## Advanced Features

### Command Categories

Commands can be organized by categories for better help display:

```typescript
export interface CommandMetadata {
  name: string;
  description: string;
  category?: string;  // e.g., "development", "analysis", "build"
  priority?: number;  // For ordering in help
}
```

### Command Validation

Add input validation using Zod schemas:

```typescript
import { z } from "zod";

const BuildOptionsSchema = z.object({
  env: z.enum(["development", "production", "test"]).default("production"),
  watch: z.boolean().default(false),
});

// In command action
const validatedOptions = BuildOptionsSchema.parse(options);
```

### Command Middleware

Add common functionality like logging, error handling:

```typescript
register(program
:
Command
):
void {
  program
  .command(this.name).description(this.description).hook('preAction', (thisCommand, actionCommand) => {
    // Pre-execution logic
  }).action(async (options) => {
    try {
      await this.buildProjectUseCase.execute(options);
    } catch (error) {
      // Error handling
    }
  });
}
```

## Testing Commands

### Unit Testing Individual Commands

```typescript
describe('BuildCommand', () => {
  let command: BuildCommand;
  let mockUseCase: jest.Mocked<BuildProjectUseCase>;
  let mockProgram: jest.Mocked<Command>;

  beforeEach(() => {
    mockUseCase = createMock<BuildProjectUseCase>();
    command = new BuildCommand(mockUseCase);
    mockProgram = createMock<Command>();
  });

  it('should register command with correct options', () => {
    command.register(mockProgram);

    expect(mockProgram.command).toHaveBeenCalledWith('build');
    expect(mockProgram.description).toHaveBeenCalledWith('Build the project');
  });
});
```

### Integration Testing with Registry

```typescript
describe('CommandRegistry', () => {
  it('should discover and register all commands', () => {
    const container = createTestContainer();
    const registry = container.get<CommandRegistry>(TYPES.CommandRegistry);

    expect(registry.hasCommand('hello')).toBe(true);
    expect(registry.hasCommand('analyze')).toBe(true);
    expect(registry.hasCommand('build')).toBe(true);
  });
});
```

## Conclusion

This scalable command organization approach follows Explicit Architecture principles and provides:

- **Zero modification** needed to existing code when adding commands
- **Clear separation** between command handling and business logic
- **Automatic discovery** and registration of commands
- **Consistent patterns** for all command implementations
- **Easy testing** and maintenance

The solution scales from a few commands to hundreds while maintaining code quality and architectural integrity.
