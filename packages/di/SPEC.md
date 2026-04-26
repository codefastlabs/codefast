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
8. [Advanced Constraints](#8-advanced-constraints)
9. [Module system](#9-module-system)
10. [Error hierarchy](#10-error-hierarchy)
11. [File structure](#11-file-structure)
12. [Roadmap](#12-roadmap)
13. [Stack kỹ thuật](#13-stack-kỹ-thuật)
14. [Testing guide](#14-testing-guide)
15. [Đối chiếu với InversifyJS v8](#15-đối-chiếu-với-inversifyjs-v8)

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

**`ServiceIdentifier` vẫn không phải branded type.** v8 đã narrow từ `string | symbol | Function` xuống `string | symbol | AbstractNewable<T> | Newable<T>` (ký hiệu `T` giữ nguyên theo API gốc của Inversify) — cải thiện nhỏ so với v7 — nhưng vẫn không phải branded type. `container.get<WrongType>('my-service')` vẫn compile được và trả về sai type.

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

### 2.2 Naming — Sync/Async convention

Quy tắc nhất quán: **unqualified = sync, `Async` suffix = async**. Không bao giờ có `Sync` suffix.

```ts
container.resolve(Logger); // sync
container.resolveAsync(Database); // async — có async factory trong chain
container.load(AppModule); // sync
container.loadAsync(LazyModule); // async — module có async setup
```

### 2.3 Token thay thế ServiceIdentifier

InversifyJS dùng `string | symbol | Newable<T>` làm service identifier — linh hoạt nhưng không type-safe. `container.get<WrongType>('my-service')` compile được và trả về sai type.

Thư viện này dùng `Token<Value>` — branded type — làm identifier duy nhất. Class cũng có thể dùng trực tiếp làm token, nhưng `Token<Value>` là cách ưu tiên khi cần abstraction.

### 2.4 Fluent chain — thứ tự chuẩn và bất biến

```
bind(token)
  .to*(…)       // 1. Strategy — bắt buộc
  .when*(…)     // 2. Constraint — tuỳ chọn, luôn sau to*
  .scope()      // 3. Scope — tuỳ chọn, luôn sau when*
  .on*(…)       // 4. Lifecycle — tuỳ chọn, luôn sau scope
```

`when*` **không thể** gọi trước `to*()` vì `bind(token)` chỉ trả về `BindToBuilder` (không có `when*`). `when*` **không thể** gọi sau `scope()` vì scope builders không expose `when*`. Lifecycle hooks **không thể** gọi trước `scope()` vì `BindingBuilder` (kết quả của `to*()`) không expose `on*`. Compiler enforce đúng thứ tự này thông qua kiểu trả về của từng bước.

> **Tại sao lifecycle sau scope là bắt buộc?** Nếu `onActivation` được gọi trước scope, không rõ activation fire cho instance transient (mỗi resolve) hay singleton (chỉ lần đầu). Buộc khai báo scope trước loại bỏ mọi ambiguity — người đọc code biết ngay activation trong ngữ cảnh nào.

### 2.5 Các nguyên tắc khác

**Zero magic:** Decorator là optional. Toàn bộ app có thể viết với explicit binding, không cần một decorator nào.

**Last-wins / override:** `bind()` áp dụng **slot-aware last-wins ở registration-time**. Cùng slot (`default`, cùng `whenNamed`, cùng `whenTagged`) thì binding mới thay binding cũ; slot khác thì append để phục vụ `resolveAll`. Xem section 5.10 để biết định nghĩa chính xác.

**Eager commit:** `to*()` commit binding ngay lập tức vào registry. Mọi thao tác đọc sau đó (`has`, `resolve*`, `validate`, `inspect`) đều thấy trạng thái mới nhất.

**Async phải explicit:** `resolve()` trên async binding throw `AsyncResolutionError` với message rõ ràng. Không silently return `Promise`.

**Lifecycle là first-class:** `onActivation` và `onDeactivation` trên từng binding — học từ InversifyJS v8 — nhưng type-safe hơn. Container cũng có container-level hooks áp dụng cho tất cả binding của một token.

**Singleton async creation là serialized:** Concurrent `resolveAsync` cho cùng một singleton token share cùng in-flight Promise — factory chỉ chạy một lần, `onActivation` chỉ chạy một lần. Xem section 6.2.

---

## 3. Kiểu dữ liệu nền tảng

Section này khai báo tất cả kiểu nền tảng được dùng xuyên suốt spec. Implementer phải export tất cả từ `@codefast/di`.

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

> **Abstract class:** TypeScript không cho phép `new AbstractClass()`, nên abstract class không satisfy `Constructor<Value>`. Nếu cần bind abstract class làm token, dùng `Token<Value>` thay thế. `container.bind(AbstractLogger)` với `AbstractLogger` là abstract class sẽ là TypeScript error.

### 3.4 `ActivationHandler` và `DeactivationHandler`

```ts
/**
 * Chạy sau khi construct và sau @postConstruct(), trước khi cache vào scope.
 * Phải return instance (có thể là instance gốc hoặc Proxy wrap).
 * Nếu return Promise, resolve() phải là resolveAsync().
 */
type ActivationHandler<Value> = (ctx: ResolutionContext, instance: Value) => Value | Promise<Value>;

/**
 * Chạy khi instance bị evict khỏi scope (singleton: unbind/dispose).
 * Return value bị bỏ qua.
 * Chỉ fire cho singleton và toConstantValue — không fire cho transient và scoped.
 */
type DeactivationHandler<Value> = (instance: Value) => void | Promise<void>;
```

> **`DeactivationHandler` scope restriction:** `onDeactivation` chỉ được gọi cho `singleton` (khi container bị dispose hoặc binding bị unbind) và `toConstantValue` (treat as singleton). `transient` không có deactivation — mỗi instance là orphan sau khi trao cho caller. `scoped` không có deactivation — child container chỉ clear cache, không notify instance.

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
   * Trả [] nếu không có binding nào match.
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
  /**
   * Slot của binding được match cho frame này.
   * `slot.name` là `undefined` nếu binding không khai báo `whenNamed()`.
   * `slot.tags` là `[]` nếu binding không khai báo `whenTagged()`.
   * Phản ánh constraint đăng ký lúc bind — không phải hint truyền vào lúc resolve.
   * Dùng trong advanced constraints (section 8): `whenParentNamed`, `whenAnyAncestorTagged`, …
   */
  readonly slot: {
    readonly name: string | undefined;
    readonly tags: ReadonlyArray<readonly [tag: string, value: unknown]>;
  };
}

type BindingKind =
  | "class"
  | "dynamic"
  | "dynamic-async"
  | "resolved"
  | "resolved-async"
  | "constant"
  | "alias";
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

| Method                                 | Tương đương InversifyJS v8        | Khi nào dùng                         |
| -------------------------------------- | --------------------------------- | ------------------------------------ |
| `.to(Class)`                           | `.to(Class)`                      | Container tự `new` và inject deps    |
| `.toSelf()`                            | `.toSelf()`                       | Token chính là class                 |
| `.toConstantValue(v)`                  | `.toConstantValue(v)`             | Constant — config, primitive         |
| `.toDynamic(ctx => ...)`               | `.toDynamicValue(ctx => ...)`     | Factory sync với `ctx.resolve()`     |
| `.toDynamicAsync(ctx => Promise)`      | (dùng `toDynamicValue` async)     | I/O khi khởi tạo                     |
| `.toResolved(factory, deps)`           | `.toResolvedValue(factory, deps)` | Explicit deps sync, không cần `ctx`  |
| `.toResolvedAsync(asyncFactory, deps)` | —                                 | Explicit deps async, không cần `ctx` |
| `.toAlias(otherToken)`                 | `.toService(otherId)`             | Alias token này → token khác         |

> **`toDynamic` vs `toDynamicAsync`:** InversifyJS v8 dùng `toDynamicValue` cho cả sync lẫn async factory — compiler không enforce. Thư viện này tách hai method rõ ràng: `toDynamic` buộc factory trả `Value` (không `Promise`), `toDynamicAsync` buộc factory trả `Promise<Value>`. Compiler enforce `resolveAsync()` khi cần.

> **`toResolved` vs `toResolvedAsync`:** `toResolved` là shorthand của `toDynamic` khi deps đơn giản và factory sync. `toResolvedAsync` là shorthand của `toDynamicAsync` khi deps đơn giản nhưng factory cần async (ví dụ: khởi tạo cache từ config). Cả hai đều là syntactic sugar — không có capability khác biệt so với `toDynamic`/`toDynamicAsync`.

> **`toAlias` chain:** Alias có thể trỏ vào alias khác — container tự resolve chain đến binding cuối cùng. Cycle (`A → B → A`) bị detect và throw `CircularDependencyError`. `toAlias` trả về `AliasBindingBuilder<Value>` để hỗ trợ constraint và `.id()`.

### 5.2 Scope

```ts
.singleton()  // ←→ .inSingletonScope()  — tạo 1 lần, dùng mãi
.transient()  // ←→ .inTransientScope()  — mỗi resolve = new (default nếu không khai báo)
.scoped()     // ←→ .inRequestScope()   — 1 lần mỗi child container
```

Scope **luôn** đứng sau `when*` trong chain (xem 2.4). Default khi không khai báo scope là `transient` — nhưng lifecycle hooks `on*()` **chỉ available sau khi gọi scope()** tường minh. Nếu không cần lifecycle hooks, có thể bỏ qua `scope()` và nhận default transient.

**Scope validation matrix — captive dependency:**

| Consumer ╲ Dependency | `singleton` | `scoped`     | `transient`  |
| --------------------- | ----------- | ------------ | ------------ |
| `singleton`           | ✅ OK       | ❌ Violation | ❌ Violation |
| `scoped`              | ✅ OK       | ✅ OK        | ✅ OK        |
| `transient`           | ✅ OK       | ✅ OK        | ✅ OK        |

`container.validate()` duyệt toàn bộ dependency graph và throw `ScopeViolationError` cho bất kỳ vi phạm nào. Xem section 6.9 để biết giới hạn của `validate()`.

> **`scoped` trong parent container:** `scoped` binding chỉ singleton trong phạm vi child container gọi resolve đầu tiên. Resolve `scoped` trực tiếp từ parent container (không có child scope context) throw `MissingScopeContextError`.

> **Singleton cache ownership:** Singleton được cache tại container nơi binding được định nghĩa — không phải container gọi resolve. Khi `child.resolve(SomeToken)` leo lên parent và tìm thấy singleton binding ở parent, instance được cache ở **parent**. `child.dispose()` chỉ deactivate singleton được định nghĩa tại child.

### 5.3 `toConstantValue` — semantics

`toConstantValue(v)` tạo binding luôn trả về cùng một value. Treat as singleton — không có scope choice. Lifecycle:

- `onActivation` có thể được đăng ký và **sẽ được gọi** lần đầu tiên value được resolve. Kết quả sau activation được cache; activation không chạy lại ở lần resolve tiếp theo.
- Nếu `onActivation` trả `Promise`, resolve phải dùng `resolveAsync()`.
- `onDeactivation` có thể được đăng ký và sẽ được gọi khi binding bị unbind hoặc container dispose.
- Value gốc được coi là immutable — `onActivation` có thể return một Proxy wrap. Sau activation, giá trị được cache là kết quả từ activation (không phải value gốc).

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

**`when()` predicate — quy tắc (normative):**

- Predicate được gọi mỗi lần resolve cần chọn candidate (không cached).
- Predicate **phải pure và deterministic** — không có side effects, không gọi I/O. Vi phạm quy tắc này là undefined behavior, có thể gây infinite loop hoặc incorrect caching.
- Predicate **không được** gọi `ctx.resolve*()` — sẽ gây circular resolution.
- **Performance note:** Với `transient` binding trên hot path (mỗi request đều resolve), `when()` predicate phức tạp bị gọi rất nhiều lần. Ưu tiên `whenNamed` / `whenTagged` (O(1) lookup) cho hot path; dùng `when()` custom predicate chỉ cho configuration-time binding.

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

### 5.5 `toAlias` — hint forwarding

Alias trỏ đến token khác. Khi resolve alias, hint được **forward** đến resolution của target token.

```ts
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();
container.bind(AbstractLogger).toAlias(Logger);

// Hint forward đến Logger resolution
const fileLogger = container.resolve(AbstractLogger, { name: "file" });
// → FileLogger (hint { name: "file" } được forward đến Logger)
```

Nếu alias có constraint riêng (`whenNamed("audit")`), constraint đó dùng để **chọn alias binding**, không ảnh hưởng hint forward:

```ts
container.bind(AuditLogger).toAlias(Logger).whenNamed("audit");
// Binding này chỉ được chọn khi resolve AuditLogger với hint { name: "audit" }
// Khi chọn xong, hint { name: "audit" } được forward đến Logger resolution
const logger = container.resolve(AuditLogger, { name: "audit" });
// → Logger binding khớp hint { name: "audit" } (nếu có) hoặc default
```

> **Alias không có scope riêng:** Scope được quyết định bởi binding đích. Alias chỉ là pointer — không tự cache instance.

### 5.6 Builder type interfaces

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
  toResolvedAsync<Deps extends readonly (Token<unknown> | Constructor)[]>(
    factory: (...args: { [K in keyof Deps]: TokenValue<Deps[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value>;
  /**
   * Alias token này → token khác.
   * Trả về AliasBindingBuilder để hỗ trợ constraint và .id().
   * Alias không có scope riêng — scope quyết định bởi binding đích.
   */
  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder<Value>;
}

// Trả về từ to*() (trừ toAlias, toConstantValue)
// Chỉ có: constraint → scope. KHÔNG có on*() trực tiếp.
interface BindingBuilder<Value> {
  // 1. Constraint
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  // 2. Scope (bắt buộc nếu muốn lifecycle hooks)
  singleton(): SingletonBindingBuilder<Value>;
  transient(): TransientBindingBuilder<Value>;
  scoped(): ScopedBindingBuilder<Value>;
  // 3. ID (không cần scope)
  id(): BindingIdentifier;
}

// Trả về từ toConstantValue() — luôn singleton-like, không có scope choice
interface ConstantBindingBuilder<Value> {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  onActivation(fn: ActivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  onDeactivation(fn: DeactivationHandler<Value>): SingletonLifecycleBuilder<Value>;
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

// Trả về từ .singleton() — activation + deactivation
interface SingletonBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}

// Trả về từ .transient() — chỉ activation, không có deactivation
interface TransientBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  id(): BindingIdentifier;
}

// Trả về từ .scoped() — như transient
interface ScopedBindingBuilder<Value> extends TransientBindingBuilder<Value> {}

// Trả về sau khi gọi on*() trên ConstantBindingBuilder
// (state đã lock constraint, chỉ còn lifecycle và id)
interface SingletonLifecycleBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}
```

> **Tại sao `BindingBuilder` không có `on*()`?** Lifecycle hooks cần biết scope context để có semantics rõ ràng: `onDeactivation` chỉ có ý nghĩa với singleton, `onActivation` với transient fire mỗi lần tạo instance mới. Buộc khai báo scope trước lifecycle loại bỏ hoàn toàn ambiguity — compiler không cho phép nhầm lẫn.

> **`ConstantBindingBuilder.onActivation` → `SingletonLifecycleBuilder`:** Sau khi gọi `onActivation()` hoặc `onDeactivation()`, builder không còn expose `when*` — trạng thái một chiều: gọi lifecycle "lock" constraint và chuyển sang phase lifecycle.

### 5.7 `toResolved` và `toResolvedAsync` — explicit deps

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

// toResolvedAsync — deps tường minh, factory async
container
  .bind(Cache)
  .toResolvedAsync(async (config) => Cache.connect(config.redisUrl), [Config] as const);
```

Với `deps: [Logger, Config] as const`, TypeScript infer factory params là `[LoggerService, AppConfig]` — không cần annotate thủ công.

> **`toResolved`/`toResolvedAsync` và named/tagged deps:** Chỉ hỗ trợ plain token, không hỗ trợ named/tagged injection. Khi cần `{ name: "file" }` hoặc `{ tags: [...] }`, dùng `toDynamic`/`toDynamicAsync` với `ctx.resolve(token, hint)`.

### 5.8 `BindingIdentifier` — unbind chính xác

Builder có `.id()` để lấy `BindingIdentifier` — dùng để unbind một binding cụ thể trong multi-binding:

```ts
const consoleId = container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton().id();
const fileId = container.bind(Logger).to(FileLogger).whenNamed("file").singleton().id();

// Unbind chỉ binding "console" — không ảnh hưởng "file"
container.unbind(consoleId);
```

> **`.id()` và chain order:** `.id()` có thể gọi ở bất kỳ bước nào sau `to*()`. Builder vẫn có thể tiếp tục chain sau `.id()` — `.id()` không phải terminal.

### 5.9 Lifecycle hooks

`onActivation` chạy sau `@postConstruct()`, trước khi cache vào scope. Phải return instance.

`onDeactivation` chỉ khả dụng trên `singleton` và `toConstantValue` — compile-time enforced bởi builder type.

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
Activation:
  1. @postConstruct() — tất cả method theo thứ tự khai báo
  2. property injection accessor initializers (nếu có @inject accessor)
  3. per-binding onActivation()
  4. container-level onActivation()

Deactivation (ngược):
  1. container-level onDeactivation()
  2. per-binding onDeactivation()
  3. @preDestroy() — tất cả method theo thứ tự khai báo
```

> **Property injection sau `@postConstruct()`:** `@inject accessor` field được inject bởi `context.addInitializer` — chạy sau constructor nhưng trước `@postConstruct()`. Thứ tự thực tế: constructor → accessor initializers → `@postConstruct()`. Điều này đảm bảo `@postConstruct()` có thể truy cập property injected fields.

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

### 5.10 Ví dụ đầy đủ

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

// Tagged binding
container.bind(Engine).to(PetrolEngine).whenTagged("fuel", "petrol");
container.bind(Engine).to(ElectricEngine).whenTagged("fuel", "electric");
container.bind(Engine).to(TurboV8).whenTagged("fuel", "petrol").whenTagged("size", "v8");

// Dynamic factory sync
container
  .bind(App)
  .toDynamic((ctx) => new App(ctx.resolve(Logger), ctx.resolve(Config)))
  .singleton();

// Async factory
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

// Resolved sync — explicit deps
container
  .bind(Mailer)
  .toResolved((logger, config) => new Mailer(logger, config), [Logger, Config] as const)
  .singleton();

// Resolved async — explicit deps
container
  .bind(Cache)
  .toResolvedAsync(async (config) => Cache.connect(config.redisUrl), [Config] as const)
  .singleton()
  .onDeactivation(async (cache) => cache.close());

// Alias
container.bind(AbstractLogger).toAlias(Logger);
container.bind(AuditLogger).toAlias(Logger).whenNamed("audit");
```

### 5.11 Slot và last-wins — định nghĩa chính xác

**Từ vựng (normative):**

**Slot key** là khóa định danh duy nhất một slot trong registry, tính từ constraint của binding:

```
SlotKey = {
  name: string | undefined,            // từ whenNamed() — undefined nếu không có
  tags: ReadonlySet<[string, unknown]>, // từ TẤT CẢ whenTagged() trên binding này
}
```

Hai slot key **bằng nhau** khi: `name` bằng nhau (hoặc cả hai `undefined`) **và** `tags` bằng nhau theo deep equality trên từng `[key, value]` pair (thứ tự không quan trọng). Slot `default` là `{ name: undefined, tags: new Set() }`.

**Predicate-only `when()`:** Binding chỉ có `.when(predicate)` (không kèm `whenNamed`/`whenTagged`) **không tham gia slot last-wins** — nhiều binding cùng token có thể tồn tại song song với slot key giống nhau. Nếu sau lọc runtime vẫn còn ≥ 2 candidates, `resolve`/`resolveAsync` throw `AmbiguousBindingError` (không phải `InternalError` — đây là lỗi của người dùng, không phải lỗi internal).

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

> **`has(token)` và slot semantics:** `container.has(token)` trả `true` nếu token có **bất kỳ binding nào** (kể cả chỉ named/tagged slots, không có default). `container.resolve(token)` không hint có thể throw `NoMatchingBindingError` ngay cả khi `has(token)` là `true`. Xem section 6.10 để biết cách dùng đúng `has` + `hasOwn`.

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

// Optional — undefined nếu không có binding, không throw TokenNotBoundError
const logger = container.resolveOptional(Logger); // ^? LoggerService | undefined
const db = await container.resolveOptionalAsync(Database); // ^? DatabaseService | undefined

// Multi — resolve tất cả binding cùng token, trả [] nếu không có
const plugins = container.resolveAll(Plugin); // ^? Plugin[]
const plugins = await container.resolveAllAsync(Plugin); // ^? Plugin[]

// Named / tagged hint
const fileLogger = container.resolve(Logger, { name: "file" });
const petrolEngine = container.resolve(Engine, { tags: [["fuel", "petrol"]] });
```

**`resolveOptionalAsync` error semantics:**

- Token không có binding → trả `undefined` (không throw `TokenNotBoundError`)
- Token có binding nhưng binding async throw lỗi runtime (ví dụ: DB connect fail) → **re-throw** lỗi đó, không wrap thành `undefined`
- Token có binding nhưng không khớp hint → trả `undefined` (không throw `NoMatchingBindingError`)

**`resolveAll` + `ResolveOptions` — filter semantics:**

```ts
container.bind(Logger).to(ConsoleLogger); // default slot
container.bind(Logger).to(FileLogger).whenNamed("file"); // named "file" slot

container.resolveAll(Logger); // → [ConsoleLogger, FileLogger]
container.resolveAll(Logger, { name: "file" }); // → [FileLogger]
container.resolveAll(Logger, { name: "x" }); // → [] (empty array, không throw)
```

`resolveAll` / `resolveAllAsync` **không bao giờ throw `TokenNotBoundError`** — trả về `[]` khi không có binding nào match.

**Async contamination — quy tắc propagation:**

Nếu token `A` phụ thuộc vào token `B`, và `B` có `toDynamicAsync`/`toResolvedAsync` factory hoặc `@postConstruct()` async, thì `A` cũng là async. Async contamination lan truyền toàn bộ dependency path. `container.resolve(A)` trong trường hợp này throw `AsyncResolutionError`. Container detect contamination tại resolve-time và message rõ token nào trong chain là nguồn async:

```
AsyncResolutionError: Token 'App' requires async resolution because 'Database'
in its dependency chain has an async factory. Use container.resolveAsync(App).
  asyncSourceToken: "Database"
```

**Singleton async creation — serialized (normative):**

Concurrent `resolveAsync(Token)` cho cùng singleton token **share cùng in-flight Promise**. Implementation phải đảm bảo:

1. Khi factory bắt đầu chạy, Promise được lưu vào in-flight map.
2. Concurrent call tiếp theo nhận cùng Promise — không tạo instance mới.
3. Khi Promise settle (resolved hoặc rejected), in-flight map được xóa.
4. Nếu factory rejected, lần resolve tiếp theo sẽ tạo Promise mới (retry).

```ts
// Cả hai nhận cùng instance — factory chỉ chạy 1 lần
const [a, b] = await Promise.all([
  container.resolveAsync(Database),
  container.resolveAsync(Database),
]);
// a === b: true
```

### 6.3 Quản lý binding

```ts
// Thêm binding
container.bind(Logger).to(ConsoleLogger);

// Unbind theo token — xóa tất cả binding của token (kể cả tất cả named/tagged slots)
container.unbind(Logger);
await container.unbindAsync(Database); // khi binding có async onDeactivation

// Unbind chính xác một binding bằng BindingIdentifier
container.unbind(consoleLoggerBindingId);
await container.unbindAsync(dbBindingId);

// Unbind tất cả binding trong container (không ảnh hưởng parent)
container.unbindAll();
await container.unbindAllAsync();

// Rebind — xóa tất cả own binding của token rồi bind lại
// Nếu token chưa có own binding → throw RebindUnboundTokenError
container.rebind(Logger).to(FileLogger).singleton();
```

**`rebind` semantics — normative:**

`rebind(token)` chỉ tác động lên binding **own** của container hiện tại. Nếu token chỉ có binding ở parent (không có ở child), `child.rebind(token)` throw `RebindUnboundTokenError`. Sau `unbind`, `to*()` commit ngay lập tức — không có gap giữa unbind và bind.

> **`rebind` và parent chain:** Thiết kế này là chủ đích. `rebind` có nghĩa là "thay thế binding đã có trong container này". Để override binding từ parent trong child container (pattern test phổ biến), dùng `bind()` tại child — resolution ưu tiên child trước parent:
>
> ```ts
> const testContainer = container.createChild();
> // Đúng — dùng bind() để tạo override tại child
> testContainer.bind(Database).toConstantValue(mockDatabase);
> // Không cần rebind() vì chưa có own binding tại child
> ```

**`unbind` và singleton deactivation:**

Khi `unbind(token)` hoặc `unbind(bindingId)` được gọi:

- Binding bị xóa khỏi registry ngay lập tức (không có gap).
- Nếu binding là singleton và đã cached, `onDeactivation` và `@preDestroy()` **được gọi synchronously** nếu handler là sync.
- Nếu handler là async, phải dùng `unbindAsync()` — `unbind()` sync trên binding có async deactivation throw `AsyncDeactivationError`.

### 6.4 Module management

```ts
// Load module sync
container.load(FeatureModule);

// Load module async (khi có AsyncModule)
await container.loadAsync(AsyncFeatureModule);

// Unload — chỉ nhận SyncModule
// Reason: SyncModule chỉ có sync onDeactivation — safe để unbind sync
container.unload(FeatureModule);

// Unload async — nhận cả SyncModule và AsyncModule
await container.unloadAsync(AsyncFeatureModule);

// Load auto-registered classes từ explicit registry
const count = container.loadAutoRegistered(appRegistry);
```

**Reference counting cho shared deps:**

Container track ownership theo cặp `(module, container)` với reference count. Nếu `ModuleA` import `ModuleB`, và `AppModule` cũng import `ModuleB`, `ModuleB` chỉ được setup một lần. `ModuleB` chỉ bị unbind khi ref-count về 0:

```ts
container.load(ModuleA); // ModuleA (ref:1) + ModuleB (ref:1)
container.load(AppModule); // AppModule (ref:1) + ModuleB (ref:2 — no-op setup)

container.unload(ModuleA); // ModuleA unload; ModuleB ref:2→1 — không unbind
container.unload(AppModule); // AppModule unload; ModuleB ref:1→0 — unbind ModuleB
```

**`Container.fromModules` dedup behavior:**

```ts
// ModuleA và ModuleB đều import(LoggerModule)
const container = Container.fromModules(ModuleA, ModuleB);
// LoggerModule.setup() chỉ chạy 1 lần — dedup theo object identity
// LoggerModule ref-count = 2 (từ ModuleA và ModuleB)
```

Dedup dựa trên **object identity**, không phải `name`. Hai module object khác nhau với cùng `name` là hai module khác nhau — không dedup. `name` chỉ phục vụ error messages và logging.

**`unload` và singleton đã cached:**

Khi `unload(module)` hoặc `unloadAsync(module)` được gọi và ref-count về 0:

- Binding bị xóa khỏi registry.
- Singleton instances đã cached thuộc module này được **deactivate** — `onDeactivation` và `@preDestroy()` được gọi.
- `unload()` sync chỉ safe nếu tất cả deactivation handlers là sync. Nếu có async handler, phải dùng `unloadAsync()`.

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

> **Child container không kế thừa container-level hooks:** Hook đăng ký trên container nào thì chỉ fire cho binding của container đó. Khi child resolve token từ parent (leo lên parent chain), parent's hooks fire vì binding thuộc parent.

> **Thứ tự:** `@postConstruct()` → accessor initializers → per-binding `onActivation()` → container-level `onActivation()`. Deactivation ngược lại: container-level `onDeactivation()` → per-binding `onDeactivation()` → `@preDestroy()`.

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

> **`[Symbol.dispose](): never`:** Container implement `Symbol.dispose` nhưng luôn throw `SyncDisposalNotSupportedError` vì `onDeactivation` có thể async. Dùng `await using` (gọi `Symbol.asyncDispose`) thay vì `using` (gọi `Symbol.dispose`).

**Scoped binding — request scope pattern:**

`scoped` binding là singleton trong phạm vi một child container. Pattern dùng cho request scope trong web framework:

```ts
// Mỗi request = một child container
app.use(async (req, res, next) => {
  await using requestScope = container.createChild();
  requestScope.bind(RequestContext).toConstantValue({ req, res });
  req.container = requestScope;
  next();
});

// Handler sử dụng requestScope
const handler = req.container.resolve(UserController);
// Khi request kết thúc, await using tự gọi requestScope.dispose()
```

> **Overhead của `createChild()`:** `createChild()` tạo một container object mới với parent reference — O(1), không copy bindings. `dispose()` chỉ clear singleton cache của child. Pattern này an toàn cho high-throughput request handling.

### 6.7 Container state lifecycle

Container có trạng thái `isDisposed`. Sau khi `dispose()` được gọi, mọi mutation operation (`bind`, `unbind`, `rebind`, `load`, `unload`) đều throw `DisposedContainerError`. Resolution operations (`resolve*`, `has*`, `inspect`) cũng throw `DisposedContainerError`.

```ts
const container = Container.create();
container.bind(Logger).to(ConsoleLogger);

await container.dispose();

container.resolve(Logger); // throws DisposedContainerError
container.bind(Logger).toSelf(); // throws DisposedContainerError

// Idempotent: gọi dispose() nhiều lần là no-op
await container.dispose(); // safe — không throw, không double-deactivate
```

```ts
interface Container {
  /** true nếu container đã được dispose. */
  readonly isDisposed: boolean;
}
```

### 6.8 `initializeAsync` — warm up singletons

```ts
await container.initializeAsync();
```

Resolve và cache tất cả `singleton` binding trong **container hiện tại** (không bao gồm parent). Mục đích: fail fast khi startup nếu có lỗi config, và loại bỏ lazy-init latency khi xử lý request đầu tiên.

**Phạm vi, cross-container, và idempotency:**

- Chỉ warm up singleton được định nghĩa tại container hiện tại — không leo lên parent.
- Nếu singleton A ở child phụ thuộc singleton B ở parent, resolve A sẽ trigger resolve B ở parent và cache B tại parent. `initializeAsync()` trên child do đó có thể là trigger gián tiếp cho parent singletons.
- `toConstantValue` binding **không bị bỏ qua** nếu có `onActivation` — activation chạy và kết quả được cache. `toConstantValue` không có `onActivation` thì bỏ qua (không cần resolve).
- **Idempotent:** Gọi nhiều lần là an toàn — singleton đã cache không bị tạo lại, factory không chạy lại.
- Binding được thêm **sau** khi gọi `initializeAsync()` không được warm up tự động — gọi lại nếu cần.

### 6.9 `validate` — detect captive dependency

```ts
container.validate();
```

Duyệt dependency graph và throw `ScopeViolationError` cho vi phạm theo scope matrix ở section 5.2.

**Phạm vi phân tích (normative):**

`validate()` chỉ có thể phân tích static các binding có deps khai báo tường minh:

| Binding kind                     | `validate()` phân tích được?           |
| -------------------------------- | -------------------------------------- |
| `to(Class)` với `@injectable`    | ✅ Phân tích đầy đủ                    |
| `toSelf()` với `@injectable`     | ✅ Phân tích đầy đủ                    |
| `toResolved(factory, deps)`      | ✅ Phân tích deps array                |
| `toResolvedAsync(factory, deps)` | ✅ Phân tích deps array                |
| `toAlias(target)`                | ✅ Trace đến target — transitive check |
| `toDynamic(ctx => ...)`          | ❌ Opaque — bỏ qua                     |
| `toDynamicAsync(ctx => ...)`     | ❌ Opaque — bỏ qua                     |
| `toConstantValue(v)`             | ✅ Không có deps — luôn OK             |

**`validate()` và alias chain:** Khi trace alias (`toAlias(target)`), `validate()` follow chain đến binding cuối cùng. Nếu consumer `singleton` alias sang target `scoped`, đây là scope violation. `validate()` check transitively — không chỉ check direct dependency.

`toDynamic` và `toDynamicAsync` là **opaque** với `validate()` — không báo false positive, không báo false negative. Scope violation trong dynamic factory chỉ được detect tại runtime.

Gọi `validate()` sau khi load tất cả module, trước khi serve request đầu tiên.

### 6.10 Introspection

```ts
// Kiểm tra có bất kỳ binding nào không — check toàn bộ parent chain
// Trả true nếu token có binding, kể cả chỉ named/tagged slots (không có default)
container.has(Logger);
container.has(Logger, { name: "file" }); // check binding có tồn tại VÀ match hint

// Kiểm tra binding tồn tại — chỉ check container hiện tại (own)
container.hasOwn(Logger);
container.hasOwn(Logger, { name: "file" });

// Tất cả binding của token (chỉ own, không leo parent)
// Trả [] thay vì undefined khi không có binding
const bindings = container.lookupBindings(Logger); // readonly BindingSnapshot[]

// Snapshot tại thời điểm gọi
const snapshot = container.inspect(); // ContainerSnapshot

// Dependency graph dưới dạng JSON
const graph = container.generateDependencyGraph({ includeParent: false }); // ContainerGraphJson
```

**`has(token)` vs `has(token, hint)` — semantics chính xác:**

```ts
container.bind(Logger).to(FileLogger).whenNamed("file");
// Không có default slot

container.has(Logger); // true  — có binding (named "file")
container.has(Logger, { name: "file" }); // true  — có binding match hint
container.has(Logger, { name: "console" }); // false — không có binding match hint

container.resolve(Logger); // throws NoMatchingBindingError — không có default slot
container.resolve(Logger, { name: "file" }); // FileLogger
```

> **`has(token)` trả `true` nhưng `resolve(token)` throw:** Đây là behavior đúng. `has` check sự tồn tại của bất kỳ binding nào; `resolve` không hint yêu cầu default slot. Khi chỉ cần biết "token có được bind không" mà không cần resolve ngay, dùng `has(token)`. Khi cần biết "resolve không hint có thành công không", dùng `has(token)` không có hint — nếu `true` nhưng không có default slot vẫn sẽ throw khi resolve.

> **`lookupBindings` trả `[]` thay vì `undefined`:** Nhất quán với `resolveAll` — không có binding nào là empty array, không phải `undefined`. Để check có binding không, dùng `has()`.

> **`has` vs `hasOwn`:** `has(token)` check toàn bộ parent chain. `hasOwn(token)` chỉ check container hiện tại — hữu ích khi cần biết binding được định nghĩa ở child hay kế thừa từ parent.

**`ContainerSnapshot` interface:**

```ts
interface ContainerSnapshot {
  /** Tất cả binding tại container này (không gồm parent). */
  readonly ownBindings: readonly BindingSnapshot[];
  /**
   * Số lượng singleton đang được cache tại container này.
   * Không bao gồm singleton từ parent.
   */
  readonly cachedSingletonCount: number;
  /** Có parent container không. */
  readonly hasParent: boolean;
  /** Trạng thái disposed. */
  readonly isDisposed: boolean;
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
  /** Có include bindings từ parent containers không (phụ thuộc vào GraphOptions). */
  readonly includesParent: boolean;
}

interface GraphNode {
  readonly id: string; // BindingIdentifier.toString()
  readonly tokenName: string;
  readonly kind: BindingKind;
  readonly scope: BindingScope;
  /** true nếu node này từ parent container (chỉ xuất hiện khi includeParent: true). */
  readonly fromParent: boolean;
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

interface GraphOptions {
  /**
   * Include bindings từ parent containers trong graph.
   * Mặc định: false — chỉ graph của container hiện tại.
   */
  readonly includeParent?: boolean;
}
```

### 6.11 Container interface

```ts
interface Container {
  readonly isDisposed: boolean;

  // --- Binding ---
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  unbindAll(): void;
  unbindAllAsync(): Promise<void>;
  /**
   * Throw RebindUnboundTokenError nếu token chưa có binding own trong container này.
   * Không check parent chain — để override binding từ parent, dùng bind().
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
  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): readonly BindingSnapshot[];
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

TC39 Decorator Stage 3 **không hỗ trợ parameter decorator** (TS1206). `@inject` trên constructor parameter chỉ khả dụng với `experimentalDecorators: true` (legacy). Giải pháp: `@injectable()` nhận **deps array** khai báo tường minh thứ tự constructor — pattern tương tự Angular Ivy.

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

// injectAll — inject tất cả binding khớp thành mảng, với optional named filter
@injectable([injectAll(Plugin), injectAll(Logger, { name: "audit" })])
class Runner {
  constructor(
    private plugins: Plugin[],
    private auditLoggers: LoggerService[],
  ) {}
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

/** Type guard để kiểm tra một value là InjectionDescriptor */
function isInjectionDescriptor(value: unknown): value is InjectionDescriptor;
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
   * Thứ tự gọi: theo thứ tự xuất hiện trong class (top-down).
   */
  readonly postConstruct: readonly string[];
  /**
   * Tên các method được đánh dấu @preDestroy().
   * Thứ tự gọi: theo thứ tự xuất hiện trong class (top-down).
   */
  readonly preDestroy: readonly string[];
}
```

**`MetadataReaderToken` — swap trong test:**

Container nhận `MetadataReader` qua token để có thể override trong test:

```ts
import { MetadataReaderToken } from "@codefast/di";

// Override MetadataReader trong test
testContainer.bind(MetadataReaderToken).toConstantValue(customReader);
```

`MetadataReaderToken` có type `Token<MetadataReader>` và được export từ `@codefast/di`.

**`SymbolMetadataReader` — implementation:**

```ts
getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
  const own = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
  if (own === undefined) return undefined;
  const meta = own.value;
  if (!meta || typeof meta !== "object" || !Object.hasOwn(meta, INJECTABLE_KEY)) {
    return undefined;
  }
  return meta[INJECTABLE_KEY] as ConstructorMetadata;
}
```

Nếu child kế thừa parent nhưng không có `@injectable()` → `getConstructorMetadata` trả `undefined` → container throw `MissingMetadataError`. Không silently leak metadata của parent class.

### 7.5 Property injection qua `accessor` field decorator

TC39 Stage 3 hỗ trợ `accessor` keyword. `@inject(token)` có thể dùng như **field decorator** trên `accessor`:

```ts
@injectable()
class Dashboard {
  @inject(Logger) accessor logger!: LoggerService;
  @inject(Database) accessor db!: DatabaseService;
}
```

**Cơ chế — thứ tự initialization:**

`@inject(token)` trên `accessor` ghi token vào `Symbol.metadata` qua `context.metadata`. Khi container resolve class có `accessor` field, container dùng `context.addInitializer` để inject giá trị vào từng instance. Thứ tự:

```
1. constructor() chạy
2. accessor initializers chạy — property injected fields được set
3. @postConstruct() chạy — có thể truy cập injected fields
```

```ts
// Container tự xử lý property injection
const dash = container.resolve(Dashboard);
// dash.logger → LoggerService từ cùng container
// dash.db → DatabaseService từ cùng container
```

**Ngoài container context:**

Nếu class được `new` thủ công (không qua container), accessor initializer không có container → throw `MissingContainerContextError`.

> **Constructor injection vẫn là cách ưu tiên** — immutable, dễ test, không cần container context. Property injection qua `accessor` hữu ích khi class kế thừa framework không kiểm soát constructor, hoặc cần break circular dependency.
>
> **Không hỗ trợ plain field** (`@inject(Logger) logger!`) — plain field decorator trong TC39 Stage 3 không có getter/setter để intercept.

**`inject()` dual-role:**

`inject()` hoạt động như cả plain function (trong deps array) lẫn accessor decorator. Return type là intersection:

```ts
function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value>;
```

Khi dùng trong deps array, TypeScript match `InjectionDescriptor<Value>`. Khi dùng làm decorator, TypeScript match `ClassAccessorDecorator<unknown, Value>`. Cả hai roles hoạt động với cùng một function — không cần import khác nhau.

> **Compatibility note:** Một số transform tools (esbuild, SWC) có thể không preserve callable objects trong metadata. Nếu gặp vấn đề, dùng `isInjectionDescriptor(value)` để kiểm tra trước khi xử lý deps array.

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

> **Nhiều `@postConstruct()` / `@preDestroy()`:** Một class có thể có nhiều method `@postConstruct()` và nhiều `@preDestroy()`. Tất cả đều được gọi theo thứ tự khai báo (top-down). Nếu một method throw, các method sau không được gọi và error được propagate.
>
> **Scope:** `@postConstruct()` chạy cho mọi scope — mỗi lần instance mới được tạo. `@preDestroy()` chỉ chạy cho `singleton` khi container dispose hoặc unbind. `scoped` và `transient` instance không có `@preDestroy()`.
>
> **Async contamination:** `@postConstruct()` async buộc `resolveAsync()` — async contamination lan truyền toàn bộ dependency path.

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
> **Lý do không dùng global registry:** Global state tạo implicit side effect tại module import time — khó tree-shake, khó isolate trong test. `createAutoRegisterRegistry()` trả về object bình thường, có thể pass, mock, hay reset độc lập.

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
| `isInjectionDescriptor(v)`     | type guard fn                 | —                             | Check value là `InjectionDescriptor`                                                              |
| `@postConstruct()`             | decorator                     | method                        | Ghi method name vào `Symbol.metadata` — chạy sau construct, trước cache                           |
| `@preDestroy()`                | decorator                     | method                        | Ghi method name vào `Symbol.metadata` — chạy khi deactivation (singleton only)                    |
| `MetadataReaderToken`          | `Token<MetadataReader>`       | —                             | Token để swap MetadataReader trong test                                                           |

> **`@singleton()` và `@scoped()` không tồn tại.** Scope là binding-time concern — khai báo tại `.singleton()` / `.transient()` / `.scoped()` trong fluent chain. Class không quyết định scope của chính nó.
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

---

## 8. Advanced Constraints

Advanced constraints là nhóm predicate factory — mỗi function nhận tham số cấu hình và trả về `(ctx: ConstraintContext) => boolean` — dùng với `.when()` trong binding chain.

Khác với `whenNamed` / `whenTagged` (lọc slot tĩnh, O(1)), advanced constraints kiểm tra **vị trí của binding trong dependency graph tại runtime**: token nào đang đứng ở direct parent, slot nào của ancestor đang active. Use case điển hình là inject khác nhau tùy vào subtree đang được resolve — ví dụ: dùng `VerboseLogger` khi ancestor là `DebugModule`, dùng `SandboxMailer` khi ancestor nào đó có tag `env=test`.

Advanced constraints export từ subpath riêng `@codefast/di/constraints`, không export từ root `@codefast/di`, để tree-shaking loại bỏ hoàn toàn khi không dùng.

### 8.1 Token name resolution

Tất cả constraint function nhận `Token<unknown> | Constructor` và resolve thành chuỗi `tokenName` để so sánh với `MaterializationFrame.tokenName`. Quy tắc:

- `Token<Value>` → dùng `token.name` (chuỗi khai báo lúc gọi `token("Logger")`)
- `Constructor` → dùng `Constructor.name` (tên class JavaScript)

> **Unique name:** `MaterializationFrame.tokenName` là `string`, không phải branded type. Nếu hai token khác nhau có cùng `name` — ví dụ `token<A>("Config")` và `token<B>("Config")` — constraint không phân biệt được. Đặt tên token unique (namespace prefix, ví dụ `"@myapp/Config"`) để tránh false match.

### 8.2 Type signatures

```ts
import type { ConstraintContext, Constructor, Token } from "@codefast/di";

// ─── Parent constraints ───────────────────────────────────────────────────────

/**
 * Match khi direct parent trong dependency graph là token đã cho.
 * Trả `false` khi không có parent (root resolve — không có gì đang inject token này).
 */
function whenParentIs(token: Token<unknown> | Constructor): (ctx: ConstraintContext) => boolean;

/**
 * Match khi KHÔNG có direct parent là token đã cho.
 * Trả `true` khi không có parent (root resolve).
 */
function whenNoParentIs(token: Token<unknown> | Constructor): (ctx: ConstraintContext) => boolean;

// ─── Ancestor constraints ─────────────────────────────────────────────────────

/**
 * Match khi bất kỳ ancestor nào trong dependency graph là token đã cho.
 * `ctx.ancestors` là tất cả frame phía trên direct parent — không bao gồm parent.
 * Trả `false` khi không có ancestor.
 */
function whenAnyAncestorIs(
  token: Token<unknown> | Constructor,
): (ctx: ConstraintContext) => boolean;

/**
 * Match khi không có ancestor nào là token đã cho.
 * Trả `true` khi không có ancestor.
 */
function whenNoAncestorIs(token: Token<unknown> | Constructor): (ctx: ConstraintContext) => boolean;

// ─── Named variants ───────────────────────────────────────────────────────────

/**
 * Match khi direct parent binding được match với slot name đã cho.
 * Đọc `ctx.parent.slot.name` — slot name của binding, không phải resolve hint.
 * Trả `false` khi không có parent.
 */
function whenParentNamed(name: string): (ctx: ConstraintContext) => boolean;

/**
 * Match khi bất kỳ ancestor binding nào được match với slot name đã cho.
 * Trả `false` khi không có ancestor.
 */
function whenAnyAncestorNamed(name: string): (ctx: ConstraintContext) => boolean;

// ─── Tagged variants ──────────────────────────────────────────────────────────

/**
 * Match khi direct parent binding được match với slot tag đã cho.
 * Tag value so sánh bằng `Object.is` — nhất quán với slot equality (section 5.11).
 * Trả `false` khi không có parent.
 */
function whenParentTagged(tag: string, value: unknown): (ctx: ConstraintContext) => boolean;

/**
 * Match khi bất kỳ ancestor binding nào được match với slot tag đã cho.
 * Trả `false` khi không có ancestor.
 */
function whenAnyAncestorTagged(tag: string, value: unknown): (ctx: ConstraintContext) => boolean;
```

### 8.3 Semantics

`ctx.parent` là `MaterializationFrame` của binding ngay trên trong stack (binding đang inject token hiện tại). `ctx.ancestors` là tất cả frame phía trên `ctx.parent`, theo thứ tự từ trực tiếp đến xa nhất — không bao gồm `ctx.parent`.

**Bảng implementation chuẩn (normative):**

| Function                            | Logic                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `whenParentIs(token)`               | `ctx.parent !== undefined && ctx.parent.tokenName === tokenNameOf(token)`                             |
| `whenNoParentIs(token)`             | `ctx.parent === undefined \|\| ctx.parent.tokenName !== tokenNameOf(token)`                           |
| `whenAnyAncestorIs(token)`          | `ctx.ancestors.some(f => f.tokenName === tokenNameOf(token))`                                         |
| `whenNoAncestorIs(token)`           | `ctx.ancestors.every(f => f.tokenName !== tokenNameOf(token))`                                        |
| `whenParentNamed(name)`             | `ctx.parent !== undefined && ctx.parent.slot.name === name`                                           |
| `whenAnyAncestorNamed(name)`        | `ctx.ancestors.some(f => f.slot.name === name)`                                                       |
| `whenParentTagged(tag, value)`      | `ctx.parent !== undefined && ctx.parent.slot.tags.some(([t, v]) => t === tag && Object.is(v, value))` |
| `whenAnyAncestorTagged(tag, value)` | `ctx.ancestors.some(f => f.slot.tags.some(([t, v]) => t === tag && Object.is(v, value)))`             |

> **`Object.is` cho tag value:** So sánh value bằng `Object.is` thay vì `===` — xử lý đúng `NaN` và phân biệt `+0` với `-0`. Nhất quán với slot equality trong section 5.11.

> **Named variant đọc `slot.name`, không đọc `currentResolveHint`:** `whenParentNamed("console")` hỏi "binding của parent có `whenNamed("console")` không?" — không hỏi "parent được resolve với hint `{ name: "console" }` không?". Hai câu hỏi khác nhau: một binding có thể match slot `"console"` mà không cần resolve hint khi nó là binding duy nhất được chọn, và ngược lại.

### 8.4 Ví dụ

**`whenParentIs` — Logger verbose chỉ khi parent là `DebugService`:**

```ts
import { whenParentIs } from "@codefast/di/constraints";

container.bind(Logger).to(ConsoleLogger);
container.bind(Logger).to(VerboseLogger).when(whenParentIs(DebugService));
```

Khi `DebugService` yêu cầu `Logger`, predicate match và `VerboseLogger` được chọn. Các service khác nhận `ConsoleLogger` (default slot).

> **Đảm bảo mutually exclusive:** Hai binding trên đều dùng predicate-only `when()`. Nếu cả hai predicate cùng `true` trong một lần resolve, resolver throw `AmbiguousBindingError`. Đảm bảo predicates loại trừ nhau — ví dụ: binding thứ nhất thêm `.when((ctx) => !whenParentIs(DebugService)(ctx))` để phủ.

**`whenAnyAncestorIs` — inject config riêng cho toàn subtree của `TestHarness`:**

```ts
import { whenAnyAncestorIs, whenNoAncestorIs } from "@codefast/di/constraints";

container.bind(Config).toConstantValue(prodConfig).when(whenNoAncestorIs(TestHarness));

container.bind(Config).toConstantValue(testConfig).when(whenAnyAncestorIs(TestHarness));
```

Bất kỳ service nào được resolve trong subtree bắt đầu từ `TestHarness` đều nhận `testConfig`. Các service ngoài subtree nhận `prodConfig`.

**`whenParentNamed` — Logger biết mình đang phục vụ slot nào của `Database`:**

```ts
import { whenParentNamed } from "@codefast/di/constraints";

container.bind(Database).to(PrimaryDatabase).whenNamed("primary").singleton();
container.bind(Database).to(ReplicaDatabase).whenNamed("replica").singleton();

container.bind(Logger).to(PrimaryLogger).when(whenParentNamed("primary"));

container.bind(Logger).to(ReplicaLogger).when(whenParentNamed("replica"));
```

Khi `PrimaryDatabase` được resolve (binding slot `"primary"`), nó inject `PrimaryLogger` vì `ctx.parent.slot.name === "primary"`.

**`whenAnyAncestorTagged` — chọn infrastructure khác nhau theo tag môi trường:**

```ts
import { whenAnyAncestorTagged } from "@codefast/di/constraints";

// Ancestor nào đó trong chain có tag env=test → dùng sandbox
container.bind(Mailer).to(SandboxMailer).when(whenAnyAncestorTagged("env", "test"));

// Không có ancestor nào có tag env=test → dùng SMTP thật
container
  .bind(Mailer)
  .to(SmtpMailer)
  .when((ctx) => !whenAnyAncestorTagged("env", "test")(ctx));
```

### 8.5 Composability

Các constraint function trả về `(ctx: ConstraintContext) => boolean` nên composable tự nhiên với toán tử JavaScript:

```ts
import { whenAnyAncestorIs, whenParentIs } from "@codefast/di/constraints";

// AND — cả hai điều kiện phải đúng
container
  .bind(Logger)
  .to(AuditVerboseLogger)
  .when((ctx) => whenParentIs(AuditService)(ctx) && whenAnyAncestorIs(ProductionModule)(ctx));

// OR — một trong hai đủ
container
  .bind(Logger)
  .to(OperationsLogger)
  .when((ctx) => whenParentIs(OrderService)(ctx) || whenParentIs(PaymentService)(ctx));
```

**Closure reuse — tạo một lần, dùng nhiều lần:**

```ts
// Tốt — closure được tạo một lần
const isInsideDebugModule = whenAnyAncestorIs(DebugModule);

container.bind(Logger).to(VerboseLogger).when(isInsideDebugModule);
container.bind(Tracer).to(VerboseTracer).when(isInsideDebugModule);

// Tránh — tạo lại closure mỗi lần (không sai, chỉ tốn allocation không cần thiết)
container.bind(Logger).to(VerboseLogger).when(whenAnyAncestorIs(DebugModule));
container.bind(Tracer).to(VerboseTracer).when(whenAnyAncestorIs(DebugModule));
```

### 8.6 Quy tắc (normative)

Các quy tắc trong section 5.4 áp dụng đầy đủ cho advanced constraints — đây là predicate `when()` thông thường:

- Predicate được gọi mỗi lần resolve cần chọn candidate, không cached.
- Predicate phải pure và deterministic — không có side effects, không gọi I/O.
- Predicate không được gọi `ctx.resolve*()` — sẽ gây circular resolution.
- Đảm bảo predicates mutually exclusive khi nhiều binding cùng token dùng predicate-only `when()`. Nếu sau filter vẫn còn ≥ 2 candidates, resolver throw `AmbiguousBindingError`.

### 8.7 Performance note

`whenAnyAncestorIs` và `whenAnyAncestorTagged` duyệt toàn bộ `ctx.ancestors` — O(depth) mỗi lần resolve. Với dependency graph nông (< 10 levels) điển hình, overhead không đáng kể. Tránh dùng các constraint này trên hot path với graph sâu và `transient` binding; ưu tiên `whenParentIs` (O(1)) khi chỉ cần kiểm tra direct parent.

### 8.8 Subpath export

```ts
// @codefast/di/constraints — src/constraints.ts
export {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
} from "#/constraints";
```

Không export từ root `@codefast/di` — tree-shaking loại bỏ toàn bộ module khi không có import nào từ `@codefast/di/constraints`.

---

## 9. Module system

Module là cách nhóm binding theo domain. Hỗ trợ sync và async setup.

### 9.1 Sync module

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

### 9.2 Async module

```ts
export const DatabaseModule = AsyncModule.create("Database", async (builder) => {
  const config = await loadRemoteConfig();

  builder.import(LoggerModule); // SyncModule có thể import bởi AsyncModuleBuilder
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

### 9.3 Dùng module

```ts
// Sync — tất cả modules phải là SyncModule
const container = Container.fromModules(AppModule, LoggerModule);

// Async — khi có ít nhất một AsyncModule
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);

// Override binding trong test — dùng bind() tại testContainer
const testContainer = Container.fromModules(AppModule);
testContainer.bind(Database).toConstantValue(mockDatabase); // override parent
// Hoặc rebind nếu Database đã bound trong AppModule tại cùng container
testContainer.rebind(Database).toConstantValue(mockDatabase);
```

> **Module là pure description — không ôm state runtime:** Cùng một `SyncModule` / `AsyncModule` object có thể load vào nhiều containers độc lập song song. Module chỉ giữ `name` và callback `setup`; container track "đã load module nào" và "binding nào thuộc module nào".
>
> **Deduplication:** Gọi `container.load(M)` nhiều lần hoặc `m.import(M)` từ nhiều module là no-op từ lần thứ hai. Dedup dựa trên **object identity**, không phải `name`. Unload reference-counting dùng cùng identity — xem section 6.4.

### 9.4 `SyncModule` không thể import `AsyncModule`

`ModuleBuilder` (dùng trong `SyncModule.create()`) chỉ nhận `SyncModule[]` trong `import()`. Điều này bắt buộc — callback của `SyncModule` là sync, không thể await async setup:

```ts
// Compile error — SyncModule không thể import AsyncModule
export const AppModule = SyncModule.create("App", (builder) => {
  builder.import(DatabaseModule); // TypeScript error: AsyncModule không assign được SyncModule
});

// Đúng — convert sang AsyncModule nếu cần import AsyncModule
export const AppModule = AsyncModule.create("App", async (builder) => {
  builder.import(DatabaseModule); // OK — AsyncModuleBuilder nhận cả SyncModule lẫn AsyncModule
});
```

### 9.5 Module interface

```ts
// ModuleBuilder — chỉ tồn tại trong callback của SyncModule.create()
// Additive-only: chỉ bind và import, không unbind hay rebind
interface ModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: SyncModule[]): void; // chỉ SyncModule
}

interface AsyncModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Array<SyncModule | AsyncModule>): void; // sync + async
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

> **Tại sao branded field?** TypeScript dùng structural typing — nếu hai interface chỉ có `name: string`, `container.load(asyncModule)` compile được mà không báo lỗi. Branded field đảm bảo `load(asyncModule)` là TypeScript error tại compile time.
>
> **`ModuleBuilder` không có `unbind` / `rebind`:** Module là _additive_ — chỉ khai báo, không xóa binding của module khác. Override trong test dùng `container.bind()` hoặc `container.rebind()` sau khi load. Tránh hidden coupling giữa modules.

---

## 10. Error hierarchy

Tất cả error kế thừa `DiError` — có `code` string (machine-readable) và message đủ context:

```ts
// Base — abstract, buộc mọi subclass khai báo code cụ thể
abstract class DiError extends Error {
  abstract readonly code: string;
}
```

**`InternalError`** — assertion failure / lỗi internal không expected (không phải lỗi user):

```ts
class InternalError extends DiError {
  readonly code = "INTERNAL_ERROR";
  // Message: mô tả assertion nào fail
}
```

**`TokenNotBoundError`** — token không có binding nào (kể cả sau khi leo lên parent chain):

```ts
class TokenNotBoundError extends DiError {
  readonly code = "TOKEN_NOT_BOUND";
  readonly tokenName: string;
  // "No binding found for token 'Database'. Did you forget container.bind(Database)?"
}
```

**`NoMatchingBindingError`** — token có binding nhưng không có slot nào match hint (kể cả trường hợp không có default slot):

```ts
class NoMatchingBindingError extends DiError {
  readonly code = "NO_MATCHING_BINDING";
  readonly tokenName: string;
  readonly hint: ResolveOptions;
  readonly availableSlots: string[]; // ["default", "name:console", "tag:fuel=petrol"]
  // "No binding for 'Logger' matching { name: 'file' }. Available slots: [default, name:console]."
}
```

**`AmbiguousBindingError`** — `when()` predicate-only: sau filter runtime còn ≥ 2 candidates (lỗi của người dùng — predicates không mutually exclusive):

```ts
class AmbiguousBindingError extends DiError {
  readonly code = "AMBIGUOUS_BINDING";
  readonly tokenName: string;
  readonly candidateIds: readonly BindingIdentifier[];
  // "Multiple bindings for 'Logger' matched without a clear winner.
  //  Candidates: [id1, id2]. Ensure when() predicates are mutually exclusive."
}
```

**`CircularDependencyError`** — A → B → A (bao gồm alias chain cycle):

```ts
class CircularDependencyError extends DiError {
  readonly code = "CIRCULAR_DEPENDENCY";
  readonly cycle: string[]; // ["App", "Database", "App"] — in toàn bộ cycle
}
```

**`AsyncResolutionError`** — `resolve()` sync trên async binding (trực tiếp hoặc qua dep chain):

```ts
class AsyncResolutionError extends DiError {
  readonly code = "ASYNC_RESOLUTION";
  readonly tokenName: string;
  readonly asyncSourceToken: string; // token là nguồn gốc async trong chain
  // "Token 'App' requires async resolution because 'Database' in its dependency
  //  chain has an async factory. Use container.resolveAsync(App)."
}
```

**`AsyncDeactivationError`** — `unbind()` sync trên binding có async `onDeactivation`:

```ts
class AsyncDeactivationError extends DiError {
  readonly code = "ASYNC_DEACTIVATION";
  readonly tokenName: string;
  // "Token 'Database' has an async onDeactivation handler. Use unbindAsync() instead."
}
```

**`ScopeViolationError`** — singleton phụ thuộc vào scoped/transient:

```ts
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
```

**`MissingMetadataError`** — `@injectable()` thiếu trên class cần auto-resolve:

```ts
class MissingMetadataError extends DiError {
  readonly code = "MISSING_METADATA";
  readonly targetName: string;
  // "Class 'UserService' is missing @injectable() decorator.
  //  Add @injectable([...deps]) or use toDynamic()/toResolved() instead."
}
```

**`AsyncModuleLoadError`** — `load()` sync nhận `AsyncModule`:

```ts
class AsyncModuleLoadError extends DiError {
  readonly code = "ASYNC_MODULE_LOAD";
  readonly moduleName: string;
  // "Module 'Database' is async. Use container.loadAsync() instead."
}
```

**`SyncDisposalNotSupportedError`** — `[Symbol.dispose]()` được gọi:

```ts
class SyncDisposalNotSupportedError extends DiError {
  readonly code = "SYNC_DISPOSAL_NOT_SUPPORTED";
  // "Container cannot be disposed synchronously because onDeactivation handlers
  //  may be async. Use `await using` or call container.dispose() explicitly."
}
```

**`MissingScopeContextError`** — `scoped` binding được resolve từ container không có child scope context:

```ts
class MissingScopeContextError extends DiError {
  readonly code = "MISSING_SCOPE_CONTEXT";
  readonly tokenName: string;
  // "Token 'RequestHandler' is scoped but was resolved from a container without
  //  a child scope context. Use container.createChild() to create a scoped context."
}
```

**`MissingContainerContextError`** — property injection (accessor) được khởi tạo ngoài container:

```ts
class MissingContainerContextError extends DiError {
  readonly code = "MISSING_CONTAINER_CONTEXT";
  readonly targetName: string;
  // "Class 'Dashboard' has @inject accessor fields but was instantiated outside
  //  a container context. Resolve it via container.resolve(Dashboard) instead."
}
```

**`RebindUnboundTokenError`** — `rebind()` trên token chưa có binding own:

```ts
class RebindUnboundTokenError extends DiError {
  readonly code = "REBIND_UNBOUND_TOKEN";
  readonly tokenName: string;
  // "Cannot rebind token 'Logger' because it has no own binding in this container.
  //  Use container.bind(Logger) to create a new binding instead."
}
```

**`DisposedContainerError`** — thao tác trên container đã dispose:

```ts
class DisposedContainerError extends DiError {
  readonly code = "DISPOSED_CONTAINER";
  // "Cannot perform operations on a disposed container."
}
```

---

## 11. File structure

```
packages/di/
├── src/
│   │
│   ├── __tests__/                             Integration tests — cross-module, end-to-end scenarios
│   │   ├── async-dispose.integration.test.ts        Container.dispose() với async onDeactivation chain
│   │   ├── async-scoped-dispose.integration.test.ts scoped + async deactivation trên child container
│   │   ├── async-singleton-concurrent.integration.test.ts  Concurrent resolveAsync cùng singleton token
│   │   ├── constraints.integration.test.ts          whenParentIs / whenAnyAncestorIs / when() trong resolve thật
│   │   ├── container-branches.integration.test.ts   Child container, parent chain, scope ownership
│   │   ├── decorators.integration.test.ts           @injectable + @inject + @postConstruct end-to-end
│   │   ├── di.integration.test.ts                   Full DI workflow: bind → load → resolve → dispose
│   │   ├── last-wins-slot.integration.test.ts       Slot-aware last-wins ở registration-time
│   │   ├── metadata-reader-branches.integration.test.ts  SymbolMetadataReader edge cases
│   │   ├── module-unload.integration.test.ts        unload + deactivation + ref-count
│   │   ├── resolve-all-async.integration.test.ts    resolveAll / resolveAllAsync filter semantics
│   │   ├── scope-violation.integration.test.ts      validate() + ScopeViolationError detection
│   │   └── when-predicate-multi.integration.test.ts when() predicate + AmbiguousBindingError
│   │
│   ├── types.ts               Tất cả kiểu nền tảng dùng xuyên suốt:
│   │                          BindingScope, BindingIdentifier, BindingKind, Constructor,
│   │                          ActivationHandler, DeactivationHandler, ResolveOptions,
│   │                          ResolutionContext, ConstraintContext, MaterializationFrame, TokenValue
│   ├── types.test.ts
│   │
│   ├── token.ts               Token<Value> branded type, token() factory, TOKEN_BRAND
│   ├── token.test.ts
│   │
│   ├── binding.ts             Binding discriminated union:
│   │                            ClassBinding, ConstantBinding, DynamicBinding,
│   │                            DynamicAsyncBinding, ResolvedBinding, ResolvedAsyncBinding, AliasBinding
│   │                          Builder interfaces:
│   │                            BindToBuilder, BindingBuilder, ConstantBindingBuilder,
│   │                            AliasBindingBuilder, SingletonBindingBuilder,
│   │                            TransientBindingBuilder, ScopedBindingBuilder,
│   │                            SingletonLifecycleBuilder
│   ├── binding.test.ts
│   │
│   ├── binding-select.ts      Binding selection — runtime filtering:
│   │                          token + ResolveOptions hint + when() predicates → candidate binding(s).
│   │                          Throw AmbiguousBindingError nếu ≥ 2 candidates sau filter.
│   │                          Tách khỏi registry (storage) và resolver (graph walk).
│   ├── binding-select.test.ts
│   │
│   ├── registry.ts            BindingRegistry — slot-aware last-wins ở registration-time,
│   │                          eager commit, Map<tokenKey, Binding[]>
│   ├── registry.test.ts
│   │
│   ├── resolver.ts            DependencyResolver — graph walk, circular detection via Set,
│   │                          async contamination propagation, captive dependency detection,
│   │                          singleton in-flight Promise deduplication (concurrency safety)
│   ├── resolver.test.ts
│   │
│   ├── scope.ts               ScopeManager — singleton cache per container,
│   │                          singleton in-flight map per container (async serialization),
│   │                          scoped cache per child, MissingScopeContextError
│   ├── scope.test.ts
│   │
│   ├── lifecycle.ts           LifecycleManager — per-binding + container-level onActivation /
│   │                          onDeactivation, thứ tự chuẩn, async deactivation chain,
│   │                          AsyncDeactivationError khi unbind sync trên async handler
│   ├── lifecycle.test.ts
│   │
│   ├── environment.ts         ResolutionContext implementation,
│   │                          async contamination tracking, capability checks
│   │                          (Symbol.metadata, Symbol.asyncDispose availability)
│   ├── environment.test.ts
│   │
│   ├── inspector.ts           Introspection — ContainerSnapshot, BindingSnapshot,
│   │                          inspect(), lookupBindings() (trả [] không undefined),
│   │                          has(), hasOwn() với hint semantics chuẩn
│   ├── inspector.test.ts
│   │
│   ├── dependency-graph.ts    Graph building — generateDependencyGraph() → ContainerGraphJson,
│   │                          nodes + edges với label format chuẩn, includeParent option
│   ├── dependency-graph.test.ts
│   │
│   ├── constraints.ts         Advanced constraints — xem section 8 để biết spec đầy đủ.
│   │                          whenParentIs, whenNoParentIs, whenAnyAncestorIs, whenNoAncestorIs,
│   │                          whenParentNamed, whenAnyAncestorNamed,
│   │                          whenParentTagged, whenAnyAncestorTagged.
│   │                          Export từ subpath @codefast/di/constraints, không từ root index.
│   ├── constraints.test.ts
│   │
│   ├── module.ts              SyncModule + AsyncModule (branded types), reference-count tracking,
│   │                          additive-only ModuleBuilder / AsyncModuleBuilder
│   ├── module.test.ts
│   │
│   ├── container.ts           DefaultContainer — compose tất cả, implement Container interface đầy đủ,
│   │                          isDisposed state + DisposedContainerError guard
│   ├── container.test.ts
│   │
│   ├── errors.ts              DiError abstract base + tất cả concrete subclasses + ScopeViolationDetails
│   ├── errors.test.ts
│   │
│   ├── metadata/
│   │   ├── metadata-keys.ts               Unique Symbol keys viết vào Symbol.metadata
│   │   ├── metadata-types.ts              ConstructorMetadata, ParamMetadata,
│   │   │                                  LifecycleMetadata, MetadataReader interface
│   │   ├── metadata-reader-token.ts       MetadataReaderToken — Token<MetadataReader>
│   │   ├── symbol-metadata-reader.ts      SymbolMetadataReader — Object.hasOwn guard,
│   │   │                                  chỉ đọc own metadata (không leak từ parent class)
│   │   └── symbol-metadata-reader.test.ts
│   │
│   ├── decorators/
│   │   ├── injectable.ts                  @injectable(deps?, options?) — ghi param metadata
│   │   │                                  vào Symbol.metadata; options.autoRegister.
│   │   │                                  createAutoRegisterRegistry() cũng export từ đây.
│   │   ├── inject.ts                      inject() / optional() / injectAll() — plain fn trả
│   │   │                                  InjectionDescriptor; đồng thời là accessor decorator.
│   │   │                                  isInjectionDescriptor() type guard.
│   │   ├── inject.test.ts
│   │   └── lifecycle-decorators.ts        @postConstruct() + @preDestroy() — support nhiều method per class
│   │
│   ├── graph-adapters/
│   │   ├── types.ts           GraphNode, GraphEdge, ContainerGraphJson, GraphOptions — shared
│   │   ├── dot.ts             toDotGraph(graph) → DOT language string (Graphviz)
│   │   ├── cytoscape.ts       toCytoscapeGraph(graph) → Cytoscape.js elements format
│   │   └── reactflow.ts       toReactFlowGraph(graph) → React Flow nodes/edges format
│   │
│   ├── index.ts               Public API exports (root entrypoint)
│   └── index.test.ts          Public API smoke tests
│
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

**Ownership của `types.ts`:** Kiểu nền tảng (`BindingScope`, `BindingIdentifier`, `BindingKind`, `Constructor`, `ActivationHandler`, `DeactivationHandler`, `ResolveOptions`, `ResolutionContext`, `ConstraintContext`, `MaterializationFrame`, `TokenValue`) được khai báo trong `types.ts` — file có single responsibility, không phụ thuộc bất kỳ file nào khác trong package. `binding.ts`, `resolver.ts`, `scope.ts`... đều import từ `types.ts`. Re-export từ `index.ts`.

**Phân tách `binding-select.ts` khỏi `registry.ts`:** `registry.ts` là storage layer — lưu binding và xử lý slot-aware last-wins. `binding-select.ts` là runtime filtering layer — nhận token + `ResolveOptions` + `when()` predicates, trả candidates. `resolver.ts` consume kết quả của `binding-select.ts`. Phân tách này làm từng layer dễ test độc lập.

**`metadata-reader-token.ts` tách riêng:** `MetadataReaderToken` là bridge giữa decorator layer và container. Tách riêng để tránh circular import (`container.ts` → `metadata-reader-token.ts` → không phụ thuộc `container.ts`).

### 11.1 Public API (`index.ts`)

```ts
// Foundation types
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

// Binding builders — types only
export type {
  AliasBindingBuilder,
  BindToBuilder,
  BindingBuilder,
  ConstantBindingBuilder,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  SingletonLifecycleBuilder,
  TransientBindingBuilder,
} from "#/binding";

// Container
export { Container } from "#/container";
export type { ContainerStatic } from "#/container";

// Introspection types
export type { BindingSnapshot, ContainerSnapshot } from "#/inspector";

// Graph types
export type {
  ContainerGraphJson,
  GraphEdge,
  GraphNode,
  GraphOptions,
} from "#/graph-adapters/types";

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
export { createAutoRegisterRegistry } from "#/decorators/injectable";
export type { AutoRegisterRegistry } from "#/decorators/injectable";

// MetadataReader
export { MetadataReaderToken } from "#/metadata/metadata-reader-token";
export type { MetadataReader } from "#/metadata/metadata-types";

// Errors
export {
  AmbiguousBindingError,
  AsyncDeactivationError,
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  DiError,
  DisposedContainerError,
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
// @codefast/di/constraints
//   → whenParentIs, whenAnyAncestorIs, whenNoParentIs, whenNoAncestorIs, ...và Named/Tagged variants
// @codefast/di/graph-adapters/dot
//   → toDotGraph(graph: ContainerGraphJson): string
// @codefast/di/graph-adapters/cytoscape
//   → toCytoscapeGraph(graph: ContainerGraphJson): CytoscapeElements
// @codefast/di/graph-adapters/reactflow
//   → toReactFlowGraph(graph: ContainerGraphJson): ReactFlowGraph
// @codefast/di/registry         — BindingRegistry (advanced)
// @codefast/di/resolver         — DependencyResolver (advanced)
// @codefast/di/scope            — ScopeManager (advanced)
// @codefast/di/lifecycle        — LifecycleManager (advanced)
// @codefast/di/binding-select   — BindingSelector (advanced)
// @codefast/di/inspector        — Inspector (advanced)
```

### 11.2 `package.json`

ESM-only. `engines.node >= 22.0.0`.

```json
{
  "name": "@codefast/di",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.mts"
    },
    "./constraints": {
      "import": "./dist/constraints.mjs",
      "types": "./dist/constraints.d.mts"
    },
    "./graph-adapters/dot": {
      "import": "./dist/graph-adapters/dot.mjs",
      "types": "./dist/graph-adapters/dot.d.mts"
    },
    "./graph-adapters/cytoscape": {
      "import": "./dist/graph-adapters/cytoscape.mjs",
      "types": "./dist/graph-adapters/cytoscape.d.mts"
    },
    "./graph-adapters/reactflow": {
      "import": "./dist/graph-adapters/reactflow.mjs",
      "types": "./dist/graph-adapters/reactflow.d.mts"
    },
    "./registry": {
      "import": "./dist/registry.mjs",
      "types": "./dist/registry.d.mts"
    },
    "./resolver": {
      "import": "./dist/resolver.mjs",
      "types": "./dist/resolver.d.mts"
    },
    "./scope": {
      "import": "./dist/scope.mjs",
      "types": "./dist/scope.d.mts"
    },
    "./lifecycle": {
      "import": "./dist/lifecycle.mjs",
      "types": "./dist/lifecycle.d.mts"
    },
    "./binding-select": {
      "import": "./dist/binding-select.mjs",
      "types": "./dist/binding-select.d.mts"
    },
    "./inspector": {
      "import": "./dist/inspector.mjs",
      "types": "./dist/inspector.d.mts"
    }
  },
  "files": ["dist"],
  "engines": { "node": ">=22.0.0" }
}
```

### 11.3 `tsdown.config.ts`

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts", "!src/__tests__/**/*.ts"],
});
```

---

## 12. Roadmap

### Core container

- `types.ts` — tất cả kiểu nền tảng: `BindingScope`, `BindingIdentifier`, `BindingKind`, `Constructor`, `ActivationHandler`, `DeactivationHandler`, `ResolveOptions`, `ResolutionContext`, `ConstraintContext`, `MaterializationFrame`, `TokenValue`
- `Token<Value>` branded type, `token()` factory, `TOKEN_BRAND`
- `Binding` discriminated union: `ClassBinding`, `ConstantBinding`, `DynamicBinding`, `DynamicAsyncBinding`, `ResolvedBinding`, `ResolvedAsyncBinding`, `AliasBinding`
- Builder interfaces với chain enforcement: `BindingBuilder` không expose `on*()` — buộc scope trước lifecycle
- `BindingRegistry` — slot-aware last-wins ở registration-time, eager commit
- `ScopeManager` — singleton cache per container, in-flight Promise map (async serialization), scoped cache per child
- `LifecycleManager` — per-binding + container-level, thứ tự chuẩn, `AsyncDeactivationError` khi unbind sync trên async handler
- `DependencyResolver` — graph walk, circular detection bằng `Set`, async contamination propagation
- `DefaultContainer` — compose tất cả, `isDisposed` state, `DisposedContainerError` guard
- Child container qua `createChild()`, singleton cache ownership tại defining container
- `dispose()` idempotent, `[Symbol.asyncDispose]()`, `[Symbol.dispose](): never`
- `unbindAll()`, `unbindAllAsync()`, `initializeAsync()`
- `validate()` — scope matrix, transitive alias check, `toDynamic` là opaque
- `has()` / `hasOwn()` với hint semantics chuẩn (any binding vs slot match)
- `lookupBindings()` trả `BindingSnapshot[]` (không phải `undefined`)
- `resolveAll` / `resolveAllAsync` với filter semantics, trả `[]`
- `resolveOptionalAsync` — `undefined` khi không có binding/hint match; re-throw lỗi runtime
- `rebind()` throw `RebindUnboundTokenError` nếu token chưa có own binding
- `loadAutoRegistered(registry)` trên container

### Decorator layer

- `@injectable(deps?, options?)` — TC39 Stage 3, deps array, `autoRegister` nhận explicit registry
- `inject()` + `optional()` + `injectAll()` — plain fn + accessor decorator, `isInjectionDescriptor()` type guard
- `@postConstruct()` + `@preDestroy()` — support nhiều method per class, thứ tự top-down
- `SymbolMetadataReader` với `Object.hasOwn` guard — không leak parent metadata
- `MetadataReaderToken` — `Token<MetadataReader>` để swap trong test
- `createAutoRegisterRegistry()` — explicit, không global

### Module system

- `SyncModule.create()` và `AsyncModule.create()` với branded types
- `ModuleBuilder.import()` chỉ nhận `SyncModule[]` — compile-time enforce
- Import graph resolution; `ModuleBuilder` additive-only
- `Container.fromModules()` / `Container.fromModulesAsync()` với dedup documentation
- `load` / `loadAsync` / `unload` / `unloadAsync` với reference-count tracking
- `unload` sync + deactivation behavior: sync deactivation only; async cần `unloadAsync`

### Error classes

Tất cả error subclasses với `readonly code` và context fields đầy đủ như section 10. Bao gồm `AmbiguousBindingError`, `AsyncDeactivationError`, `DisposedContainerError` mới.

### Introspection và diagnostics

- `inspect(): ContainerSnapshot` — typed snapshot với `isDisposed`
- `lookupBindings(token)` — `BindingSnapshot[]` (không bao giờ `undefined`)
- `generateDependencyGraph(options?): ContainerGraphJson` — `includeParent` option
- `toDotGraph()` từ `@codefast/di/graph-adapters/dot`

### Advanced constraints

Fully spec'd in section 8. Export từ `@codefast/di/constraints`: `whenParentIs`, `whenNoParentIs`, `whenAnyAncestorIs`, `whenNoAncestorIs`, `whenParentNamed`, `whenAnyAncestorNamed`, `whenParentTagged`, `whenAnyAncestorTagged`.

### Integration packages

- `@codefast/di-hono` — middleware + scoped container per request cho Hono
- `@codefast/di-fastify` — plugin + scoped container per request cho Fastify

---

## 13. Stack kỹ thuật

| Công cụ                 | Vai trò                                             |
| ----------------------- | --------------------------------------------------- |
| TypeScript 5.9+         | Decorator Stage 3, `Symbol.metadata` stable, strict |
| tsdown                  | Bundle ESM, `.d.ts`                                 |
| Vitest                  | Unit test và integration test                       |
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

## 14. Testing guide

### 14.1 Isolated container — không load module

Pattern đơn giản nhất: tạo container mới, bind chỉ những gì cần test:

```ts
import { Container } from "@codefast/di";
import { describe, expect, it } from "vitest";

describe("UserService", () => {
  it("registers user and logs action", () => {
    const noopLogger: LoggerService = { log: () => {} };

    const container = Container.create();
    container.bind(Logger).toConstantValue(noopLogger);
    container.bind(UserRepo).toConstantValue(mockUserRepo);
    container.bind(UserService).toSelf();

    const service = container.resolve(UserService);
    expect(service).toBeInstanceOf(UserService);
  });
});
```

### 14.2 Child container — override binding từ parent

Để override binding đã định nghĩa trong module, dùng `bind()` tại child container (không cần `rebind()` vì child không có own binding):

```ts
const testContainer = Container.fromModules(AppModule);

// Override Database binding — child resolution ưu tiên hơn parent
testContainer.bind(Database).toConstantValue(mockDatabase);

const userService = testContainer.resolve(UserService);
// userService.database === mockDatabase
```

### 14.3 Rebind — override binding trong cùng container

Dùng `rebind()` khi muốn thay thế binding **đã có** trong cùng container (ví dụ: hot-reload hoặc reconfiguration):

```ts
const container = Container.create();
container.bind(Logger).to(ConsoleLogger).singleton();

// Override trong cùng container
container.rebind(Logger).toConstantValue(mockLogger);
// Lưu ý: singleton cũ bị deactivate (onDeactivation được gọi nếu có)
```

### 14.4 Swap MetadataReader

Container nhận `MetadataReader` qua `MetadataReaderToken`. Để test container behavior mà không phụ thuộc vào `Symbol.metadata`:

```ts
import { MetadataReaderToken } from "@codefast/di";

const customReader: MetadataReader = {
  getConstructorMetadata: (target) => ({
    params: [{ index: 0, token: Logger, optional: false, multi: false }],
  }),
  getLifecycleMetadata: () => ({ postConstruct: [], preDestroy: [] }),
};

const container = Container.create();
container.bind(MetadataReaderToken).toConstantValue(customReader);
container.bind(UserService).toSelf();

const service = container.resolve(UserService);
```

### 14.5 Test với scoped binding

```ts
it("scoped binding isolated per child", () => {
  const container = Container.create();
  container.bind(RequestId).toConstantValue("request-1");
  container.bind(RequestHandler).toSelf().scoped();

  const child1 = container.createChild();
  child1.bind(RequestId).toConstantValue("req-1");

  const child2 = container.createChild();
  child2.bind(RequestId).toConstantValue("req-2");

  const h1 = child1.resolve(RequestHandler);
  const h2 = child2.resolve(RequestHandler);

  expect(h1).not.toBe(h2); // khác instance — mỗi child là scope riêng
  expect(child1.resolve(RequestHandler)).toBe(h1); // cùng instance trong child1
});
```

### 14.6 Test với async binding

```ts
it("resolves async binding", async () => {
  const container = Container.create();
  container
    .bind(Database)
    .toDynamicAsync(async () => {
      return new MockDatabase();
    })
    .singleton();

  const db = await container.resolveAsync(Database);
  expect(db).toBeInstanceOf(MockDatabase);

  // Cleanup
  await container.dispose();
});
```

### 14.7 Test dispose behavior

```ts
it("calls onDeactivation on dispose", async () => {
  const disconnected = vi.fn();
  const container = Container.create();
  container.bind(Database).to(MockDatabase).singleton().onDeactivation(disconnected);

  await container.resolveAsync(Database);
  await container.dispose();

  expect(disconnected).toHaveBeenCalledOnce();
});

it("throws DisposedContainerError after dispose", async () => {
  const container = Container.create();
  await container.dispose();

  expect(() => container.resolve(Logger)).toThrow(DisposedContainerError);
});
```

### 14.8 Test `validate()`

```ts
it("detects captive dependency violation", () => {
  const container = Container.create();
  container.bind(Cache).to(InMemoryCache).scoped();
  container.bind(UserService).to(UserServiceImpl).singleton();
  // UserServiceImpl phụ thuộc Cache — singleton phụ thuộc scoped → violation

  expect(() => container.validate()).toThrow(ScopeViolationError);
});
```

### 14.9 Anti-patterns cần tránh

**Không dùng global container trong test:** Global state làm tests phụ thuộc nhau:

```ts
// ❌ Anti-pattern
const container = Container.create(); // global — leak giữa tests

// ✅ Đúng — mỗi test tự tạo container
beforeEach(() => {
  container = Container.create();
});
afterEach(async () => {
  await container.dispose();
});
```

**Không mock `Symbol.metadata` trực tiếp:** Dùng `MetadataReaderToken` thay thế (xem 13.4).

**Không dùng `rebind()` để override từ parent:** Dùng `bind()` tại child container (xem 13.2).

---

## 15. Đối chiếu với InversifyJS v8

Section này đối chiếu toàn bộ public API của InversifyJS v8.0.0 (tháng 3/2026) với `@codefast/di`. Mỗi nhóm tính năng được xét theo ba chiều: **học từ v8**, **cải thiện hơn v8**, **không học từ v8**.

---

### 15.1 Bảng so sánh API theo nhóm

#### Setup và yêu cầu

| Khía cạnh          | InversifyJS v8                                                | `@codefast/di`                                    |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------- |
| Cài đặt            | `npm install inversify reflect-metadata`                      | `npm install @codefast/di`                        |
| reflect-metadata   | Bắt buộc — `import 'reflect-metadata'` ở entry point          | Không cần — zero dependency                       |
| tsconfig flags     | `experimentalDecorators: true`, `emitDecoratorMetadata: true` | Không cần flag đặc biệt                           |
| Decorator standard | Legacy TC39 Stage 1 (experimentalDecorators)                  | TC39 Stage 3 (`Symbol.metadata`, TypeScript 5.9+) |
| Module format      | ESM-only                                                      | ESM-only                                          |
| Node.js tối thiểu  | Node ≥ 20.19.0                                                | Node ≥ 22.0.0                                     |

#### Binding API

| Tính năng              | InversifyJS v8                                    | `@codefast/di`                                             |
| ---------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Async binding          | `toDynamicValue` nhận cả sync lẫn async           | `toDynamic` vs `toDynamicAsync` — compiler enforce         |
| Explicit deps async    | Không có `toResolvedValueAsync`                   | `toResolvedAsync(factory, deps)` — symmetric với sync      |
| Scope naming           | `inSingletonScope()` / `inTransientScope()` / ... | `singleton()` / `transient()` / `scoped()`                 |
| Lifecycle sau scope    | `when*` khả dụng sau scope (v8)                   | `on*()` chỉ sau scope — chain chuẩn bất biến               |
| `onDeactivation` guard | Runtime error trên non-singleton                  | Compile-time: chỉ trên `SingletonBindingBuilder`           |
| Alias                  | `toService()` trả `void`                          | `toAlias()` trả `AliasBindingBuilder` — có `when*`/`.id()` |
| Alias + hint forward   | Không được spec                                   | Hint forwarded đến target resolution                       |

#### Container API

| Tính năng                | InversifyJS v8                                        | `@codefast/di`                                             |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| Tạo container            | `new Container()`                                     | `Container.create()` — static factory                      |
| Child container          | `new Container({ parent })`                           | `container.createChild()` — explicit                       |
| Optional resolution      | `container.get(id, { optional: true })`               | `resolveOptional()` / `resolveOptionalAsync()`             |
| Multi resolution         | `getAll()` chỉ có sync                                | `resolveAll()` + `resolveAllAsync()`                       |
| Singleton async safety   | Không được spec                                       | Concurrent `resolveAsync` share in-flight Promise          |
| Container lifecycle      | Không có `isDisposed`, thao tác sau dispose undefined | `isDisposed` getter, `DisposedContainerError`              |
| `isBound()`              | Semantics không rõ với hint                           | `has(token, hint?)` — có binding / match hint cụ thể       |
| `isCurrentBound()`       | Tên dễ nhầm                                           | `hasOwn(token, hint?)` — rõ hơn                            |
| `lookupBindings()`       | Không có                                              | `lookupBindings()` trả `[]` (không `undefined`)            |
| Disposed container guard | Không có                                              | `DisposedContainerError` trên mọi operation                |
| Warm up singletons       | Không có                                              | `initializeAsync()` — fail-fast khi startup                |
| Dependency graph export  | Không có                                              | `generateDependencyGraph({ includeParent? })` → JSON + DOT |

#### Error handling

| Tình huống                     | InversifyJS v8                 | `@codefast/di`                             |
| ------------------------------ | ------------------------------ | ------------------------------------------ |
| Predicate ambiguity            | `InternalError` (sai loại)     | `AmbiguousBindingError` với `candidateIds` |
| Async handler trên sync unbind | Silent fail hoặc runtime error | `AsyncDeactivationError` — explicit        |
| Disposed container             | Undefined behavior             | `DisposedContainerError`                   |
| Không có typed error hierarchy | Không có `code` field          | `DiError` abstract + `code` string         |

#### Module system

| Tính năng                     | InversifyJS v8                                                  | `@codefast/di`                                                   |
| ----------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Module type distinction       | `ContainerModule` / `AsyncContainerModule` không phân biệt type | `SyncModule` / `AsyncModule` branded — `load(async)` là TS error |
| Module coupling               | `ContainerModule` callback có `unbind`, `rebind`                | `ModuleBuilder` additive-only — tránh hidden coupling            |
| Module deduplication          | Không được spec                                                 | Object identity dedup + reference-count documented               |
| SyncModule import AsyncModule | Không được guard                                                | Compile error — `ModuleBuilder.import()` chỉ nhận `SyncModule[]` |
| Unload + deactivation         | Không được spec                                                 | Deactivate singleton khi ref-count về 0                          |

---

### 15.2 Tổng hợp: học từ v8

| Tính năng v8                                                   | Cách triển khai ở đây                                                               |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Naming: unqualified=sync, `Async`=async                        | Giữ nguyên: `resolve`/`resolveAsync`, `load`/`loadAsync`, `unbind`/`unbindAsync`, … |
| ESM-only                                                       | Giống v8                                                                            |
| `onActivation` / `onDeactivation` per-binding                  | Giữ, callback tự infer type từ binding — không cần annotate thủ công                |
| Container-level `onActivation` / `onDeactivation`              | Giữ, child không kế thừa hooks của parent                                           |
| `toResolvedValue(factory, injectOptions)`                      | `toResolved(factory, deps)` sync + `toResolvedAsync` mới                            |
| `toService()` alias concept                                    | `toAlias()` — đổi tên rõ hơn, hint forwarding được spec                             |
| `BindingIdentifier` / `.getIdentifier()`                       | Giữ concept, đổi thành `.id()` — tên ngắn hơn                                       |
| `whenNamed` / `whenTagged` / `whenDefault` / `when(predicate)` | Giữ nguyên, tag key là `string` only                                                |
| `isBound()` check hierarchy                                    | `has()` — giữ semantics với hint support                                            |
| `isCurrentBound()` check current only                          | `hasOwn()` — tên rõ hơn                                                             |
| `unbindAll()` / `unbindAllAsync()`                             | Giữ nguyên                                                                          |
| `@postConstruct()` / `@preDestroy()` method decorators         | Giữ, TC39 Stage 3, support nhiều method per class thay vì chỉ một                   |
| `getAll` filter semantics                                      | `resolveAll` — filter semantics, trả `[]` khi không match                           |
| `bind(id).unbind(bindingId)` — unbind một binding cụ thể       | Giữ qua `container.unbind(bindingId)`                                               |

---

### 15.3 Tổng hợp: cải thiện hơn v8

| InversifyJS v8                                                          | Thư viện này                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `reflect-metadata` + `experimentalDecorators` bắt buộc                  | Zero `reflect-metadata` — TC39 Stage 3, không flag legacy                      |
| `ServiceIdentifier` = union type, không branded                         | `Token<Value>` branded — `resolve` luôn đúng type                              |
| `container.get<WrongType>('id')` compile được                           | Impossible — `Token<Value>` mang type tại compile time                         |
| `inSingletonScope()` / `inTransientScope()` / `inRequestScope()`        | `singleton()` / `transient()` / `scoped()` — tên ngắn, không prefix `in`       |
| `toDynamicValue` nhận cả sync lẫn async, compiler không enforce         | `toDynamic` vs `toDynamicAsync` — compiler enforce `resolveAsync()` khi cần    |
| Không có `toResolvedValueAsync`                                         | `toResolvedAsync(factory, deps)` — symmetric với `toResolved`                  |
| `when*` khả dụng sau scope                                              | `on*()` chỉ sau scope — chain order bất biến, loại bỏ ambiguity                |
| `onDeactivation` không có compile-time guard                            | Builder type narrowing — `onDeactivation` chỉ trên `SingletonBindingBuilder`   |
| `toService()` trả về `void`                                             | `toAlias()` trả về `AliasBindingBuilder` — có `when*`, `.id()`, hint forward   |
| `@inject` trên parameter cần `experimentalDecorators`                   | `@injectable([deps])` + `inject()` — TC39 Stage 3 thuần                        |
| `@inject` trên plain property                                           | `@inject accessor field` — dùng TC39 `accessor` keyword                        |
| `getAll()` chỉ có sync                                                  | `resolveAll()` + `resolveAllAsync()`                                           |
| `container.get()` + `{ optional: true }` — ẩn trong options             | `resolveOptional()` + `resolveOptionalAsync()` — tên method tường minh         |
| `tag` là single tag object — không hỗ trợ multi-tag                     | `tags` là `ReadonlyArray<readonly [string, unknown]>` — multi-tag lookup       |
| `Symbol.metadata` prototype chain không được xử lý                      | `SymbolMetadataReader` dùng `Object.hasOwn` guard — không leak parent metadata |
| `ContainerModule` / `AsyncContainerModule` không phân biệt ở type level | `SyncModule` / `AsyncModule` branded — `load(asyncModule)` là TypeScript error |
| `@postConstruct` chỉ một method per class                               | Support mảng — nhiều `@postConstruct()` / `@preDestroy()` per class            |
| Không có `validate()`                                                   | `container.validate()` — detect captive dependency tĩnh, transitive alias      |
| Không có `initializeAsync()`                                            | Idempotent warm-up, cross-container trigger documented                         |
| Không có typed error hierarchy                                          | `DiError` abstract + `code` string + context fields trên mọi subclass          |
| Module có thể `unbind` / `rebind` binding của module khác               | `ModuleBuilder` additive-only — tránh hidden coupling giữa modules             |
| Module deduplication không được spec                                    | Object identity deduplication + reference-counting rõ ràng                     |
| `rebind` không throw khi token chưa bound                               | `RebindUnboundTokenError` — contract tường minh                                |
| Predicate ambiguity throw `InternalError`                               | `AmbiguousBindingError` với `candidateIds` — lỗi của user, không phải internal |
| Concurrent async singleton resolution không được spec                   | Serialized via in-flight Promise map — factory chỉ chạy 1 lần                  |
| Container sau dispose: undefined behavior                               | `DisposedContainerError` + `isDisposed` getter                                 |
| Async unbind sync: silent fail                                          | `AsyncDeactivationError` — explicit                                            |
| `lookupBindings` không có                                               | `lookupBindings()` trả `BindingSnapshot[]` — không bao giờ `undefined`         |
| `toService()` + hint semantics không được spec                          | `toAlias()` hint forwarding documented                                         |
| Không có Testing guide                                                  | Section 13 với patterns cho isolated container, child override, MetadataReader |
| `autoRegister` qua global option hoặc per-get                           | `createAutoRegisterRegistry()` — explicit registry, không global state         |
| `[Symbol.asyncDispose]()` không được spec                               | `dispose()` + `[Symbol.asyncDispose]()` — `await using` support                |
| `[Symbol.dispose]()` không được spec                                    | `[Symbol.dispose](): never` — throw `SyncDisposalNotSupportedError` rõ ràng    |
| Không có `lookupBindings()`, `inspect()`, `generateDependencyGraph()`   | Introspection API đầy đủ — typed snapshot, JSON graph, DOT export              |

---

### 15.4 Tổng hợp: không học từ v8

| InversifyJS v8                                                      | Lý do không học                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `string \| symbol` làm service identifier                           | Không type-safe — dùng `Token<Value>` branded                              |
| `new Container({ parent })`                                         | Dùng `container.createChild()` — explicit, không mix config với hierarchy  |
| `new Container({ autobind })`                                       | Không support — "Zero magic" principle                                     |
| `new Container({ defaultScope })`                                   | Không override default scope ở container level — tránh hidden behavior     |
| `container.get(id, { autobind: true })` per-resolve                 | Không support — "Zero magic" principle                                     |
| `container.getAll(id, { chained: true })` chained resolution        | Không có — leo lên parent chain tự động, không cần opt-in                  |
| `snapshot()` / `restore()`                                          | Module composition + `bind()` tại child thay thế trong test workflow       |
| `container.register(PluginClass)`                                   | Không có plugin system — tránh hidden extension mechanism                  |
| `toFactory(ctx => curriedFn)`                                       | `toConstantValue(fn)` hoặc `toDynamic` — ít indirection hơn                |
| `rebindAsync()` — unbind async rồi bind lại                         | Dùng `unbindAsync()` rồi `bind()` — tách rõ hai bước, semantics tường minh |
| Parameter decorator `@inject` / `@optional` / `@named` / `@tagged`  | TS1206 — không tồn tại trong TC39 Stage 3                                  |
| `@multiInject(id)` trên parameter / property                        | `injectAll(token)` trong deps array — plain function, không cần decorator  |
| `@injectFromBase()` / `@injectFromHierarchy()`                      | Explicit deps array thay thế — không có implicit inheritance injection     |
| `@unmanaged()` trên parameter                                       | Trong deps array, không khai báo arg không cần inject                      |
| `decorate(decorator, target, idx)`                                  | Không target third-party class integration                                 |
| `LazyServiceIdentifier<T>` — defer evaluation cho circular deps     | `accessor` property injection giải quyết circular dep trực tiếp            |
| `ContainerModule` callback có `bind`, `unbind`, `rebind`, `isBound` | `ModuleBuilder` chỉ `bind` + `import` — tránh hidden coupling giữa modules |
| `when*` ancestor/parent constraints trên main API surface           | Export từ `@codefast/di/constraints` — giữ main API surface nhỏ            |
| `inRequestScope()` per-resolve-tree semantics                       | `scoped()` per-child-container — ranh giới lifecycle rõ ràng hơn           |
| `toResolvedValue` với per-dep name/tag injection options            | `toResolved` chỉ plain token array — khi cần name/tag, dùng `toDynamic`    |

---

_Phiên bản tài liệu: 8.1 — April 2026_
_Lấy cảm hứng từ InversifyJS v8.0.0 (March 2026) — nghiên cứu từ docs.inversify.io_
