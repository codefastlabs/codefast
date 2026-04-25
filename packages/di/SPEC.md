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

**`ServiceIdentifier` vẫn không phải branded type.** v8 đã narrow từ `string | symbol | Function` xuống `string | symbol | AbstractNewable<T> | Newable<T>` (ký hiệu `T` giữ nguyên theo API gốc của Inversify) — cải thiện nhỏ so với v7 — nhưng vẫn không phải branded type. `container.get<WrongType>('my-service')` vẫn compile được và trả về sai type. Không có gì ngăn được lỗi này ở compile time.

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

Quy tắc này áp dụng cho code của thư viện và mọi snippet minh họa trong SPEC. Trường hợp tài liệu trích nguyên văn API bên ngoài (ví dụ Inversify dùng `Newable<T>`) có thể giữ nguyên để tránh sai nghĩa khi đối chiếu.

### 2.2 Naming — Sync/Async convention (học từ InversifyJS v8)

Quy tắc nhất quán: **unqualified = sync, `Async` suffix = async**. Không bao giờ có `Sync` suffix.

```ts
container.resolve(Logger); // sync
container.resolveAsync(Database); // async — có async factory trong chain
container.load(AppModule); // sync
container.loadAsync(LazyModule); // async — module có async setup
```

### 2.3 Token thay thế ServiceIdentifier

InversifyJS dùng `string | symbol | Newable<T>` làm service identifier (`T` là ký hiệu generic của API gốc). Cách này linh hoạt nhưng không type-safe — `container.get<WrongType>('my-service')` compile được và trả về sai type.

Thư viện này dùng `Token<Value>` — branded type — làm identifier duy nhất. Class cũng có thể dùng trực tiếp làm token (như InversifyJS), nhưng `Token<Value>` là cách ưu tiên khi cần abstraction.

### 2.4 Fluent chain — thứ tự chuẩn

**Thứ tự chain chuẩn và duy nhất:**

```
bind(token)
  .to*(…)       // 1. Strategy — bắt buộc
  .when*(…)     // 2. Constraint — tuỳ chọn, luôn sau to*
  .scope()      // 3. Scope — tuỳ chọn, luôn sau when*
  .on*(…)       // 4. Lifecycle — tuỳ chọn, luôn sau scope
```

`when*` **không thể** gọi trước `to*()` vì `bind(token)` chỉ trả về `BindToBuilder` (không có `when*`). `when*` **không thể** gọi sau `scope()` vì scope builders không expose `when*`. Compiler enforce đúng thứ tự này.

### 2.5 Các nguyên tắc khác

**Zero magic:** Decorator là optional. Toàn bộ app có thể viết với explicit binding, không cần một decorator nào.

**Last-wins / override:** `bind()` áp dụng **slot-aware last-wins ở registration-time** (container + module), không đợi đến lúc `resolve`. Cùng slot (`default`, cùng `whenNamed`, cùng `whenTagged`) thì binding mới thay binding cũ; slot khác thì append để phục vụ `resolveAll`.

**Async phải explicit:** `resolve()` trên async binding throw `AsyncResolutionError` với message rõ ràng. Không silently return `Promise`.

**Lifecycle là first-class:** `onActivation` và `onDeactivation` trên từng binding — học từ InversifyJS v8 — nhưng type-safe hơn. Container cũng có container-level hooks áp dụng cho tất cả binding của một token.

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
type TokenValue<Type> = Type extends Token<infer Value> ? Value : never;

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

Binding mô tả cách tạo ra một value từ một token. API theo kiểu fluent builder với thứ tự chuẩn: `to*() → when*() → scope() → on*()`.

### 4.0 ResolutionContext

`ctx` trong `toDynamic` và `toDynamicAsync` là một `ResolutionContext` — không phải container đầy đủ, chỉ expose resolve:

```ts
interface ResolutionContext {
  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value;
  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value>;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined;
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value[];
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]>;
  /**
   * Dependency-graph navigation context — dùng trong `BindingBuilder.when()` predicates.
   * Khác với `resolve*`: không cần để tạo instance thông thường, chỉ cần khi binding
   * cần biết vị trí trong dependency graph để quyết định resolve hay không.
   */
  graph: ConstraintContext;
}
```

`resolveAll`/`resolveAllAsync` trong `ResolutionContext` giữ nguyên ngữ cảnh resolve hiện tại (`resolutionPath`, `materializationStack`, parent/ancestors) — nghĩa là vẫn áp dụng đầy đủ scope validation (captive dependency) và `when()` predicates.

`ConstraintContext` chứa:

```ts
interface ConstraintContext {
  /** Mảng label (readonly snapshot) của token trên path hiện tại — dùng để hiển thị lỗi. */
  resolutionPath: readonly string[];
  /**
   * Stack các frame trên construction chain — dùng để detect captive dependency.
   * Khác với `resolutionPath` (chỉ là labels string), `materializationStack`
   * chứa metadata đầy đủ (scope, bindingId, kind) của từng step.
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

### 4.2 Scope

```ts
.singleton()  // ←→ .inSingletonScope()  — tạo 1 lần, dùng mãi
.transient()  // ←→ .inTransientScope()  — mỗi resolve = new (default)
.scoped()     // ←→ .inRequestScope()   — 1 lần mỗi child container
```

Scope **luôn** đứng sau `when*` trong chain (xem 2.4). Default khi không khai báo scope là `transient`.

### 4.3 Constraint — `when*`

`when*` đứng ngay sau `to*()`, trước scope. Mỗi binding có thể có một hoặc nhiều constraint kết hợp.

```ts
// Named binding
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding — tag key là string, value là unknown
container.bind(Engine).to(PetrolEngine).whenTagged("fuel", "petrol");
container.bind(Engine).to(ElectricEngine).whenTagged("fuel", "electric");

