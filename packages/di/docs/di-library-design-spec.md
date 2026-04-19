# DI Library — Design Specification

> Lấy cảm hứng từ InversifyJS v8 · Xây dựng hoàn toàn mới · Zero `reflect-metadata` · TC39 Decorators Stage 3 · TypeScript 5.9+ · ESM-only

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

Và vẫn cần `experimentalDecorators: true` cùng `emitDecoratorMetadata: true` trong tsconfig — hai flag legacy gắn liền với một proposal TC39 đã bị thay thế. v8 không có kế hoạch bỏ `reflect-metadata` vì toàn bộ decorator layer của nó vẫn phụ thuộc vào `emitDecoratorMetadata` để đọc constructor types.

**`ServiceIdentifier` vẫn không phải branded type.** v8 đã narrow từ `string | symbol | Function` xuống `string | symbol | AbstractNewable<T> | Newable<T>` — cải thiện nhỏ so với v7 — nhưng vẫn không phải branded type. `container.get<WrongType>('my-service')` vẫn compile được và trả về sai type. Không có gì ngăn được lỗi này ở compile time.

### Mục tiêu của thư viện này

- **Zero `reflect-metadata`** — không polyfill, không flag legacy
- **TC39 Decorator Stage 3** — `Symbol.metadata` stable (TypeScript 5.9+), không cần `experimentalDecorators`
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
  /**
   * Dependency-graph navigation context — dùng trong `BindingBuilder.when()` predicates.
   * Khác với `resolve*`: không cần để tạo instance thông thường, chỉ cần khi binding
   * cần biết vị trí trong dependency graph để quyết định resolve hay không.
   */
  graph: ConstraintContext;
}
```

`ConstraintContext` chứa:

```ts
interface ConstraintContext {
  /** Mảng label (readonly snapshot) của token trên path hiện tại — dùng để hiển thị lỗi. */
  resolutionPath: readonly string[];
  /**
   * Stack các frame trên construction chain — dùng để detect captive dependency
   * (singleton giữ scoped/transient). Khác với `resolutionPath` (chỉ là labels string),
   * `materializationStack` chứa metadata đầy đủ (scope, bindingId, kind) của từng step.
   */
  materializationStack: readonly MaterializationFrame[];
  /** Frame ngay trên (direct parent) trong construction chain, hoặc `undefined` ở root. */
  parent: MaterializationFrame | undefined;
  /** Tất cả các frame trên parent (không gồm direct parent). */
  ancestors: readonly MaterializationFrame[];
  currentResolveHint: ResolveHint | undefined;
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
// onDeactivation: chỉ áp dụng singleton — chạy khi unbind hoặc dispose
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

> **`onDeactivation` và scope:** `onDeactivation` chỉ được gọi cho `singleton` binding. Transient không có lifecycle. Scoped — instance bị release khi child container bị dispose nhưng `onDeactivation` không được gọi.

**Builder type narrowing — compile-time enforcement:** `.singleton()`, `.transient()`, `.scoped()` trả về các builder type khác nhau. `onDeactivation` **chỉ có mặt** trên `SingletonBindingBuilder` — gọi trên transient/scoped là lỗi TypeScript, không phải silent no-op:

```ts
container.bind(Handler).to(RequestHandler)
  .transient()
  .onDeactivation(...); // ← TypeScript Error: Property 'onDeactivation' does not exist

container.bind(Database).to(PostgresDatabase)
  .singleton()
  .onDeactivation(...); // ← OK
```

Type interfaces của builder:

```ts
// Base — chứa các method chung, không có scope hoặc deactivation
interface BindingBuilder<Value> {
  singleton(): SingletonBindingBuilder<Value>;
  transient(): TransientBindingBuilder<Value>;
  scoped(): ScopedBindingBuilder<Value>;
  onActivation(fn: (ctx: ResolutionContext, instance: Value) => Value | Promise<Value>): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  id(): BindingIdentifier;
}

// Singleton — thêm onDeactivation
interface SingletonBindingBuilder<Value> extends BindingBuilder<Value> {
  onDeactivation(fn: (instance: Value) => void | Promise<void>): this;
}

// Transient và Scoped — KHÔNG có onDeactivation
interface TransientBindingBuilder<Value> extends BindingBuilder<Value> {}
interface ScopedBindingBuilder<Value> extends BindingBuilder<Value> {}
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

// Tagged binding — tag key là string, value là unknown
container.bind(Engine).to(PetrolEngine).whenTagged("fuel", "petrol");
container.bind(Engine).to(ElectricEngine).whenTagged("fuel", "electric");

// Resolve theo tag
const engine = container.resolve(Engine, { tag: ["fuel", "electric"] });

// Tránh collision giữa các package — dùng namespace prefix trong string
container.bind(Engine).to(HydrogenEngine).whenTagged("mylib:fuel", "hydrogen");
const h = container.resolve(Engine, { tag: ["mylib:fuel", "hydrogen"] });
```

> **Tag key là `string`:** `whenTagged` và `ResolveOptions.tag` chỉ nhận `string`. Để tránh collision giữa các package, dùng namespace prefix: `"mylib:fuel"`, `"@scope/pkg:tag"`. Cách này nhất quán với convention đã phổ biến trong hệ sinh thái JS/TS, serialize thẳng vào JSON, và không gây vấn đề debugging với local symbols cùng description.

### 4.5 `toResolved` — explicit deps (lấy cảm hứng từ `toResolvedValue` của v8)

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
  [Logger, Config] as const, // `as const` bắt buộc để TypeScript infer tuple, không infer union
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

> **Khác với `toResolvedValue` của InversifyJS v8:** v8 dùng `injectOptions` thay vì plain token array — mỗi phần tử có thể là `ServiceIdentifier` hoặc object `{ name, serviceIdentifier }` để support named injection. Thư viện này dùng plain token array cho trường hợp không cần named/tagged, và `toDynamic` với `ctx.resolve(token, { name })` cho trường hợp cần — tách biệt rõ ràng hơn.

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

// Hoặc dùng `await using` (TC39 Explicit Resource Management — TypeScript 5.2+) — tự động dispose khi ra khỏi scope.
// Lưu ý: `using` (sync) KHÔNG hoạt động — Container chỉ implement Symbol.asyncDispose.
// Gọi `using container = ...` sẽ throw ngay tại runtime với message hướng dẫn.
{
  await using scoped = container.createChild();
  scoped.bind(RequestId).toConstantValue(crypto.randomUUID());
  const handler = scoped.resolve(RequestHandler);
  // scoped[Symbol.asyncDispose]() được gọi ở cuối block
}
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
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ): Promise<Value[]>;
  // resolveAll() throw AsyncResolutionError nếu bất kỳ binding nào là async.
  // resolveAllAsync() an toàn cho cả sync lẫn async binding trong cùng multi-binding.

  // Scoping
  createChild(): Container;

  // Disposal — hỗ trợ TC39 Explicit Resource Management (`await using`).
  // Disposal — hỗ trợ TC39 Explicit Resource Management.
  // Chỉ có async dispose vì onDeactivation có thể async.
  // [Symbol.dispose] tồn tại nhưng throw ngay — hướng dẫn dùng `await using`.
  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  [Symbol.dispose](): never; // throws: "Container disposal is async. Use `await using` or `await container.dispose()`."

  // Initialization — warm up tất cả singletons trước khi serve traffic
  // initialize() sync đã bị bỏ — dùng initializeAsync() cho mọi trường hợp
  initializeAsync(): Promise<void>;

  // Validation — phát hiện scope violations (captive dependency)
  // Throw ScopeViolationError nếu singleton phụ thuộc vào scoped/transient.
  // Nên gọi sau khi load xong tất cả modules, trước khi serve traffic.
  validate(): void;

  // Introspection — chỉ dùng dev/debug
  has(token: Token<unknown> | Constructor): boolean;
  inspect(): ContainerSnapshot;
  // Overloaded — format quyết định return type (không phải hai method riêng)
  generateDependencyGraph(opts?: DotGraphOptions & { format?: "dot" }): string;
  generateDependencyGraph(opts: DotGraphOptions & { format: "json" }): ContainerGraphJson;
}

