# SPEC.md — Refactor: `@codefast/cli`

> **Phản biện kiến trúc và đặc tả cải tiến lớn (không tương thích ngược)**
> Mục tiêu: giảm ~60% số file, xóa toàn bộ tầng lễ nghi, giữ nguyên mọi domain logic thuần túy.

---

## 1. Vấn đề hiện tại

### 1.1 Explicit Architecture bị áp dụng sai tầm

Codebase này là **một CLI tool với 3 lệnh** (arrange, mirror, tag). Nó đang áp dụng đầy đủ Hexagonal Architecture / Explicit Architecture — một pattern sinh ra để **tách biệt domain khỏi database/network trong hệ thống enterprise lớn**. Kết quả là:

- **164 file TypeScript** để thực hiện công việc có thể làm trong ~55 file.
- **6 cấp thư mục lồng nhau**: `src/domains/arrange/application/ports/inbound/analyze-directory.port.ts`
- **39 port interface files** — mỗi file chỉ chứa 1 interface với 1 method `execute()`.
- **30 adapter files** — mỗi file implement đúng 1 interface ở trên.
- **5 file `tokens.ts`** — mỗi injectable phải có 1 token constant tương ứng.

Đây không phải "sạch hơn" — đây là **ceremony vì ceremony**. Sự phức tạp hiển thị không phải là sự sạch sẽ; nó là tiếng ồn làm chết chìm tín hiệu.

---

### 1.2 DI Container không cần thiết cho một CLI

`@codefast/di` với `Module.create`, `moduleBuilder.bind().to().singleton().onActivation()`, `@injectable([inject(Token)])`, `Container.create()`, `runtimeContainer.validate()`, `runtimeContainer.initializeAsync()`, `runtimeContainer.dispose()` — đây là mức độ phức tạp của NestJS, áp dụng cho một process Node.js chạy rồi thoát trong vài giây.

**Vấn đề cụ thể:**

- Lỗi DI chỉ xuất hiện lúc runtime, không phải compile-time — đây là regression về type safety.
- `runtimeContainer.validate()` chỉ được gọi khi `NODE_ENV !== "production"` — production không được kiểm tra.
- Token string `"AnalyzeDirectoryUseCase"` hoàn toàn không type-safe tại điểm đăng ký.
- `onActivation(createOptionalCliPortTelemetryActivation(...))` là side-effect magic khó trace.
- Module dependencies được khai báo qua `moduleBuilder.import(ShellInfrastructureModule)` nhưng dependency thực sự nằm ở class constructor — bất đồng bộ giữa hai nơi.

Một CLI không cần IoC container. Nó cần **function composition** thẳng thắn.

---

### 1.3 Port Interface = Interface cho chính mình

```typescript
// analyze-directory.port.ts
export interface AnalyzeDirectoryPort {
  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
}

// analyze-directory.use-case.ts
export class AnalyzeDirectoryUseCase implements AnalyzeDirectoryPort { ... }
```

Interface này có **duy nhất một implementation**. Nó không bao giờ được swap. Nó không đại diện cho một boundary thật sự. Nó chỉ tồn tại vì kiến trúc "yêu cầu" phải có inbound port — đây là cargo cult.

Cùng vấn đề với tất cả 4 inbound ports của `arrange`, 2 của `mirror`, 2 của `tag`, và toàn bộ presenting ports.

---

### 1.4 Request Objects là Type Aliases được thăng cấp

```typescript
// analyze-directory.request.ts — một file riêng chỉ để chứa:
export type ArrangeAnalyzeDirectoryRequest = {
  analyzeRootPath: string;
};
```

Đây là `{ analyzeRootPath: string }` được đặt tên và cho vào file riêng. Nó không có validation, không có behavior, không xứng đáng có file riêng. Tương tự với `arrange-sync.request.ts`, `suggest-groups.request.ts`, và tất cả request files trong mirror/tag.

---

### 1.5 Contracts/Models = Thêm một tầng không cần thiết

```
src/domains/arrange/contracts/models.ts
src/domains/mirror/contracts/models.ts
src/domains/tag/contracts/models.ts
```

Mỗi file chứa 2-3 type aliases. "Contracts" folder tồn tại để ngăn domain domain import lẫn nhau — nhưng trong CLI này, các domain **không import lẫn nhau** ngay cả khi không có folder này. Pattern này giải quyết một vấn đề không tồn tại.