// Chỉ match khi không có name/tag nào (default slot tường minh)
container.bind(Logger).to(NoopLogger).whenDefault();

// Custom predicate — dùng ConstraintContext
container
  .bind(Logger)
  .to(VerboseLogger)
  .when((ctx) => ctx.ancestors.some((f) => f.token === "DebugModule"));

// Kết hợp name + custom predicate trên cùng binding
container
  .bind(Logger)
  .to(AuditLogger)
  .whenNamed("audit")
  .when((ctx) => ctx.parent?.scope === "singleton");
```

> **Tag key là `string`:** `whenTagged` chỉ nhận `string` làm tag key. Dùng namespace prefix để tránh collision giữa các package: `"mylib:fuel"`, `"@scope/pkg:env"`.

> **`whenDefault()` tường minh vs không khai báo constraint:** Binding không có bất kỳ `when*` nào cũng match default slot. `whenDefault()` hữu ích khi muốn document rõ ràng ý định, hoặc kết hợp với custom `when()`.

> **Resolve bằng hint:**
>
> ```ts
> container.resolve(Logger, { name: "file" });
> container.resolve(Engine, { tag: ["fuel", "electric"] });
> ```

### 4.4 Lifecycle hooks

`onActivation` chạy sau khi resolve, trước khi cache vào scope. `onDeactivation` chỉ áp dụng singleton — compile-time enforced bởi builder type.

```ts
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

**Builder type narrowing — compile-time enforcement:**

```ts
container.bind(Handler).to(RequestHandler)
  .transient()
  .onDeactivation(...); // ← TypeScript Error: Property 'onDeactivation' does not exist

container.bind(Database).to(PostgresDatabase)
  .singleton()
  .onDeactivation(...); // ← OK
```

Type-safe hơn InversifyJS v8 — callback nhận đúng type của binding, không cần annotate thủ công:

```ts
// InversifyJS v8 — phải annotate thủ công
.onActivation((_context: ResolutionContext, katana: Katana) => { ... })

// Thư viện này — compiler tự infer type từ binding
container.bind(Logger).to(ConsoleLogger)
  .onActivation((ctx, logger) => {
  //                   ^? ConsoleLogger — không cần annotate
    return logger;
  });
```

### 4.5 Builder type interfaces

```ts
// Trả về từ bind(token) — chỉ có to* methods
interface BindToBuilder<Value> {
  to(type: Constructor<Value>): BindingBuilder<Value>;
  toSelf(): BindingBuilder<Value>;
  toConstantValue(value: Value): ConstantBindingBuilder<Value>;
  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value>;
  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value>;
  toResolved<Deps extends readonly (Token<unknown> | Constructor)[]>(
    factory: (...args: { [K in keyof Deps]: TokenValue<Deps[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value>;
  toAlias(target: Token<Value> | Constructor<Value>): void;
}

// Trả về từ to*() — constraint → scope → lifecycle
interface BindingBuilder<Value> {
  // 1. Constraint (tuỳ chọn, gọi trước scope)
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  // 2. Scope (sau constraint)
  singleton(): SingletonBindingBuilder<Value>;
  transient(): TransientBindingBuilder<Value>;
  scoped(): ScopedBindingBuilder<Value>;
  // 3. Lifecycle (nếu không gọi scope, mặc định transient)
  onActivation(fn: ActivationHandler<Value>): this;
  // 4. ID
  id(): BindingIdentifier;
}

// Trả về từ toConstantValue() — luôn singleton, không có scope choice
interface ConstantBindingBuilder<Value> {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}

// Trả về từ .singleton() — thêm onDeactivation, không còn when* hay scope
interface SingletonBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}

// Trả về từ .transient() hoặc .scoped() — không có onDeactivation, không còn when* hay scope
interface TransientBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  id(): BindingIdentifier;
}
interface ScopedBindingBuilder<Value> extends TransientBindingBuilder<Value> {}
```

> **Tại sao `when*` không còn sau scope?** Scope builders (`SingletonBindingBuilder`, `TransientBindingBuilder`, `ScopedBindingBuilder`) không expose `when*` — calling `scope().whenNamed(...)` là TypeScript error. Đây là compile-time enforcement cho ordering rule ở section 2.4.

### 4.6 `toResolved` — explicit deps

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

### 4.7 `BindingIdentifier` — unbind chính xác

`bind()` trả về builder có `.id()` để lấy `BindingIdentifier` — dùng để unbind một binding cụ thể trong multi-binding:

```ts
const consoleLoggerBindingId = container.bind(Logger).to(ConsoleLogger).whenNamed("console").id();

// Unbind chính xác binding này — không ảnh hưởng các Logger binding khác
container.unbind(consoleLoggerBindingId);
```

### 4.8 Ví dụ đầy đủ

```ts
// Class binding
container.bind(Logger).to(ConsoleLogger).singleton();

// Self binding
container.bind(ConsoleLogger).toSelf().singleton();

// Constant value — không có scope (luôn là singleton)
container.bind(Config).toConstantValue({ port: 3000, env: "production" });

// Named binding với scope
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding
container.bind(Engine).to(PetrolEngine).whenTagged("fuel", "petrol");
container.bind(Engine).to(ElectricEngine).whenTagged("fuel", "electric");

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
    const appConfig = ctx.resolve(Config);
    const db = new PostgresDatabase(appConfig.dbUrl);
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
```