// ContainerGraphJson — typed, không phải raw string
interface ContainerGraphJson {
  nodes: Array<{ id: string; scope: "singleton" | "transient" | "scoped" }>;
  edges: Array<{ from: string; to: string }>;
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

TC39 Decorator Stage 3 **không hỗ trợ parameter decorator** (TS1206) — đây là quyết định có chủ ý của TC39, không phải thiếu sót. `@inject` trên constructor parameter chỉ khả dụng với `experimentalDecorators: true` (legacy), trái với mục tiêu của thư viện.

Giải pháp: `@injectable()` nhận **deps array** khai báo tường minh thứ tự constructor — pattern tương tự Angular Ivy và tsyringe v2, và khớp hoàn hảo với nguyên tắc "explicit over magic" của spec.

```ts
import { injectable, inject, optional } from "@codefast/di";

// Class không có deps — không cần truyền gì
@injectable()
class ConsoleLogger implements LoggerService {
  log(msg: string) {
    console.log(msg);
  }
}

// Class có deps — khai báo tường minh qua deps array
@injectable([Logger, Config])
class App {
  constructor(
    private logger: LoggerService,
    private config: AppConfig,
  ) {}
}

// Optional dependency — dùng helper optional()
@injectable([Logger, Config, optional(Analytics)])
class App {
  constructor(
    private logger: LoggerService,
    private config: AppConfig,
    private analytics?: AnalyticsService,
  ) {}
}
```

`optional()` là plain function trả về `InjectionDescriptor` — không phải decorator — hoàn toàn Stage 3 compatible.

### 6.2 Named / tagged inject

`inject()` là plain function trả về `InjectionDescriptor` — dùng trong deps array của `@injectable()`. Hỗ trợ đầy đủ `name` và `tag` options:

```ts
import { injectable, inject, optional } from "@codefast/di";

@injectable([inject(Logger, { name: "console" }), inject(Engine, { tag: ["fuel", "electric"] })]) // tag key luôn là string
class Dashboard {
  constructor(
    private logger: LoggerService,
    private engine: Engine,
  ) {}
}

// Kết hợp optional + named
@injectable([inject(Logger, { name: "file" }), optional(Analytics)])
class Reporter {
  constructor(
    private logger: LoggerService,
    private analytics?: AnalyticsService,
  ) {}
}
```

Type signature của `inject()` và `optional()`:

```ts
// Plain function — không phải decorator
function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  opts?: { name?: string; tag?: [tag: string, value: unknown] },
): InjectionDescriptor<Value>;

function optional<Value>(
  token: Token<Value> | Constructor<Value>,
  opts?: { name?: string; tag?: [tag: string, value: unknown] },
): InjectionDescriptor<Value | undefined>;

// InjectionDescriptor — được truyền vào deps array
interface InjectionDescriptor<Value = unknown> {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: [tag: string, value: unknown];
}
```

### 6.3 Inheritance — explicit, không có magic

InversifyJS v7 có implicit inheritance injection — bị deprecated và thay bằng `@injectFromBase`. Thư viện này không có implicit injection từ đầu — mọi dep phải khai báo tường minh trong deps array:

```ts
@injectable([Logger])
class BaseService {
  constructor(protected logger: LoggerService) {}
}

// Child khai báo lại toàn bộ — explicit, không magic
@injectable([Logger, UserRepo])
class UserService extends BaseService {
  constructor(
    logger: LoggerService,
    private repo: UserRepository,
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
  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined;
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

interface LifecycleMetadata {
  postConstruct?: string; // method name
  preDestroy?: string; // method name
}
```

> **`Symbol.metadata` prototype chain safety — quy tắc bắt buộc:**
>
> TC39 quy định `Symbol.metadata` của subclass prototype-chain từ parent. Nếu child không có `@injectable()`, `target[Symbol.metadata]` vẫn có thể đọc được metadata của parent — dẫn đến inject sai số lượng deps, không có lỗi compile.
>
> `SymbolMetadataReader` (implementation của `MetadataReader`) **phải** kiểm tra `Object.hasOwn` trước khi đọc:
>
> ```ts
> getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
>   const meta = target[Symbol.metadata];
>   // PHẢI dùng hasOwn — không dùng `in` hay truy cập trực tiếp
>   if (!meta || !Object.hasOwn(meta, INJECTABLE_KEY)) return undefined;
>   return meta[INJECTABLE_KEY] as ConstructorMetadata;
> }
> ```
>
> Nếu child kế thừa parent nhưng không có `@injectable()` → `getConstructorMetadata` trả về `undefined` → container throw `MissingMetadataError`, không silently dùng metadata của parent.

### 6.5 Property injection qua `accessor` field decorator

TC39 Stage 3 hỗ trợ `accessor` keyword — tạo getter/setter với private backing slot. `@inject(token)` có thể dùng như **field decorator** trên `accessor` để inject property sau khi construct, thay thế cho deps array khi muốn:

```ts
import { injectable, inject } from "@codefast/di";

@injectable()
class Dashboard {
  @inject(Logger) accessor logger!: LoggerService;
  @inject(Database) accessor db!: DatabaseService;

  // Không cần truyền deps array — injection qua accessor
}
```

Cơ chế hoạt động:

- `@inject(Logger)` trên `accessor` ghi token vào `Symbol.metadata` của class qua `context.metadata`
- `context.addInitializer` (chạy **per-instance** khi object được tạo) gọi `container.resolve(token)` và set vào backing slot
- Container truyền reference vào class decorator context qua `ResolutionContext` — không cần global container

> **Constructor injection vẫn là cách ưu tiên** — dễ test hơn, immutable, rõ deps hơn. Property injection qua `accessor` hữu ích khi:
>
> - Class kế thừa framework mà bạn không kiểm soát constructor
> - Circular dependency có chủ ý (hiếm, cần document rõ)
> - Tích hợp với hệ thống ngoài (web components, ORM entities)
>
> **Không hỗ trợ plain field** (`@inject(Logger) logger!: LoggerService`) — chỉ `accessor`. Plain field decorator trong TC39 Stage 3 không có getter/setter để intercept; `accessor` là cách đúng theo spec.

Type signature của `inject` khi dùng làm field decorator:

```ts
// inject() hoạt động như cả plain function (deps array) lẫn accessor decorator
function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  opts?: { name?: string; tag?: [tag: string, value: unknown] },
): InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value>;
```

### 6.6 Method lifecycle decorators — `@postConstruct` và `@preDestroy`

TC39 Stage 3 hỗ trợ method decorator. `@postConstruct()` và `@preDestroy()` là method decorators, ghi method name vào `Symbol.metadata` — `LifecycleManager` đọc và gọi tự động:

```ts
@injectable([Config])
class DatabaseService {
  constructor(private config: AppConfig) {}

  @postConstruct()
  async initialize(): Promise<void> {
    // chạy sau khi construct, trước khi cache vào scope
    await this.connect(this.config.dbUrl);
  }

  @preDestroy()
  async cleanup(): Promise<void> {
    // chạy khi onDeactivation (singleton dispose)
    await this.disconnect();
  }
}

// Binding không cần .onActivation() / .onDeactivation() nữa
container.bind(Database).to(DatabaseService).singleton();
```

> **Precedence:** Nếu binding có cả `@postConstruct()` trên class **và** `.onActivation()` tại binding site, thứ tự là: `@postConstruct()` chạy trước → `.onActivation()` chạy sau (nhận instance đã được init). Tương tự, `.onDeactivation()` chạy trước → `@preDestroy()` chạy sau.
>
> **Scope:** `@postConstruct()` chạy cho mọi scope (singleton, transient, scoped) — mỗi lần instance mới được tạo. `@preDestroy()` chỉ chạy cho singleton (giống `onDeactivation`), vì transient không có lifecycle tracking.
>
> **Async:** Cả hai đều hỗ trợ async — method trả về `Promise` sẽ được await. Dùng `@postConstruct()` async trên transient binding đồng nghĩa với resolve luôn trả về `Promise` → bắt buộc dùng `resolveAsync()`.

### 6.7 Auto-registration qua `context.addInitializer`

`@injectable()` hỗ trợ option `autoRegister` — khi bật, class tự đăng ký vào một global registry tại thời điểm class được định nghĩa (module load time), không cần `container.bind()` tường minh:

```ts
import { injectable, autoRegistered } from "@codefast/di";

@injectable([Logger, Config], { autoRegister: true })
class UserService { ... }

@injectable([Logger], { autoRegister: true })
class EmailService { ... }

// Container load tất cả auto-registered classes một lần
const container = Container.create();
container.loadAutoRegistered(); // bind tất cả class có autoRegister: true
```

Cơ chế: Class decorator `@injectable` dùng `context.addInitializer` để push constructor vào `AUTO_REGISTER_REGISTRY` (module-level array). `context.addInitializer` trên class decorator chạy **một lần khi class được định nghĩa** (không phải per-instance) — phù hợp cho registration.

> **Auto-register scope:** Default là `transient`. Để override: `{ autoRegister: true, scope: "singleton" }`.
>
> **Circular import:** `autoRegister` không giải quyết circular import — class phải được import (module phải chạy) trước khi `container.loadAutoRegistered()`. Convention: import tất cả service files vào một `index.ts` entry point trước khi khởi tạo container.
>
> **Coexistence:** Auto-register và explicit binding cùng tồn tại. Explicit `container.bind(UserService)` sau `loadAutoRegistered()` override binding tự động (last-wins).

`loadAutoRegistered()` trả về số lượng class đã đăng ký, dùng để debug:

```ts
const count = container.loadAutoRegistered();
console.log(`Registered ${count} services`); // "Registered 12 services"
```

### 6.8 Danh sách decorator và helpers

| API                         | Loại                          | Target / Ngữ cảnh                | Tác dụng                                                                                                                                      |
| --------------------------- | ----------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@injectable(deps?, opts?)` | decorator                     | class                            | Ghi param metadata vào `Symbol.metadata`. `deps` = array `(Token \| Constructor \| InjectionDescriptor)[]`. `opts.autoRegister` để tự đăng ký |
| `inject(token, opts?)`      | plain fn / accessor decorator | deps array hoặc `accessor` field | Tạo `InjectionDescriptor` hoặc inject qua accessor getter/setter                                                                              |
| `optional(token, opts?)`    | plain fn                      | deps array                       | Như `inject` nhưng resolve trả về `undefined` nếu không có binding                                                                            |
| `@postConstruct()`          | decorator                     | method                           | Ghi method name vào `Symbol.metadata` — LifecycleManager gọi sau khi construct, trước khi cache                                               |
| `@preDestroy()`             | decorator                     | method                           | Ghi method name vào `Symbol.metadata` — LifecycleManager gọi khi deactivation (singleton only)                                                |

> **`@singleton()` và `@scoped()` đã bị bỏ.** Scope là binding-time concern — khai báo tại `.singleton()` / `.transient()` / `.scoped()` trong fluent chain, không phải trên class. Decorator scope-hint tạo ra hai nguồn sự thật và dễ gây nhầm lẫn.

> **Tại sao không có `@inject` / `@injectOptional` trên parameter?**
> TC39 Decorator Stage 3 không định nghĩa parameter decorator (TS1206). Chúng chỉ tồn tại trong hệ thống `experimentalDecorators` legacy. Deps array trong `@injectable()` thay thế hoàn toàn và explicit hơn.

### 6.6 Cấu hình tsconfig

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "strict": true
  }
}
```

Không cần `experimentalDecorators: true`. Decorator Stage 3 là chuẩn từ TypeScript 5.0; `Symbol.metadata` stable từ TypeScript 5.9.

---

## 7. Module system

Module là cách nhóm binding theo domain. Hỗ trợ cả sync lẫn async setup — theo convention `load`/`loadAsync` của InversifyJS v8.

### 7.1 Sync module

```ts
import { Module } from "@codefast/di";

export const LoggerModule = Module.create("Logger", (builder) => {
  builder.bind(Logger).to(ConsoleLogger).singleton();
});

export const AppModule = Module.create("App", (builder) => {
  builder.import(LoggerModule);
  builder.bind(Config).toConstantValue(loadConfig());
  builder.bind(App).toSelf().singleton();
});
```

### 7.2 Async module

```ts
export const DatabaseModule = Module.createAsync("Database", async (builder) => {
  // Có thể chạy async setup trước khi đăng ký binding
  const config = await loadRemoteConfig();

  builder.import(LoggerModule);
  builder.bind(Config).toConstantValue(config);
  builder
    .bind(Database)
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
const testContainer = Container.fromModules(AppModule);
testContainer.bind(Database).toConstantValue(mockDatabase);
```

> **Module là pure description — không ôm state runtime:** Cùng một `Module` object có thể load song song vào nhiều containers độc lập. `Module` chỉ giữ `name` và callback `setup`; container mới là bên track "đã load module nào" và "binding nào thuộc module nào". Đây là use case chính để test (share module AppModule giữa nhiều integration test mà không cần reset).
>
> **Deduplication:** Trong cùng một container, gọi `container.load(M)` nhiều lần hoặc `m.import(M)` từ nhiều module là **no-op cho lần thứ hai trở đi** — module chỉ chạy `setup` đúng một lần trên mỗi container. Dedup dựa trên Module object identity, không phải `name`.

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
│   ├── token.test.ts
│   ├── binding.ts              Binding union, BindingBuilder fluent API, BindingIdentifier
│   ├── binding.test.ts
│   ├── registry.ts             BindingRegistry — Map<Token, Binding[]>
│   ├── registry.test.ts
│   ├── resolver.ts             DependencyResolver — graph walk, circular detection
│   ├── resolver.test.ts        Bao gồm circular dependency cases
│   ├── scope.ts                ScopeManager — singleton/scoped cache
│   ├── scope.test.ts
│   ├── lifecycle.ts            LifecycleManager — onActivation/onDeactivation
│   ├── lifecycle.test.ts
│   ├── container.ts            DefaultContainer + Container interface
│   ├── container.test.ts       Bao gồm named/tagged và integration tests
│   ├── module.ts               Module + AsyncModule
│   ├── module.test.ts
│   │
│   ├── decorators/
│   │   ├── injectable.ts       @injectable(deps?, opts?) — class decorator + autoRegister option
│   │   ├── injectable.test.ts
│   │   ├── inject.ts           inject() + optional() — plain fn và accessor field decorator
│   │   ├── inject.test.ts
│   │   ├── lifecycle-decorators.ts  @postConstruct() + @preDestroy() — method decorators
│   │   ├── lifecycle-decorators.test.ts
│   │   ├── metadata.ts         SymbolMetadataReader — implements MetadataReader (hasOwn guard)
│   │   └── index.ts
│   │
│   ├── errors.ts               DiError + tất cả subclasses
│   └── index.ts                Public API exports
│
├── package.json
├── tsconfig.json
└── tsdown.config.ts
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
export { injectable } from "./decorators";
// @singleton() và @scoped() đã bị bỏ — scope khai báo tại binding site

// Lifecycle method decorators
export { postConstruct, preDestroy } from "./decorators";

// Injection helpers — dùng được cả trong deps array lẫn như accessor field decorator
export { inject, optional } from "./decorators";

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
  "engines": { "node": ">=22.0.0" }
}
```

ESM-only, không có `"require"` export — giống InversifyJS v8. Node 20.19+ hỗ trợ `require(esm)` mà không cần flag.

### 9.3 `tsdown.config.ts`

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
});
```

