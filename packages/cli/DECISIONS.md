# Decision: refactoring `@codefast/cli`

> **Architectural critique and a major, backward-incompatible improvement spec.** Goal: cut the file count by ~60%,
> delete every ceremony layer, and keep all pure domain logic intact.

> **Status (implemented):** the goals and the §7 checklist are applied in the current `packages/cli/src/`. For the
> **post-refactor architecture** (directory tree, module boundaries, the `#/…` import convention) see
> [ARCHITECTURE.md](./ARCHITECTURE.md).  
> **§1** below describes the **pre-refactor context** — paths such as `src/domains/...` and `src/shell/...` no longer
> exist in the repo.

**Minor, accepted deviations from §3.1:** separate `core/fs.ts` + `core/path.ts` were replaced by
[`core/filesystem/node.ts`](./src/core/filesystem/node.ts) plus direct `node:path` calls where needed; the `Result`
helpers are named `consumeCliAppError` / `runCliResultAsync` in
[`core/cli/result-handle.ts`](./src/core/cli/result-handle.ts) (equivalent in intent to §3.7); the class-string
tokenizer lives in [`arrange/domain/tailwind-token.ts`](./src/arrange/domain/tailwind-token.ts) next to
`token-classifier.ts` to keep the two roles distinct.

---

## 1. The current problems

### 1.1 Explicit Architecture applied at the wrong scale

This codebase is **a CLI tool with 3 commands** (arrange, mirror, tag). It applies full Hexagonal Architecture /
Explicit Architecture — a pattern born to **separate the domain from the database and the network in large enterprise
systems**. The result:

- **164 TypeScript files** to do work that fits in ~55 files.
- **6 levels of nested directories**: `src/domains/arrange/application/ports/inbound/analyze-directory.port.ts`
- **39 port interface files** — each holding exactly 1 interface with 1 `execute()` method.
- **30 adapter files** — each implementing exactly 1 of those interfaces.
- **5 `tokens.ts` files** — every injectable needs a matching token constant.

This is not "cleaner" — it is **ceremony for ceremony's sake**. Visible complexity is not cleanliness; it is noise
drowning the signal.

---

### 1.2 A DI container is unnecessary for a CLI

`@codefast/di` with `Module.create`, `moduleBuilder.bind().to().singleton().onActivation()`,
`@injectable([inject(Token)])`, `Container.create()`, `runtimeContainer.validate()`,
`runtimeContainer.initializeAsync()`, `runtimeContainer.dispose()` — that is NestJS-level complexity applied to a
Node.js process that runs and exits within a few seconds.

**Concrete problems:**

- DI errors surface at runtime, not compile time — a type-safety regression.
- `runtimeContainer.validate()` only runs when `NODE_ENV !== "production"` — production is never checked.
- The token string `"AnalyzeDirectoryUseCase"` is not type-safe at all at the registration site.
- `onActivation(createOptionalCliPortTelemetryActivation(...))` is side-effect magic that is hard to trace.
- Module dependencies are declared through `moduleBuilder.import(ShellInfrastructureModule)`, but the real dependency
  lives in the class constructor — the two places drift apart.

A CLI does not need an IoC container. It needs **straightforward function composition**.

---

### 1.3 A port interface is an interface for its only implementation

```typescript
// analyze-directory.port.ts
export interface AnalyzeDirectoryPort {
  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
}

// analyze-directory.use-case.ts
export class AnalyzeDirectoryUseCase implements AnalyzeDirectoryPort { ... }
```

This interface has **exactly one implementation**. It is never swapped. It does not stand for a real boundary. It exists
only because the architecture "requires" an inbound port — that is cargo cult.

The same problem applies to all 4 inbound ports in `arrange`, 2 in `mirror`, 2 in `tag`, and every presenting port.

---

### 1.4 Request objects are promoted type aliases

```typescript
// analyze-directory.request.ts — a dedicated file that holds only:
export type ArrangeAnalyzeDirectoryRequest = {
  analyzeRootPath: string;
};
```

This is `{ analyzeRootPath: string }` given a name and its own file. It has no validation, no behavior, and does not
earn a file of its own. The same goes for `arrange-sync.request.ts`, `suggest-groups.request.ts`, and every request file
in mirror/tag.

---

### 1.5 Contracts/models are one more layer nobody needs

```
src/domains/arrange/contracts/models.ts
src/domains/mirror/contracts/models.ts
src/domains/tag/contracts/models.ts
```