> **Nguyên tắc fluent chain:** `BindingBuilder` trả về chính nó (`this`) hoặc scoped builder — không phải `Container`. Mỗi `container.bind(...)` là một câu độc lập.
>
> **Staged auto-commit:** `to*()` chỉ chốt strategy trên builder; binding sẽ auto-commit ở cuối chain (microtask). Trước các thao tác đọc/resolve (`has`, `resolve*`, `validate`, `inspect`, ...) container flush pending registrations để đảm bảo thấy trạng thái mới nhất.

### 4.9 Phân loại single binding vs multiple binding

**Từ vựng (normative):**

- **Registration (bản ghi):** một object binding trong danh sách của một `RegistryKey`.
- **Slot:** nhóm binding có thể last-wins tại registration-time:
  - `default` — không `whenNamed`, không `whenTagged`, không `when`
  - `name:<value>` — `whenNamed`
  - `tag:<k=v>` — `whenTagged`

  Runtime gom `whenNamed` + toàn bộ `whenTagged` thành **một khóa slot** ổn định; "cùng name + cùng tập tag" thì last-wins, khác một trong hai thì slot khác.

- **Predicate-only `when()`:** binding chỉ có `.when(predicate)` (không kèm `whenNamed`/`whenTagged`) không tham gia slot last-wins — nhiều bản ghi cùng token có thể tồn tại song song. Nếu sau lọc vẫn còn ≥ 2 candidate, `resolve`/`resolveAsync` throw `InternalError` (`"INTERNAL_ERROR"`) — **không** last-wins.

- **Candidate:** bản ghi vượt qua lọc `ResolveHint` và `when(ctx)`.
- **Single:** sau lọc còn đúng một candidate.
- **Multiple:** có chủ đích giữ ≥ 2 candidate để phục vụ `resolveAll*` hoặc hint.

**Bảng tình huống:**

| #   | Tình huống                                                | Phân loại                        | `resolve` không hint     | `resolveAll` / hint         |
| --- | --------------------------------------------------------- | -------------------------------- | ------------------------ | --------------------------- |
| 1   | `bind(T).to*(A)` một lần                                  | Single                           | Trả A                    | Trả `[A]`                   |
| 2   | `bind(T).to*(A)` rồi `bind(T).to*(B)`                     | Single (last-wins slot default)  | Trả B                    | Trả `[B]`                   |
| 3   | `...whenNamed("a").to*(A)` rồi `...whenNamed("a").to*(B)` | Single theo slot named           | —                        | Hint `{name:"a"}` trả B     |
| 4   | `...whenNamed("a").to*(A)` và `...whenNamed("b").to*(B)`  | Multiple (named slots khác nhau) | Lỗi nếu không có default | `resolveAll(T)` thấy A và B |
| 5   | `...to*(A)` và `...whenNamed("x").to*(B)`                 | Single + Multiple song song      | Trả A (default slot)     | `resolveAll(T)` thấy A và B |
| 6   | `container.rebind(T).to*(C)`                              | Single (explicit reset)          | Trả C                    | Trả `[C]`                   |

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

### 5.3 Quản lý binding

```ts
// Thêm binding
container.bind(Logger).to(ConsoleLogger);

// Unbind tất cả bindings của token
container.unbind(Logger);

// Unbind một binding cụ thể (dùng BindingIdentifier)
container.unbind(consoleLoggerBindingId);

// Unbind tất cả bindings trong container
container.unbindAll();
await container.unbindAllAsync(); // khi onDeactivation là async

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

### 5.4 Container-level activation hooks

Ngoài per-binding `.onActivation()`, container cũng hỗ trợ container-level hooks — apply cho **tất cả** binding của một token, kể cả binding được thêm sau:

```ts
// Áp dụng cho mọi binding của Logger, không cần sửa từng binding
container.onActivation(Logger, (ctx, logger) => {
  logger.setCorrelationId(ctx.graph.currentResolveHint?.name ?? "default");
  return logger;
});

container.onDeactivation(Database, async (db) => {
  // cleanup cho mọi Database binding khi unbind
  await db.flushMetrics();
});
```

> **Thứ tự:** Container-level activation chạy **sau** per-binding `onActivation`. Container-level deactivation chạy **sau** per-binding `onDeactivation`. Chain: `@postConstruct()` → per-binding activation → container-level activation; container-level deactivation → per-binding deactivation → `@preDestroy()`.

### 5.5 Child container

```ts
// Child kế thừa tất cả bindings của parent
// Scope 'scoped' reset độc lập trong mỗi child
const requestContainer = container.createChild();
requestContainer.bind(RequestId).toConstantValue(crypto.randomUUID());

const handler = requestContainer.resolve(RequestHandler);

// Dispose: gọi onDeactivation cho tất cả singleton thuộc child
await requestContainer.dispose();

// Hoặc dùng `await using` (TC39 Explicit Resource Management — TypeScript 5.2+)
{
  await using scoped = container.createChild();
  scoped.bind(RequestId).toConstantValue(crypto.randomUUID());
  const handler = scoped.resolve(RequestHandler);
  // scoped[Symbol.asyncDispose]() được gọi ở cuối block
}
```

### 5.6 Container interface

```ts
/** Tuỳ chọn cho `generateDependencyGraph`. */
type GraphOptions = { readonly hideInternals?: boolean };

interface Container {
  // --- Binding ---
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  unbindAll(): void;
  unbindAllAsync(): Promise<void>;
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  // Không có rebindAsync — async deactivation dùng unbindAsync rồi bind lại

  // --- Module ---
  load(...modules: Module[]): void;
  loadAsync(...modules: Array<Module | AsyncModule>): Promise<void>;
  unload(...modules: Module[]): void;
  unloadAsync(...modules: Array<Module | AsyncModule>): Promise<void>;