---

## 10. Roadmap

### Phase 0 — Nền móng (1–2 ngày)

Setup package trong monorepo: tsconfig strict, tsdown, vitest. Định nghĩa `Token<Value>`, `Binding` union, `DiError` hierarchy. Không có logic — chỉ là types và contracts.

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

### Phase 2 — Decorator layer (4–5 ngày)

TC39 Stage 3 `@injectable(deps?, opts?)` với deps array và `autoRegister` option. `inject()` và `optional()` hoạt động cả như plain function (deps array) lẫn `accessor` field decorator (property injection). `@postConstruct()` và `@preDestroy()` method decorators tích hợp vào `LifecycleManager`. `SymbolMetadataReader` với `Object.hasOwn` guard cho prototype chain safety. Container nhận `MetadataReader` qua constructor — injectable trong test.

**Deliverable:** Đầy đủ constructor injection, property injection qua `accessor`, method lifecycle decorators, auto-registration. Test cả decorator path và non-decorator path.

---

### Phase 3 — Module system (2–3 ngày)

`Module.create()` và `Module.createAsync()`. Import graph resolution. `Container.fromModules()` / `Container.fromModulesAsync()`. `load`/`loadAsync`/`unload`/`unloadAsync` theo convention v8. Deduplication tự động.

**Constraint quan trọng:** Module phải reusable — cùng một `Module` object có thể load vào nhiều containers độc lập. Không có "single-container ownership". Đây là requirement cứng cho test workflow.

