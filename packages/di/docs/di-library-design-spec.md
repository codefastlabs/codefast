# DI Library — Design Specification

> Lấy cảm hứng từ InversifyJS v8 · Xây dựng hoàn toàn mới · Zero `reflect-metadata` · TC39 Decorators Stage 3 · TypeScript 5.5+ · ESM-only

---

## Mục lục

1. [Bối cảnh và mục tiêu](#1-bối-cảnh-và-mục-tiêu)
2. [Nguyên tắc thiết kế](#2-nguyên-tắc-thiết-kế)
3. [Token API](#3-token-api)
4. [Binding API](#4-binding-api)
5. [Container API](#5-container-api)
6. [Decorator layer](#6-decorator-layer)
7. [Module system](#7-module-system)
8. [Error hierarchy](#8-error-hierarchy)
9. [File structure](#9-file-structure)
10. [Roadmap](#10-roadmap)
11. [Stack kỹ thuật](#11-stack-kỹ-thuật)
12. [Đối chiếu với InversifyJS v8](#12-đối-chiếu-với-inversifyjs-v8)

---

## 1. Bối cảnh và mục tiêu

### InversifyJS v8 giải quyết được gì

InversifyJS v8 (release tháng 3/2026) mang lại nhiều cải thiện đáng kể so với v7: naming convention nhất quán (unqualified = sync, `Async` suffix = async), loại bỏ `Provider` thay bằng `Factory`, cải thiện type safety cho `ServiceIdentifier`, và chuyển sang ESM-only. Đây là những quyết định đúng đắn và thư viện này học từ chúng.

### InversifyJS v8 vẫn chưa giải quyết được

**`reflect-metadata` vẫn còn.** Getting started của v8 vẫn yêu cầu:

```
npm install inversify reflect-metadata
```

Và vẫn cần `experimentalDecorators: true` cùng `emitDecoratorMetadata: true` trong tsconfig — hai flag legacy gắn liền với một proposal TC39 đã bị thay thế.

**`ServiceIdentifier` vẫn là `string | symbol | Newable<T>`** — không phải branded type. `container.get<WrongType>('my-service')` vẫn compile được và trả về sai type. Không có gì ngăn được lỗi này ở compile time.

### Mục tiêu của thư viện này

- **Zero `reflect-metadata`** — không polyfill, không flag legacy
- **TC39 Decorator Stage 3** — `Symbol.metadata`, TypeScript 5.2+, không cần `experimentalDecorators`
- **Branded `Token<Value>`** — type-safe hoàn toàn, không bao giờ `any` rò rỉ ra ngoài
- **ESM-only** — như InversifyJS v8, không dual build
- **Học API đẹp từ v8** — lifecycle hooks, fluent builder, naming convention — nhưng làm lại từ đầu
- **Không tương thích ngược** với InversifyJS bất kỳ version nào

---

## 2. Nguyên tắc thiết kế

### 2.1 Naming — Không dùng tiền tố `I` hay `T`

| Tránh                   | Dùng                             | Lý do                              |
| ----------------------- | -------------------------------- | ---------------------------------- |
| `IContainer`            | `Container`                      | Interface mô tả hành vi, tên đã đủ |
| `ILogger`               | `Logger`                         | —                                  |
| `ContainerImpl`         | `DefaultContainer`               | `Impl` là lazy naming              |
| `T` (type param đơn lẻ) | `Value`, `Target`, `Deps`, `Ctx` | Tên mô tả ngữ cảnh                 |
| `TResult`               | `Result`                         | —                                  |

### 2.2 Naming — Sync/Async convention (học từ InversifyJS v8)

Quy tắc nhất quán: **unqualified = sync, `Async` suffix = async**. Không bao giờ có `Sync` suffix.

```ts
container.resolve(Logger); // sync
container.resolveAsync(Database); // async — có async factory trong chain
container.load(AppModule); // sync
container.loadAsync(LazyModule); // async — module có async setup
```

### 2.3 Token thay thế ServiceIdentifier

InversifyJS dùng `string | symbol | Newable<T>` làm service identifier. Cách này linh hoạt nhưng không type-safe — `container.get<WrongType>('my-service')` compile được và trả về sai type.

Thư viện này dùng `Token<Value>` — branded type — làm identifier duy nhất. Class cũng có thể dùng trực tiếp làm token (như InversifyJS), nhưng `Token<Value>` là cách ưu tiên khi cần abstraction.

### 2.4 Các nguyên tắc khác

**Zero magic:** Decorator là optional. Toàn bộ app có thể viết với explicit binding, không cần một decorator nào.

**Last-wins override:** Binding sau cùng thắng, không throw duplicate error — rất tiện cho test.

**Async phải explicit:** `resolve()` trên async binding throw `AsyncResolutionError` với message rõ ràng. Không silently return `Promise`.

**Lifecycle là first-class:** `onActivation` và `onDeactivation` trên từng binding — học từ InversifyJS v8 — nhưng type-safe hơn.

---

## 3. Token API

### 3.1 Tạo token

`token()` là factory function — nhất quán với cách TypeScript hiện đại viết (tương tự `signal()`, `ref()`).

```ts
import { token } from "@codefast/di";

// Cơ bản
const Logger = token<LoggerService>("Logger");
const Database = token<DatabaseService>("Database");
const Config = token<AppConfig>("Config");

// Token cho primitive
const Port = token<number>("Port");
const Env = token<"development" | "production">("Env");

// Tổ chức theo domain
export const Tokens = {
  Logger: token<LoggerService>("Logger"),
  Database: token<DatabaseService>("Database"),
  Config: token<AppConfig>("Config"),
} as const;
```

### 3.2 Type signature

```ts
// Branded type — không thể giả mạo bằng object literal thông thường
interface Token<Value> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value; // unique symbol, không export
}

// Helper để extract type
type TokenValue<T> = T extends Token<infer Value> ? Value : never;

// Resolve luôn trả về đúng type
const logger = container.resolve(Logger); // ^? LoggerService — không phải any
const port = container.resolve(Port); // ^? number
```

### 3.3 Class làm token

Class có thể dùng trực tiếp làm token khi không cần abstraction:

```ts
// Không cần token riêng
container.bind(ConsoleLogger).toSelf();
const logger = container.resolve(ConsoleLogger); // ^? ConsoleLogger

// Khi cần inject qua interface → dùng Token
container.bind(Logger).to(ConsoleLogger);
const logger = container.resolve(Logger); // ^? LoggerService
```

> **`toSelf()` không có `@injectable()`:** Nếu `ConsoleLogger` không có `@injectable()` và constructor có deps, container throw `MissingMetadataError` — không assume zero deps. Để dùng `toSelf()` với constructor deps mà không có decorator, dùng `toDynamic()` hoặc `toResolved()` thay thế.

---

## 4. Binding API

Binding mô tả cách tạo ra một value từ một token. API theo kiểu fluent builder.

### 4.0 ResolutionContext

`ctx` trong `toDynamic` và `toDynamicAsync` là một `ResolutionContext` — không phải container đầy đủ, chỉ expose resolve:

```ts
interface ResolutionContext {
  resolve<Value>(token: Token<Value> | Constructor<Value>, opts?: ResolveOptions): Value;
  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ): Promise<Value>;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ): Value | undefined;
}
```

### 4.1 Các loại binding

| Method                            | Tương đương InversifyJS v8        | Khi nào dùng                      |
| --------------------------------- | --------------------------------- | --------------------------------- |
| `.to(Class)`                      | `.to(Class)`                      | Container tự `new` và inject deps |
| `.toSelf()`                       | `.toSelf()`                       | Token chính là class              |
| `.toConstantValue(v)`             | `.toConstantValue(v)`             | Constant — config, primitive      |
| `.toDynamic(ctx => ...)`          | `.toDynamicValue(ctx => ...)`     | Factory với `ctx.resolve()`       |
| `.toDynamicAsync(ctx => Promise)` | (dùng `toDynamicValue` async)     | I/O khi khởi tạo                  |
| `.toResolved(factory, deps)`      | `.toResolvedValue(factory, deps)` | Explicit deps, không cần `ctx`    |
| `.toAlias(otherToken)`            | `.toService(otherId)`             | Alias token này → token khác      |

> **Ghi chú:** InversifyJS v8 dùng `toDynamicValue` cho cả sync lẫn async factory. Thư viện này tách ra hai method rõ ràng để compiler có thể enforce `resolveAsync()` khi cần.

### 4.2 Scope (học từ InversifyJS v8, đặt tên ngắn hơn)

```ts
.singleton()    // ←→ .inSingletonScope()  — tạo 1 lần, dùng mãi
.transient()    // ←→ .inTransientScope()  — mỗi resolve = new (default)
.scoped()       // ←→ .inRequestScope()   — 1 lần mỗi child container
```

### 4.3 Lifecycle hooks (học từ InversifyJS v8)

```ts
// onActivation: chạy sau khi resolve, trước khi cache vào scope
// onDeactivation: chạy khi unbind hoặc dispose — chỉ có ở singleton
container
  .bind(Database)
  .to(PostgresDatabase)
  .singleton()
  .onActivation(async (ctx, db) => {
    await db.connect();
    return db; // phải return instance (có thể wrap bằng Proxy)
  })
  .onDeactivation(async (db) => {
    await db.disconnect();
  });
```

Type-safe hơn InversifyJS v8 — callback nhận đúng type của binding, không phải generic:

```ts
// InversifyJS v8 — phải annotate thủ công
.onActivation((_context: ResolutionContext, katana: Katana) => { ... })

// Thư viện này — compiler tự infer type từ binding
container.bind(Logger).to(ConsoleLogger)
  .onActivation((ctx, logger) => {
  //                   ^? ConsoleLogger — không cần annotate
    return logger
  })
```

### 4.4 Named và tagged binding

Lấy ý tưởng từ InversifyJS v8 nhưng đơn giản hóa. Phase 1 chỉ có `whenNamed` và `whenTagged` — bỏ `whenAnyAncestor*`, `whenParent*` (quá phức tạp cho phần lớn use case, để Phase 4).

```ts
// Named binding — nhiều impl cùng token
container.bind(Logger).to(ConsoleLogger).whenNamed("console");
container.bind(Logger).to(FileLogger).whenNamed("file");

// Resolve theo tên
const logger = container.resolve(Logger, { name: "file" }); // ^? LoggerService

// Tagged binding
container.bind(Engine).to(PetrolEngine).whenTagged("fuel", "petrol");
container.bind(Engine).to(ElectricEngine).whenTagged("fuel", "electric");

// Resolve theo tag
const engine = container.resolve(Engine, { tag: ["fuel", "electric"] });
```

### 4.5 `toResolved` — explicit deps (học từ `toResolvedValue` của v8)

Alternative sạch hơn `toDynamic` khi deps đơn giản — không cần `ctx` object:

```ts
// toDynamic — dùng khi cần resolve nhiều deps hoặc logic phức tạp
container.bind(App).toDynamic((ctx) => {
  const logger = ctx.resolve(Logger);
  const config = ctx.resolve(Config);
  return new App(logger, config);
});

// toResolved — khai báo deps explicit, sạch hơn cho trường hợp đơn giản
container.bind(App).toResolved(
  (logger, config) => new App(logger, config),
  [Logger, Config], // deps array — type-safe với tuple inference
);
```

Type signature — tuple inference đảm bảo factory params khớp chính xác với deps:

```ts
toResolved<Deps extends readonly (Token<unknown> | Constructor)[]>(
  factory: (...args: { [K in keyof Deps]: TokenValue<Deps[K]> }) => Value,
  deps: Deps,
): BindingBuilder<Value>;
```

Với `deps: [Logger, Config]`, TypeScript infer factory params là `[LoggerService, AppConfig]` — không cần annotate thủ công.

### 4.6 BindingIdentifier — unbind chính xác (học từ v8)

`bind()` trả về builder có `.id()` để lấy `BindingIdentifier` — dùng để unbind một binding cụ thể trong multi-binding, không phải tất cả bindings của token:

```ts
const consoleLoggerBindingId = container.bind(Logger).to(ConsoleLogger).id(); // ←→ .getIdentifier() trong InversifyJS v8

// Unbind chính xác binding này — không ảnh hưởng các Logger binding khác
container.unbind(consoleLoggerBindingId);
```

### 4.7 Ví dụ đầy đủ

```ts
// Class binding
container.bind(Logger).to(ConsoleLogger).singleton();

// Self binding
container.bind(ConsoleLogger).toSelf().singleton();

// Constant value — không có scope (luôn là singleton)
container.bind(Config).toConstantValue({ port: 3000, env: "production" });

// Dynamic factory
container
  .bind(App)
  .toDynamic((ctx) => {
    const logger = ctx.resolve(Logger); // ^? LoggerService
    const config = ctx.resolve(Config); // ^? AppConfig
    return new App(logger, config);
  })
  .singleton();

// Async factory — phải dùng container.resolveAsync()
container
  .bind(Database)
  .toDynamicAsync(async (ctx) => {
    const cfg = ctx.resolve(Config);
    const db = new PostgresDatabase(cfg.dbUrl);
    await db.connect();
    return db;
  })
  .singleton()
  .onDeactivation(async (db) => {
    await db.disconnect();
  });

// Resolved — explicit deps
container
  .bind(Mailer)
  .toResolved((logger, config) => new Mailer(logger, config), [Logger, Config])
  .singleton();

// Alias
container.bind(AbstractLogger).toAlias(Logger);

// Named binding
container.bind(Logger).to(FileLogger).whenNamed("file");
```

> **Nguyên tắc fluent chain:** `BindingBuilder` trả về chính nó (`BindingBuilder<Value>`) — không phải `Container`. Mỗi `container.bind(...)` là một câu độc lập. Không thể chain `.bind()` liên tiếp trên builder.

---

## 5. Container API

### 5.1 Tạo container

```ts
import { Container } from "@codefast/di";

// Static factory — không dùng new Container()
const container = Container.create();

// Từ modules
const container = Container.fromModules(AppModule, DatabaseModule);
await Container.fromModulesAsync(AppModule, DatabaseModule);
```

### 5.2 Resolution

```ts
// Sync resolve — throws AsyncResolutionError nếu binding có async factory
const logger = container.resolve(Logger); // ^? LoggerService

// Async resolve — an toàn cho cả sync lẫn async binding
const db = await container.resolveAsync(Database); // ^? DatabaseService

// Optional — không throw nếu không tìm thấy binding
const logger = container.resolveOptional(Logger); // ^? LoggerService | undefined

// Multi — resolve tất cả bindings cùng token
const plugins = container.resolveAll(Plugin); // ^? Plugin[]

// Named / tagged
const fileLogger = container.resolve(Logger, { name: "file" });
const petrolEngine = container.resolve(Engine, { tag: ["fuel", "petrol"] });
```

### 5.3 Quản lý binding (naming convention từ v8)

```ts
// Thêm binding
container.bind(Logger).to(ConsoleLogger);

// Unbind tất cả bindings của token
container.unbind(Logger);

// Unbind một binding cụ thể (dùng BindingIdentifier)
container.unbind(consoleLoggerBindingId);

// Rebind — unbind tất cả rồi bind lại
container.rebind(Logger).to(FileLogger).singleton();

// Async variants (khi onDeactivation là async)
await container.unbindAsync(Database);
container.bind(Database).to(NewDatabase).singleton(); // bind lại là sync

// Load / unload module
container.load(FeatureModule);
container.unload(FeatureModule);
await container.loadAsync(AsyncFeatureModule);
await container.unloadAsync(AsyncFeatureModule);
```

### 5.4 Child container (scoped)

```ts
// Child kế thừa tất cả bindings của parent
// Scope 'scoped' reset độc lập trong mỗi child
const requestContainer = container.createChild();
requestContainer.bind(RequestId).toConstantValue(crypto.randomUUID());

const handler = requestContainer.resolve(RequestHandler);

// Dispose: gọi onDeactivation cho tất cả singleton thuộc child
await requestContainer.dispose();
```

### 5.5 Container interface

```ts
interface Container {
  // Binding
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  // Không có rebindAsync — async deactivation dùng unbindAsync rồi bind lại

  // Module
  load(...modules: Module[]): void;
  loadAsync(...modules: Array<Module | AsyncModule>): Promise<void>;
  unload(...modules: Module[]): void;
  unloadAsync(...modules: Array<Module | AsyncModule>): Promise<void>;

  // Resolution
  resolve<Value>(token: Token<Value> | Constructor<Value>, opts?: ResolveOptions): Value;
  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ): Promise<Value>;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ): Value | undefined;
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, opts?: ResolveOptions): Value[];

  // Scoping
  createChild(): Container;
  dispose(): Promise<void>;

  // Introspection — chỉ dùng dev/debug
  has(token: Token<unknown> | Constructor): boolean;
  inspect(): ContainerSnapshot;
}

interface ResolveOptions {
  name?: string;
  tag?: [tag: string, value: unknown];
}

// Static methods — không nằm trong interface vì TypeScript interface không model static
interface ContainerStatic {
  create(): Container;
  fromModules(...modules: Module[]): Container;
  fromModulesAsync(...modules: Array<Module | AsyncModule>): Promise<Container>;
}
```

---

## 6. Decorator layer

Decorator là syntactic sugar — core container không phụ thuộc vào chúng. Dùng **TC39 Decorator Stage 3** và `Symbol.metadata`. Không cần `experimentalDecorators: true` hay `reflect-metadata`.

### 6.1 Cách dùng

```ts
import { injectable, inject, injectOptional } from "@codefast/di";

@injectable()
class ConsoleLogger implements LoggerService {
  log(msg: string) {
    console.log(msg);
  }
}

@injectable()
class App {
  constructor(
    @inject(Logger) private logger: LoggerService,
    @inject(Config) private config: AppConfig,
    @injectOptional(Analytics) private analytics?: AnalyticsService,
  ) {}
}
```

### 6.2 Named / tagged inject

```ts
@injectable()
class Dashboard {
  constructor(
    @inject(Logger, { name: "console" }) private logger: LoggerService,
    @inject(Engine, { tag: ["fuel", "electric"] }) private engine: Engine,
  ) {}
}
```

### 6.3 Inheritance — explicit, không có magic

InversifyJS v7 có implicit inheritance injection — bị deprecated và thay bằng `@injectFromBase`. Thư viện này không có implicit injection từ đầu — mọi dep phải khai báo tường minh trong constructor:

```ts
@injectable()
class BaseService {
  constructor(@inject(Logger) protected logger: LoggerService) {}
}

// Child khai báo lại toàn bộ — explicit, không magic
@injectable()
class UserService extends BaseService {
  constructor(
    @inject(Logger) logger: LoggerService,
    @inject(UserRepo) private repo: UserRepository,
  ) {
    super(logger);
  }
}
```

### 6.4 MetadataReader — port interface

Container không đọc `Symbol.metadata` trực tiếp — đọc qua port này để có thể swap khi test:

```ts
interface MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
}

interface ConstructorMetadata {
  params: ParamMetadata[];
}

interface ParamMetadata {
  index: number;
  token: Token<unknown> | Constructor;
  optional: boolean;
  name?: string;
  tag?: [tag: string, value: unknown];
}
```

### 6.5 Danh sách decorator

| Decorator                       | Target            | Tác dụng                                                                                                                                                                          |
| ------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@injectable()`                 | class             | Đánh dấu class có thể auto-resolve; ghi param metadata vào `Symbol.metadata`                                                                                                      |
| `@inject(token, opts?)`         | constructor param | Ghi token + options (name/tag) cho param đó                                                                                                                                       |
| `@injectOptional(token, opts?)` | constructor param | Như `@inject` nhưng không throw nếu không có binding                                                                                                                              |
| `@singleton()`                  | class             | Gợi ý scope `singleton` — chỉ có hiệu lực khi binding dùng `.toSelf()` hoặc `.to()` mà không gọi `.singleton()` / `.transient()` / `.scoped()` explicit; explicit call luôn thắng |
| `@scoped()`                     | class             | Gợi ý scope `scoped` — cùng precedence rule như `@singleton()`                                                                                                                    |

### 6.6 Cấu hình tsconfig

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true
  }
}
```

Không cần `experimentalDecorators: true`. Decorator Stage 3 là chuẩn từ TypeScript 5.2.

---

## 7. Module system

Module là cách nhóm binding theo domain. Hỗ trợ cả sync lẫn async setup — theo convention `load`/`loadAsync` của InversifyJS v8.

### 7.1 Sync module

```ts
import { Module } from "@codefast/di";

export const LoggerModule = Module.create("Logger", (m) => {
  m.bind(Logger).to(ConsoleLogger).singleton();
});

export const AppModule = Module.create("App", (m) => {
  m.import(LoggerModule);
  m.bind(Config).toConstantValue(loadConfig());
  m.bind(App).toSelf().singleton();
});
```

### 7.2 Async module

```ts
export const DatabaseModule = Module.createAsync("Database", async (m) => {
  // Có thể chạy async setup trước khi đăng ký binding
  const config = await loadRemoteConfig();

  m.import(LoggerModule);
  m.bind(Config).toConstantValue(config);
  m.bind(Database)
    .toDynamicAsync(async (ctx) => {
      const db = new PostgresDatabase(config.dbUrl);
      await db.connect();
      return db;
    })
    .singleton()
    .onDeactivation(async (db) => {
      await db.disconnect();
    });
});

// Async module phải load bằng loadAsync
const container = Container.create();
await container.loadAsync(DatabaseModule);
```

### 7.3 Dùng module

```ts
// Sync — tất cả modules phải là sync
const container = Container.fromModules(AppModule, LoggerModule);

// Async — khi có ít nhất 1 async module
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);

// Override binding trong test — last-wins
const testContainer = Container.fromModules(AppModule).bind(Database).toConstantValue(mockDatabase);
```

### 7.4 Module interface

Hai type riêng biệt — không nhầm lẫn:

```ts
// ModuleBuilder — chỉ tồn tại trong callback của Module.create()
// Người dùng không cầm giữ type này; chỉ gọi m.bind() và m.import() trong callback
interface ModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  import(...modules: Module[]): void;
}

interface AsyncModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  import(...modules: Array<Module | AsyncModule>): void;
}

// Module — object đã hoàn chỉnh, được export và pass vào container
// Người dùng không gọi bind() hay import() trực tiếp trên object này
interface Module {
  readonly name: string;
}

interface AsyncModule {
  readonly name: string;
}
```

`Module.create("name", (m: ModuleBuilder) => { ... })` — callback nhận `ModuleBuilder`, trả về `Module`. Tương tự cho `Module.createAsync`.

---

## 8. Error hierarchy

Tất cả error có `code` string (machine-readable) và message đủ context để debug ngay không cần tra tài liệu.

```ts
// Base
class DiError extends Error {
  abstract readonly code: string;
}

// Token không có binding nào
class TokenNotBoundError extends DiError {
  code = "TOKEN_NOT_BOUND";
  // "No binding found for token 'Database'.
  //  Did you forget container.bind(Database)...?"
}

// A → B → A
class CircularDependencyError extends DiError {
  code = "CIRCULAR_DEPENDENCY";
  cycle: string[]; // ['App', 'Database', 'App'] — in toàn bộ cycle
}

// resolve() sync trên async binding
class AsyncResolutionError extends DiError {
  code = "ASYNC_RESOLUTION";
  // "Token 'Database' has an async factory.
  //  Use container.resolveAsync() instead."
}

// Singleton phụ thuộc vào scoped — captive dependency
class ScopeViolationError extends DiError {
  code = "SCOPE_VIOLATION";
}

// @injectable thiếu trên class cần auto-resolve
class MissingMetadataError extends DiError {
  code = "MISSING_METADATA";
}

// resolve() với name/tag không khớp binding nào
class NoMatchingBindingError extends DiError {
  code = "NO_MATCHING_BINDING";
  // "Multiple bindings found for token 'Logger' but none match { name: 'file' }."
}

// load() trên AsyncModule — phải dùng loadAsync()
class AsyncModuleLoadError extends DiError {
  code = "ASYNC_MODULE_LOAD";
  // "Module 'Database' is async. Use container.loadAsync() instead."
}
```

---

## 9. File structure

```
packages/di/
├── src/
│   ├── token.ts                Token<Value> — factory fn, branded type, TokenValue
│   ├── binding.ts              Binding union, BindingBuilder fluent API, BindingIdentifier
│   ├── registry.ts             BindingRegistry — Map<Token, Binding[]>
│   ├── resolver.ts             DependencyResolver — graph walk, circular detection
│   ├── scope.ts                ScopeManager — singleton/scoped cache
│   ├── lifecycle.ts            LifecycleManager — onActivation/onDeactivation
│   ├── container.ts            DefaultContainer + Container interface
│   ├── module.ts               Module + AsyncModule
│   │
│   ├── decorators/
│   │   ├── injectable.ts       @injectable() — Stage 3 class decorator
│   │   ├── inject.ts           @inject() + @injectOptional()
│   │   ├── metadata.ts         SymbolMetadataReader — implements MetadataReader
│   │   └── index.ts
│   │
│   ├── errors.ts               DiError + tất cả subclasses
│   └── index.ts                Public API exports
│
├── test/
│   ├── token.test.ts
│   ├── container.test.ts
│   ├── scope.test.ts
│   ├── lifecycle.test.ts
│   ├── circular.test.ts
│   ├── decorators.test.ts
│   ├── module.test.ts
│   └── named-tagged.test.ts
│
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### 9.1 Public API (`index.ts`)

```ts
// Token
export { token } from "./token";
export type { Token, TokenValue } from "./token";

// Container
export { Container } from "./container";
export type { ResolveOptions, ContainerSnapshot } from "./container";

// Binding types
export type { BindingIdentifier } from "./binding";

// Module
export { Module, AsyncModule } from "./module";

// Decorators
export { injectable, inject, injectOptional, singleton, scoped } from "./decorators";

// Errors
export {
  DiError,
  TokenNotBoundError,
  CircularDependencyError,
  AsyncResolutionError,
  ScopeViolationError,
  MissingMetadataError,
  NoMatchingBindingError,
  AsyncModuleLoadError,
} from "./errors";

// Không export:
// Binding, Registry, Resolver, ScopeManager, LifecycleManager, MetadataReader
```

### 9.2 `package.json`

```json
{
  "name": "@codefast/di",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "engines": { "node": ">=20.19.0" }
}
```

ESM-only, không có `"require"` export — giống InversifyJS v8. Node 20.19+ hỗ trợ `require(esm)` mà không cần flag.

### 9.3 `tsup.config.ts`

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"], // ESM-only — không cần CJS
  dts: true,
  clean: true,
  sourcemap: true,
});
```

---

## 10. Roadmap

### Phase 0 — Nền móng (1–2 ngày)

Setup package trong monorepo: tsconfig strict, tsup, vitest. Định nghĩa `Token<Value>`, `Binding` union, `DiError` hierarchy. Không có logic — chỉ là types và contracts.

**Deliverable:** Package import được, types compile sạch, zero runtime code.

---

### Phase 1 — Core container, không decorator (3–5 ngày)

Build theo thứ tự — mỗi bước test được độc lập:

1. `token.ts` — factory fn, branded type, `TokenValue`
2. `binding.ts` — discriminated union, `BindingBuilder`, `BindingIdentifier`
3. `registry.ts` — `Map<Token, Binding[]>`
4. `scope.ts` — singleton cache, scoped cache per child
5. `lifecycle.ts` — `LifecycleManager`, `onActivation`/`onDeactivation`
6. `resolver.ts` — graph walk, circular detection bằng `Set`
7. `container.ts` — compose tất cả, public API

**Deliverable:** Dùng được hoàn toàn với explicit binding, không cần decorator:

```ts
const container = Container.create();

container.bind(Config).toConstantValue({ port: 3000 });
container
  .bind(Logger)
  .to(ConsoleLogger)
  .singleton()
  .onActivation((ctx, logger) => {
    logger.log("Logger initialized");
    return logger;
  });
container
  .bind(App)
  .toResolved((logger, config) => new App(logger, config), [Logger, Config])
  .singleton();

const app = container.resolve(App); // fully typed, no any
```

---

### Phase 2 — Decorator layer (3–4 ngày)

TC39 Stage 3 `@injectable()`, `@inject()`, `@injectOptional()` với named/tagged options. `SymbolMetadataReader` implements `MetadataReader`. Container nhận `MetadataReader` qua constructor — injectable trong test.

**Deliverable:** Decorator hoạt động, test cả decorator path và non-decorator path.

---

### Phase 3 — Module system (2–3 ngày)

`Module.create()` và `Module.createAsync()`. Import graph resolution. `Container.fromModules()` / `Container.fromModulesAsync()`. `load`/`loadAsync`/`unload`/`unloadAsync` theo convention v8. Deduplication tự động.

**Deliverable:** Tổ chức app thành modules, override binding dễ dàng trong test.

---

### Phase 4 — Advanced + DX (ongoing)

- **Constraint bindings đầy đủ:** `when(constraint)` tùy chỉnh, `whenParentIs`, `whenAnyAncestorIs`
- **Scope violation detection:** Warn khi singleton phụ thuộc vào scoped
- **Container-level initialize():** Warm up tất cả singleton một lần
- **Dependency graph:** Export DOT/JSON cho visualization
- **Integration packages:** `@codefast/di-hono`, `@codefast/di-fastify`

---

## 11. Stack kỹ thuật

| Công cụ                 | Vai trò                                      |
| ----------------------- | -------------------------------------------- |
| TypeScript 5.5+         | Decorator Stage 3, `Symbol.metadata`, strict |
| tsup                    | Bundle ESM, `.d.ts`                          |
| Vitest                  | Unit test                                    |
| publint                 | Kiểm tra package exports correctness         |
| `@arethetypeswrong/cli` | Kiểm tra type resolution correctness         |
| pnpm                    | Package manager (workspace monorepo)         |

### tsconfig

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

---

## 12. Đối chiếu với InversifyJS v8

### Học từ v8

| Tính năng v8                             | Cách triển khai ở đây                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Naming: unqualified=sync, `Async`=async  | Giữ nguyên: `resolve`/`resolveAsync`, `load`/`loadAsync`, `unbind`/`unbindAsync`, ... |
| ESM-only, Node ≥ 20.19                   | Giống v8                                                                              |
| `onActivation` / `onDeactivation`        | Giữ, nhưng callback tự infer type — không cần annotate                                |
| `toResolvedValue(factory, deps)`         | Đổi tên thành `toResolved(factory, deps)`                                             |
| `toService()` alias                      | Đổi tên thành `toAlias()`                                                             |
| `BindingIdentifier` / `.getIdentifier()` | Giữ concept, đổi method thành `.id()`                                                 |
| Bỏ `Provider` / `ProviderBinding`        | Không có từ đầu — chỉ có `toDynamic` và `toDynamicAsync`                              |
| Named/tagged bindings                    | Giữ `whenNamed`, `whenTagged` — bỏ `whenAnyAncestor*` cho Phase 1                     |

### Cải thiện hơn v8

| InversifyJS v8                                         | Thư viện này                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `reflect-metadata` + `experimentalDecorators` bắt buộc | Zero `reflect-metadata` — TC39 Stage 3 + `Symbol.metadata`          |
| `ServiceIdentifier = string \| symbol \| Newable<T>`   | `Token<Value>` branded type — resolve luôn đúng type                |
| `container.get<WrongType>('id')` compile được          | Không thể — `Token<Value>` mang type ở compile time                 |
| `.inSingletonScope()`, `.inTransientScope()`           | `.singleton()`, `.transient()` — ngắn hơn                           |
| `toDynamicValue` cho cả sync lẫn async                 | `toDynamic` vs `toDynamicAsync` — compiler enforce `resolveAsync()` |
| Async module không có API riêng                        | `Module.createAsync()` + `container.loadAsync()` — explicit         |

### Không học từ v8

| InversifyJS v8                                     | Lý do không học                                    |
| -------------------------------------------------- | -------------------------------------------------- |
| `string \| symbol` làm service identifier          | Không type-safe — dùng `Token<Value>`              |
| `new Container()` public constructor               | Dùng `Container.create()` static factory           |
| Implicit inheritance injection (`@injectFromBase`) | Explicit từ đầu — `@inject` trong từng constructor |

---

_Phiên bản tài liệu: 2.0 — April 2026_
_Lấy cảm hứng từ InversifyJS v8.0.0 (March 2026)_