  // --- Container-level lifecycle hooks ---
  onActivation<Value>(
    token: Token<Value> | Constructor<Value>,
    handler: ActivationHandler<Value>,
  ): void;
  onDeactivation<Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void;

  // --- Resolution ---
  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value;
  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value>;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined;
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value[];
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]>;
  // resolveAll() throw AsyncResolutionError nếu bất kỳ binding nào là async.

  // --- Scoping ---
  createChild(): Container;

  // --- Disposal ---
  // Chỉ có async dispose vì onDeactivation có thể async.
  // [Symbol.dispose] tồn tại nhưng throw ngay — hướng dẫn dùng `await using`.
  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  [Symbol.dispose](): never;

  // --- Initialization ---
  initializeAsync(): Promise<void>;

  // --- Validation ---
  validate(): void;

  // --- Introspection ---
  has(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  // has() kiểm tra cả parent chain (như isBound trong v8)
  hasOwn(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  // hasOwn() chỉ kiểm tra container hiện tại, không leo lên parent
  lookupBindings(token: Token<unknown> | Constructor): readonly Binding<unknown>[] | undefined;
  inspect(): ContainerSnapshot;
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson;
}

interface ResolveOptions {
  name?: string;
  tag?: [tag: string, value: unknown];
}

// Static methods
interface ContainerStatic {
  create(): Container;
  fromModules(...modules: Module[]): Container;
  fromModulesAsync(...modules: Array<Module | AsyncModule>): Promise<Container>;
}
```

> **`has` vs `hasOwn`:** `has(token)` check toàn bộ parent chain (tương đương `isBound` trong v8). `hasOwn(token)` chỉ check container hiện tại (tương đương `isCurrentBound` trong v8) — hữu ích khi cần biết binding được định nghĩa ở child hay kế thừa từ parent.

---

## 6. Decorator layer

Decorator là syntactic sugar — core container không phụ thuộc vào chúng. Dùng **TC39 Decorator Stage 3** và `Symbol.metadata`. Không cần `experimentalDecorators: true` hay `reflect-metadata`.

### 6.1 Cách dùng

TC39 Decorator Stage 3 **không hỗ trợ parameter decorator** (TS1206) — đây là quyết định có chủ ý của TC39. `@inject` trên constructor parameter chỉ khả dụng với `experimentalDecorators: true` (legacy), trái với mục tiêu của thư viện.

Giải pháp: `@injectable()` nhận **deps array** khai báo tường minh thứ tự constructor — pattern tương tự Angular Ivy và tsyringe v2.

```ts
import { injectable, inject, injectAll, optional } from "@codefast/di";

// Class không có deps
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

// Optional dependency
@injectable([Logger, Config, optional(Analytics)])
class App {
  constructor(
    private logger: LoggerService,
    private config: AppConfig,
    private analytics?: AnalyticsService,
  ) {}
}

// Multi dependency — inject tất cả binding cùng token thành mảng
@injectable([injectAll(Plugin)])
class PluginRunner {
  constructor(private plugins: Plugin[]) {}
}
```

`optional()` là plain function trả về `InjectionDescriptor` — không phải decorator — hoàn toàn Stage 3 compatible.

### 6.2 Named / tagged / multi inject

`inject()`, `optional()`, `injectAll()` đều là plain function trả về `InjectionDescriptor`:

```ts
@injectable([inject(Logger, { name: "console" }), inject(Engine, { tag: ["fuel", "electric"] })])
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

// Multi-binding injection
@injectable([injectAll(Plugin)])
class Runner {
  constructor(private plugins: Plugin[]) {}
}
```

Type signature:

```ts
function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: { name?: string; tag?: [tag: string, value: unknown] },
): InjectionDescriptor<Value>;

function optional<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: { name?: string; tag?: [tag: string, value: unknown] },
): InjectionDescriptor<Value | undefined>;

function injectAll<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: { name?: string; tag?: [tag: string, value: unknown] },
): InjectionDescriptor<Value[]>;

interface InjectionDescriptor<Value = unknown> {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: [tag: string, value: unknown];
  readonly isInjectAllBindings?: boolean;
}
```

### 6.3 Inheritance — explicit, không có magic

Mọi dep phải khai báo tường minh trong deps array — không có implicit inheritance injection:

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

> **`Symbol.metadata` prototype chain safety:**
>
> `SymbolMetadataReader.getConstructorMetadata` phải:
>
> 1. Đọc **chỉ** metadata bag **own** của class: `Object.getOwnPropertyDescriptor(target, Symbol.metadata)?.value`
> 2. Trên bag đó, dùng `Object.hasOwn(meta, INJECTABLE_KEY)` trước khi đọc
>
> ```ts
> getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
>   const own = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
>   if (own === undefined) return undefined;
>   const meta = own.value;
>   if (!meta || typeof meta !== "object" || !Object.hasOwn(meta, INJECTABLE_KEY)) return undefined;
>   return meta[INJECTABLE_KEY] as ConstructorMetadata;
> }
> ```
>
> Nếu child kế thừa parent nhưng không có `@injectable()` → `getConstructorMetadata` trả về `undefined` → container throw `MissingMetadataError`, không silently dùng metadata của parent.

### 6.5 Property injection qua `accessor` field decorator

TC39 Stage 3 hỗ trợ `accessor` keyword. `@inject(token)` có thể dùng như **field decorator** trên `accessor`:

```ts
@injectable()
class Dashboard {
  @inject(Logger) accessor logger!: LoggerService;
  @inject(Database) accessor db!: DatabaseService;
}
```

Cơ chế: `@inject(token)` trên `accessor` ghi token vào `Symbol.metadata` qua `context.metadata`; `context.addInitializer` chạy **per-instance** gọi `container.resolve(token)` và set vào backing slot.

> **Constructor injection vẫn là cách ưu tiên** — dễ test hơn, immutable. Property injection qua `accessor` hữu ích khi class kế thừa framework không kiểm soát được constructor, circular dependency có chủ ý (hiếm), hoặc tích hợp với ORM entities / web components.
>
> **Không hỗ trợ plain field** (`@inject(Logger) logger!`) — plain field decorator trong TC39 Stage 3 không có getter/setter để intercept.

```ts
// inject() hoạt động như cả plain function (deps array) lẫn accessor decorator
function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: { name?: string; tag?: [tag: string, value: unknown] },
): InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value>;
```

### 6.6 Method lifecycle decorators

`@postConstruct()` và `@preDestroy()` là method decorators, ghi method name vào `Symbol.metadata`:

```ts
@injectable([Config])
class DatabaseService {
  constructor(private config: AppConfig) {}