**Deliverable:** Tổ chức app thành modules, override binding dễ dàng trong test.

---

### Phase 4 — Advanced + DX

- **Constraint bindings đầy đủ:** `when(constraint)` tùy chỉnh, `whenParentIs`, `whenAnyAncestorIs` — export từ `@codefast/di/constraints`
- **Scope violation detection:** `container.validate()` throw `ScopeViolationError` khi singleton phụ thuộc vào scoped/transient (captive dependency)
- **Container-level `initializeAsync()`:** warm up tất cả singletons (sync lẫn async) trước khi serve traffic. `initialize()` sync đã bị bỏ
- **Dependency graph:** `generateDependencyGraph({ format: "dot" })` (Graphviz) và `generateDependencyGraph({ format: "json" })` trả về `ContainerGraphJson` typed — export từ `@codefast/di/dependency-graph`
- **Builder type narrowing:** `onDeactivation` chỉ compile được trên `SingletonBindingBuilder`
- **Integration packages:** `@codefast/di-hono`, `@codefast/di-fastify`

### Phase 5 — Integration packages

- `@codefast/di-hono` — middleware + scoped container per request cho Hono
- `@codefast/di-fastify` — plugin + scoped container per request cho Fastify

---

## 11. Stack kỹ thuật

| Công cụ                 | Vai trò                                             |
| ----------------------- | --------------------------------------------------- |
| TypeScript 5.9+         | Decorator Stage 3, `Symbol.metadata` stable, strict |
| tsdown                  | Bundle ESM, `.d.ts`                                 |
| Vitest                  | Unit test                                           |
| publint                 | Kiểm tra package exports correctness                |
| `@arethetypeswrong/cli` | Kiểm tra type resolution correctness                |
| pnpm                    | Package manager (workspace monorepo)                |