---

### 1.6 Coordination Layer: Thêm một tầng giữa tầng

```
src/shell/application/coordination/cli-executor.coordination.ts
src/shell/application/coordination/cli-schema-parsing.coordination.ts
```

`CliExecutorService` và `SchemaValidatorService` được inject vào commands qua token, thay vì được gọi trực tiếp. `consumeCliAppError()` là một helper function được bọc thành interface + injectable class + token để có thể được DI. Đây là complexity thuần túy không có giá trị.

---

### 1.7 Shell có đầy đủ Domain/Application/Infrastructure/Ports của riêng nó

`shell/` có:

- `application/ports/outbound/` — 11 port files
- `application/ports/inbound/` — 1 port file
- `application/ports/primary/` — 1 port file
- `application/coordination/` — 2 files
- `application/services/` — 2 files
- `domain/` — 6 files
- `infrastructure/adapters/` — 5 files + 4 node/ + 1 telemetry/ + 1 workspace/
- `composition/tokens.ts`
- `wiring/optional-cli-port-telemetry-activation.ts`
- `shell.module.ts`

`shell/` là một **micro-monolith trong monolith**. Nó phức tạp như một domain đầy đủ nhưng chỉ wrap `node:fs`, `node:path`, `process`, và `commander`.

---

### 1.8 Vấn đề đặt tên

| Hiện tại                                 | Vấn đề                                                     |
| ---------------------------------------- | ---------------------------------------------------------- |
| `cli-executor.coordination.ts`           | "Coordination" không phải layer DDD                        |
| `caught-unknown-message.value-object.ts` | Đây là 1 function, không phải value object                 |
| `source-text-edit.support.ts`            | Suffix "support" không có nghĩa                            |
| `arrange-analyze.domain-service.ts`      | Prefix domain không cần thiết trong folder `domain/`       |
| `TailwindGroupingDomainService`          | Class wrapping 2 pure functions thuần túy thành injectable |
| `PresentArrangeSyncResultPresenter`      | Tên presenter trùng với interface                          |

---

## 2. Phần tốt — cần giữ nguyên

| Phần                                               | Lý do giữ                                     |
| -------------------------------------------------- | --------------------------------------------- |
| `Result<T, E>` với `ok()` / `err()`                | Đúng cách, không throw                        |
| `AppError` không extends `Error`                   | Tránh stack trace overhead, carried in Result |
| Domain functions thuần túy trong `arrange/domain/` | Zero side-effects, testable                   |
| `grouping.domain.ts`, `imports.domain.ts`          | Logic Tailwind tốt                            |
| AST parsing và collectors                          | Tốt, giữ nguyên                               |
| Commander cho CLI                                  | Đúng tool                                     |
| Zod cho config validation                          | Đúng tool                                     |
| `vitest` test setup                                | Đúng tool                                     |

---

## 3. Kiến trúc mới

### 3.1 Cấu trúc thư mục mục tiêu