  @postConstruct()
  async initialize(): Promise<void> {
    await this.connect(this.config.dbUrl);
  }

  @preDestroy()
  async cleanup(): Promise<void> {
    await this.disconnect();
  }
}

// Binding không cần .onActivation() / .onDeactivation() nữa
container.bind(Database).to(DatabaseService).singleton();
```

> **Thứ tự precedence:** `@postConstruct()` → per-binding `onActivation()` → container-level `onActivation()`. Deactivation ngược lại: container-level `onDeactivation()` → per-binding `onDeactivation()` → `@preDestroy()`.
>
> **Scope:** `@postConstruct()` chạy cho mọi scope — mỗi lần instance mới được tạo. `@preDestroy()` chạy khi instance bị evict khỏi cache: scoped khi child dispose, singleton khi root dispose/unbind.
>
> **Async:** Cả hai hỗ trợ async. `@postConstruct()` async trên transient binding buộc `resolveAsync()`.

### 6.7 Auto-registration

`@injectable()` hỗ trợ `autoRegister` — class tự đăng ký vào global registry tại module load time:

```ts
@injectable([Logger, Config], { autoRegister: true })
class UserService { ... }

const container = Container.create();
const count = container.loadAutoRegistered();
console.log(`Registered ${count} services`);
```

> **Auto-register scope:** Default là `transient`. Override: `{ autoRegister: true, scope: "singleton" }`.
>
> **Coexistence:** `container.bind(UserService)` sau `loadAutoRegistered()` áp dụng slot-aware last-wins — binding explicit thay bản auto-registered nếu cùng slot.

### 6.8 Danh sách decorator và helpers

| API                            | Loại                          | Target                           | Tác dụng                                                                       |
| ------------------------------ | ----------------------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `@injectable(deps?, options?)` | decorator                     | class                            | Ghi param metadata vào `Symbol.metadata`. `options.autoRegister` để tự đăng ký |
| `inject(token, options?)`      | plain fn / accessor decorator | deps array hoặc `accessor` field | Tạo `InjectionDescriptor` hoặc inject qua accessor                             |
| `optional(token, options?)`    | plain fn                      | deps array                       | Như `inject` nhưng trả về `undefined` nếu không có binding                     |
| `injectAll(token, options?)`   | plain fn                      | deps array                       | Resolve tất cả bindings khớp token thành mảng                                  |
| `@postConstruct()`             | decorator                     | method                           | Ghi method name vào `Symbol.metadata` — chạy sau construct, trước cache        |
| `@preDestroy()`                | decorator                     | method                           | Ghi method name vào `Symbol.metadata` — chạy khi deactivation                  |

> **`@singleton()` và `@scoped()` đã bị bỏ.** Scope là binding-time concern — khai báo tại `.singleton()` / `.transient()` / `.scoped()` trong fluent chain, không phải trên class.

> **Không có `@inject` / `@injectOptional` trên parameter.** TC39 Stage 3 không có parameter decorator (TS1206). Deps array thay thế hoàn toàn và explicit hơn.

### 6.9 Cấu hình tsconfig

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

Module là cách nhóm binding theo domain. Hỗ trợ cả sync lẫn async setup.

**Quy tắc bind trong module:**

- `bind(token).to*(...)` áp dụng **slot-aware last-wins ở registration-time**: cùng slot thay bản cũ, khác slot append.
- `when*` **luôn** chain sau `to*()`, trước scope — cùng quy tắc với container binding.
- `resolve` chọn một candidate duy nhất; `resolveAll` trả toàn bộ candidate match.

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

// Override binding trong test
const testContainer = Container.fromModules(AppModule);
testContainer.rebind(Database).toConstantValue(mockDatabase);
```

> **Module là pure description — không ôm state runtime:** Cùng một `Module` object có thể load song song vào nhiều containers độc lập. `Module` chỉ giữ `name` và callback `setup`; container mới là bên track "đã load module nào" và "binding nào thuộc module nào". Đây là use case chính để test — share `AppModule` giữa nhiều integration test mà không cần reset.
>
> **Deduplication:** Trong cùng một container, gọi `container.load(M)` nhiều lần hoặc `m.import(M)` từ nhiều module là no-op cho lần thứ hai trở đi. Dedup dựa trên Module object identity, không phải `name`.

### 7.4 Module interface

```ts
// ModuleBuilder — chỉ tồn tại trong callback của Module.create()
interface ModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Module[]): void;
}

interface AsyncModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Array<Module | AsyncModule>): void;
}

// Module — object đã hoàn chỉnh, export và pass vào container
interface Module {
  readonly name: string;
}

interface AsyncModule {
  readonly name: string;
}
```

`Module.create("name", (m: ModuleBuilder) => { ... })` — callback nhận `ModuleBuilder`, trả về `Module`. Tương tự cho `Module.createAsync`.