Each file holds 2–3 type aliases. The `contracts` folder exists to stop domains from importing each other — but in this
CLI the domains **do not import each other** even without it. The pattern solves a problem that does not exist.

---

### 1.6 Coordination layer: a layer between the layers

```
src/shell/application/coordination/cli-executor.coordination.ts
src/shell/application/coordination/cli-schema-parsing.coordination.ts
```

`CliExecutorService` and `SchemaValidatorService` are injected into commands through a token instead of being called
directly. `consumeCliAppError()` is a helper function wrapped into an interface + injectable class + token purely so it
can be injected. This is complexity with no payoff.

---

### 1.7 The shell carries its own full Domain/Application/Infrastructure/Ports stack

`shell/` contains:

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

`shell/` is a **micro-monolith inside the monolith**. It is as complex as a full domain, yet all it wraps is `node:fs`,
`node:path`, `process`, and `commander`.

---

### 1.8 Naming problems

| Current                                  | Problem                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `cli-executor.coordination.ts`           | "Coordination" is not a DDD layer                      |
| `caught-unknown-message.value-object.ts` | This is a function, not a value object                 |
| `source-text-edit.support.ts`            | The "support" suffix means nothing                     |
| `arrange-analyze.domain-service.ts`      | The domain prefix is redundant inside `domain/`        |
| `TailwindGroupingDomainService`          | A class wrapping two pure functions into an injectable |
| `PresentArrangeSyncResultPresenter`      | The presenter name collides with its interface         |

---

## 2. What is good — keep it

| Part                                       | Why it stays                                     |
| ------------------------------------------ | ------------------------------------------------ |
| `Result<T, E>` with `ok()` / `err()`       | The right shape, no throwing                     |
| `AppError` not extending `Error`           | Avoids stack-trace overhead, carried in `Result` |
| Pure domain functions in `arrange/domain/` | Zero side effects, testable                      |
| `grouping.domain.ts`, `imports.domain.ts`  | Good Tailwind logic                              |
| AST parsing and collectors                 | Good as-is                                       |
| Commander for the CLI                      | The right tool                                   |
| Zod for config validation                  | The right tool                                   |
| The `vitest` test setup                    | The right tool                                   |

---

## 3. The new architecture

### 3.1 Target directory layout

```
src/
├── bin.ts                          # #!/usr/bin/env node — 3 lines
├── cli.ts                          # runCli(argv): Commander setup + dispatch
├── core/
│   ├── result.ts                   # Result<T,E>, ok(), err() — unchanged
│   ├── errors.ts                   # AppError — unchanged
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
│   │   ├── types.ts                # Bucket, StringNode, PlannedEdit, ... (unchanged)
│   │   ├── grouping.ts             # suggestCnGroups(), summarizeBucketLabels()
│   │   ├── grouping-service.ts     # planGroupEditsForFile() — logic unchanged
│   │   ├── analyze-service.ts      # accumulateAnalyzeReport() — logic unchanged
│   │   ├── imports.ts              # ensureCnImport() — unchanged
│   │   ├── token-classifier.ts     # classifyTailwindToken() — unchanged
│   │   └── ast/                    # ast-node.model, collectors, helpers — unchanged
│   └── output.ts                   # printAnalyzeReport(), printSyncResult(), printPreview()
├── mirror/
│   ├── command.ts                  # MirrorCommand
│   ├── sync.ts                     # runMirrorSync(input): Result<GlobalStats, AppError>
│   ├── prepare.ts                  # prepareMirrorSync(cwd, opts)
│   ├── domain/
│   │   ├── types.ts                # unchanged
│   │   ├── exports.ts              # generateMirrorExports() — logic unchanged
│   │   ├── path-normalizer.ts      # normalizePath() — unchanged
│   │   └── errors.ts               # mirror-specific errors — unchanged
│   └── output.ts                   # printMirrorProgress()
├── tag/
│   ├── command.ts                  # TagCommand
│   ├── sync.ts                     # runTagSync(input): Result<TagResult, AppError>
│   ├── prepare.ts                  # prepareTagSync(cwd, opts)
│   ├── domain/
│   │   └── types.ts                # unchanged
│   └── output.ts                   # printTagProgress(), printTagResult()
└── config/
    ├── schema.ts                   # CodefastConfig Zod schema — unchanged
    └── loader.ts                   # loadConfig(cwd): Config | null
```

**Result:** ~55 files instead of 164 — a 66% cut.

---

### 3.2 Drop the DI container — use function composition

**Before (current):**

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

