# Giải Pháp Tổ Chức Command Scalable cho packages/cli

## Tóm Tắt Vấn Đề

Trong bối cảnh **Explicit Architecture**, khi mở rộng về số lượng command thì cần một giải pháp để tổ chức các file `*.command.ts` trong `packages/cli` một cách có hệ thống và scalable.

## Giải Pháp Đã Triển Khai

### 1. Cấu Trúc Thư Mục Mới

```text
packages/cli/src/commands/
├── interfaces/
│   └── command.interface.ts          # Interface cơ bản cho tất cả commands
├── implementations/
│   ├── hello.command.ts              # Command implementation riêng biệt
│   ├── analyze.command.ts            # Command implementation riêng biệt
│   ├── check-component-types.command.ts  # Command implementation riêng biệt
│   └── [future-commands].command.ts  # Các command tương lai
├── registry/
│   └── command.registry.ts           # Hệ thống discovery và registration
└── command-handler.ts                # Handler chính sử dụng registry
```

### 2. Các Thành Phần Chính

#### A. Command Interface (`interfaces/command.interface.ts`)

- Định nghĩa contract cho tất cả commands
- Đảm bảo tính nhất quán và type safety

#### B. Command Registry (`registry/command.registry.ts`)

- Tự động discovery commands sử dụng InversifyJS `multiInject`
- Quản lý việc đăng ký commands
- Hỗ trợ metadata và categorization

#### C. Individual Command Implementations (`implementations/*.command.ts`)

- Mỗi command là một class riêng biệt
- Implement `CommandInterface`
- Sử dụng Dependency Injection cho use cases
- Naming convention: `[name].command.ts`

#### D. Updated Command Handler (`command-handler.ts`)

- Sử dụng `CommandRegistry` thay vì hardcode commands
- Tự động register tất cả commands từ registry
- Tuân thủ Open/Closed Principle

### 3. Cấu Hình Dependency Injection

#### Updated Types (`di/types.ts`)

```typescript
export const TYPES = {
  // ... existing types
  Command: Symbol.for("Command"),
  CommandRegistry: Symbol.for("CommandRegistry"),
  CommandHandler: Symbol.for("CommandHandler"),
} as const;
```

#### Updated Commands Module (`di/modules/commands.module.ts`)

```typescript
export const commandsModule = new ContainerModule((options) => {
  // Command Registry
  options.bind<CommandRegistry>(TYPES.CommandRegistry).to(CommandRegistry);

  // Command Handler
  options.bind<CommandHandler>(TYPES.CommandHandler).to(CommandHandler);

  // Individual Commands (tự động discovery)
  options.bind<CommandInterface>(TYPES.Command).to(HelloCommand);
  options.bind<CommandInterface>(TYPES.Command).to(AnalyzeCommand);
  options.bind<CommandInterface>(TYPES.Command).to(CheckComponentTypesCommand);
});
```

## Cách Thêm Command Mới

### Bước 1: Tạo Command Implementation

```typescript
// packages/cli/src/commands/implementations/new-command.command.ts
@injectable()
export class NewCommand implements CommandInterface {
  readonly name = "new-command";
  readonly description = "Description of new command";

  constructor(
    @inject(TYPES.YourUseCase)
    private readonly yourUseCase: YourUseCase,
  ) {}

  register(program: Command): void {
    program.command(this.name).description(this.description).option("-o, --option <value>", "option description").action(async (options) => {
      await this.yourUseCase.execute(options);
    });
  }
}
```

### Bước 2: Đăng Ký trong DI Container

```typescript
// Trong commands.module.ts
options.bind<CommandInterface>(TYPES.Command).to(NewCommand);
```

### Bước 3: Hoàn Thành!

Command sẽ tự động được discovery và register. Không cần sửa code existing.

## Nguyên Lý Explicit Architecture Được Áp Dụng

### 1. **Open/Closed Principle**

- Thêm commands mới mà không sửa existing code
- Extension through composition và DI

### 2. **Single Responsibility Principle**

- Mỗi command có một responsibility duy nhất
- Tách biệt command logic và business logic

### 3. **Dependency Inversion Principle**

- Commands phụ thuộc vào abstractions (use cases)
- Không phụ thuộc vào concrete implementations

### 4. **Interface Segregation Principle**

- Command interface nhỏ và focused
- Clients chỉ phụ thuộc vào những gì họ cần

## Lợi Ích Của Giải Pháp

### 1. **Scalability**

- Thêm unlimited commands mà không modify existing code
- Mỗi command isolated và independently testable
- Clear separation of concerns

### 2. **Maintainability**

- Dễ tìm và modify specific commands
- Consistent structure across commands
- Self-documenting organization

### 3. **Testability**

- Unit test từng command riêng biệt
- Mock dependencies dễ dàng với DI
- Test command registration separately

### 4. **Flexibility**

- Commands có thể có complexity levels khác nhau
- Dễ thêm command-specific options
- Support async/sync operations

## Kết Quả Testing

### Build Success

```bash
✓ TypeScript compilation successful
✓ All command files compiled correctly
✓ Declaration files generated
```

### CLI Functionality

```bash
$ node dist/esm/index.js --help
Usage: codefast [options] [command]
CLI tools for CodeFast development
Commands:
  hello [options]                  Say hello
  analyze [options]                Analyze TypeScript project
  check-component-types [options]  Check React component type correspondence

$ node dist/esm/index.js hello --name "CodeFast"
✓ Hello, CodeFast!
```

## Kết Luận

Giải pháp này cung cấp một cách tiếp cận scalable và maintainable để tổ chức commands trong CLI package, tuân thủ hoàn toàn các nguyên lý của Explicit Architecture:

- **Zero modification** cần thiết khi thêm commands mới
- **Automatic discovery** và registration
- **Clear architectural boundaries** giữa các layers
- **Type-safe** implementation với TypeScript
- **Comprehensive testing** support

Đây là một implementation mẫu mực của Explicit Architecture trong context của CLI application, có thể scale từ vài commands đến hàng trăm commands mà vẫn duy trì chất lượng code và tính integrity của architecture.