> **Tại sao `ModuleBuilder` không có `unbind` / `rebind`?** Module là _additive_ — chỉ khai báo binding, không xoá binding của module khác. Override trong test dùng `container.rebind()` sau khi load module. Thiết kế này tránh hidden coupling giữa modules.

---

## 8. Error hierarchy

Tất cả error có `code` string (machine-readable) và message đủ context để debug ngay:

```ts
// Base — abstract, buộc mọi subclass khai báo code cụ thể
abstract class DiError extends Error {
  abstract readonly code: string;
}

// Lỗi lập trình / cấu hình sai
class InternalError extends DiError {
  code = "INTERNAL_ERROR";
}

// Token không có binding nào
class TokenNotBoundError extends DiError {
  code = "TOKEN_NOT_BOUND";
  // "No binding found for token 'Database'. Did you forget container.bind(Database)...?"
}

// A → B → A
class CircularDependencyError extends DiError {
  code = "CIRCULAR_DEPENDENCY";
  cycle: string[]; // ['App', 'Database', 'App'] — in toàn bộ cycle
}

// resolve() sync trên async binding
class AsyncResolutionError extends DiError {
  code = "ASYNC_RESOLUTION";
  // "Token 'Database' has an async factory. Use container.resolveAsync() instead."
}

// Singleton phụ thuộc vào scoped/transient — captive dependency
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
│   ├── binding.ts              Binding union, BindToBuilder/BindingBuilder fluent API, BindingIdentifier
│   ├── binding.test.ts
│   ├── registry.ts             BindingRegistry — Map<Token, Binding[]>
│   ├── registry.test.ts
│   ├── resolver.ts             DependencyResolver — graph walk, circular detection bằng Set
│   ├── resolver.test.ts
│   ├── scope.ts                ScopeManager — singleton/scoped cache
│   ├── scope.test.ts
│   ├── lifecycle.ts            LifecycleManager — onActivation/onDeactivation (per-binding + container-level)
│   ├── lifecycle.test.ts
│   ├── container.ts            DefaultContainer + Container interface
│   ├── container.test.ts
│   ├── module.ts               Module + AsyncModule
│   ├── module.test.ts
│   │
│   ├── metadata/
│   │   ├── metadata-keys.ts          Hằng key trên Symbol.metadata
│   │   ├── metadata-types.ts         ConstructorMetadata, ParamMetadata, MetadataReader, …
│   │   ├── symbol-metadata-reader.ts SymbolMetadataReader (Object.hasOwn guard)
│   │   ├── symbol-metadata-reader.test.ts
│   │   ├── param-registry.ts         WeakMap pending ParamMetadata
│   │   └── param-registry.test.ts
│   │
│   ├── decorators/
│   │   ├── injectable.ts             @injectable(deps?, options?) + autoRegister
│   │   ├── injectable.test.ts
│   │   ├── inject.ts                 inject() + optional() + injectAll() — plain fn và accessor decorator
│   │   ├── inject.test.ts
│   │   ├── lifecycle-decorators.ts   @postConstruct() + @preDestroy()
│   │   └── lifecycle-decorators.test.ts
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
export { token } from "#/token";
export type { Token, TokenValue } from "#/token";

// Container
export { Container } from "#/container";
export type { ContainerGraphJson, ContainerSnapshot } from "#/inspector";

// Binding — types consumers cần khi viết modules hoặc typed helpers
export type {
  ActivationHandler,
  BindToBuilder,
  BindingBuilder,
  BindingIdentifier,
  BindingScope,
  ConstantBindingBuilder,
  ConstraintContext,
  Constructor,
  DeactivationHandler,
  ResolveOptions,
  SingletonBindingBuilder,
} from "#/binding";

// Module
export { AsyncModule, Module } from "#/module";
export type { AsyncModuleBuilder, ModuleBuilder } from "#/module";

// Decorators
export { inject, injectAll, isInjectionDescriptor, optional } from "#/decorators/inject";
export type { InjectOptions } from "#/decorators/inject";
export { getAutoRegistered, injectable } from "#/decorators/injectable";
export type { InjectableDependency } from "#/decorators/injectable";
export { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";

// Errors
export {
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  DiError,
  InternalError,
  MissingMetadataError,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
} from "#/errors";
export type { ScopeViolationDetails } from "#/errors";

// Subpath exports — không export từ index.ts, truy cập qua:
// @codefast/di/binding          — BindingRegistry, builder variants
// @codefast/di/constraints      — Constraint helpers (whenParentIs, whenAnyAncestorIs, …)
// @codefast/di/dependency-graph — StaticDependencyEdge, ContainerGraphJson detail
// @codefast/di/graph-adapters/dot — toDotGraph()
// @codefast/di/inspector        — ContainerInspector, ContainerSnapshot detail
// @codefast/di/lifecycle        — LifecycleManager internals
// @codefast/di/metadata/*       — Metadata internals
// @codefast/di/registry         — BindingRegistry
// @codefast/di/resolver         — DependencyResolver
// @codefast/di/scope            — ScopeManager
```

### 9.2 `package.json`

ESM-only, không có `"require"` export. `engines.node` yêu cầu `>=22.0.0`.