```
src/
├── bin.ts                          # #!/usr/bin/env node — 3 dòng
├── cli.ts                          # runCli(argv): Commander setup + dispatch
├── core/
│   ├── result.ts                   # Result<T,E>, ok(), err() — giữ nguyên
│   ├── errors.ts                   # AppError — giữ nguyên
│   ├── fs.ts                       # readFile, exists, writeFile (thin wrappers)
│   ├── path.ts                     # cwd, resolve, join (thin wrappers)
│   ├── workspace.ts                # findRepoRoot, listWorkspacePackages
│   └── config.ts                   # loadCodefastConfig(cwd): Result<Config, AppError>
├── arrange/
│   ├── command.ts                  # ArrangeCommand: Commander subcommand definition
│   ├── sync.ts                     # runArrangeSync(input): Result<RunResult, AppError>
│   ├── analyze.ts                  # analyzeDirectory(path): Result<Report, AppError>
│   ├── workspace.ts                # prepareArrangeWorkspace(cwd, target)
│   ├── domain/
│   │   ├── types.ts                # Bucket, StringNode, PlannedEdit, ... (giữ nguyên)
│   │   ├── grouping.ts             # suggestCnGroups(), summarizeBucketLabels()
│   │   ├── grouping-service.ts     # planGroupEditsForFile() — giữ nguyên logic
│   │   ├── analyze-service.ts      # accumulateAnalyzeReport() — giữ nguyên logic
│   │   ├── imports.ts              # ensureCnImport() — giữ nguyên
│   │   ├── token-classifier.ts     # classifyTailwindToken() — giữ nguyên
│   │   └── ast/                    # ast-node.model, collectors, helpers — giữ nguyên
│   └── output.ts                   # printAnalyzeReport(), printSyncResult(), printPreview()
├── mirror/
│   ├── command.ts                  # MirrorCommand
│   ├── sync.ts                     # runMirrorSync(input): Result<GlobalStats, AppError>
│   ├── prepare.ts                  # prepareMirrorSync(cwd, opts)
│   ├── domain/
│   │   ├── types.ts                # giữ nguyên
│   │   ├── exports.ts              # generateMirrorExports() — giữ nguyên logic
│   │   ├── path-normalizer.ts      # normalizePath() — giữ nguyên
│   │   └── errors.ts               # mirror-specific errors — giữ nguyên
│   └── output.ts                   # printMirrorProgress()
├── tag/
│   ├── command.ts                  # TagCommand
│   ├── sync.ts                     # runTagSync(input): Result<TagResult, AppError>
│   ├── prepare.ts                  # prepareTagSync(cwd, opts)
│   ├── domain/
│   │   └── types.ts                # giữ nguyên
│   └── output.ts                   # printTagProgress(), printTagResult()
└── config/
    ├── schema.ts                   # CodefastConfig Zod schema — giữ nguyên
    └── loader.ts                   # loadConfig(cwd): Config | null
```

**Kết quả:** ~55 file thay vì 164 file. Giảm 66%.

---

### 3.2 Bỏ DI Container — dùng Function Composition

**Trước (hiện tại):**

```typescript
// 5 files, 1 class, 1 interface, 1 token, 1 module binding
// arrange/application/ports/inbound/analyze-directory.port.ts
export interface AnalyzeDirectoryPort {
  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
}
// arrange/composition/tokens.ts
export const AnalyzeDirectoryUseCaseToken = token<AnalyzeDirectoryPort>("AnalyzeDirectoryUseCase");
// arrange/arrange.module.ts
moduleBuilder.bind(AnalyzeDirectoryUseCaseToken).to(AnalyzeDirectoryUseCase).singleton();
// arrange/application/use-cases/analyze-directory.use-case.ts
@injectable([inject(CliFilesystemPortToken), inject(ArrangeTargetScannerPortToken), ...])
export class AnalyzeDirectoryUseCase implements AnalyzeDirectoryPort { ... }
```

**Sau (mục tiêu):**

```typescript
// arrange/analyze.ts — 1 file, 1 function
import { readFileSync } from "#/core/fs";
import { scanArrangeTargets } from "#/arrange/domain/scanner";
import { accumulateAnalyzeReport, createEmptyReport } from "#/arrange/domain/analyze-service";

export function analyzeDirectory(rootPath: string): Result<AnalyzeReport, AppError> {
  const report = createEmptyReport();
  try {
    const files = scanArrangeTargets(rootPath);
    for (const filePath of files) {
      const source = readFileSync(filePath);
      const sf = parseDomainSourceFile(filePath, source);
      accumulateAnalyzeReport(report, sf, source, filePath);
    }
    return ok(report);
  } catch (e) {
    return err(new AppError("INFRA_FAILURE", messageFrom(e), e));
  }
}
```

**Composition root:**

```typescript
// cli.ts
export async function runCli(argv: string[]): Promise<number> {
  const program = new Command().name("codefast").version(readVersion());

  program.addCommand(createArrangeCommand());
  program.addCommand(createMirrorCommand());
  program.addCommand(createTagCommand());

  await program.parseAsync(argv, { from: "node" });
  return process.exitCode ?? 0;
}
```

Không có container, không có module, không có token. Type-safe hoàn toàn tại compile-time.

---

### 3.3 Loại bỏ Port Interface 1:1

**Quy tắc mới:** Chỉ tạo interface khi có **ít nhất 2 implementations cụ thể** hoặc khi cần **mock cho testing** ở module khác.

Trong CLI này, tất cả infrastructure calls (fs, path, process) đều có thể được test bằng cách truyền đường dẫn tmp thật — không cần mock interface. Domain logic thuần túy không cần interface.

Với telemetry: nếu cần wrap, dùng **decorator function**, không phải DI `onActivation`:

```typescript
// Thay vì: onActivation(createOptionalCliPortTelemetryActivation(...))
export function withTelemetry<T extends (...args: unknown[]) => unknown>(
  name: string,
  fn: T,
  telemetry: Telemetry,
): T {
  return ((...args) => {
    telemetry.trace(name);
    return fn(...args);
  }) as T;
}
```

---

### 3.4 Command Pattern đơn giản hơn

**Trước:**

```typescript
// CommandPort interface + CommandTree type + CommandRouteWire union
// + CommanderCliHostAdapter translate CommandTree → Commander
// + register-cli-command-trees.ts
// = 3 files, nhiều indirection
```

**Sau:**

```typescript
// arrange/command.ts
export function createArrangeCommand(): Command {
  const cmd = new Command("arrange").description("Analyze and regroup Tailwind classes");

  cmd
    .command("analyze [target]")
    .option("--json", "JSON output")
    .action(async (target, opts) => {
      // ... trực tiếp
    });

  // ...
  return cmd;
}
```

Commander đã là declarative và composable. Wrapping nó trong `CommandTree` JSON chỉ thêm translation layer không có giá trị.

---

### 3.5 Shell utilities là functions, không phải injectables

**Trước:** `CliLoggerPort` → `NodeCliLoggerAdapter` → `CliLoggerPortToken` → inject vào mọi class.

**Sau:**

```typescript
// core/logger.ts
export const logger = {
  out: (msg: string) => process.stdout.write(msg + "\n"),
  err: (msg: string) => process.stderr.write(msg + "\n"),
};
```

Import trực tiếp. Nếu cần test, dùng `vi.spyOn(logger, 'out')`. Không cần interface, không cần token.

Tương tự với `CliPathPort` (chỉ gọi `node:path`), `CliRuntimePort` (chỉ gọi `process`), `CliFilesystemPort` (chỉ gọi `node:fs`).

---

### 3.6 Presenters là functions

**Trước:** `PresentAnalyzeReportPresenter` interface + `PresentAnalyzeReportPresenter` class + token + binding.

**Sau:**

```typescript
// arrange/output.ts
export function printAnalyzeReport(rootPath: string, report: AnalyzeReport): void { ... }
export function printSyncResult(result: ArrangeRunResult, write: boolean): void { ... }
export function printGroupPreview(plan: GroupFileWorkPlan): void { ... }
```

Import và gọi trực tiếp trong command. Không cần presenter abstraction cho output-only functions.

---

### 3.7 Error handling thống nhất

Giữ `Result<T, E>` và `AppError`. Thêm helper top-level:

```typescript
// core/result.ts — thêm vào file hiện tại
export function handleResult<T>(
  result: Result<T, AppError>,
  onSuccess: (value: T) => void,
): boolean {
  if (!result.ok) {
    logger.err(formatAppError(result.error));
    process.exitCode = exitCodeFor(result.error);
    return false;
  }
  onSuccess(result.value);
  return true;
}
```

Thay thế `CliExecutorService` injectable với function thuần túy.

---

## 4. Migration Plan

### Phase 1 — Xóa DI Container (breaking)

1. Xóa `@codefast/di` khỏi dependencies.
2. Xóa toàn bộ `*.module.ts`, `composition/tokens.ts`.
3. Xóa `@injectable`, `@inject` decorators.
4. Viết lại `cli.ts` với function composition.

### Phase 2 — Flatten structure

1. Merge `application/use-cases/` functions vào `domain-name/sync.ts`, `domain-name/analyze.ts`.
2. Xóa `application/ports/inbound/` (tất cả 8 files).
3. Xóa `application/requests/` (tất cả request type files).
4. Xóa `contracts/models.ts` — move types vào domain.
5. Merge presenter classes thành functions trong `output.ts`.

### Phase 3 — Simplify shell

1. Xóa `shell/application/ports/outbound/` (11 files → 0).
2. Replace với `core/fs.ts`, `core/path.ts`, `core/logger.ts` (functions).
3. Xóa `coordination/` layer.
4. Xóa `wiring/optional-cli-port-telemetry-activation.ts`.

### Phase 4 — Simplify commands

1. Xóa `CommandTree` / `CommandRouteWire` abstraction.
2. Viết lại commands dùng Commander API trực tiếp.
3. Xóa `bootstrap/register-cli-command-trees.ts`, `bootstrap/cli-application.module.ts`.
4. Simplify `bootstrap/composition-root.ts` → remove entirely.