**After (target):**

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

No container, no module, no token. Fully type-safe at compile time.

---

### 3.3 Remove 1:1 port interfaces

**New rule:** create an interface only when there are **at least 2 concrete implementations**, or when another module
genuinely needs to **mock it for testing**.

In this CLI, every infrastructure call (fs, path, process) can be tested by passing a real temp path — no mock interface
needed. Pure domain logic needs no interface at all.

For telemetry: if wrapping is needed, use a **decorator function**, not DI `onActivation`:

```typescript
// Instead of: onActivation(createOptionalCliPortTelemetryActivation(...))
export function withTelemetry<T extends (...args: unknown[]) => unknown>(name: string, fn: T, telemetry: Telemetry): T {
  return ((...args) => {
    telemetry.trace(name);
    return fn(...args);
  }) as T;
}
```

---

### 3.4 A simpler command pattern

**Before:**

```typescript
// CommandPort interface + CommandTree type + CommandRouteWire union
// + CommanderCliHostAdapter translating CommandTree → Commander
// + register-cli-command-trees.ts
// = 3 files, a lot of indirection
```

**After:**

```typescript
// arrange/command.ts
export function createArrangeCommand(): Command {
  const cmd = new Command("arrange").description("Analyze and regroup Tailwind classes");

  cmd
    .command("analyze [target]")
    .option("--json", "JSON output")
    .action(async (target, opts) => {
      // ... directly here
    });

  // ...
  return cmd;
}
```

Commander is already declarative and composable. Wrapping it in a `CommandTree` JSON only adds a translation layer with
no payoff.

---

### 3.5 Shell utilities are functions, not injectables

**Before:** `CliLoggerPort` → `NodeCliLoggerAdapter` → `CliLoggerPortToken` → injected into every class.

**After:**

```typescript
// core/logger.ts
export const logger = {
  out: (msg: string) => process.stdout.write(msg + "\n"),
  err: (msg: string) => process.stderr.write(msg + "\n"),
};
```

Import it directly. To test, use `vi.spyOn(logger, 'out')`. No interface, no token.

The same goes for `CliPathPort` (which only calls `node:path`), `CliRuntimePort` (only `process`), and
`CliFilesystemPort` (only `node:fs`).

---

### 3.6 Presenters are functions

**Before:** a `PresentAnalyzeReportPresenter` interface + a `PresentAnalyzeReportPresenter` class + token + binding.

**After:**

```typescript
// arrange/output.ts
export function printAnalyzeReport(rootPath: string, report: AnalyzeReport): void { ... }
export function printSyncResult(result: ArrangeRunResult, write: boolean): void { ... }
export function printGroupPreview(plan: GroupFileWorkPlan): void { ... }
```

Import and call them directly in the command. Output-only functions do not need a presenter abstraction.

---

### 3.7 Unified error handling

Keep `Result<T, E>` and `AppError`. Add one top-level helper:

```typescript
// core/result.ts — added to the existing file
export function handleResult<T>(result: Result<T, AppError>, onSuccess: (value: T) => void): boolean {
  if (!result.ok) {
    logger.err(formatAppError(result.error));
    process.exitCode = exitCodeFor(result.error);
    return false;
  }
  onSuccess(result.value);
  return true;
}
```

This replaces the `CliExecutorService` injectable with a plain function.

---

## 4. Migration plan

### Phase 1 — Delete the DI container (breaking)

1. Remove `@codefast/di` from dependencies.
2. Delete every `*.module.ts` and `composition/tokens.ts`.
3. Delete the `@injectable` and `@inject` decorators.
4. Rewrite `cli.ts` with function composition.

### Phase 2 — Flatten the structure

1. Merge `application/use-cases/` functions into `<domain>/sync.ts` and `<domain>/analyze.ts`.
2. Delete `application/ports/inbound/` (all 8 files).
3. Delete `application/requests/` (every request type file).
4. Delete `contracts/models.ts` — move the types into the domain.
5. Merge presenter classes into functions in `output.ts`.

### Phase 3 — Simplify the shell

1. Delete `shell/application/ports/outbound/` (11 files → 0).
2. Replace it with `core/fs.ts`, `core/path.ts`, `core/logger.ts` (plain functions).
3. Delete the `coordination/` layer.
4. Delete `wiring/optional-cli-port-telemetry-activation.ts`.

### Phase 4 — Simplify the commands