```json
{
  "name": "@codefast/di",
  "type": "module",
  "exports": {
    ".": "./dist/index.{mjs,d.mts}",
    "./binding": "./dist/binding.{mjs,d.mts}",
    "./constraints": "./dist/constraints.{mjs,d.mts}",
    "./container": "./dist/container.{mjs,d.mts}",
    "./dependency-graph": "./dist/dependency-graph.{mjs,d.mts}",
    "./environment": "./dist/environment.{mjs,d.mts}",
    "./errors": "./dist/errors.{mjs,d.mts}",
    "./graph-adapters/dot": "./dist/graph-adapters/dot.{mjs,d.mts}",
    "./inspector": "./dist/inspector.{mjs,d.mts}",
    "./lifecycle": "./dist/lifecycle.{mjs,d.mts}",
    "./metadata/metadata-keys": "./dist/metadata/metadata-keys.{mjs,d.mts}",
    "./metadata/metadata-types": "./dist/metadata/metadata-types.{mjs,d.mts}",
    "./metadata/param-registry": "./dist/metadata/param-registry.{mjs,d.mts}",
    "./metadata/symbol-metadata-reader": "./dist/metadata/symbol-metadata-reader.{mjs,d.mts}",
    "./module": "./dist/module.{mjs,d.mts}",
    "./registry": "./dist/registry.{mjs,d.mts}",
    "./resolver": "./dist/resolver.{mjs,d.mts}",
    "./scope": "./dist/scope.{mjs,d.mts}",
    "./token": "./dist/token.{mjs,d.mts}"
  },
  "files": ["dist"],
  "engines": { "node": ">=22.0.0" }
}
```

