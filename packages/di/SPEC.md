# DI Library — Design Specification

> Lấy cảm hứng từ InversifyJS v8 · Xây dựng hoàn toàn mới · Zero `reflect-metadata` · TC39 Decorators Stage 3 · TypeScript 5.9+ · ESM-only

---

## Mục lục

1. [Bối cảnh và mục tiêu](#1-bối-cảnh-và-mục-tiêu)
2. [Nguyên tắc thiết kế](#2-nguyên-tắc-thiết-kế)
3. [Kiểu dữ liệu nền tảng](#3-kiểu-dữ-liệu-nền-tảng)
4. [Token API](#4-token-api)
5. [Binding API](#5-binding-api)
6. [Container API](#6-container-api)
7. [Decorator layer](#7-decorator-layer)
8. [Module system](#8-module-system)
9. [Error hierarchy](#9-error-hierarchy)
10. [File structure](#10-file-structure)
11. [Roadmap](#11-roadmap)
12. [Stack kỹ thuật](#12-stack-kỹ-thuật)
13. [Đối chiếu với InversifyJS v8](#13-đối-chiếu-với-inversifyjs-v8)

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

`when*` **không thể** gọi trước `to*()` vì `bind(token)` chỉ trả về `BindToBuilder` (không có `when*`). `when*` **không thể** gọi sau `scope()` vì scope builders không expose `when*`. Compiler enforce đúng thứ tự này thông qua kiểu trả về của từng bước.

### 2.5 Các nguyên tắc khác

**Zero magic:** Decorator là optional. Toàn bộ app có thể viết với explicit binding, không cần một decorator nào.

**Last-wins / override:** `bind()` áp dụng **slot-aware last-wins ở registration-time** (container + module), không đợi đến lúc `resolve`. Cùng slot (`default`, cùng `whenNamed`, cùng `whenTagged`) thì binding mới thay binding cũ; slot khác thì append để phục vụ `resolveAll`. Xem section 5.9 để biết định nghĩa chính xác của "cùng slot".

**Eager commit:** `to*()` commit binding ngay lập tức vào registry. Mọi thao tác đọc sau đó (`has`, `resolve*`, `validate`, `inspect`) đều thấy trạng thái mới nhất.

**Async phải explicit:** `resolve()` trên async binding throw `AsyncResolutionError` với message rõ ràng. Không silently return `Promise`.

**Lifecycle là first-class:** `onActivation` và `onDeactivation` trên từng binding — học từ InversifyJS v8 — nhưng type-safe hơn. Container cũng có container-level hooks áp dụng cho tất cả binding của một token.

---

## 3. Kiểu dữ liệu nền tảng

Section này khai báo tất cả kiểu nền tảng được dùng xuyên suốt spec. Implementer phải export tất cả từ `@codefast/di` (hoặc subpath tương ứng).

### 3.1 `BindingScope`

```ts
type BindingScope = "singleton" | "transient" | "scoped";
```

### 3.2 `BindingIdentifier`

Opaque branded type — không thể tạo thủ công từ bên ngoài thư viện. Chỉ lấy qua `.id()` trên builder.

```ts
declare const BINDING_ID_BRAND: unique symbol;
type BindingIdentifier = string & { readonly [BINDING_ID_BRAND]: true };
```

### 3.3 `Constructor`

```ts
/**
 * Concrete constructor — có thể gọi `new`.
 * Abstract class không thỏa mãn kiểu này; dùng Token<Value> cho abstract class.
 */
type Constructor<Value = unknown> = new (...args: unknown[]) => Value;
```

> **Abstract class:** Abstract class không satisfy `Constructor<Value>` (TypeScript không cho phép `new AbstractClass()`). Nếu cần bind abstract class làm token, dùng `Token<Value>` thay thế. `container.bind(AbstractLogger)` với `AbstractLogger` là abstract class sẽ là TypeScript error.

### 3.4 `ActivationHandler` và `DeactivationHandler`

```ts
/**
 * Chạy sau khi construct, trước khi cache vào scope.
 * Phải return instance (có thể là instance gốc hoặc Proxy wrap).
 * Nếu return Promise, resolve() phải là resolveAsync().
 */
type ActivationHandler<Value> = (ctx: ResolutionContext, instance: Value) => Value | Promise<Value>;

/**
 * Chạy khi instance bị evict khỏi scope (singleton: unbind/dispose, scoped: không gọi).
 * Return value bị bỏ qua.
 */
type DeactivationHandler<Value> = (instance: Value) => void | Promise<void>;
```

> **`DeactivationHandler` và `scoped`:** `onDeactivation` không được gọi cho `scoped` instance khi child container dispose — `scoped` không có lifecycle deactivation. Chỉ `singleton` và `toConstantValue` (treat as singleton) có deactivation. Xem section 5.3.

### 3.5 `ResolveOptions`

```ts
interface ResolveOptions {
  /** Match binding có `whenNamed(name)`. */
  name?: string;
  /** Match binding có tất cả các tag trong array này. */
  tags?: ReadonlyArray<readonly [tag: string, value: unknown]>;
}
```

### 3.6 `ResolutionContext`

`ctx` trong `toDynamic` / `toDynamicAsync` — không phải container đầy đủ, chỉ expose resolve trong ngữ cảnh hiện tại:

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
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined>;
  /**
   * Resolve tất cả binding match token + hint trong ngữ cảnh hiện tại.
   * Throw AsyncResolutionError nếu bất kỳ binding nào là async.
   * hint.name / hint.tags có tác dụng filter (không phải broadcast).
   */
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value[];
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]>;
  /**
   * Dependency-graph context — dùng trong `when()` predicates.
   * Không cần cho resolve thông thường.
   */
  readonly graph: ConstraintContext;
}
```

`resolveAll`/`resolveAllAsync` trong `ResolutionContext` giữ nguyên ngữ cảnh resolve hiện tại (`resolutionPath`, `materializationStack`) — áp dụng đầy đủ scope validation và `when()` predicates.

### 3.7 `ConstraintContext`

```ts
interface ConstraintContext {
  /** Mảng token name trên resolution path hiện tại (readonly snapshot). */
  readonly resolutionPath: readonly string[];
  /**
   * Stack frames đầy đủ trên construction chain.
   * Khác với `resolutionPath` (chỉ là string label), `materializationStack`
   * chứa metadata đầy đủ để detect captive dependency.
   */
  readonly materializationStack: readonly MaterializationFrame[];
  /** Frame ngay trên (direct parent), hoặc `undefined` ở root. */
  readonly parent: MaterializationFrame | undefined;
  /** Tất cả frame trên direct parent. */
  readonly ancestors: readonly MaterializationFrame[];
  /** Hint được truyền vào lần resolve hiện tại, hoặc `undefined` nếu không có. */
  readonly currentResolveHint: ResolveOptions | undefined;
}

interface MaterializationFrame {
  /** Token name dùng để hiển thị trong error message. */
  readonly tokenName: string;
  readonly scope: BindingScope;
  readonly bindingId: BindingIdentifier;
  readonly kind: BindingKind;
}

type BindingKind = "class" | "dynamic" | "dynamic-async" | "resolved" | "constant" | "alias";
```

### 3.8 `TokenValue`

Helper type để extract `Value` từ `Token<Value>` hoặc `Constructor<Value>`:

```ts
type TokenValue<Type> =
  Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
```

---

## 4. Token API

### 4.1 Tạo token

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

### 4.2 Type signature

```ts
// Branded type — không thể giả mạo bằng object literal thông thường
declare const TOKEN_BRAND: unique symbol;

interface Token<Value> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value; // unique symbol, không export
}
```

```ts
// Resolve luôn trả về đúng type — không thể truyền sai token
const logger = container.resolve(Logger); // ^? LoggerService
const port = container.resolve(Port); // ^? number
```

### 4.3 Class làm token

Class có thể dùng trực tiếp làm token khi không cần abstraction:

```ts
// Không cần token riêng — class là token
container.bind(ConsoleLogger).toSelf();
const logger = container.resolve(ConsoleLogger); // ^? ConsoleLogger

// Khi cần inject qua interface → dùng Token
container.bind(Logger).to(ConsoleLogger);
const logger = container.resolve(Logger); // ^? LoggerService
```

> **`toSelf()` không có `@injectable()`:** Nếu `ConsoleLogger` không có `@injectable()` và constructor có deps, container throw `MissingMetadataError` — không assume zero deps. Để dùng `toSelf()` với constructor deps mà không có decorator, dùng `toDynamic()` hoặc `toResolved()` thay thế.

---

## 5. Binding API

Binding mô tả cách tạo ra một value từ một token. API theo kiểu fluent builder với thứ tự chuẩn: `to*() → when*() → scope() → on*()`.

### 5.1 Các loại binding

| Method                            | Tương đương InversifyJS v8        | Khi nào dùng                      |
| --------------------------------- | --------------------------------- | --------------------------------- |
| `.to(Class)`                      | `.to(Class)`                      | Container tự `new` và inject deps |
| `.toSelf()`                       | `.toSelf()`                       | Token chính là class              |
| `.toConstantValue(v)`             | `.toConstantValue(v)`             | Constant — config, primitive      |
| `.toDynamic(ctx => ...)`          | `.toDynamicValue(ctx => ...)`     | Factory với `ctx.resolve()`       |
| `.toDynamicAsync(ctx => Promise)` | (dùng `toDynamicValue` async)     | I/O khi khởi tạo                  |
| `.toResolved(factory, deps)`      | `.toResolvedValue(factory, deps)` | Explicit deps, không cần `ctx`    |
| `.toAlias(otherToken)`            | `.toService(otherId)`             | Alias token này → token khác      |

> **`toDynamic` vs `toDynamicAsync`:** InversifyJS v8 dùng `toDynamicValue` cho cả sync lẫn async factory. Thư viện này tách ra hai method rõ ràng để compiler enforce `resolveAsync()` khi cần — không thể nhầm lẫn.

> **`toAlias` chain:** Alias có thể trỏ vào alias khác — container tự resolve chain đến binding cuối cùng. Cycle (`A → B → A`) bị detect và throw `CircularDependencyError`. `toAlias` trả về `AliasBindingBuilder<Value>` (không phải `void`) để hỗ trợ constraint và `.id()` — xem section 5.5.

### 5.2 Scope

```ts
.singleton()  // ←→ .inSingletonScope()  — tạo 1 lần, dùng mãi
.transient()  // ←→ .inTransientScope()  — mỗi resolve = new (default)
.scoped()     // ←→ .inRequestScope()   — 1 lần mỗi child container
```

Scope **luôn** đứng sau `when*` trong chain (xem 2.4). Default khi không khai báo scope là `transient`.

**Scope validation matrix — captive dependency:**

| Consumer ╲ Dependency | `singleton` | `scoped`     | `transient`  |
| --------------------- | ----------- | ------------ | ------------ |
| `singleton`           | ✅ OK       | ❌ Violation | ❌ Violation |
| `scoped`              | ✅ OK       | ✅ OK        | ✅ OK        |
| `transient`           | ✅ OK       | ✅ OK        | ✅ OK        |

`container.validate()` duyệt toàn bộ dependency graph và throw `ScopeViolationError` cho bất kỳ vi phạm nào. Xem section 6.8 để biết giới hạn của `validate()`.

> **`scoped` trong parent container:** `scoped` binding chỉ singleton trong phạm vi child container gọi resolve đầu tiên. Resolve `scoped` trực tiếp từ parent container (không có child scope context) throw `MissingScopeContextError`.

> **Singleton cache ownership:** Singleton được cache tại container nơi binding được định nghĩa — không phải container gọi resolve. Khi `child.resolve(SomeToken)` leo lên parent và tìm thấy singleton binding ở parent, instance được cache ở **parent**. `child.dispose()` chỉ deactivate singleton được định nghĩa tại child.

### 5.3 `toConstantValue` — semantics

`toConstantValue(v)` tạo binding luôn trả về cùng một value. Treat as singleton — không có scope choice. Lifecycle:

- `onActivation` có thể được đăng ký và **sẽ được gọi** lần đầu tiên value được resolve. Kết quả sau activation được cache; activation không chạy lại ở lần resolve tiếp theo.
- `onDeactivation` có thể được đăng ký và sẽ được gọi khi binding bị unbind hoặc container dispose.
- Value gốc được coi là immutable — `onActivation` có thể return một Proxy wrap, nhưng cần cẩn thận: sau activation, giá trị được cache là kết quả từ activation (không phải value gốc).

### 5.4 Constraint — `when*`

`when*` đứng ngay sau `to*()`, trước scope. Mỗi binding có thể có một hoặc nhiều constraint kết hợp.

```ts
// Named binding
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding — tag key là string, value là unknown
container.bind(Engine).to(PetrolEngine).whenTagged("fuel", "petrol");
container.bind(Engine).to(ElectricEngine).whenTagged("fuel", "electric");

// Nhiều tag trên cùng binding
container.bind(Engine).to(TurboV8).whenTagged("fuel", "petrol").whenTagged("size", "v8");

// Default slot tường minh — match khi không có name/tag nào
container.bind(Logger).to(NoopLogger).whenDefault();

// Custom predicate — dùng ConstraintContext
container
  .bind(Logger)
  .to(VerboseLogger)
  .when((ctx) => ctx.ancestors.some((f) => f.tokenName === "DebugModule"));

// Kết hợp name + custom predicate trên cùng binding
container
  .bind(Logger)
  .to(AuditLogger)
  .whenNamed("audit")
  .when((ctx) => ctx.parent?.scope === "singleton");
```

> **Tag key là `string`:** `whenTagged` chỉ nhận `string` làm tag key. Dùng namespace prefix để tránh collision: `"mylib:fuel"`, `"@scope/pkg:env"`.

> **`whenDefault()` tường minh vs không khai báo constraint:** Binding không có bất kỳ `when*` nào cũng match default slot. `whenDefault()` hữu ích khi muốn document rõ ràng ý định hoặc kết hợp với custom `when()`.

**`when()` predicate — quy tắc:**

- Predicate được gọi mỗi lần resolve cần chọn candidate (không cached).
- Predicate **phải pure và deterministic** — không có side effects, không gọi I/O.
- Predicate **không được** gọi `ctx.resolve*()` — sẽ gây circular resolution.
- Vi phạm những quy tắc này không bị detect ở compile time, nhưng behavior sẽ undefined và có thể gây infinite loop.

**Resolve bằng hint:**

```ts
// Named
container.resolve(Logger, { name: "file" });

// Một tag
container.resolve(Engine, { tags: [["fuel", "electric"]] });

// Nhiều tag — binding phải có TẤT CẢ tag này
container.resolve(Engine, {
  tags: [
    ["fuel", "petrol"],
    ["size", "v8"],
  ],
});

// Kết hợp name + tag
container.resolve(Logger, { name: "audit", tags: [["env", "production"]] });
```

### 5.5 Builder type interfaces

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
  /**
   * Alias token này → token khác.
   * Trả về AliasBindingBuilder để hỗ trợ constraint (whenNamed, whenTagged, when)
   * và .id() để unbind chính xác.
   * Alias không có scope riêng — scope được quyết định bởi binding đích.
   */
  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder<Value>;
}

// Trả về từ to*() (trừ toAlias, toConstantValue) — constraint → scope → lifecycle
interface BindingBuilder<Value> {
  // 1. Constraint
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  // 2. Scope
  singleton(): SingletonBindingBuilder<Value>;
  transient(): TransientBindingBuilder<Value>;
  scoped(): ScopedBindingBuilder<Value>;
  // 3. Lifecycle (scope chưa gọi → default transient, không có onDeactivation)
  onActivation(fn: ActivationHandler<Value>): this;
  // 4. ID
  id(): BindingIdentifier;
}

// Trả về từ toConstantValue() — luôn singleton-like, không có scope choice
interface ConstantBindingBuilder<Value> {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  onActivation(fn: ActivationHandler<Value>): SingletonBindingBuilder<Value>;
  onDeactivation(fn: DeactivationHandler<Value>): SingletonBindingBuilder<Value>;
  id(): BindingIdentifier;
}

// Trả về từ toAlias() — chỉ constraint và id, không có scope hay lifecycle
interface AliasBindingBuilder<Value> {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  id(): BindingIdentifier;
}

// Trả về từ .singleton() — thêm onDeactivation, không còn when* hay scope
interface SingletonBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}

// Trả về từ .transient() — không có onDeactivation
interface TransientBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  id(): BindingIdentifier;
}

// Trả về từ .scoped() — như transient
interface ScopedBindingBuilder<Value> extends TransientBindingBuilder<Value> {}
```

> **Tại sao `ConstantBindingBuilder.onActivation` trả về `SingletonBindingBuilder`?** Sau khi gọi `onActivation()`, builder không còn expose `when*` hay scope nữa — chỉ còn `onDeactivation` và `id()`. Đây là state machine một chiều: gọi `onActivation()` "lock" constraint và chuyển sang lifecycle phase.

> **`AliasBindingBuilder` không có lifecycle:** Alias không tự tạo instance — nó delegate hoàn toàn cho binding đích. Lifecycle của instance được quản lý bởi binding đích, không phải alias.

### 5.6 `toResolved` — explicit deps

Alternative sạch hơn `toDynamic` khi deps đơn giản:

```ts
// toDynamic — dùng khi cần logic phức tạp hoặc resolve có điều kiện
container.bind(App).toDynamic((ctx) => {
  const logger = ctx.resolve(Logger);
  const config = ctx.resolve(Config);
  return new App(logger, config);
});

// toResolved — deps khai báo tường minh, factory nhận đúng type
container.bind(App).toResolved(
  (logger, config) => new App(logger, config),
  [Logger, Config] as const, // `as const` bắt buộc — TypeScript infer tuple, không infer union
);
```

Với `deps: [Logger, Config] as const`, TypeScript infer factory params là `[LoggerService, AppConfig]` — không cần annotate thủ công.

> **`toResolved` và named/tagged deps:** `toResolved` chỉ hỗ trợ plain token, không hỗ trợ named/tagged injection. Khi cần `{ name: "file" }` hoặc `{ tags: [...] }`, dùng `toDynamic` với `ctx.resolve(token, hint)`.

### 5.7 `BindingIdentifier` — unbind chính xác

Builder có `.id()` để lấy `BindingIdentifier` — dùng để unbind một binding cụ thể trong multi-binding:

```ts
const consoleId = container.bind(Logger).to(ConsoleLogger).whenNamed("console").id();
const fileId = container.bind(Logger).to(FileLogger).whenNamed("file").id();

// Unbind chỉ binding "console" — không ảnh hưởng "file"
container.unbind(consoleId);
```

### 5.8 Lifecycle hooks

`onActivation` chạy sau khi construct, trước khi cache vào scope. Phải return instance.

`onDeactivation` chỉ khả dụng trên `singleton` và `toConstantValue` — compile-time enforced bởi builder type (xem section 5.5).

```ts
container
  .bind(Database)
  .to(PostgresDatabase)
  .singleton()
  .onActivation(async (ctx, db) => {
    await db.connect();
    return db; // phải return — có thể return Proxy wrap
  })
  .onDeactivation(async (db) => {
    await db.disconnect();
  });
```

**Thứ tự lifecycle đầy đủ:**

```
Activation:   @postConstruct() → per-binding onActivation() → container-level onActivation()
Deactivation: container-level onDeactivation() → per-binding onDeactivation() → @preDestroy()
```

**Type inference — không cần annotate:**

```ts
// InversifyJS v8 — phải annotate thủ công
.onActivation((_ctx: ResolutionContext, db: Database) => { ... })

// Thư viện này — compiler tự infer từ binding
container.bind(Database).to(PostgresDatabase)
  .singleton()
  .onActivation((ctx, db) => {
  //                   ^? PostgresDatabase
    return db;
  });
```

### 5.9 Ví dụ đầy đủ

```ts
// Class binding
container.bind(Logger).to(ConsoleLogger).singleton();

// Self binding
container.bind(ConsoleLogger).toSelf().singleton();

// Constant value
container.bind(Config).toConstantValue({ port: 3000, env: "production" });

// Named bindings
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding — một tag
container.bind(Engine).to(PetrolEngine).whenTagged("fuel", "petrol");
container.bind(Engine).to(ElectricEngine).whenTagged("fuel", "electric");

// Tagged binding — nhiều tag
container.bind(Engine).to(TurboV8).whenTagged("fuel", "petrol").whenTagged("size", "v8");

// Dynamic factory
container
  .bind(App)
  .toDynamic((ctx) => new App(ctx.resolve(Logger), ctx.resolve(Config)))
  .singleton();

// Async factory — phải dùng resolveAsync()
container
  .bind(Database)
  .toDynamicAsync(async (ctx) => {
    const cfg = ctx.resolve(Config);
    const db = new PostgresDatabase(cfg.dbUrl);
    await db.connect();
    return db;
  })
  .singleton()
  .onDeactivation(async (db) => db.disconnect());

// Resolved — explicit deps
container
  .bind(Mailer)
  .toResolved((logger, config) => new Mailer(logger, config), [Logger, Config] as const)
  .singleton();

// Alias — với constraint
container.bind(AbstractLogger).toAlias(Logger);
container.bind(AuditLogger).toAlias(Logger).whenNamed("audit");
```

### 5.10 Slot và last-wins — định nghĩa chính xác

**Từ vựng (normative):**

**Slot key** là khóa định danh duy nhất một slot trong registry, tính từ constraint của binding:

```
SlotKey = {
  name: string | undefined,            // từ whenNamed() — undefined nếu không có
  tags: ReadonlySet<[string, unknown]>, // từ TẤT CẢ whenTagged() trên binding này
}
```

Hai slot key **bằng nhau** khi: `name` bằng nhau (hoặc cả hai `undefined`) **và** `tags` bằng nhau theo deep equality trên từng `[key, value]` pair (thứ tự không quan trọng). Slot `default` là `{ name: undefined, tags: new Set() }`.

**Predicate-only `when()`:** Binding chỉ có `.when(predicate)` (không kèm `whenNamed`/`whenTagged`) **không tham gia slot last-wins** — nhiều binding cùng token có thể tồn tại song song với slot key giống nhau (`default`). Nếu sau lọc runtime vẫn còn ≥ 2 candidate, `resolve`/`resolveAsync` throw `InternalError`.

**Candidate:** Binding vượt qua lọc `ResolveOptions` (name/tags) và tất cả `when(ctx)` predicates.

**Bảng tình huống:**

| #   | Tình huống                                                          | Kết quả slot          | `resolve` không hint                        | `resolveAll` / hint     |
| --- | ------------------------------------------------------------------- | --------------------- | ------------------------------------------- | ----------------------- |
| 1   | `bind(T).to*(A)`                                                    | Default               | A                                           | `[A]`                   |
| 2   | `bind(T).to*(A)` rồi `bind(T).to*(B)`                               | Default last-wins     | B                                           | `[B]`                   |
| 3   | `whenNamed("a").to*(A)` rồi `whenNamed("a").to*(B)`                 | Named "a" last-wins   | `NoMatchingBindingError` (không có default) | Hint `{name:"a"}` → B   |
| 4   | `whenNamed("a").to*(A)` và `whenNamed("b").to*(B)`                  | Named "a" + Named "b" | `NoMatchingBindingError`                    | `resolveAll` → `[A, B]` |
| 5   | `to*(A)` và `whenNamed("x").to*(B)`                                 | Default + Named "x"   | A                                           | `resolveAll` → `[A, B]` |
| 6   | `rebind(T).to*(C)`                                                  | Explicit reset        | C                                           | `[C]`                   |
| 7   | Tags `{fuel:petrol, size:v8}.to*(A)` rồi cùng tags `.to*(B)`        | Tag-set last-wins     | Hint `{tags:[...]}` → B                     | Hint → B                |
| 8   | Tags `{fuel:petrol}.to*(A)` và tags `{fuel:petrol, size:v8}.to*(B)` | Hai tag-set khác nhau | Hint cụ thể                                 | `resolveAll` → `[A, B]` |

**Row 3 — `resolve` không hint:** Throw `NoMatchingBindingError` (không phải `TokenNotBoundError`) vì token có binding nhưng không có slot nào match hint trống. Message bao gồm danh sách các slot có sẵn: `"Available slots: [name:a, name:b]"`.

---

## 6. Container API

### 6.1 Tạo container

```ts
import { Container } from "@codefast/di";

// Static factory — không dùng new Container()
const container = Container.create();

// Từ modules — load tất cả modules rồi trả về container
const container = Container.fromModules(AppModule, DatabaseModule);
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);
```

### 6.2 Resolution

```ts
// Sync resolve — throws AsyncResolutionError nếu binding có async factory
const logger = container.resolve(Logger); // ^? LoggerService

// Async resolve — an toàn cho cả sync lẫn async binding
const db = await container.resolveAsync(Database); // ^? DatabaseService

// Optional — undefined nếu không có binding, không throw
const logger = container.resolveOptional(Logger); // ^? LoggerService | undefined
const db = await container.resolveOptionalAsync(Database); // ^? DatabaseService | undefined

// Multi — resolve tất cả binding cùng token
const plugins = container.resolveAll(Plugin); // ^? Plugin[]
const plugins = await container.resolveAllAsync(Plugin); // ^? Plugin[]

// Named / tagged hint
const fileLogger = container.resolve(Logger, { name: "file" });
const petrolEngine = container.resolve(Engine, { tags: [["fuel", "petrol"]] });
const turboV8 = container.resolve(Engine, {
  tags: [
    ["fuel", "petrol"],
    ["size", "v8"],
  ],
});
```

**`resolveAll` + `ResolveOptions` — filter semantics:**

`hint` trong `resolveAll` / `resolveAllAsync` là **filter** — trả về tất cả binding match hint (không phải broadcast đến tất cả binding). Hành vi cụ thể:

```ts
container.bind(Logger).to(ConsoleLogger); // default slot
container.bind(Logger).to(FileLogger).whenNamed("file"); // named "file" slot

container.resolveAll(Logger); // → [ConsoleLogger, FileLogger]
container.resolveAll(Logger, { name: "file" }); // → [FileLogger]
container.resolveAll(Logger, { name: "x" }); // → [] (empty array, không throw)
```

`resolveAll` / `resolveAllAsync` **không bao giờ throw `TokenNotBoundError`** — trả về `[]` khi không có binding nào match.

**Async contamination — quy tắc propagation:**

Nếu token `A` phụ thuộc vào token `B`, và `B` có `toDynamicAsync` factory hoặc `@postConstruct()` async, thì `A` cũng là async. Async contamination lan truyền toàn bộ dependency path. `container.resolve(A)` trong trường hợp này throw `AsyncResolutionError` — phải dùng `container.resolveAsync(A)`. Container detect contamination tại resolve-time và message rõ token nào trong chain là nguồn async:

```
AsyncResolutionError: Token 'App' requires async resolution because 'Database'
in its dependency chain has an async factory. Use container.resolveAsync(App).
  asyncSourceToken: "Database"
```

### 6.3 Quản lý binding

```ts
// Thêm binding
container.bind(Logger).to(ConsoleLogger);

// Unbind theo token — xóa tất cả binding của token (kể cả tất cả named/tagged slots)
container.unbind(Logger);
await container.unbindAsync(Database); // khi onDeactivation là async

// Unbind chính xác một binding
container.unbind(consoleLoggerBindingId); // sync
await container.unbindAsync(dbBindingId); // async deactivation

// Unbind tất cả binding trong container (không ảnh hưởng parent)
container.unbindAll();
await container.unbindAllAsync();

// Rebind — xóa tất cả binding của token rồi bind lại (chỉ own bindings, không ảnh hưởng parent)
// Nếu token chưa có binding: throw RebindUnboundTokenError
// Nếu binding hiện tại có async onDeactivation: dùng unbindAsync() rồi bind() thủ công
container.rebind(Logger).to(FileLogger).singleton();

// Load / unload module
container.load(FeatureModule);
container.unload(FeatureModule);
await container.loadAsync(AsyncFeatureModule);
await container.unloadAsync(AsyncFeatureModule);

// Load auto-registered classes từ explicit registry (xem section 7.7)
const count = container.loadAutoRegistered(appRegistry);
```

> **`rebind` — token chưa có binding:** Throw `RebindUnboundTokenError`. Lý do: `rebind` có nghĩa là "thay thế", không phải "tạo mới" — nếu không có gì để thay thế, đây là lỗi lập trình. Dùng `bind()` nếu muốn tạo binding lần đầu.

> **`rebind` và parent chain:** `rebind(token)` chỉ tác động lên binding **own** của container hiện tại. Nếu token chỉ có binding ở parent (không có ở child), `child.rebind(token)` throw `RebindUnboundTokenError`. Resolve từ parent sau đó vẫn trả binding cũ của parent.

### 6.4 `unload` — semantics và ownership

`container.unload(module)` unbind tất cả binding **thuộc module đó** trong container này.

**Reference counting cho shared deps:** Container track ownership theo cặp `(module, container)` với reference count. Nếu `ModuleA` import `ModuleB`, và `AppModule` cũng import `ModuleB`, `ModuleB` chỉ load một lần (dedup by object identity). `ModuleB` chỉ bị unbind khi ref-count về 0:

```ts
container.load(ModuleA); // ModuleA (ref:1) + ModuleB (ref:1)
container.load(AppModule); // AppModule (ref:1) + ModuleB (ref:2 — no-op load)

container.unload(ModuleA); // ModuleA unload; ModuleB ref:2→1 — không unbind
container.unload(AppModule); // AppModule unload; ModuleB ref:1→0 — unbind ModuleB
```

`unloadAsync` tương tự nhưng await `onDeactivation` async trước khi xóa binding.

> **`unload(AsyncModule)` — tại sao `unload` (sync) không nhận `AsyncModule`:** Nếu `AsyncModule` có binding với async `onDeactivation`, `unload` sync không thể await. Để nhất quán và tránh silent-skip deactivation, `unload` chỉ nhận `Module` (sync). Dùng `unloadAsync` cho cả `Module` lẫn `AsyncModule`.

### 6.5 Container-level activation hooks

Ngoài per-binding `.onActivation()`, container hỗ trợ container-level hooks — apply cho **tất cả** binding của một token, kể cả binding được thêm sau khi hook đăng ký:

```ts
container.onActivation(Logger, (ctx, logger) => {
  logger.setCorrelationId(ctx.graph.currentResolveHint?.name ?? "default");
  return logger;
});

container.onDeactivation(Database, async (db) => {
  await db.flushMetrics();
});
```

> **Child container kế thừa container-level hooks:** Child container **không** kế thừa container-level hooks của parent. Hook được đăng ký trên container nào thì chỉ fire cho binding của container đó. Khi child resolve token từ parent (leo lên parent chain), parent's hooks fire vì binding thuộc parent.

> **Thứ tự:** `@postConstruct()` → per-binding `onActivation()` → container-level `onActivation()`. Deactivation ngược lại: container-level `onDeactivation()` → per-binding `onDeactivation()` → `@preDestroy()`.

> **`onDeactivation` với `toConstantValue`:** Container-level `onDeactivation` có fire cho `toConstantValue` binding khi container dispose hoặc binding bị unbind.

### 6.6 Child container

```ts
// Child kế thừa tất cả binding của parent (resolve leo lên nếu không tìm thấy ở child)
// Singleton của parent không bị re-created ở child
const requestContainer = container.createChild();
requestContainer.bind(RequestId).toConstantValue(crypto.randomUUID());

const handler = requestContainer.resolve(RequestHandler);

// Dispose: deactivate tất cả singleton ĐƯỢC ĐỊNH NGHĨA tại child (không ảnh hưởng parent)
await requestContainer.dispose();

// `await using` — TC39 Explicit Resource Management (TypeScript 5.2+)
{
  await using scoped = container.createChild();
  scoped.bind(RequestId).toConstantValue(crypto.randomUUID());
  const handler = scoped.resolve(RequestHandler);
  // scoped[Symbol.asyncDispose]() tự động gọi ở cuối block
}
```

> **`[Symbol.dispose](): never`:** Container implement `Symbol.dispose` nhưng luôn throw `SyncDisposalNotSupportedError` vì `onDeactivation` có thể async. Dùng `await using` (gọi `Symbol.asyncDispose`) thay vì `using` (gọi `Symbol.dispose`). TypeScript báo lỗi nếu dùng sai khi `exactOptionalPropertyTypes: true`.

### 6.7 `initializeAsync` — warm up singletons

```ts
await container.initializeAsync();
```

Resolve và cache tất cả `singleton` binding trong **container hiện tại** (không bao gồm parent). Mục đích: fail fast khi startup nếu có lỗi config, và loại bỏ lazy-init latency khi xử lý request đầu tiên.

**Phạm vi, cross-container, và idempotency:**

- Chỉ warm up singleton được định nghĩa tại container hiện tại — không leo lên parent.
- Nếu singleton A ở child phụ thuộc singleton B ở parent, resolve A sẽ trigger resolve B ở parent và cache B tại parent. `initializeAsync()` trên child do đó có thể là trigger gián tiếp cho parent singletons.
- `toConstantValue` binding bỏ qua (không cần resolve).
- **Idempotent:** Gọi nhiều lần là an toàn — singleton đã cache không bị tạo lại.
- Binding được thêm **sau** khi gọi `initializeAsync()` không được warm up tự động — gọi lại nếu cần.

### 6.8 `validate` — detect captive dependency

```ts
container.validate();
```

Duyệt dependency graph và throw `ScopeViolationError` cho vi phạm theo scope matrix ở section 5.2.

**Phạm vi phân tích (normative):**

`validate()` chỉ có thể phân tích static các binding có deps khai báo tường minh:

| Binding kind                  | `validate()` phân tích được? |
| ----------------------------- | ---------------------------- |
| `to(Class)` với `@injectable` | ✅ Phân tích đầy đủ          |
| `toSelf()` với `@injectable`  | ✅ Phân tích đầy đủ          |
| `toResolved(factory, deps)`   | ✅ Phân tích deps array      |
| `toAlias(target)`             | ✅ Trace đến target          |
| `toDynamic(ctx => ...)`       | ❌ Opaque — bỏ qua           |
| `toDynamicAsync(ctx => ...)`  | ❌ Opaque — bỏ qua           |
| `toConstantValue(v)`          | ✅ Không có deps — luôn OK   |

`toDynamic` và `toDynamicAsync` là **opaque** với `validate()` — không báo false positive, không báo false negative. Nếu có scope violation trong dynamic factory, nó chỉ được detect tại runtime.

Gọi `validate()` sau khi load tất cả module, trước khi serve request đầu tiên.

### 6.9 Introspection

```ts
// Kiểm tra binding tồn tại — check toàn bộ parent chain
container.has(Logger);
container.has(Logger, { name: "file" }); // check với hint

// Kiểm tra binding tồn tại — chỉ check container hiện tại (own)
container.hasOwn(Logger);
container.hasOwn(Logger, { name: "file" });

// Tất cả binding của token (kể cả chưa resolved, chỉ own)
const bindings = container.lookupBindings(Logger); // readonly Binding<LoggerService>[] | undefined

// Snapshot tại thời điểm gọi
const snapshot = container.inspect(); // ContainerSnapshot

// Dependency graph dưới dạng JSON
const graph = container.generateDependencyGraph({ hideInternals: true }); // ContainerGraphJson
```

> **`has` vs `hasOwn`:** `has(token)` check toàn bộ parent chain (tương đương `isBound` trong InversifyJS v8). `hasOwn(token)` chỉ check container hiện tại (tương đương `isCurrentBound` trong v8) — hữu ích khi cần biết binding được định nghĩa ở child hay kế thừa từ parent.

**`ContainerSnapshot` interface:**

```ts
interface ContainerSnapshot {
  /** Tất cả binding tại container này (không gồm parent). */
  readonly ownBindings: readonly BindingSnapshot[];
  /**
   * Số lượng singleton đang được cache tại container này.
   * Không bao gồm singleton từ parent. Dùng để debug memory footprint.
   */
  readonly cachedSingletonCount: number;
  /** Có parent container không. */
  readonly hasParent: boolean;
}

interface BindingSnapshot {
  readonly tokenName: string;
  readonly kind: BindingKind;
  readonly scope: BindingScope;
  readonly slot: {
    readonly name?: string;
    readonly tags: ReadonlyArray<readonly [string, unknown]>;
  };
  readonly id: BindingIdentifier;
}
```

**`ContainerGraphJson` interface:**

```ts
interface ContainerGraphJson {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

interface GraphNode {
  readonly id: string; // BindingIdentifier.toString()
  readonly tokenName: string;
  readonly kind: BindingKind;
  readonly scope: BindingScope;
}

interface GraphEdge {
  readonly from: string; // node id (consumer)
  readonly to: string; // node id (dependency)
  /**
   * Mô tả mối quan hệ — format chuẩn:
   * - `"[0]"`, `"[1]"`, … — dep theo index
   * - `"name:file"` — named dep
   * - `"tag:fuel=petrol"` — tagged dep
   * - `"alias"` — alias edge
   */
  readonly label?: string;
}
```

### 6.10 Container interface

```ts
/** Tuỳ chọn cho `generateDependencyGraph`. */
interface GraphOptions {
  readonly hideInternals?: boolean;
}

interface Container {
  // --- Binding ---
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  unbindAll(): void;
  unbindAllAsync(): Promise<void>;
  /**
   * Throw RebindUnboundTokenError nếu token chưa có binding own trong container này.
   */
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;

  // --- Module ---
  load(...modules: SyncModule[]): void;
  loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  unload(...modules: SyncModule[]): void;
  unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  loadAutoRegistered(registry: AutoRegisterRegistry): number;

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
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined>;
  /**
   * Không throw khi không có binding match — trả về [].
   * Throw AsyncResolutionError nếu bất kỳ binding nào là async.
   * hint có tác dụng filter (không phải broadcast).
   */
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value[];
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]>;

  // --- Child ---
  createChild(): Container;

  // --- Disposal ---
  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  /** Luôn throw SyncDisposalNotSupportedError. Dùng `await using`. */
  [Symbol.dispose](): never;

  // --- Initialization ---
  initializeAsync(): Promise<void>;

  // --- Validation ---
  validate(): void;

  // --- Introspection ---
  has(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  hasOwn(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  lookupBindings<Value>(
    token: Token<Value> | Constructor<Value>,
  ): readonly Binding<Value>[] | undefined;
  inspect(): ContainerSnapshot;
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson;
}

// Static API
interface ContainerStatic {
  create(): Container;
  fromModules(...modules: SyncModule[]): Container;
  fromModulesAsync(...modules: Array<SyncModule | AsyncModule>): Promise<Container>;
}
```

---

## 7. Decorator layer

Decorator là syntactic sugar — core container không phụ thuộc vào chúng. Dùng **TC39 Decorator Stage 3** và `Symbol.metadata`. Không cần `experimentalDecorators: true` hay `reflect-metadata`.

### 7.1 Cách dùng

TC39 Decorator Stage 3 **không hỗ trợ parameter decorator** (TS1206). `@inject` trên constructor parameter chỉ khả dụng với `experimentalDecorators: true` (legacy), trái với mục tiêu của thư viện.

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

### 7.2 Named / tagged / multi inject

`inject()`, `optional()`, `injectAll()` là plain functions trả về `InjectionDescriptor`:

```ts
@injectable([inject(Logger, { name: "console" }), inject(Engine, { tags: [["fuel", "electric"]] })])
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

// injectAll — inject tất cả binding khớp thành mảng
@injectable([injectAll(Plugin)])
class Runner {
  constructor(private plugins: Plugin[]) {}
}
```

Type signatures:

```ts
function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value>;

function optional<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value | undefined>;

function injectAll<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value[]>;

interface InjectOptions {
  name?: string;
  tags?: ReadonlyArray<readonly [tag: string, value: unknown]>;
}

interface InjectionDescriptor<Value = unknown> {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  /** true nếu tạo bởi injectAll() — inject tất cả binding match thành mảng. */
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}
```

### 7.3 Inheritance — explicit, không có magic

Mọi dep phải khai báo tường minh — không có implicit inheritance injection:

```ts
@injectable([Logger])
class BaseService {
  constructor(protected logger: LoggerService) {}
}

// Child khai báo lại toàn bộ — explicit
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

### 7.4 MetadataReader — port interface

Container không đọc `Symbol.metadata` trực tiếp — đọc qua port này để có thể swap trong test:

```ts
interface MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined;
}

interface ConstructorMetadata {
  readonly params: readonly ParamMetadata[];
}

interface ParamMetadata {
  readonly index: number;
  readonly token: Token<unknown> | Constructor;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}

interface LifecycleMetadata {
  /**
   * Tên các method được đánh dấu @postConstruct().
   * Mảng vì class có thể có nhiều method @postConstruct().
   * Thứ tự gọi: theo thứ tự xuất hiện trong class (top-down).
   */
  readonly postConstruct: readonly string[];
  /**
   * Tên các method được đánh dấu @preDestroy().
   * Mảng vì class có thể có nhiều method @preDestroy().
   * Thứ tự gọi: theo thứ tự xuất hiện trong class (top-down).
   */
  readonly preDestroy: readonly string[];
}
```

> **Nhiều `@postConstruct()` / `@preDestroy()`:** Một class có thể có nhiều method `@postConstruct()` và nhiều `@preDestroy()`. Tất cả đều được gọi theo thứ tự khai báo (top-down). Nếu một method throw, các method sau không được gọi và error được propagate.

> **`Symbol.metadata` prototype chain safety:** `SymbolMetadataReader.getConstructorMetadata` phải:
>
> 1. Đọc **chỉ** metadata bag **own** của class: `Object.getOwnPropertyDescriptor(target, Symbol.metadata)?.value`
> 2. Dùng `Object.hasOwn(meta, INJECTABLE_KEY)` trước khi đọc
>
> ```ts
> getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
>   const own = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
>   if (own === undefined) return undefined;
>   const meta = own.value;
>   if (!meta || typeof meta !== "object" || !Object.hasOwn(meta, INJECTABLE_KEY)) {
>     return undefined;
>   }
>   return meta[INJECTABLE_KEY] as ConstructorMetadata;
> }
> ```
>
> Nếu child kế thừa parent nhưng không có `@injectable()` → `getConstructorMetadata` trả về `undefined` → container throw `MissingMetadataError`, không silently dùng metadata của parent.

### 7.5 Property injection qua `accessor` field decorator

TC39 Stage 3 hỗ trợ `accessor` keyword. `@inject(token)` có thể dùng như **field decorator** trên `accessor`:

```ts
@injectable()
class Dashboard {
  @inject(Logger) accessor logger!: LoggerService;
  @inject(Database) accessor db!: DatabaseService;
}
```

**Cơ chế — container resolution:**

`@inject(token)` trên `accessor` ghi token vào `Symbol.metadata` qua `context.metadata`. Khi container resolve class có `accessor` field, container sử dụng `context.addInitializer` để inject giá trị vào từng instance sau construct. Container là nguồn duy nhất của truth — không có global state.

```ts
// Container tự xử lý property injection
const dash = container.resolve(Dashboard);
// dash.logger → LoggerService từ cùng container
// dash.db → DatabaseService từ cùng container
```

**Ngoài container context:**

Nếu class được `new` thủ công (không qua container), `accessor` initializer không có container → throw `MissingContainerContextError`. Property injection chỉ hoạt động khi class được resolve từ container.

> **Constructor injection vẫn là cách ưu tiên** — immutable, dễ test, không cần container context. Property injection qua `accessor` hữu ích khi class kế thừa framework không kiểm soát constructor, hoặc cần break circular dependency (hiếm).
>
> **Không hỗ trợ plain field** (`@inject(Logger) logger!`) — plain field decorator trong TC39 Stage 3 không có getter/setter để intercept.

`inject()` hoạt động như cả plain function lẫn accessor decorator:

```ts
function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value>;
```

### 7.6 Method lifecycle decorators

`@postConstruct()` và `@preDestroy()` là method decorators, ghi method names vào `Symbol.metadata`:

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

container.bind(Database).to(DatabaseService).singleton();
```

> **Thứ tự:** `@postConstruct()` → per-binding `onActivation()` → container-level `onActivation()`. Deactivation ngược lại.
>
> **Scope:** `@postConstruct()` chạy cho mọi scope — mỗi lần instance mới được tạo. `@preDestroy()` chỉ chạy cho `singleton` khi container dispose hoặc unbind. `scoped` instance không có `@preDestroy()` (không có deactivation lifecycle). `transient` không có deactivation.
>
> **Async:** Cả hai hỗ trợ async. `@postConstruct()` async buộc `resolveAsync()` — async contamination lan truyền toàn bộ dependency path.

### 7.7 Auto-registration

`@injectable()` hỗ trợ `autoRegister` — class tự đăng ký vào **explicit registry** tại module load time. Không có global singleton.

```ts
// Registry explicit — không phải global
const appRegistry = createAutoRegisterRegistry();

@injectable([Logger, Config], { autoRegister: appRegistry, scope: "singleton" })
class UserService { ... }

@injectable([Logger], { autoRegister: appRegistry })
class PostService { ... }  // default scope: transient

const container = Container.create();
const count = container.loadAutoRegistered(appRegistry);
// count = 2
```

> **Scope trong auto-register:** Default `transient`. Override qua `{ autoRegister: registry, scope: "singleton" | "scoped" }`.
>
> **Coexistence với explicit bind:** `container.bind(UserService)` sau `loadAutoRegistered()` áp dụng slot-aware last-wins — binding explicit thay bản auto-registered nếu cùng slot.
>
> **Lý do không dùng global registry:** Auto-registration với global state tạo ra implicit side effect tại module import time — khó tree-shake, khó isolate trong test, vi phạm "Zero magic". `createAutoRegisterRegistry()` trả về object bình thường, có thể pass vào, mock, hay reset độc lập.

**`AutoRegisterRegistry` interface:**

```ts
interface AutoRegisterRegistry {
  /** Thêm class vào registry. Gọi tự động bởi @injectable({ autoRegister }). */
  register(target: Constructor, scope: BindingScope): void;
  /** Lấy tất cả entry đã đăng ký. */
  entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }>;
}

function createAutoRegisterRegistry(): AutoRegisterRegistry;
```

### 7.8 Danh sách decorator và helpers

| API                            | Loại                          | Target                        | Tác dụng                                                                                          |
| ------------------------------ | ----------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `@injectable(deps?, options?)` | decorator                     | class                         | Ghi param metadata vào `Symbol.metadata`. `options.autoRegister` để đăng ký vào explicit registry |
| `inject(token, options?)`      | plain fn + accessor decorator | deps array / `accessor` field | `InjectionDescriptor` hoặc inject qua accessor                                                    |
| `optional(token, options?)`    | plain fn                      | deps array                    | Như `inject` nhưng trả `undefined` nếu không có binding                                           |
| `injectAll(token, options?)`   | plain fn                      | deps array                    | Resolve tất cả binding match thành mảng                                                           |
| `@postConstruct()`             | decorator                     | method                        | Ghi method name vào `Symbol.metadata` — chạy sau construct, trước cache                           |
| `@preDestroy()`                | decorator                     | method                        | Ghi method name vào `Symbol.metadata` — chạy khi deactivation (singleton only)                    |

> **`@singleton()` và `@scoped()` không tồn tại.** Scope là binding-time concern — khai báo tại `.singleton()` / `.transient()` / `.scoped()` trong fluent chain.
>
> **Không có parameter decorator.** TC39 Stage 3 không hỗ trợ (TS1206). Deps array thay thế hoàn toàn.

### 7.9 Cấu hình tsconfig

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "strict": true
  }
}
```

Không cần `experimentalDecorators: true`. Decorator Stage 3 chuẩn từ TypeScript 5.0; `Symbol.metadata` stable từ TypeScript 5.9.

---

## 8. Module system

Module là cách nhóm binding theo domain. Hỗ trợ sync và async setup.

### 8.1 Sync module

```ts
import { SyncModule } from "@codefast/di";

export const LoggerModule = SyncModule.create("Logger", (builder) => {
  builder.bind(Logger).to(ConsoleLogger).singleton();
});

export const AppModule = SyncModule.create("App", (builder) => {
  builder.import(LoggerModule);
  builder.bind(Config).toConstantValue(loadConfig());
  builder.bind(App).toSelf().singleton();
});
```

### 8.2 Async module

```ts
export const DatabaseModule = AsyncModule.create("Database", async (builder) => {
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
    .onDeactivation(async (db) => db.disconnect());
});

// Async module phải dùng loadAsync
const container = Container.create();
await container.loadAsync(DatabaseModule);
```

### 8.3 Dùng module

```ts
// Sync — tất cả modules phải là SyncModule
const container = Container.fromModules(AppModule, LoggerModule);

// Async — khi có ít nhất một AsyncModule
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);

// Override binding trong test — rebind sau khi load
const testContainer = Container.fromModules(AppModule);
testContainer.rebind(Database).toConstantValue(mockDatabase);
```

> **Module là pure description — không ôm state runtime:** Cùng một `SyncModule` / `AsyncModule` object có thể load vào nhiều containers độc lập song song. Module chỉ giữ `name` và callback `setup`; container track "đã load module nào" và "binding nào thuộc module nào".
>
> **Deduplication:** Gọi `container.load(M)` nhiều lần hoặc `m.import(M)` từ nhiều module là no-op từ lần thứ hai. Dedup dựa trên **object identity**, không phải `name`. Unload reference-counting dùng cùng identity — xem section 6.4.

### 8.4 Module interface

```ts
// ModuleBuilder — chỉ tồn tại trong callback của SyncModule.create()
// Additive-only: chỉ bind và import, không unbind hay rebind
interface ModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: SyncModule[]): void;
}

interface AsyncModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Array<SyncModule | AsyncModule>): void;
}

// SyncModule — branded để phân biệt với AsyncModule ở type level
declare const SYNC_MODULE_BRAND: unique symbol;
interface SyncModule {
  readonly name: string;
  readonly [SYNC_MODULE_BRAND]: true;
}

// AsyncModule — branded để phân biệt với SyncModule ở type level
declare const ASYNC_MODULE_BRAND: unique symbol;
interface AsyncModule {
  readonly name: string;
  readonly [ASYNC_MODULE_BRAND]: true;
}

// Static factories
interface SyncModuleStatic {
  create(name: string, setup: (builder: ModuleBuilder) => void): SyncModule;
}

interface AsyncModuleStatic {
  create(name: string, setup: (builder: AsyncModuleBuilder) => Promise<void>): AsyncModule;
}
```

> **Tại sao `SyncModule` và `AsyncModule` có branded field?** TypeScript dùng structural typing — nếu hai interface chỉ có `name: string`, `container.load(asyncModule)` compile được mà không bị lỗi. Branded field đảm bảo `load(asyncModule)` là TypeScript error tại compile time, không chỉ `AsyncModuleLoadError` tại runtime.
>
> **Tại sao `ModuleBuilder` không có `unbind` / `rebind`?** Module là _additive_ — chỉ khai báo, không xóa binding của module khác. Override trong test dùng `container.rebind()` sau khi load. Thiết kế này tránh hidden coupling giữa modules.

---

## 9. Error hierarchy

Tất cả error kế thừa `DiError` — có `code` string (machine-readable) và message đủ context:

```ts
// Base — abstract, buộc mọi subclass khai báo code cụ thể
abstract class DiError extends Error {
  abstract readonly code: string;
}

// Assertion failure / ambiguous predicate / lỗi internal không expected
class InternalError extends DiError {
  readonly code = "INTERNAL_ERROR";
}

// Token không có binding nào (kể cả sau khi leo lên parent chain)
class TokenNotBoundError extends DiError {
  readonly code = "TOKEN_NOT_BOUND";
  readonly tokenName: string;
  // "No binding found for token 'Database'. Did you forget container.bind(Database)?"
}

// Token có binding nhưng không có slot nào match hint
class NoMatchingBindingError extends DiError {
  readonly code = "NO_MATCHING_BINDING";
  readonly tokenName: string;
  readonly hint: ResolveOptions;
  readonly availableSlots: string[]; // ["default", "name:console", "tag:fuel=petrol"]
  // "No binding for 'Logger' matching { name: 'file' }. Available slots: [default, name:console]."
}

// A → B → A (bao gồm alias chain cycle)
class CircularDependencyError extends DiError {
  readonly code = "CIRCULAR_DEPENDENCY";
  readonly cycle: string[]; // ["App", "Database", "App"] — in toàn bộ cycle
}

// resolve() sync trên async binding (trực tiếp hoặc qua dep chain)
class AsyncResolutionError extends DiError {
  readonly code = "ASYNC_RESOLUTION";
  readonly tokenName: string;
  readonly asyncSourceToken: string; // token là nguồn gốc async trong chain
  // "Token 'App' requires async resolution because 'Database' in its dependency
  //  chain has an async factory. Use container.resolveAsync(App)."
}

// Singleton phụ thuộc vào scoped/transient
class ScopeViolationError extends DiError {
  readonly code = "SCOPE_VIOLATION";
  readonly details: ScopeViolationDetails;
}

interface ScopeViolationDetails {
  readonly consumerToken: string;
  readonly consumerScope: BindingScope;
  readonly dependencyToken: string;
  readonly dependencyScope: BindingScope;
  readonly path: string[]; // full resolution path để trace
}

// @injectable() thiếu trên class cần auto-resolve
class MissingMetadataError extends DiError {
  readonly code = "MISSING_METADATA";
  readonly targetName: string;
  // "Class 'UserService' is missing @injectable() decorator.
  //  Add @injectable([...deps]) or use toDynamic()/toResolved() instead."
}

// load() nhận AsyncModule — phải dùng loadAsync()
class AsyncModuleLoadError extends DiError {
  readonly code = "ASYNC_MODULE_LOAD";
  readonly moduleName: string;
  // "Module 'Database' is async. Use container.loadAsync() instead."
}

// [Symbol.dispose]() được gọi — phải dùng await using
class SyncDisposalNotSupportedError extends DiError {
  readonly code = "SYNC_DISPOSAL_NOT_SUPPORTED";
  // "Container cannot be disposed synchronously because onDeactivation handlers
  //  may be async. Use `await using` or call container.dispose() explicitly."
}

// scoped binding được resolve từ container không có child scope context
class MissingScopeContextError extends DiError {
  readonly code = "MISSING_SCOPE_CONTEXT";
  readonly tokenName: string;
  // "Token 'RequestHandler' is scoped but was resolved from a container without
  //  a child scope context. Use container.createChild() to create a scoped context."
}

// Property injection (accessor) được khởi tạo ngoài container
class MissingContainerContextError extends DiError {
  readonly code = "MISSING_CONTAINER_CONTEXT";
  readonly targetName: string;
  // "Class 'Dashboard' has @inject accessor fields but was instantiated outside
  //  a container context. Resolve it via container.resolve(Dashboard) instead."
}

// rebind() trên token chưa có binding own trong container
class RebindUnboundTokenError extends DiError {
  readonly code = "REBIND_UNBOUND_TOKEN";
  readonly tokenName: string;
  // "Cannot rebind token 'Logger' because it has no own binding in this container.
  //  Use container.bind(Logger) to create a new binding instead."
}
```

---

## 10. File structure

```
packages/di/
├── src/
│   ├── types.ts               BindingScope, BindingIdentifier, BindingKind, Constructor,
│   │                          ActivationHandler, DeactivationHandler, ResolveOptions,
│   │                          ResolutionContext, ConstraintContext, MaterializationFrame, TokenValue
│   ├── token.ts               Token<Value>, token() factory, TOKEN_BRAND
│   ├── token.test.ts
│   ├── binding.ts             Binding discriminated union, BindToBuilder/BindingBuilder fluent API
│   ├── binding.test.ts
│   ├── registry.ts            BindingRegistry — Map<Token, Binding[]>, slot-aware last-wins
│   ├── registry.test.ts
│   ├── resolver.ts            DependencyResolver — graph walk, circular detection via Set,
│   │                          async contamination propagation
│   ├── resolver.test.ts
│   ├── scope.ts               ScopeManager — singleton cache per container, scoped cache per child
│   ├── scope.test.ts
│   ├── lifecycle.ts           LifecycleManager — per-binding + container-level hooks, ordering
│   ├── lifecycle.test.ts
│   ├── container.ts           DefaultContainer + Container interface
│   ├── container.test.ts
│   ├── module.ts              SyncModule + AsyncModule (branded), reference-count tracking
│   ├── module.test.ts
│   │
│   ├── metadata/
│   │   ├── metadata-keys.ts               Unique Symbol keys trên Symbol.metadata
│   │   ├── metadata-types.ts              ConstructorMetadata, ParamMetadata,
│   │   │                                  LifecycleMetadata, MetadataReader
│   │   ├── symbol-metadata-reader.ts      SymbolMetadataReader — Object.hasOwn guard
│   │   ├── symbol-metadata-reader.test.ts
│   │   └── param-registry.test.ts
│   │
│   ├── decorators/
│   │   ├── injectable.ts                  @injectable(deps?, options?) + autoRegister
│   │   ├── injectable.test.ts
│   │   ├── inject.ts                      inject() / optional() / injectAll() — plain fn + accessor
│   │   ├── inject.test.ts
│   │   ├── lifecycle-decorators.ts        @postConstruct() + @preDestroy()
│   │   └── lifecycle-decorators.test.ts
│   │
│   ├── auto-register/
│   │   ├── auto-register-registry.ts      createAutoRegisterRegistry(), AutoRegisterRegistry
│   │   └── auto-register-registry.test.ts
│   │
│   ├── errors.ts              DiError + tất cả subclasses + ScopeViolationDetails
│   └── index.ts               Public API exports
│
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

### 10.1 Public API (`index.ts`)

```ts
// Types nền tảng
export type {
  ActivationHandler,
  BindingIdentifier,
  BindingKind,
  BindingScope,
  ConstraintContext,
  Constructor,
  DeactivationHandler,
  MaterializationFrame,
  ResolveOptions,
  ResolutionContext,
  TokenValue,
} from "#/types";

// Token
export { token } from "#/token";
export type { Token } from "#/token";

// Container
export { Container } from "#/container";
export type {
  BindingSnapshot,
  ContainerGraphJson,
  ContainerSnapshot,
  GraphEdge,
  GraphNode,
  GraphOptions,
} from "#/container";

// Binding builders
export type {
  AliasBindingBuilder,
  BindToBuilder,
  BindingBuilder,
  ConstantBindingBuilder,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  TransientBindingBuilder,
} from "#/binding";

// Module
export { AsyncModule, SyncModule } from "#/module";
export type { AsyncModuleBuilder, ModuleBuilder } from "#/module";

// Decorators
export { inject, injectAll, isInjectionDescriptor, optional } from "#/decorators/inject";
export type { InjectionDescriptor, InjectOptions } from "#/decorators/inject";
export { injectable } from "#/decorators/injectable";
export type { InjectableDependency, InjectableOptions } from "#/decorators/injectable";
export { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";

// Auto-register
export { createAutoRegisterRegistry } from "#/auto-register/auto-register-registry";
export type { AutoRegisterRegistry } from "#/auto-register/auto-register-registry";

// Errors
export {
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  DiError,
  InternalError,
  MissingContainerContextError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  RebindUnboundTokenError,
  ScopeViolationError,
  SyncDisposalNotSupportedError,
  TokenNotBoundError,
} from "#/errors";
export type { ScopeViolationDetails } from "#/errors";

// Subpath exports (không export từ root index):
// @codefast/di/constraints  — whenParentIs, whenAnyAncestorIs, whenNoParentIs, whenNoAncestorIs, …
// @codefast/di/graph-adapters/dot — toDotGraph(graph: ContainerGraphJson): string
// @codefast/di/metadata/*   — Metadata internals (symbol-metadata-reader, metadata-types, …)
// @codefast/di/registry     — BindingRegistry (advanced)
// @codefast/di/resolver     — DependencyResolver (advanced)
// @codefast/di/scope        — ScopeManager (advanced)
// @codefast/di/lifecycle    — LifecycleManager (advanced)
```

### 10.2 `package.json`

ESM-only. `engines.node >= 22.0.0`.

```json
{
  "name": "@codefast/di",
  "type": "module",
  "exports": {
    ".": "./dist/index.{mjs,d.mts}",
    "./constraints": "./dist/constraints.{mjs,d.mts}",
    "./graph-adapters/dot": "./dist/graph-adapters/dot.{mjs,d.mts}",
    "./metadata/metadata-keys": "./dist/metadata/metadata-keys.{mjs,d.mts}",
    "./metadata/metadata-types": "./dist/metadata/metadata-types.{mjs,d.mts}",
    "./metadata/symbol-metadata-reader": "./dist/metadata/symbol-metadata-reader.{mjs,d.mts}",
    "./registry": "./dist/registry.{mjs,d.mts}",
    "./resolver": "./dist/resolver.{mjs,d.mts}",
    "./scope": "./dist/scope.{mjs,d.mts}",
    "./lifecycle": "./dist/lifecycle.{mjs,d.mts}"
  },
  "files": ["dist"],
  "engines": { "node": ">=22.0.0" }
}
```

### 10.3 `tsdown.config.ts`

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
});
```

---

## 11. Roadmap

### Core container

- `types.ts` — tất cả kiểu nền tảng: `BindingScope`, `BindingIdentifier`, `BindingKind`, `Constructor`, `ActivationHandler`, `DeactivationHandler`, `ResolveOptions`, `ResolutionContext`, `ConstraintContext`, `MaterializationFrame`, `TokenValue`
- `Token<Value>` branded type, `token()` factory, `TOKEN_BRAND`
- `Binding` discriminated union: `ClassBinding`, `ConstantBinding`, `DynamicBinding`, `DynamicAsyncBinding`, `ResolvedBinding`, `AliasBinding`
- `BindToBuilder` / `BindingBuilder` / `AliasBindingBuilder` fluent API với ordering enforcement qua type system
- `BindingRegistry` — slot-aware last-wins ở registration-time, eager commit
- `ScopeManager` — singleton cache per container, scoped cache per child, `MissingScopeContextError`
- `LifecycleManager` — per-binding + container-level `onActivation` / `onDeactivation`, thứ tự chuẩn
- `DependencyResolver` — graph walk, circular detection bằng `Set`, async contamination propagation
- `DefaultContainer` — compose tất cả, implement `Container` interface đầy đủ
- Child container qua `createChild()`, singleton cache ownership tại defining container
- `dispose()`, `[Symbol.asyncDispose]()`, `[Symbol.dispose](): never`
- `unbindAll()`, `unbindAllAsync()`, `initializeAsync()`
- `validate()` — scope matrix, transitive check, alias chain, `toDynamic` là opaque
- `has()` (hierarchy) và `hasOwn()` (current only)
- `resolveAll` / `resolveAllAsync` với filter semantics, trả `[]` thay vì throw
- `rebind()` throw `RebindUnboundTokenError` nếu token chưa có own binding
- `loadAutoRegistered(registry)` trên container

### Decorator layer

- `@injectable(deps?, options?)` — TC39 Stage 3, deps array, `autoRegister` nhận explicit registry
- `inject()` + `optional()` + `injectAll()` — plain fn + accessor decorator
- `@postConstruct()` + `@preDestroy()` — support nhiều method per class, thứ tự top-down
- `SymbolMetadataReader` với `Object.hasOwn` guard
- `LifecycleMetadata` với `postConstruct: string[]` và `preDestroy: string[]`
- `createAutoRegisterRegistry()` — explicit, không global

### Module system

- `SyncModule.create()` và `AsyncModule.create()` với branded types
- Import graph resolution; `ModuleBuilder` additive-only
- `Container.fromModules()` / `Container.fromModulesAsync()`
- `load` / `loadAsync` / `unload` / `unloadAsync` với reference-count tracking
- Deduplication theo object identity

### Introspection và diagnostics

- `inspect(): ContainerSnapshot` — typed snapshot
- `lookupBindings(token)` — all bindings cho một token
- `generateDependencyGraph(options?): ContainerGraphJson` — nodes + edges với label format chuẩn
- `toDotGraph()` từ `@codefast/di/graph-adapters/dot`

### Advanced constraints

Export từ `@codefast/di/constraints`:

- `whenParentIs(token)` — direct parent
- `whenAnyAncestorIs(token)` — bất kỳ ancestor
- `whenNoParentIs(token)` — không có direct parent là token đó
- `whenNoAncestorIs(token)` — không có ancestor là token đó
- Variants cho Named và Tagged

### Error classes

Tất cả error subclasses với `readonly code` và context fields đầy đủ như section 9.

### Integration packages

- `@codefast/di-hono` — middleware + scoped container per request cho Hono
- `@codefast/di-fastify` — plugin + scoped container per request cho Fastify

---

## 12. Stack kỹ thuật

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

## 13. Đối chiếu với InversifyJS v8

### Học từ v8

| Tính năng v8                                      | Cách triển khai ở đây                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Naming: unqualified=sync, `Async`=async           | Giữ nguyên: `resolve`/`resolveAsync`, `load`/`loadAsync`, `unbind`/`unbindAsync`, … |
| ESM-only, Node ≥ 22                               | Giống v8                                                                            |
| `onActivation` / `onDeactivation` per-binding     | Giữ, callback tự infer type — không cần annotate                                    |
| Container-level `onActivation` / `onDeactivation` | Giữ, child không kế thừa hooks của parent                                           |
| `toResolvedValue(factory, injectOptions)`         | `toResolved(factory, deps)` với plain token array                                   |
| `toService()` alias                               | `toAlias()` trả về `AliasBindingBuilder` (không phải `void`)                        |
| `BindingIdentifier` / `.getIdentifier()`          | Giữ concept, đổi thành `.id()`                                                      |
| Named/tagged bindings                             | Giữ `whenNamed`, `whenTagged` (tag key `string` only)                               |
| `isBound()` check hierarchy                       | `has()` — giữ semantics                                                             |
| `isCurrentBound()` check current only             | `hasOwn()` — đổi tên rõ hơn                                                         |
| `unbindAll()` / `unbindAllAsync()`                | Giữ nguyên                                                                          |
| `postConstruct` / `preDestroy` decorators         | Giữ, TC39 Stage 3, support nhiều method per class                                   |

### Cải thiện hơn v8

| InversifyJS v8                                                       | Thư viện này                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `reflect-metadata` + `experimentalDecorators` bắt buộc               | Zero `reflect-metadata` — TC39 Stage 3                                  |
| `ServiceIdentifier` = union type, không branded                      | `Token<Value>` branded — `resolve` luôn đúng type                       |
| `container.get<WrongType>('id')` compile được                        | Impossible — `Token<Value>` mang type tại compile time                  |
| `.inSingletonScope()`, `.inTransientScope()`, `.inRequestScope()`    | `.singleton()`, `.transient()`, `.scoped()`                             |
| `toDynamicValue` cho cả sync lẫn async                               | `toDynamic` vs `toDynamicAsync` — compiler enforce                      |
| `when*` có thể chain trước `to*()`                                   | `when*` chỉ sau `to*()` — compiler enforce thứ tự                       |
| `when*` khả dụng sau scope                                           | Không thể — scope builders không expose `when*`                         |
| `onDeactivation` không có compile-time guard                         | Builder type narrowing — chỉ có trên `SingletonBindingBuilder`          |
| `toService()` trả về `void`                                          | `toAlias()` trả về `AliasBindingBuilder` — hỗ trợ constraint và `.id()` |
| `@inject` trên parameter (cần `experimentalDecorators`)              | `@injectable([deps])` + `inject()` — TC39 Stage 3 thuần                 |
| `@inject` trên plain property                                        | `@inject accessor field` — TC39 `accessor` keyword                      |
| `getAll()` chỉ có sync                                               | `resolveAll()` + `resolveAllAsync()`                                    |
| Không có `optional` resolve method                                   | `resolveOptional()` + `resolveOptionalAsync()`                          |
| `Symbol.metadata` prototype chain không được xử lý                   | `SymbolMetadataReader` dùng `Object.hasOwn` guard                       |
| Async module không có API riêng                                      | `AsyncModule.create()` + branded type (compile-time safe)               |
| `@postConstruct` chỉ một method per class                            | Support mảng — nhiều `@postConstruct()` per class                       |
| Không có `validate()`                                                | `container.validate()` với phạm vi rõ ràng (`toDynamic` là opaque)      |
| Không có `initializeAsync()`                                         | Idempotent, cross-container trigger documented                          |
| Không có typed error hierarchy                                       | `DiError` abstract + `code` string + context fields trên mọi subclass   |
| `tag` trong hint là single tuple                                     | `tags` là array of tuples — multi-tag lookup                            |
| `unload` semantics không rõ                                          | Reference-counting với ownership rõ ràng                                |
| `autoRegister` dùng global singleton                                 | `createAutoRegisterRegistry()` — explicit, không global                 |
| `[Symbol.dispose]()` không được spec                                 | `(): never` throw `SyncDisposalNotSupportedError`                       |
| `Module` và `AsyncModule` không phân biệt ở type level               | Branded types — compile-time enforcement                                |
| Kiểu nền tảng (`BindingScope`, `Constructor`, …) thiếu hoặc phân tán | `types.ts` tập trung, export đầy đủ                                     |
| `rebind` không rõ behavior khi token chưa bound                      | `RebindUnboundTokenError` — contract tường minh                         |
| `resolveAll` với no-match behavior không rõ                          | Trả `[]` — không throw, filter semantics                                |

### Không học từ v8

| InversifyJS v8                                                     | Lý do không học                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `string \| symbol` làm service identifier                          | Không type-safe — dùng `Token<Value>`                                  |
| `new Container({ parent })`                                        | Dùng `container.createChild()` — explicit hơn                          |
| `new Container({ autobind })`                                      | Không support — "Zero magic" principle                                 |
| `new Container({ defaultScope })`                                  | Không override default scope ở container level — tránh hidden behavior |
| `snapshot()` / `restore()`                                         | Module reusability + `rebind()` thay thế trong test workflow           |
| `toFactory(ctx => curried_fn)`                                     | `toConstantValue(fn)` hoặc `toDynamic` — ít indirection hơn            |
| `@injectable('Singleton')` scope hint                              | Scope là binding-time concern — tránh hai nguồn sự thật                |
| Parameter decorator `@inject` / `@injectOptional`                  | TS1206 — không tồn tại trong TC39 Stage 3                              |
| `@named` / `@tagged` / `@optional` / `@multiInject` trên parameter | Cùng lý do — dùng plain function thay thế                              |
| `@injectFromBase` / `@injectFromHierarchy`                         | Explicit deps array thay thế hoàn toàn                                 |
| `@unmanaged()`                                                     | Trong deps array, đơn giản không khai báo arg đó                       |
| `decorate(decorator, target, idx)`                                 | Không target third-party class integration                             |
| `LazyServiceIdentifier<T>`                                         | Circular dep giải quyết bằng `accessor` property injection             |
| `ContainerModule` có `bind`, `unbind`, `rebind` trong callback     | `ModuleBuilder` chỉ additive — tránh hidden coupling                   |
| `rebindAsync()`                                                    | Dùng `unbindAsync()` rồi `bind()` — tách rõ hai bước                   |
| `whenNoParent*` / `whenNoAncestor*` trên main builder              | Export từ `@codefast/di/constraints` — giữ main API surface nhỏ        |

---

_Phiên bản tài liệu: 6.0 — April 2026_
_Lấy cảm hứng từ InversifyJS v8.0.0 (March 2026)_