### tsconfig

```json
{
  "compilerOptions": {
    "target": "ESNext",
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

| Tính năng v8                              | Cách triển khai ở đây                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Naming: unqualified=sync, `Async`=async   | Giữ nguyên: `resolve`/`resolveAsync`, `load`/`loadAsync`, `unbind`/`unbindAsync`, ...     |
| ESM-only, Node ≥ 20.19                    | Giống v8                                                                                  |
| `onActivation` / `onDeactivation`         | Giữ, nhưng callback tự infer type — không cần annotate                                    |
| `toResolvedValue(factory, injectOptions)` | Đổi tên thành `toResolved(factory, deps)` với deps là plain token array — đơn giản hơn    |
| `toService()` alias                       | Đổi tên thành `toAlias()`                                                                 |
| `BindingIdentifier` / `.getIdentifier()`  | Giữ concept, đổi method thành `.id()`                                                     |
| Bỏ `Provider` / `ProviderBinding`         | Không có từ đầu — chỉ có `toDynamic` và `toDynamicAsync`                                  |
| Named/tagged bindings                     | Giữ `whenNamed`, `whenTagged` (tag key `string` only) — bỏ `whenAnyAncestor*` cho Phase 1 |

### Cải thiện hơn v8

| InversifyJS v8                                                             | Thư viện này                                                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `reflect-metadata` + `experimentalDecorators` bắt buộc                     | Zero `reflect-metadata` — TC39 Stage 3 + `Symbol.metadata`                                                                     |
| `ServiceIdentifier = string \| symbol \| AbstractNewable<T> \| Newable<T>` | `Token<Value>` branded type — resolve luôn đúng type                                                                           |
| `container.get<WrongType>('id')` compile được                              | Không thể — `Token<Value>` mang type ở compile time                                                                            |
| `.inSingletonScope()`, `.inTransientScope()`                               | `.singleton()`, `.transient()` — ngắn hơn                                                                                      |
| `toDynamicValue` cho cả sync lẫn async                                     | `toDynamic` vs `toDynamicAsync` — compiler enforce `resolveAsync()`                                                            |
| Async module không có API riêng                                            | `Module.createAsync()` + `container.loadAsync()` — explicit                                                                    |
| `@inject` trên parameter (cần `experimentalDecorators`)                    | `@injectable([deps])` + `inject()` / `optional()` — TC39 Stage 3 thuần; `inject()` cũng dùng được như accessor field decorator |
| `getAll()` chỉ có sync                                                     | `resolveAll()` + `resolveAllAsync()` — consistent với sync/async convention                                                    |
| `onDeactivation` không có compile-time guard                               | Builder type narrowing — `onDeactivation` chỉ tồn tại trên `SingletonBindingBuilder`                                           |
| Không có method lifecycle decorator trên class                             | `@postConstruct()` / `@preDestroy()` method decorators — TC39 Stage 3, không cần `reflect-metadata`                            |
| Không có property injection trong Stage 3                                  | `@inject(token) accessor field` — TC39 `accessor` keyword, per-instance via `context.addInitializer`                           |
| `Symbol.metadata` prototype chain không được xử lý                         | `SymbolMetadataReader` dùng `Object.hasOwn` guard — không silently inherit metadata của parent class                           |

### Không học từ v8

| InversifyJS v8                                     | Lý do không học                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `string \| symbol` làm service identifier          | Không type-safe — dùng `Token<Value>`                                              |
| `new Container({ parent })` để tạo child container | Dùng `container.createChild()` — explicit hơn, không lộ constructor options        |
| Implicit inheritance injection (`@injectFromBase`) | Explicit từ đầu — deps array trong `@injectable()` khai báo tường minh tất cả      |
| Parameter decorator `@inject` / `@injectOptional`  | TS1206 — không tồn tại trong TC39 Stage 3; dùng `inject()` / `optional()` thay thế |
| `@singleton()` / `@scoped()` scope hint decorators | Scope là binding-time concern — decorator scope-hint tạo hai nguồn sự thật         |

---

_Phiên bản tài liệu: 3.0 — April 2026_
_Lấy cảm hứng từ InversifyJS v8.0.0 (March 2026)_