### 9.3 `tsdown.config.ts`

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
});
```

---

## 10. Roadmap

### Core container

- `Token<Value>` branded type, `token()` factory function, `TokenValue<T>` helper
- `Binding` discriminated union: `ClassBinding`, `ConstantBinding`, `DynamicBinding`, `DynamicAsyncBinding`, `ResolvedBinding`, `AliasBinding`
- `BindToBuilder` / `BindingBuilder` fluent API với ordering enforcement qua type system
- `BindingRegistry` — slot-aware last-wins ở registration-time
- `ScopeManager` — singleton cache, scoped cache per child container
- `LifecycleManager` — per-binding + container-level `onActivation` / `onDeactivation`
- `DependencyResolver` — graph walk, circular detection bằng `Set`
- `DefaultContainer` — compose tất cả, implement `Container` interface
- Child container qua `createChild()`, `await using` qua `Symbol.asyncDispose`
- `dispose()`, `unbindAll()`, `unbindAllAsync()`, `initializeAsync()`
- `validate()` — `ScopeViolationError` khi singleton phụ thuộc vào scoped/transient
- `has()` (hierarchy) và `hasOwn()` (current container only)
- Container-level `onActivation()` / `onDeactivation()` hooks

### Decorator layer

- TC39 Stage 3 `@injectable(deps?, options?)` với deps array và `autoRegister` option
- `inject()` + `optional()` + `injectAll()` — plain functions (deps array) **và** `accessor` field decorator
- `@postConstruct()` + `@preDestroy()` — method decorators tích hợp với `LifecycleManager`
- `SymbolMetadataReader` với `Object.hasOwn` guard cho prototype chain safety
- Container nhận `MetadataReader` qua constructor — injectable trong test

### Module system

- `Module.create()` và `Module.createAsync()`
- Import graph resolution; `ModuleBuilder` additive-only (`bind` + `import`, không có `unbind`)
- `Container.fromModules()` / `Container.fromModulesAsync()`
- `load` / `loadAsync` / `unload` / `unloadAsync` theo convention v8
- Deduplication tự động theo object identity

### Introspection và diagnostics

- `inspect(): ContainerSnapshot` — snapshot state tại thời điểm gọi
- `lookupBindings(token)` — all bindings cho một token (kể cả chưa resolved)
- `generateDependencyGraph(options?): ContainerGraphJson` — JSON canonical (nodes + edges)
- `toDotGraph()` từ `@codefast/di/graph-adapters/dot` — chuỗi Graphviz DOT

### Advanced constraints

Export từ `@codefast/di/constraints`:

- `when(predicate)` — custom constraint
- `whenDefault()` — chỉ match khi không có name/tag
- `whenParentIs(token)` — parent trực tiếp
- `whenAnyAncestorIs(token)` — bất kỳ ancestor nào
- `whenNoParentIs(token)` — không có parent nào là token đó
- `whenNoAncestorIs(token)` — không có ancestor nào là token đó
- Tương tự cho `Named` và `Tagged` variants

### Integration packages

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

| Tính năng v8                                                                | Cách triển khai ở đây                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Naming: unqualified=sync, `Async`=async                                     | Giữ nguyên: `resolve`/`resolveAsync`, `load`/`loadAsync`, `unbind`/`unbindAsync`, … |
| ESM-only, Node ≥ 22                                                         | Giống v8                                                                            |
| `onActivation` / `onDeactivation` per-binding                               | Giữ, nhưng callback tự infer type — không cần annotate                              |
| Container-level `onActivation(id, handler)` / `onDeactivation(id, handler)` | Giữ — áp dụng cho tất cả binding của một token                                      |
| `toResolvedValue(factory, injectOptions)`                                   | Đổi tên thành `toResolved(factory, deps)` với deps là plain token array             |
| `toService()` alias                                                         | Đổi tên thành `toAlias()`                                                           |
| `BindingIdentifier` / `.getIdentifier()`                                    | Giữ concept, đổi method thành `.id()`                                               |
| Bỏ `Provider` / `ProviderBinding`                                           | Không có từ đầu — chỉ có `toDynamic` và `toDynamicAsync`                            |
| Named/tagged bindings                                                       | Giữ `whenNamed`, `whenTagged` (tag key `string` only)                               |
| `isBound()` check hierarchy                                                 | `has()` — giữ semantics                                                             |
| `isCurrentBound()` check current only                                       | `hasOwn()` — giữ semantics, đổi tên rõ hơn                                          |
| `unbindAll()` / `unbindAllAsync()`                                          | Giữ nguyên                                                                          |
| `postConstruct` / `preDestroy` decorators                                   | Giữ, implement lại bằng TC39 Stage 3                                                |

### Cải thiện hơn v8

| InversifyJS v8                                                             | Thư viện này                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `reflect-metadata` + `experimentalDecorators` bắt buộc                     | Zero `reflect-metadata` — TC39 Stage 3 + `Symbol.metadata`                           |
| `ServiceIdentifier = string \| symbol \| AbstractNewable<T> \| Newable<T>` | `Token<Value>` branded type — resolve luôn đúng type                                 |
| `container.get<WrongType>('id')` compile được                              | Không thể — `Token<Value>` mang type ở compile time                                  |
| `.inSingletonScope()`, `.inTransientScope()`, `.inRequestScope()`          | `.singleton()`, `.transient()`, `.scoped()` — ngắn hơn                               |
| `toDynamicValue` cho cả sync lẫn async                                     | `toDynamic` vs `toDynamicAsync` — compiler enforce `resolveAsync()`                  |
| `when*` chain trước hoặc sau `to*()`                                       | `when*` chỉ sau `to*()`, trước scope — compiler enforce ordering                     |
| `when*` khả dụng sau scope (e.g. `.inSingletonScope().whenNamed()`)        | Không thể — scope builders không expose `when*`                                      |
| `onDeactivation` không có compile-time guard                               | Builder type narrowing — `onDeactivation` chỉ tồn tại trên `SingletonBindingBuilder` |
| `@inject` trên parameter (cần `experimentalDecorators`)                    | `@injectable([deps])` + `inject()` — TC39 Stage 3 thuần                              |
| `@inject` trên plain property                                              | `@inject(token) accessor field` — TC39 `accessor` keyword                            |
| `getAll()` chỉ có sync                                                     | `resolveAll()` + `resolveAllAsync()` — consistent                                    |
| Không có `optional` resolution method                                      | `resolveOptional()` — rõ ràng hơn option object                                      |
| `Symbol.metadata` prototype chain không được xử lý                         | `SymbolMetadataReader` dùng `Object.hasOwn` guard                                    |
| Async module không có API riêng                                            | `Module.createAsync()` + `container.loadAsync()` — explicit                          |
| Không có method lifecycle decorator trên class                             | `@postConstruct()` / `@preDestroy()` — TC39 Stage 3                                  |
| Không có `validate()` để detect captive dependency                         | `container.validate()` throw `ScopeViolationError`                                   |
| Không có `initializeAsync()` warm-up                                       | `container.initializeAsync()` — warm up tất cả singletons                            |
| Không có `generateDependencyGraph()`                                       | JSON canonical + Graphviz DOT adapter                                                |
| Không có typed error hierarchy                                             | `DiError` abstract base, tất cả subclass có `code` string                            |

### Không học từ v8

| InversifyJS v8                                                     | Lý do không học                                                                                                                                                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `string \| symbol` làm service identifier                          | Không type-safe — dùng `Token<Value>`                                                                                                                                                          |
| `new Container({ parent })` để tạo child container                 | Dùng `container.createChild()` — explicit hơn                                                                                                                                                  |
| `new Container({ autobind })` / `get(id, { autobind: true })`      | Không support auto-binding — "Zero magic" principle                                                                                                                                            |
| `new Container({ defaultScope })`                                  | Không override default scope ở container level — tránh hidden behavior                                                                                                                         |
| `snapshot()` / `restore()`                                         | Module reusability + `container.rebind()` thay thế cho test workflow                                                                                                                           |
| `toFactory(ctx => curried_fn)`                                     | Pattern bind factory function như service value — dùng `toConstantValue(fn)` thay, hoặc `toDynamic` nếu cần ctx. `toFactory` tạo thêm một lớp indirection không cần thiết cho hầu hết use case |
| `@injectable('Singleton')` scope hint decorator                    | Scope là binding-time concern — decorator scope-hint tạo hai nguồn sự thật                                                                                                                     |
| Parameter decorator `@inject` / `@injectOptional`                  | TS1206 — không tồn tại trong TC39 Stage 3                                                                                                                                                      |
| `@named` / `@tagged` / `@optional` / `@multiInject` trên parameter | Cùng lý do trên — dùng `inject()` / `optional()` / `injectAll()` plain function                                                                                                                |
| `@injectFromBase` / `@injectFromHierarchy`                         | Explicit deps array thay thế hoàn toàn — không có implicit inheritance injection                                                                                                               |
| `@unmanaged()`                                                     | Trong deps array, đơn giản là không khai báo arg đó; `toDynamic` cover case phức tạp hơn                                                                                                       |
| `decorate(decorator, target, idx)`                                 | Thư viện không target third-party class integration ở scope này                                                                                                                                |
| `LazyServiceIdentifier<T>`                                         | Circular dep được giải quyết bằng `accessor` property injection thay thế — rõ ràng hơn lazy wrapper                                                                                            |
| `ContainerModule` có `bind`, `unbind`, `rebind` trong callback     | `ModuleBuilder` chỉ additive (`bind` + `import`) — module không xoá binding của module khác                                                                                                    |
| `rebindAsync()`                                                    | Dùng `unbindAsync()` rồi `bind()` — tách rõ hai bước, không cần helper                                                                                                                         |
| `whenNoParent*` / `whenNoAncestor*` names (v8)                     | Có support, nhưng export từ `@codefast/di/constraints` — không trên main builder để giữ API surface nhỏ                                                                                        |

---

_Phiên bản tài liệu: 4.0 — April 2026_
_Lấy cảm hứng từ InversifyJS v8.0.0 (March 2026)_