1. Delete the `CommandTree` / `CommandRouteWire` abstraction.
2. Rewrite the commands against the Commander API directly.
3. Delete `bootstrap/register-cli-command-trees.ts` and `bootstrap/cli-application.module.ts`.
4. Simplify `bootstrap/composition-root.ts` → remove it entirely.

### Phase 5 — Preserve and clean the domain

1. Keep all pure `domain/` logic as-is (arrange AST, grouping, mirror exports, tag).
2. Rename to the new convention (drop the `.domain-service` and `.value-object` suffixes).
3. Update imports.

---

## 5. New file naming convention

| Old pattern                              | New pattern                  | Why                                   |
| ---------------------------------------- | ---------------------------- | ------------------------------------- |
| `analyze-directory.port.ts`              | ❌ Delete                    | Not needed                            |
| `analyze-directory.use-case.ts`          | `analyze.ts`                 | Clearer                               |
| `arrange-grouping.domain-service.ts`     | `grouping-service.ts`        | Redundant prefix inside `domain/`     |
| `tailwind-token.value-object.ts`         | `token-classifier.ts`        | Redundant suffix                      |
| `caught-unknown-message.value-object.ts` | `errors.ts`                  | This is one function, `messageFrom()` |
| `*.coordination.ts`                      | Merge into the caller        | The layer is not needed               |
| `composition/tokens.ts`                  | ❌ Delete                    | No more DI                            |
| `contracts/models.ts`                    | Merge into `domain/types.ts` | Redundant folder                      |

**Remaining suffix rules:**

- `.schema.ts` — Zod schemas
- `.test.ts` — test files
- No other suffix — the module name says what it is.

---

## 6. Testing strategy

**Unchanged:** unit tests for pure domain logic — the most valuable part, and untouched by the refactor.

**Improved:** integration tests no longer need to mock a DI container. Call the function directly against a temp
filesystem:

```typescript
// tests/arrange-analyze.test.ts
import { analyzeDirectory } from "#/arrange/analyze";

it("analyzes a real directory", () => {
  const tmpDir = createTempFixture("cn-calls");
  const result = analyzeDirectory(tmpDir);
  expect(result.ok).toBe(true);
});
```

No container setup, no mocked tokens. The tests are clearer and faster.

---

## 7. Checklist

- [x] `Result<T,E>`, `ok()`, `err()` unchanged (`core/result.ts`)
- [x] `AppError` unchanged (`core/errors.ts`, along with `messageFrom`)
- [x] All pure domain logic in `arrange/domain/` unchanged
- [x] All domain logic in `mirror/domain/` and `tag/domain/` unchanged
- [x] AST parsing/collectors unchanged (`arrange/domain/ast/`)
- [x] Config schema (Zod) unchanged (`config/schema.ts`)
- [x] `commander`, `zod`, `yaml`, `jiti`, `picomatch`, `typescript` dependencies unchanged
- [x] `@codefast/di` dependency **deleted**
- [x] Every `*.module.ts` **deleted**
- [x] Every `composition/tokens.ts` **deleted**
- [x] Every `application/ports/inbound/*.port.ts` **deleted**
- [x] Every `application/requests/*.ts` **deleted**
- [x] Every `contracts/models.ts` **deleted** (types merged)
- [x] `bootstrap/` folder **deleted** (its logic moved into `cli.ts`)
- [x] `CommandTree`/`CommandRouteWire` abstraction **deleted**
- [x] `shell/application/ports/outbound/` (11 files) **deleted**
- [x] `shell/application/coordination/` **deleted**
- [x] `shell/wiring/` **deleted**
- [x] Domain test coverage did not drop _(there was no measurable domain suite under `tests/` either before or after the
      refactor, so there is no measured regression — adding tests per §6 is an optional next step)_

---

## 8. Summary

This codebase has **good domain logic** buried under **three layers of architectural ceremony**. Hexagonal Architecture
does not mean every function must be wrapped in an interface + injectable class + token + module binding. It means
**domain logic does not depend on infrastructure** — and straightforward function composition is enough to get there.

> "A codebase is not complex because it has many patterns. It is simple because it has only as many patterns as the
> problem requires."

After the refactor, any new developer can read `cli.ts` and understand the whole flow in five minutes — instead of
tracing through 8 layers of DI container to find where `console.log` is called.

**Applied:** the current `src/` layout matches the spirit of §3; the operational document is
[ARCHITECTURE.md](./ARCHITECTURE.md). This document now serves as the **decision history** (why it changed) and a
**closed checklist** (§7).

## License

Released under the [MIT License](./LICENSE).