### Phase 5 — Preserve and clean domain

1. Giữ nguyên tất cả `domain/` logic thuần túy (arrange AST, grouping, mirror exports, tag).
2. Rename theo convention mới (xóa `.domain-service`, `.value-object` suffixes).
3. Update imports.

---

## 5. File Naming Convention mới

| Pattern cũ                               | Pattern mới                 | Lý do                               |
| ---------------------------------------- | --------------------------- | ----------------------------------- |
| `analyze-directory.port.ts`              | ❌ Xóa                      | Không cần                           |
| `analyze-directory.use-case.ts`          | `analyze.ts`                | Rõ ràng hơn                         |
| `arrange-grouping.domain-service.ts`     | `grouping-service.ts`       | Prefix thừa trong folder `domain/`  |
| `tailwind-token.value-object.ts`         | `token-classifier.ts`       | Suffix thừa                         |
| `caught-unknown-message.value-object.ts` | `errors.ts`                 | Đây là một function `messageFrom()` |
| `*.coordination.ts`                      | Merge vào caller            | Layer không cần thiết               |
| `composition/tokens.ts`                  | ❌ Xóa                      | DI không còn                        |
| `contracts/models.ts`                    | Merge vào `domain/types.ts` | Folder thừa                         |

**Quy tắc suffix còn lại:**

- `.schema.ts` — Zod schemas
- `.test.ts` — test files
- Không có suffix khác — tên module tự nói lên ý nghĩa.

---

## 6. Testing Strategy

**Giữ nguyên:** Unit tests cho domain logic thuần túy — đây là phần có value nhất và không bị ảnh hưởng bởi refactor.

**Cải thiện:** Integration tests không cần mock DI container nữa. Gọi function trực tiếp với filesystem tạm:

```typescript
// tests/arrange-analyze.test.ts
import { analyzeDirectory } from "#/arrange/analyze";

it("analyzes a real directory", () => {
  const tmpDir = createTempFixture("cn-calls");
  const result = analyzeDirectory(tmpDir);
  expect(result.ok).toBe(true);
});
```

Không cần container setup, không cần mock tokens. Test rõ ràng và nhanh hơn.

---

## 7. Checklist

- [ ] `Result<T,E>`, `ok()`, `err()` giữ nguyên
- [ ] `AppError` giữ nguyên
- [ ] Tất cả domain logic thuần túy trong `arrange/domain/` giữ nguyên
- [ ] Tất cả domain logic trong `mirror/domain/`, `tag/domain/` giữ nguyên
- [ ] AST parsing/collectors giữ nguyên
- [ ] Config schema (Zod) giữ nguyên
- [ ] `commander`, `zod`, `yaml`, `jiti`, `picomatch`, `typescript` dependencies giữ nguyên
- [ ] `@codefast/di` dependency **xóa**
- [ ] Tất cả `*.module.ts` **xóa**
- [ ] Tất cả `composition/tokens.ts` **xóa**
- [ ] Tất cả `application/ports/inbound/*.port.ts` **xóa**
- [ ] Tất cả `application/requests/*.ts` **xóa**
- [ ] Tất cả `contracts/models.ts` **xóa** (merge types)
- [ ] `bootstrap/` folder **xóa** (logic vào `cli.ts`)
- [ ] `CommandTree`/`CommandRouteWire` abstraction **xóa**
- [ ] `shell/application/ports/outbound/` (11 files) **xóa**
- [ ] `shell/application/coordination/` **xóa**
- [ ] `shell/wiring/` **xóa**
- [ ] Test coverage cho domain không giảm

---

## 8. Tổng kết

Codebase này có **domain logic tốt** bị chôn dưới **3 tầng ceremony kiến trúc**. Hexagonal Architecture không có nghĩa là mọi function phải được bọc trong interface + injectable class + token + module binding. Nó có nghĩa là **domain logic không phụ thuộc vào infrastructure** — và điều đó có thể đạt được chỉ với function composition thẳng thắn.

> "A codebase is not complex because it has many patterns. It is simple because it has only as many patterns as the problem requires."

Sau refactor, mọi developer mới có thể đọc `cli.ts` và hiểu toàn bộ flow trong 5 phút — thay vì phải trace qua 8 layers của DI container để tìm xem `console.log` được gọi ở đâu.
