# CLI Package — Tài Liệu Đặc Tả Chi Tiết

> **Mục đích:** Tài liệu này mô tả toàn bộ kiến trúc, luồng xử lý, cấu trúc dữ liệu và các quyết định thiết kế của `packages/cli/src`. Không chứa code. Dùng làm cơ sở tái cấu trúc.

---

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu Trúc Thư Mục](#2-cấu-trúc-thư-mục)
3. [Bootstrap & Entry Point](#3-bootstrap--entry-point)
4. [Shell — Hạ Tầng Chung](#4-shell--hạ-tầng-chung)
5. [Domain: Arrange](#5-domain-arrange)
6. [Domain: Mirror](#6-domain-mirror)
7. [Domain: Tag](#7-domain-tag)
8. [Config System](#8-config-system)
9. [Cấu Trúc Dữ Liệu Cốt Lõi](#9-cấu-trúc-dữ-liệu-cốt-lõi)
10. [Luồng Xử Lý Chính](#10-luồng-xử-lý-chính)
11. [Các Pattern & Quyết Định Thiết Kế](#11-các-pattern--quyết-định-thiết-kế)
12. [Bản Đồ Phụ Thuộc Module](#12-bản-đồ-phụ-thuộc-module)
13. [Bất Biến Hệ Thống](#13-bất-biến-hệ-thống)

---

## 1. Tổng Quan Kiến Trúc

Đây là một **CLI monorepo tool** được xây dựng theo kiến trúc **Hexagonal (Ports & Adapters)** kết hợp với **DI Container** (dependency injection). Hệ thống gồm:

- **1 shell module** chứa hạ tầng chung (filesystem, logging, runtime, telemetry, error handling)
- **3 domain module** độc lập (arrange, mirror, tag), mỗi domain là một tập lệnh CLI riêng
- **1 hệ thống config** dùng chung cho cả 3 domain

**Triết lý thiết kế:**

- Mọi I/O đều đi qua Port interface — không bao giờ gọi trực tiếp `fs`, `process`, hay `console`
- Domain logic (algorithms) hoàn toàn thuần túy (pure) — không có side effect, không có I/O
- Use-case layer điều phối, không chứa logic nghiệp vụ
- Lỗi được truyền qua `Result<T, AppError>` thay vì throw exception

---

## 2. Cấu Trúc Thư Mục

```
packages/cli/src/
├── bin.ts                          # Điểm vào thực thi (executable entry point)
├── program.ts                      # Khởi tạo Commander.js và DI container
│
├── bootstrap/                      # Wiring DI container
│   ├── cli-application.module.ts   # Root module — đăng ký 3 domain
│   ├── composition-root.ts         # Factory tạo container và resolve commands
│   └── register-cli-command-trees.ts # Gắn CommandTree vào Commander.js
│
├── shell/                          # Hạ tầng chung (cross-cutting concerns)
│   ├── shell.module.ts
│   ├── application/
│   │   ├── cli-runtime.tokens.ts
│   │   ├── global-cli-options.model.ts
│   │   ├── coordination/           # Error handling + schema validation contracts
│   │   ├── services/               # CliExecutorService, SchemaValidatorService
│   │   ├── use-cases/              # LoadCodefastConfigUseCase
│   │   └── ports/
│   │       ├── primary/            # CommandPort (inbound từ Commander.js)
│   │       ├── inbound/            # LoadCodefastConfigPort
│   │       └── outbound/           # FilesystemPort, LoggerPort, RuntimePort, ...
│   ├── domain/
│   │   ├── result.model.ts         # Result<T, E> type
│   │   ├── errors.domain.ts        # AppError class
│   │   ├── cli-exit-codes.domain.ts
│   │   ├── cli-positional-arg.value-object.ts
│   │   ├── caught-unknown-message.value-object.ts
│   │   └── source-text-edit.support.ts
│   ├── infrastructure/
│   │   ├── node/                   # Node.js adapters (fs, path, process, logger)
│   │   ├── commander/              # Commander.js adapter
│   │   ├── telemetry/              # Telemetry adapter
│   │   ├── adapters/               # Misc adapters (error formatter, repo root, TS walker)
│   │   └── workspace/              # pnpm workspace layout adapter
│   ├── contracts/
│   │   └── cli-command-slots.ts    # Slot name constants
│   ├── composition/
│   │   └── tokens.ts               # CommandPortToken
│   └── wiring/
│       └── optional-cli-port-telemetry-activation.ts  # Telemetry middleware
│
├── domains/
│   ├── config/                     # Config system dùng chung
│   │   ├── domain/                 # Schema interfaces + Zod schemas
│   │   ├── application/ports/outbound/  # ConfigLoaderPort, ConfigWarningReporterPort, ConfigSchemaPort
│   │   └── infrastructure/adapters/    # ConfigLoaderAdapter, ZodSchemaAdapter, WarningReporterAdapter
│   │
│   ├── arrange/                    # Domain: nhóm Tailwind classes
│   │   ├── presentation/cli/       # ArrangeCommand (4 subcommands)
│   │   ├── presentation/presenters/
│   │   ├── application/
│   │   │   ├── use-cases/          # Analyze, PrepareWorkspace, RunSync, SuggestGroups
│   │   │   ├── requests/           # Input DTOs
│   │   │   └── ports/              # Inbound + Outbound + Presenting
│   │   ├── domain/
│   │   │   ├── types.domain.ts
│   │   │   ├── ast/                # Pure domain AST (không phụ thuộc TypeScript compiler)
│   │   │   ├── grouping.domain.ts  # Pure algorithm: suggestCnGroups()
│   │   │   ├── arrange-analyze.domain-service.ts
│   │   │   ├── arrange-grouping.domain-service.ts
│   │   │   ├── tailwind-grouping.domain-service.ts
│   │   │   └── tailwind-token-classifier.domain-service.ts
│   │   ├── infrastructure/
│   │   │   ├── typescript-ast-translator.ts  # Anti-corruption layer: ts.Node → DomainAstNode
│   │   │   └── adapters/
│   │   ├── composition/tokens.ts
│   │   └── contracts/models.ts
│   │
│   ├── mirror/                     # Domain: đồng bộ package.json exports
│   │   ├── presentation/
│   │   ├── application/
│   │   │   ├── use-cases/          # PrepareMirrorSync, RunMirrorSync
│   │   │   └── ports/
│   │   ├── domain/
│   │   │   ├── types.domain.ts     # ExportMapData, MirrorPackageMeta, GlobalStats
│   │   │   ├── generate-mirror-exports.domain-service.ts
│   │   │   ├── path-normalizer.value-object.ts
│   │   │   └── package-display-name.policy.ts
│   │   ├── infrastructure/adapters/
│   │   ├── composition/tokens.ts
│   │   └── contracts/models.ts
│   │
│   └── tag/                        # Domain: thêm @since JSDoc tags
│       ├── presentation/
│       ├── application/
│       │   ├── use-cases/          # PrepareTagSync, RunTagSync
│       │   └── ports/
│       ├── domain/
│       │   └── types.domain.ts     # TagSyncResult, TagFileResult
│       ├── infrastructure/adapters/
│       ├── composition/tokens.ts
│       └── contracts/models.ts
│
└── lib/                            # Utility functions dùng chung
```

---

## 3. Bootstrap & Entry Point

### 3.1 `bin.ts` — Executable Entry Point

**Vai trò:** Điểm vào duy nhất khi Node.js thực thi file. Không chứa logic.

**Hành vi:**

- Gọi `runCli(process.argv)` từ `program.ts`
- Nhận exit code trả về
- Gọi `process.exit(code)`

**Lý do tách riêng:** `program.ts` có thể được test độc lập mà không cần thực sự exit process.

---

### 3.2 `program.ts` — CLI Program Setup

**Vai trò:** Khởi tạo toàn bộ CLI — DI container, Commander.js program, đăng ký commands.

**Hành vi theo thứ tự:**

1. Tạo DI container từ `composition-root.ts`
2. Load `CliApplicationModule` (root module)
3. Chờ container `initializeAsync()` hoàn tất
4. Resolve danh sách `CommandPort[]` từ container
5. Tạo Commander.js program với:
   - Tên: đọc từ package.json
   - Version: đọc từ package.json
   - Global flag: `--no-color`
6. Đăng ký CommandTree vào Commander.js qua `register-cli-command-trees.ts`
7. Gọi `program.parseAsync(argv)`
8. Return `process.exitCode`

---

### 3.3 `bootstrap/cli-application.module.ts` — Root DI Module

**Vai trò:** Module gốc của toàn bộ ứng dụng CLI. Import tất cả domain modules.

**Nội dung:**

- Import `ShellInfrastructureModule`
- Import `ArrangeModule`
- Import `MirrorModule`
- Import `TagModule`
- Import `ConfigModule`

---

### 3.4 `bootstrap/composition-root.ts` — Container Factory

**Vai trò:** Tạo DI container và cung cấp hàm resolve commands.

**Hành vi:**

- Khởi tạo container với root module
- Expose hàm `resolveCommandPorts()` → trả về `CommandPort[]`

---

### 3.5 `bootstrap/register-cli-command-trees.ts` — Commander Registration

**Vai trò:** Nhận danh sách `CommandPort[]`, duyệt từng `CommandTree`, gắn vào Commander.js program.

**Hành vi:**

- Với mỗi `CommandTree` trong danh sách:
  - Tạo Commander `Command` với tên, mô tả, aliases
  - Nếu có `route`: đăng ký positional args và flags
  - Nếu có `action`: wire dispatch handler
  - Nếu có `children`: đệ quy (recursive) đăng ký subcommands
- `LeafDispatchHandler` nhận: `positionalArguments`, `localOptions`, `globalBridge` (object chứa global options như `--no-color`)

---

## 4. Shell — Hạ Tầng Chung

Shell module cung cấp tất cả hạ tầng không thuộc nghiệp vụ cụ thể của bất kỳ domain nào.

### 4.1 Ports (Outbound — Driven)

Mỗi port là một interface mà infrastructure phải implement. Domain và use-case chỉ biết đến port, không biết implementation.

| Port                             | Mô tả                                                 |
| -------------------------------- | ----------------------------------------------------- |
| `CliFilesystemPort`              | Đọc/ghi file, kiểm tra tồn tại, list directory        |
| `CliLoggerPort`                  | In ra stdout (`log`) và stderr (`err`)                |
| `CliRuntimePort`                 | Đặt exit code (`setExitCode`), đọc env vars           |
| `CliPathPort`                    | Thao tác đường dẫn (join, resolve, dirname, basename) |
| `CliTelemetryPort`               | Emit telemetry events (optional)                      |
| `CliVerboseDiagnosticsPort`      | Bật/tắt verbose stack trace mode                      |
| `FormatAppErrorPort`             | Format AppError thành string để hiển thị              |
| `RepoRootResolverPort`           | Tìm thư mục gốc của repo (chứa package.json)          |
| `TypescriptSourceFileWalkerPort` | Duyệt file .ts/.tsx trong directory                   |
| `WorkspacePackageLayoutPort`     | Discover packages trong pnpm workspace                |
| `GlobalCliOptionsParsePort`      | Parse global options từ argv raw                      |

### 4.2 Primary Port (Inbound — Driver)

| Port          | Mô tả                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `CommandPort` | Interface mà mỗi domain command phải implement. Trả về `CommandTree`. |

**`CommandTree` structure:**

- `name`: tên command
- `description`: mô tả
- `aliases`: mảng alias strings
- `route`: mảng `CommandRouteWire` — khai báo positional args và flags
- `action`: handler function khi command được gọi
- `children`: mảng `CommandTree` con (subcommands)

**`CommandRouteWire` types:**

- `optionalPositional`: positional arg tùy chọn
- `greedyPositional`: positional arg lấy tất cả còn lại
- `booleanFlag`: flag boolean (--flag / --no-flag)
- `stringFlag`: flag nhận string value

### 4.3 Domain Objects

#### `Result<T, E>`

Type đại diện cho kết quả có thể thất bại mà không throw exception.

- `{ ok: true; value: T }` — thành công
- `{ ok: false; error: E }` — thất bại với error

Constructor helpers: `ok(value)` và `err(error)`.

#### `AppError`

Class đại diện cho lỗi ứng dụng.

- `code`: `"NOT_FOUND" | "VALIDATION_ERROR" | "INFRA_FAILURE"`
- `message`: string mô tả lỗi
- `cause`: unknown (original error nếu có)

#### Exit Codes

- `0`: Thành công
- `1`: Lỗi chung (general error)
- `2`: Lỗi sử dụng (usage error — sai argument)

#### `CliPositionalArg` Value Object

Wrapper xung quanh string positional argument với helper methods để parse và validate.

#### `CaughtUnknownMessage` Value Object

Trích xuất message từ unknown error (có thể là Error, string, hoặc object bất kỳ).

#### `SourceTextEdit`

Tuple `(start: number, end: number, replacement: string)` đại diện cho một text edit trong source file.

Helper: `applyEditsDescending(edits[], sourceText)` — apply từ cuối lên đầu để không bị lệch offset.

### 4.4 Infrastructure Adapters

#### Node.js Adapters

- **`NodeCliFsAdapter`**: Implement `CliFilesystemPort` dùng `fs/promises` của Node.js
- **`NodeCliLoggerAdapter`**: Implement `CliLoggerPort` dùng `process.stdout.write` / `process.stderr.write`
- **`NodeCliRuntimeAdapter`**: Implement `CliRuntimePort` dùng `process.exitCode` và `process.env`
- **`NodeCliPathAdapter`**: Implement `CliPathPort` dùng module `path` của Node.js

#### Commander Adapter

- **`CommanderCliHostAdapter`**: Nhận `CommandTree[]`, duyệt đệ quy, build Commander command tree.
  - Với leaf node (có `action`): tạo `LeafDispatchHandler`
  - `LeafDispatchHandler` extract positional args, local options, global bridge → gọi `action`

#### Telemetry Adapter

- **`CliTelemetryAdapter`**: Emit events khi CLI actions xảy ra. Activated theo điều kiện qua env var `CLI_TELEMETRY`.
- **Activation pattern**: Dùng `onActivation` middleware trong DI container để wrap port nếu telemetry enabled.

#### Misc Adapters

- **`FormatAppErrorAdapter`**: Format `AppError` — nếu verbose mode: hiển thị stack trace; nếu không: chỉ message
- **`GlobalCliOptionsParserAdapter`**: Parse `--no-color` và các global flags từ argv trước khi Commander parse
- **`RepoRootResolverAdapter`**: Tìm thư mục chứa `package.json` bằng cách đi lên từ CWD
- **`TypescriptSourceFileWalkerAdapter`**: Dùng `glob` pattern để tìm `.ts`/`.tsx` files

#### Workspace Adapter

- **`NodePnpmWorkspacePackageLayoutAdapter`**: Đọc `pnpm-workspace.yaml`, resolve danh sách packages trong workspace

### 4.5 Services

#### `CliExecutorService`

**Vai trò:** Implement error handling và exit code logic.

**Method `consumeCliAppError(result)`:**

- Nhận `Result<T, AppError>`
- Nếu `ok: false`:
  - Gọi `FormatAppErrorPort.format(error)` để lấy message string
  - Gọi `CliLoggerPort.err(formattedMessage)` để in ra stderr
  - Map `error.code` → exit code:
    - `VALIDATION_ERROR` → exit code 2
    - Khác → exit code 1
  - Gọi `CliRuntimePort.setExitCode(code)`
  - Return `false` (signal thất bại)
- Nếu `ok: true`: Return `true`

#### `SchemaValidatorService`

**Vai trò:** Wrap Zod parsing, convert parse failure thành `AppError`.

**Method `parse(schema, data)`:**

- Gọi Zod schema parse
- Nếu thành công: Return `ok(parsed)`
- Nếu thất bại: Return `err(new AppError("VALIDATION_ERROR", zodError.message))`

### 4.6 Use Cases (Shell)

#### `LoadCodefastConfigUseCase`

**Vai trò:** Load file config `codefast.config.*` từ repo root.

**Input:** `rootDir: string`

**Hành vi:**

1. Gọi `ConfigLoaderPort.load(rootDir)` — tìm và load file config
2. Gọi `ConfigSchemaPort.validate(rawConfig)` — validate với Zod
3. Nếu có warnings: Gọi `ConfigWarningReporterPort.report(warnings)`
4. Return `Result<CodefastConfig, AppError>`

### 4.7 Coordination

#### `CliExecutorCoordination`

Contract cho error handling: `consumeCliAppError(result) → boolean`

#### `CliSchemaParsing Coordination`

Contract cho schema validation: `parse(schema, data) → Result<T, AppError>`

### 4.8 Shell Module Wiring

**`optional-cli-port-telemetry-activation.ts`**: Middleware logic — kiểm tra `CLI_TELEMETRY` env var, nếu bật thì wrap các port với telemetry adapter.

---

## 5. Domain: Arrange

**Mục đích:** Nhóm Tailwind CSS class strings thành các `cn()` call có cấu trúc rõ ràng. Tool xử lý cả `cn()` thuần và `tv()` (tailwind-variants).

### 5.1 CLI Commands

Domain expose 4 subcommands qua `arrange.command.ts`:

| Subcommand | Mô tả                                        | Mode      |
| ---------- | -------------------------------------------- | --------- |
| `analyze`  | Báo cáo các cn/tv strings dài, cn-in-tv      | Read-only |
| `preview`  | Hiển thị dry-run rewrites (không write file) | Read-only |
| `apply`    | Ghi rewrites vào files                       | Write     |
| `group`    | Test grouping trên một class string          | Stateless |

**Global option:** `--target <path>` — thư mục cần xử lý (default: CWD hoặc config)

### 5.2 Use Cases

#### `PrepareArrangeWorkspaceUseCase`

**Vai trò:** Resolve target directory và load config. Chạy trước mọi use case khác.

**Hành vi:**

1. Resolve repo root từ `RepoRootResolverPort`
2. Load config từ `LoadCodefastConfigUseCase`
3. Xác định target path: từ CLI arg → config → fallback CWD
4. Validate path tồn tại
5. Return `{ targetPath, config }`

#### `AnalyzeDirectoryUseCase`

**Vai trò:** Scan directory, phân tích AST, tạo báo cáo.

**Input:** `{ targetPath: string }`

**Hành vi:**

1. Dùng `ArrangeTargetScannerPort` tìm tất cả `.ts`/`.tsx` files trong `targetPath`
2. Với mỗi file:
   - Đọc source text qua `CliFilesystemPort`
   - Parse bằng `DomainSourceParserPort` → `DomainSourceFile`
   - Chạy 3 collectors: `cn-collector`, `tv-collector`, `jsx-collector`
   - Gọi `accumulateAnalyzeReportForSourceFile()` (domain service)
3. Tổng hợp `AnalyzeReport`
4. Return `Result<AnalyzeReport, AppError>`

#### `RunArrangeSyncUseCase`

**Vai trò:** Scan và viết (hoặc preview) rewrites cho tất cả files.

**Input:** `{ targetPath, mode: "apply" | "preview", config }`

**Hành vi:**

1. Scan files như `AnalyzeDirectoryUseCase`
2. Với mỗi file:
   - Parse → DomainSourceFile
   - `buildGroupFileUnwrapState()` → kế hoạch unwrap cn-in-tv
   - `tryBuildGroupFileWorkPlan()` → kế hoạch group cn() args
   - Nếu mode `apply`: apply edits, ghi file, track modified
   - Nếu mode `preview`: store work plans để present
3. Nếu mode `apply` và có files modified: Gọi `onAfterWrite` hook từ config
4. Return `Result<ArrangeRunResult, AppError>`

#### `SuggestCnGroupsUseCase`

**Vai trò:** Nhận một chuỗi class string, trả về gợi ý nhóm.

**Input:** `{ classString: string }`

**Hành vi:**

1. Parse tokens từ class string
2. Gọi `TailwindGroupingDomainService.suggestGroups(tokens)`
3. Gọi `summarizeGroupBucketLabels(groups)`
4. Return `{ groups, bucketLabels }`

### 5.3 Domain Logic

#### Domain AST (`ast/`)

**Lý do tồn tại:** Tách biệt hoàn toàn domain logic khỏi TypeScript compiler. Domain không `import` từ `typescript` package.

**`ast-node.model.ts`** — Pure enums và interfaces:

- `DomainSyntaxKind`: Identifier, StringLiteral, TemplateLiteral, CallExpression, JsxAttribute, ...
- `DomainAstNode`: `{ kind, pos, end, parent? }`
- `DomainSourceFile`: `{ fileName, text, statements[] }`
- `DomainCallExpression`: extends DomainAstNode với `expression` và `arguments[]`
- `DomainStringLiteral`: extends DomainAstNode với `text`
- `DomainJsxAttribute`: extends DomainAstNode với `name` và `initializer`

**`ast-helpers.helper.ts`** — AST traversal helpers:

- `visitNodes(node, visitor)`: duyệt đệ quy tất cả nodes
- `collectBindings(node)`: tìm tất cả call bindings trong một expression
- `getConditionalBranches(node)`: extract branches từ ternary/logical expressions

**Collectors** — mỗi collector nhận `DomainSourceFile`, trả về list targets:

- **`collectors-cn.collector.ts`**: Tìm tất cả `cn(...)` call expressions
- **`collectors-tv.collector.ts`**: Tìm tất cả `tv(...)` calls và `cn()` calls bên trong `tv()`
- **`collectors-jsx.collector.ts`**: Tìm tất cả JSX `className={...}` attributes

**`targets.model.ts`** — Grouping targets:

- `GroupTarget`: `{ kind: "cnArg"; item: StringNode } | { kind: "jsxClassName"; ... }`
- `StringNode`: `{ nodes: TailwindClassLiteral[], sf, isTvContext, cnCall? }`
- Logic: Quyết định node nào đủ điều kiện để group (đủ dài, đủ phức tạp)

#### `arrange-analyze.domain-service.ts`

**Vai trò:** Tích lũy `AnalyzeReport` từ một source file.

**Hành vi:**

- Đếm cn() calls, tv() calls
- Tìm `cn()` bên trong `tv()` (cn-in-tv pattern) → báo cáo để unwrap
- Tìm các string literals quá dài (> threshold)
- Tích lũy vào report object

#### `arrange-grouping.domain-service.ts`

**Vai trò:** Lập kế hoạch (plan) tất cả edits cho một file.

**`buildGroupFileUnwrapState()`** — Kế hoạch unwrap cn-in-tv:

- Tìm tất cả cn() calls nằm trong tv()
- Mỗi cn-in-tv: tạo edit thay thế `cn("a", "b")` → `"a b"` (merge lại thành string)

**`tryBuildGroupFileWorkPlan()`** — Kế hoạch group cn() args:

- Với mỗi `GroupTarget`:
  - Lấy danh sách class tokens
  - Gọi `suggestCnGroups(tokens)` từ `grouping.domain.ts`
  - Tạo `SourceTextEdit` thay thế span cũ bằng grouped output

#### `tailwind-grouping.domain-service.ts`

**Vai trò:** Phân loại Tailwind tokens vào "buckets" và sắp xếp.

**Buckets (theo thứ tự hiển thị):**

1. `existence` — điều kiện hiện diện (hidden, visible, flex, block, ...)
2. `position` — vị trí tuyệt đối (absolute, relative, fixed, sticky, top-_, left-_, z-\*)
3. `layout` — layout container (flex, grid, gap, cols, rows, ...)
4. `sizing` — kích thước (w-_, h-_, min-_, max-_)
5. `spacing` — padding, margin
6. `typography` — text, font, leading, tracking, ...
7. `border` — border, rounded, outline, ...
8. `color` — background color, text color, ring, ...
9. `effects` — shadow, opacity, blur, ...
10. `animation` — transition, animate, duration, ...
11. `interaction` — cursor, pointer-events, select, ...
12. `responsive` — breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:)
13. `state` — pseudo-class prefixes (hover:, focus:, active:, disabled:, ...)
14. `other` — không phân loại được

#### `tailwind-token-classifier.domain-service.ts`

**Vai trò:** Phân loại một Tailwind class token vào đúng bucket.

**Logic:**

- Strip prefix (responsive/state) nếu có
- Match base class với pattern rules cho từng bucket
- Return bucket name

#### `grouping.domain.ts` — Pure Algorithm

**Vai trò:** Pure function không có side effect.

**`suggestCnGroups(classString)`:**

- Parse tokens từ string
- Phân loại mỗi token vào bucket
- Nhóm consecutive tokens cùng bucket thành một cn() call
- Return array of groups: `{ bucket, tokens }[]`

**`summarizeGroupBucketLabels(groups)`:**

- Return array of bucket names (deduped) theo thứ tự xuất hiện

#### `source-text-formatters.formatter.ts`

**Vai trò:** Tạo source code string từ grouped tokens.

**Output format:**

```
cn(
  "token1 token2",    // bucket-name
  "token3",           // other-bucket
)
```

### 5.4 Infrastructure

#### `typescript-ast-translator.ts` — Anti-Corruption Layer

**Vai trò:** Chuyển đổi `ts.Node` (TypeScript compiler AST) sang `DomainAstNode` (domain AST thuần túy).

**Lý do:** Domain không được `import typescript` package để tránh phụ thuộc vào compiler version.

**Hành vi:**

- Nhận `ts.SourceFile` từ TypeScript compiler
- Duyệt đệ quy, map từng `ts.SyntaxKind` sang `DomainSyntaxKind`
- Giữ nguyên `pos`, `end` (character positions trong source text)
- Return `DomainSourceFile`

#### Adapters

- **`DomainSourceParserAdapter`**: Dùng TypeScript compiler parse source text → `ts.SourceFile` → gọi `TypescriptAstTranslator` → `DomainSourceFile`
- **`ArrangeTargetScannerAdapter`**: Tìm `.ts`/`.tsx` files (exclude node_modules, dist, .git)
- **`ArrangeFileProcessorAdapter`**: Implement toàn bộ flow xử lý một file (parse → collect → plan → write)
- **`ArrangeTargetPathResolverAdapter`**: Resolve target path từ arg hoặc config
- **`FileWalkerAdapter`**: Generic file walker dùng glob

### 5.5 Presenters

| Presenter                   | Mô tả                                                          |
| --------------------------- | -------------------------------------------------------------- |
| `ArrangeAnalyzePresenter`   | Format `AnalyzeReport` thành table/list cho stdout             |
| `GroupFilePreviewPresenter` | Format work plan thành side-by-side diff                       |
| `ArrangeSyncPresenter`      | Format `ArrangeRunResult` thành summary (files changed, count) |

**`arrange-cli.schema.ts`**: Zod schema cho CLI arguments của arrange command.

---

## 6. Domain: Mirror

**Mục đích:** Tự động tạo và cập nhật `exports` field trong `package.json` của các packages trong monorepo bằng cách scan thư mục `dist/`.

### 6.1 CLI Commands

Domain expose 1 subcommand qua `mirror.command.ts`:

| Subcommand | Option             | Mô tả                           |
| ---------- | ------------------ | ------------------------------- |
| `sync`     | `--package <name>` | Sync một package cụ thể         |
| `sync`     | (không có flag)    | Sync toàn bộ workspace packages |

### 6.2 Use Cases

#### `PrepareMirrorSyncUseCase`

**Vai trò:** Chuẩn bị context trước khi chạy sync.

**Hành vi:**

1. Load config
2. Nếu có `--package` flag: validate package tồn tại trong workspace
3. Nếu không có flag: resolve danh sách tất cả packages từ `WorkspacePackageLayoutPort`
4. Return `{ packages: PackageMeta[], config: MirrorConfig }`

#### `RunMirrorSyncUseCase`

**Vai trò:** Chạy sync cho tất cả packages được cung cấp.

**Hành vi:**

1. Với mỗi package:
   - Gọi `SyncWorkspacePackagePort.sync(packageMeta)`
   - Nhận `PackageStats` (exports count, modules, CSS exports, skip reason)
   - Emit progress qua `MirrorSyncReporterPort`
2. Tổng hợp `GlobalStats`
3. Emit completion summary
4. Return `Result<GlobalStats, AppError>`

### 6.3 Domain Logic

#### `generate-mirror-exports.domain-service.ts`

**Vai trò:** Pure function tạo `ExportMapData` từ dist directory contents.

**Input:** `{ distFiles: string[], customExports: CustomExportConfig, cssExports: CssExportConfig }`

**Hành vi:**

1. Nhóm files theo base name (strip extension)
2. Với mỗi group, xác định conditional exports:
   - `"types"`: → file `.d.ts`
   - `"import"`: → file `.mjs` (ESM)
   - `"require"`: → file `.cjs` (CJS)
3. Merge với `customExports` từ config
4. Thêm CSS exports nếu có file `.css`
5. Sort exports theo pattern chuẩn (`"."` first, named exports after)
6. Return `ExportMapData`

#### `path-normalizer.value-object.ts`

**Vai trò:** Normalize đường dẫn cho export entries (ensure `./` prefix, convert backslashes).

#### `package-display-name.policy.ts`

**Vai trò:** Business rule xác định tên hiển thị cho package trong output.

- Nếu có `name` trong package.json: dùng tên đó
- Nếu không: dùng directory name

#### Types

**`ExportEntry`:**

```
{
  types: string        // path đến .d.ts file
  import?: string      // path đến .mjs file
  require?: string     // path đến .cjs file
}
```

**`ExportMapData`:** `Record<string, ExportEntry | string>` — toàn bộ exports map

**`MirrorPackageMeta`:** `{ packageName, packageDir, distDir }`

**`PackageStats`:** `{ packageName, jsModules, cssExports, customExports, skippedReason? }`

**`GlobalStats`:** `{ packagesFound, packagesProcessed, packagesSkipped, packagesErrored, totalExports, totalJsModules, totalCssExports, packageDetails: PackageStats[] }`

### 6.4 Infrastructure

#### `PackageJsonExportsRepository`

**Vai trò:** Đọc và ghi `package.json` files. Xử lý custom/CSS export config từ package.json.

**Hành vi đọc:** Parse package.json, trích xuất existing exports, custom export config (`codefast.mirror.*`)

**Hành vi ghi:** Merge exports mới vào package.json, preserve tất cả fields khác, ghi file

#### Adapters

- **`FileSystemServiceAdapter`**: Wrap filesystem operations cho mirror domain
- **`MirrorSyncReporterAdapter`**: Emit progress messages ra stdout (per-package status)
- **`PackageRepositoryAdapter`**: Implement `PackageRepositoryPort` dùng `PackageJsonExportsRepository`
- **`SyncWorkspacePackageAdapter`**: Orchestrate sync cho một package: đọc dist, generate exports, ghi package.json
- **`MirrorPackagePathResolverAdapter`**: Resolve đường dẫn tuyệt đối cho package từ tên

#### `guards/dirent-list.guard.ts`

**Vai trò:** Type guard để kiểm tra Node.js `Dirent[]` object là valid trước khi xử lý.

### 6.5 Presenters

**`PresentMirrorSyncProgressPresenter`**: Format progress output — mỗi package hiển thị trạng thái (processed/skipped/error) và số lượng exports.

---

## 7. Domain: Tag

**Mục đích:** Tự động thêm `@since <version>` JSDoc comment vào các exported declarations trong TypeScript source files.

### 7.1 CLI Commands

Domain expose 1 subcommand (với alias) qua `tag.command.ts`:

| Subcommand | Alias      | Option            | Mô tả                                  |
| ---------- | ---------- | ----------------- | -------------------------------------- |
| `sync`     | `annotate` | `--dry-run`       | Thêm @since tags (dry-run không write) |
| `sync`     | `annotate` | `--target <path>` | Chỉ định target directory              |
| `sync`     | `annotate` | `--version <v>`   | Override version string                |

### 7.2 Use Cases

#### `PrepareTagSyncUseCase`

**Vai trò:** Chuẩn bị execution context.

**Hành vi:**

1. Load config
2. Resolve target: từ `--target` arg → workspace packages → fallback `src/`
3. Nếu `--version` arg có: dùng version đó
4. Nếu không: gọi `TagVersionResolverPort` để infer version từ git tag hoặc package.json
5. Return `{ targets: TagTarget[], version: string, config: TagConfig, mode: "apply"|"dry-run" }`

#### `RunTagSyncUseCase`

**Vai trò:** Chạy tagging trên tất cả targets.

**Hành vi:**

1. Với mỗi target:
   - Gọi `TagTargetRunnerPort.run(target, version, mode)`
   - Nhận `TagFileResult[]` (files processed, declarations tagged, changed flag)
2. Emit progress qua `TagSyncReporterPort`
3. Tổng hợp `TagSyncResult`
4. Nếu mode `apply` và files changed: gọi `onAfterWrite` hook
5. Return `Result<TagSyncResult, AppError>`

### 7.3 Domain Types

**`TagTarget`:** `{ kind: "directory" | "package", path: string, packageName?: string }`

**`TagFileResult`:**

```
{
  filePath: string
  taggedDeclarations: TaggedDeclaration[]
  changed: boolean
}
```

**`TaggedDeclaration`:** `{ name: string, version: string, line: number }`

**`TagSyncResult`:**

```
{
  mode: "applied" | "dry-run"
  selectedTargets: TagTarget[]
  targetResults: TagTargetResult[]
  filesScanned: number
  filesChanged: number
  taggedDeclarations: number
  versionSummary: string
  distinctVersions: string[]
  modifiedFiles: string[]
  hookError?: AppError
}
```

### 7.4 Infrastructure Adapters

- **`TagTargetResolverAdapter`**: Tìm eligible tag targets — scan workspace packages, fallback sang `src/` nếu không tìm thấy packages
- **`TagTargetRunnerAdapter`**: Chạy tagging logic trên một target directory — duyệt .ts files, parse JSDoc, thêm @since nếu chưa có
- **`TagVersionResolverAdapter`**: Infer version bằng cách:
  1. Đọc `version` từ `package.json` gần nhất
  2. Fallback: đọc latest git tag
  3. Fallback: return `"0.0.0"`
- **`TagSinceWriterAdapter`**: Ghi `@since` JSDoc vào source file — find declaration, compute insertion point, apply edit
- **`TagTargetPathResolverAdapter`**: Resolve đường dẫn target từ CLI arg hoặc config

### 7.5 Presenters

| Presenter                         | Mô tả                                                                 |
| --------------------------------- | --------------------------------------------------------------------- |
| `PresentTagSyncResultPresenter`   | Summary sau khi hoàn tất: files changed, declarations tagged, version |
| `PresentTagSyncProgressPresenter` | Per-file progress trong quá trình chạy                                |

---

## 8. Config System

### 8.1 Config File

CLI tìm config file ở repo root với các tên sau (theo thứ tự ưu tiên):

1. `codefast.config.ts`
2. `codefast.config.js`
3. `codefast.config.mjs`
4. `codefast.config.cjs`
5. `codefast.config.json`

### 8.2 Config Schema

**Root config (`CodefastConfig`):**

```
{
  mirror?: MirrorConfig
  tag?: CodefastTagConfig
  arrange?: CodefastArrangeConfig
}
```

**`MirrorConfig`:**

```
{
  skipPackages?: string[]              // Package names để bỏ qua
  pathTransformations?: PathTransform[] // Transform dist paths trước khi dùng
  customExports?: Record<string, ExportEntry>  // Manual export entries
  cssExports?: CssExportConfig         // CSS file export config
}
```

**`CodefastTagConfig`:**

```
{
  onAfterWrite?: OnAfterWriteHook      // Shell command chạy sau khi ghi files
}
```

**`CodefastArrangeConfig`:**

```
{
  onAfterWrite?: OnAfterWriteHook      // Shell command chạy sau khi ghi files
}
```

**`OnAfterWriteHook`:**

```
{
  command: string          // Shell command (e.g. "prettier --write")
  args?: string[]          // Nếu có: truyền modified file paths làm args
}
```

### 8.3 Config Loading Flow

1. `RepoRootResolverPort` tìm thư mục gốc
2. `ConfigLoaderAdapter` tìm file config, import dynamic
3. `ZodCodefastConfigSchemaAdapter` validate với Zod schema
4. Nếu validation có warnings (không phải errors): log qua `ConfigWarningReporterAdapter`
5. Return `Result<CodefastConfig, AppError>`

**Phân biệt warning vs error:**

- Error: config file tồn tại nhưng có field bắt buộc thiếu → fail
- Warning: field không nhận ra (typo, deprecated) → log và tiếp tục với defaults

### 8.4 Config Module Ports

| Port                        | Mô tả                              |
| --------------------------- | ---------------------------------- |
| `ConfigLoaderPort`          | Load raw config object từ file     |
| `ConfigWarningReporterPort` | Log warnings về config issues      |
| `CodefastConfigSchemaPort`  | Validate raw object với Zod schema |

---

## 9. Cấu Trúc Dữ Liệu Cốt Lõi

### 9.1 `Result<T, E>` — Error Monad

Toàn bộ use-case trả về `Result`. Không bao giờ throw exception ở use-case boundary.

**Nguyên tắc sử dụng:**

- Use-case: luôn return `Result<T, AppError>`
- Command handler: gọi `consumeCliAppError(result)`, nếu `false` → early return
- Infrastructure adapter: nếu I/O fail → return `err(new AppError("INFRA_FAILURE", msg, cause))`

### 9.2 `CommandTree` — Command Definition

Cấu trúc đệ quy mô tả toàn bộ command structure. Không chứa implementation.

```
CommandTree {
  name: string
  description: string
  aliases?: string[]
  route?: CommandRouteWire[]
  action?: LeafDispatchHandler
  children?: CommandTree[]
}
```

`LeafDispatchHandler` signature:

```
(positionalArgs: PositionalArgBag, localOptions: OptionsBag, globalBridge: GlobalBridge) => void | Promise<void>
```

### 9.3 Domain AST Nodes

Tất cả nodes inherit từ `DomainAstNode { kind, pos, end, parent? }`.

| Node Type                        | Extra Fields                         |
| -------------------------------- | ------------------------------------ |
| `DomainSourceFile`               | `fileName`, `text`, `statements[]`   |
| `DomainStringLiteral`            | `text`                               |
| `DomainTemplateLiteral`          | `head`, `templateSpans[]`            |
| `DomainCallExpression`           | `expression`, `arguments[]`          |
| `DomainJsxAttribute`             | `name`, `initializer`                |
| `DomainIdentifier`               | `text`                               |
| `DomainPropertyAccessExpression` | `expression`, `name`                 |
| `DomainBinaryExpression`         | `left`, `operatorToken`, `right`     |
| `DomainConditionalExpression`    | `condition`, `whenTrue`, `whenFalse` |

### 9.4 Export Maps (Mirror)

```
ExportMapData = {
  ".": {
    types: "./dist/index.d.ts",
    import: "./dist/index.mjs",
    require: "./dist/index.cjs"
  },
  "./utils": {
    types: "./dist/utils.d.ts",
    import: "./dist/utils.mjs"
  },
  "./styles.css": "./dist/styles.css"
}
```

---

## 10. Luồng Xử Lý Chính

### 10.1 CLI Invocation Flow (Tổng Thể)

```
process.argv
  → bin.ts: runCli(argv)
  → program.ts:
      1. Tạo DI container
      2. Load CliApplicationModule (ArrangeModule + MirrorModule + TagModule + ShellModule)
      3. container.initializeAsync()
      4. Resolve CommandPort[] → CommandTree[]
      5. Tạo Commander program
      6. register-cli-command-trees: CommandTree[] → Commander commands
      7. program.parseAsync(argv)
         → Commander route to matched command
         → LeafDispatchHandler(positionalArgs, options, globalBridge)
         → CommandHandler (e.g. ArrangeCommand.performAnalyze)
             → PrepareWorkspace → AnalyzeDirectory → Present
         → (set process.exitCode via CliRuntimePort)
      8. Return process.exitCode
  → bin.ts: process.exit(exitCode)
```

### 10.2 `arrange analyze` Flow

```
ArrangeCommand.performAnalyze(args, opts, global)
  → PrepareArrangeWorkspaceUseCase.execute(targetArg)
      → RepoRootResolverPort.resolve()
      → LoadCodefastConfigUseCase.execute(rootDir)
      → ArrangeTargetPathResolverPort.resolve(targetArg, config)
      → return { targetPath, config }
  → if error: consumeCliAppError → exit
  → AnalyzeDirectoryUseCase.execute({ targetPath })
      → ArrangeTargetScannerPort.scan(targetPath) → filePaths[]
      → for each filePath:
          → CliFilesystemPort.readFile(filePath) → sourceText
          → DomainSourceParserPort.parse(sourceText, filePath) → DomainSourceFile
          → collectors-cn.collect(domainSf) → cnCalls[]
          → collectors-tv.collect(domainSf) → tvCalls[], cnInTvCalls[]
          → collectors-jsx.collect(domainSf) → jsxClassNames[]
          → arrange-analyze.accumulateForFile(report, file, cnCalls, tvCalls, ...)
      → return AnalyzeReport
  → if error: consumeCliAppError → exit
  → ArrangeAnalyzePresenter.present(report) → stdout
```

### 10.3 `arrange apply` Flow

```
ArrangeCommand.performApply(args, opts, global)
  → PrepareArrangeWorkspaceUseCase.execute(...)
  → RunArrangeSyncUseCase.execute({ targetPath, mode: "apply", config })
      → ArrangeTargetScannerPort.scan(targetPath) → filePaths[]
      → for each filePath:
          → parse → DomainSourceFile
          → buildGroupFileUnwrapState(domainSf)
              → collectors-tv: find cn-in-tv
              → create unwrap edits: cn("a","b") → "a b"
          → tryBuildGroupFileWorkPlan(domainSf, unwrapState)
              → collectors-cn: find cn() calls
              → for each cn() arg group:
                  → suggestCnGroups(tokens) → groups[]
                  → planGroupEditForTarget(target, groups) → SourceTextEdit
          → if workPlan has edits:
              → applyEditsDescending(edits, sourceText) → newSourceText
              → CliFilesystemPort.writeFile(filePath, newSourceText)
              → track as modified
      → if modifiedFiles.length > 0 and config.arrange.onAfterWrite:
          → run shell hook with modifiedFiles as args
      → return ArrangeRunResult
  → ArrangeSyncPresenter.present(result) → stdout
```

### 10.4 `mirror sync` Flow

```
MirrorCommand.performSync(args, opts, global)
  → PrepareMirrorSyncUseCase.execute({ packageFilter? })
      → LoadCodefastConfigUseCase.execute(rootDir) → config
      → if packageFilter:
          → WorkspacePackageLayoutPort.findPackage(packageFilter) → packageMeta
      → else:
          → WorkspacePackageLayoutPort.listPackages() → packageMetas[]
      → filter out config.mirror.skipPackages
      → return { packages, config }
  → RunMirrorSyncUseCase.execute({ packages, config })
      → for each package:
          → SyncWorkspacePackagePort.sync(packageMeta, config)
              → CliFilesystemPort.readFile(package.json) → raw
              → PackageRepositoryPort.read(raw) → { existingExports, customConfig }
              → CliFilesystemPort.listDir(distDir) → distFiles[]
              → generate-mirror-exports(distFiles, customConfig) → ExportMapData
              → PackageRepositoryPort.write(package.json, ExportMapData)
              → return PackageStats
          → MirrorSyncReporterPort.reportPackage(packageStats)
      → accumulate GlobalStats
      → MirrorSyncReporterPort.reportCompletion(globalStats)
      → return GlobalStats
  → PresentMirrorSyncProgressPresenter.present(globalStats) → stdout
```

### 10.5 `tag sync` Flow

```
TagCommand.performSync(args, opts, global)
  → PrepareTagSyncUseCase.execute({ targetArg, versionArg, dryRun })
      → LoadCodefastConfigUseCase.execute(rootDir) → config
      → TagTargetResolverPort.resolve(targetArg)
          → if targetArg: use as directory target
          → else: scan workspace packages
          → filter by config.tag.skipPackages
      → if versionArg: use it
      → else: TagVersionResolverPort.resolve(targetDir)
          → check package.json version
          → fallback: git tag
      → return { targets, version, config, mode }
  → RunTagSyncUseCase.execute({ targets, version, mode, config })
      → for each target:
          → TagTargetRunnerPort.run(target, version, mode)
              → scan .ts files in target.path
              → for each file:
                  → parse source
                  → find exported declarations without @since
                  → if mode "apply": TagSinceWriterPort.write(file, version)
                  → return TagFileResult
          → accumulate TagSyncResult
      → if mode "apply" and modifiedFiles.length > 0:
          → run onAfterWrite hook
      → return TagSyncResult
  → PresentTagSyncResultPresenter.present(result) → stdout
```

### 10.6 Error Handling Flow

```
use-case.execute() → Result<T, AppError>

CommandHandler:
  const result = await useCase.execute(...)
  const ok = cliExecutor.consumeCliAppError(result)
  if (!ok) return   ← early exit, exitCode already set

consumeCliAppError(result):
  if result.ok: return true
  const msg = FormatAppErrorPort.format(result.error)
  CliLoggerPort.err(msg)
  const code = mapErrorCode(result.error.code)  // VALIDATION_ERROR→2, else→1
  CliRuntimePort.setExitCode(code)
  return false
```

---

## 11. Các Pattern & Quyết Định Thiết Kế

### 11.1 Hexagonal Architecture (Ports & Adapters)

**Nguyên tắc:**

- Domain layer không import bất kỳ thư viện ngoài nào
- Application layer chỉ biết về Port interfaces
- Infrastructure layer implement các Port interfaces
- Wiring xảy ra tại bootstrap layer (DI container)

**Phân loại ports:**

- **Primary/Inbound**: Được gọi bởi infrastructure vào domain (e.g. `CommandPort` được Commander.js gọi)
- **Secondary/Outbound**: Được domain gọi ra infrastructure (e.g. `FilesystemPort` được use-case gọi)

### 11.2 DI Container Pattern

**Thư viện:** `@codefast/di` (custom internal DI container)

**Token-based resolution:** Mỗi binding có token (symbol hoặc class). Container resolve theo token.

**Module pattern:** Mỗi domain có một Module class đăng ký tất cả bindings của mình.

**Singleton:** Tất cả services và adapters đều singleton trong container.

**Optional activation:** Telemetry adapter được activate có điều kiện qua `onActivation` hook trong container — nếu env var `CLI_TELEMETRY` không set, port được bind như no-op.

### 11.3 Result-Based Error Handling

**Lý do không dùng exception:**

- Exceptions phá vỡ type safety — caller không biết function có thể throw gì
- Result type buộc caller phải xử lý error case
- Dễ test hơn (không cần try/catch trong tests)

**Quy tắc:**

- Use-case boundary: luôn trả `Result<T, AppError>`
- Domain pure functions: có thể throw (sẽ được use-case catch và wrap)
- Infrastructure adapters: catch I/O errors, wrap thành `err(AppError)`

### 11.4 Anti-Corruption Layer (TypeScript AST)

**Vấn đề:** TypeScript compiler (`ts` package) là heavy dependency. Domain không nên biết về nó.

**Giải pháp:** `TypescriptAstTranslator` nằm ở infrastructure layer, translate `ts.Node` → `DomainAstNode`. Domain chỉ work với `DomainAstNode`.

**Lợi ích:** Có thể đổi TypeScript compiler version hoặc thậm chí đổi parser mà không ảnh hưởng domain logic.

### 11.5 Pure Domain Algorithms

**`grouping.domain.ts`** và các domain services là pure functions:

- Input: plain data structures
- Output: plain data structures
- Không có side effects
- Không có I/O

**Lợi ích:** Trivial to unit test. Không cần mock bất cứ thứ gì.

### 11.6 CommandTree as Data

**Thay vì:** Command handlers trực tiếp tạo Commander.js commands.

**Thay bằng:** Command handlers trả về `CommandTree` (plain data object). `CommanderCliHostAdapter` chịu trách nhiệm translate sang Commander.js.

**Lợi ích:**

- Command definitions có thể được test mà không cần Commander.js
- Có thể swap Commander.js với framework CLI khác mà không đổi domain code
- Command structure dễ serialize/introspect

### 11.7 OnAfterWrite Hook

**Mục đích:** Cho phép users chạy custom post-processing (prettier, eslint --fix) sau khi CLI ghi files.

**Cơ chế:**

- Config chứa `onAfterWrite: { command, args? }`
- Use-case (arrange/tag) chạy hook sau khi tất cả files đã được ghi
- Modified file paths được truyền vào hook command

**Lý do không hardcode formatter:** CLI không nên assume user dùng prettier, eslint, hay bất kỳ tool cụ thể nào.

### 11.8 Workspace-Aware Discovery

Mirror và Tag cần biết về tất cả packages trong monorepo.

**`WorkspacePackageLayoutPort`** abstract việc discover packages:

- Implementation hiện tại: `NodePnpmWorkspacePackageLayoutAdapter` đọc `pnpm-workspace.yaml`
- Future: có thể thêm adapter cho npm workspaces, yarn workspaces mà không đổi domain code

### 11.9 Collector Pattern (Arrange)

Mỗi collector là một pure traversal function:

- Input: `DomainSourceFile`
- Output: list of targets (cn calls, tv calls, jsx classNames)
- Collectors độc lập, có thể chạy song song

Use-case gọi tất cả collectors, aggregate kết quả.

### 11.10 Edit Application Strategy

Tất cả text edits được represent như `SourceTextEdit = (start, end, replacement)`.

**`applyEditsDescending(edits, text)`:**

- Sort edits từ cuối file lên đầu
- Apply từng edit: `text.slice(0, start) + replacement + text.slice(end)`
- Lý do descending: edit sau không làm lệch offset của edit trước

---

## 12. Bản Đồ Phụ Thuộc Module

```
bin.ts
  └── program.ts
        ├── bootstrap/composition-root.ts
        │     └── bootstrap/cli-application.module.ts
        │           ├── shell/shell.module.ts
        │           │     ├── node/* adapters
        │           │     ├── commander/* adapter
        │           │     ├── telemetry/* adapter
        │           │     ├── adapters/* (format, repo-root, ts-walker, etc.)
        │           │     ├── workspace/* adapter
        │           │     └── application/use-cases/load-codefast-config
        │           │           └── domains/config/* (loader, schema, reporter)
        │           │
        │           ├── domains/arrange/arrange.module.ts
        │           │     ├── [imports shell.module]
        │           │     ├── application/use-cases/* (analyze, sync, suggest, prepare)
        │           │     ├── domain/* (pure algorithms, AST nodes)
        │           │     ├── infrastructure/typescript-ast-translator
        │           │     └── infrastructure/adapters/* (parser, scanner, processor, etc.)
        │           │
        │           ├── domains/mirror/mirror.module.ts
        │           │     ├── [imports shell.module]
        │           │     ├── application/use-cases/* (prepare, run)
        │           │     ├── domain/* (generate-exports, path-normalizer)
        │           │     └── infrastructure/* (package-json-repo, adapters)
        │           │
        │           └── domains/tag/tag.module.ts
        │                 ├── [imports shell.module]
        │                 ├── application/use-cases/* (prepare, run)
        │                 ├── domain/* (types)
        │                 └── infrastructure/adapters/* (resolver, runner, writer)
        │
        └── bootstrap/register-cli-command-trees.ts
              └── shell/infrastructure/commander/commander-cli-host.adapter.ts
```

**Dependency rules (strict):**

- `domain/` không import từ `application/`, `infrastructure/`, hoặc external packages
- `application/` import từ `domain/` và `ports/` (interfaces chỉ)
- `infrastructure/` import từ `application/ports/` và external packages
- `presentation/` import từ `application/` (use-cases qua DI) và `domain/` (types)

---

## 13. Bất Biến Hệ Thống

Đây là các invariant phải được giữ nguyên trong quá trình tái cấu trúc:

1. **Mọi I/O phải qua Port interface** — không `import fs` trực tiếp trong domain/application layer

2. **Use-case luôn trả `Result<T, AppError>`** — không throw exception ở use-case boundary

3. **Domain layer không depend vào TypeScript compiler** — sử dụng `DomainAstNode`, không dùng `ts.Node`

4. **Pure algorithms không có side effects** — `grouping.domain.ts`, domain services nhận data, trả data

5. **Config được load một lần mỗi command** — qua `LoadCodefastConfigUseCase`, không load lại

6. **OnAfterWrite hook chỉ chạy sau khi tất cả files đã ghi thành công** — không chạy nếu có file fail

7. **edits được apply descending** — luôn từ cuối file lên đầu để giữ offset chính xác

8. **Exit code được set qua `CliRuntimePort`** — không set `process.exitCode` trực tiếp

9. **Commander.js chỉ được biết đến ở infrastructure layer** — `CommanderCliHostAdapter` và `register-cli-command-trees.ts`

10. **Mỗi domain module độc lập** — arrange, mirror, tag không import lẫn nhau; chỉ share qua shell module

---

_Tài liệu này đặc tả trạng thái của `packages/cli/src` tại thời điểm phân tích. Dùng làm blueprint cho việc tái cấu trúc — giữ nguyên tất cả invariants và architectural decisions._
