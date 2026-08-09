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

<a id="chain-order"></a>

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

**Last-wins / override:** `bind()` áp dụng **slot-aware last-wins ở registration-time**. Cùng slot (`default`, cùng `whenNamed`, cùng `whenTagged`) thì binding mới thay binding cũ; slot khác thì append để phục vụ `resolveAll`. Xem [section 5.10](#binding-examples) để biết định nghĩa chính xác.

**Eager commit:** `to*()` commit binding ngay lập tức vào registry — đúng **một** lần cho cả chain. Mọi thao tác đọc sau đó (`has`, `resolve*`, `validate`, `inspect`) đều thấy trạng thái mới nhất, kể cả khi chain bị bỏ dở giữa chừng.

**Async phải explicit:** `resolve()` trên async binding throw `AsyncResolutionError` với message rõ ràng. Không silently return `Promise`.

**Lifecycle là first-class:** `onActivation` và `onDeactivation` trên từng binding — học từ InversifyJS v8 — nhưng type-safe hơn. Container cũng có container-level hooks áp dụng cho tất cả binding của một token.

**Singleton async creation là serialized:** Concurrent `resolveAsync` cho cùng một singleton token share cùng in-flight Promise — factory chỉ chạy một lần, `onActivation` chỉ chạy một lần. Xem [section 6.2](#resolution).

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

<a id="lifecycle-handlers"></a>

### 3.4 `ActivationHandler` và `DeactivationHandler`

**Activation handler** nhận resolution context và instance, chạy sau `@postConstruct()` và trước khi instance được cache vào scope. Tại thời điểm nó chạy, instance đã qua `new` đầy đủ, gồm cả các accessor initializer. Nó **phải** trả về một instance — chính nó, hoặc một Proxy bọc quanh. Trả về `Promise` thì lần resolve phải là `resolveAsync()`.

**Deactivation handler** nhận instance, chạy khi instance bị đẩy khỏi scope. Giá trị trả về bị bỏ qua.

> **Hình dạng chính xác:** `src/core/types.ts` — `ActivationHandler`, `DeactivationHandler`.

> **`DeactivationHandler` scope restriction:** `onDeactivation` chỉ được gọi cho `singleton` (khi container bị dispose hoặc binding bị unbind) và `toConstantValue` (treat as singleton). `transient` không có deactivation — mỗi instance là orphan sau khi trao cho caller. `scoped` không có deactivation — child container chỉ clear cache, không notify instance.

> **`toConstantValue` deactivate kể cả khi chưa từng resolve:** một singleton chỉ tồn tại sau lần resolve đầu, nên không resolve thì không có gì để deactivate. Constant thì ngược lại — giá trị do caller đưa vào tại thời điểm bind, nên nó tồn tại ngay từ đó. Hook được gọi tại `dispose()` / `unbind()` bất kể có ai resolve hay không; nếu đã resolve qua `onActivation` thì hook nhận giá trị **sau activation**, không phải giá trị gốc.

<a id="resolve-options"></a>

### 3.5 `ResolveOptions`

Hint truyền vào một lần resolve có ba trường, đều tuỳ chọn:

- **`name`** — khớp binding có `whenNamed(name)`.
- **`tags`** — mảng criterion, hiểu theo nghĩa **bộ lọc superset**: khớp binding mà _mọi_ tag nó khai báo đều nằm trong mảng này, chứ không phải "binding phải có đủ các tag này". Luật đầy đủ ở [section 5.11](#slot-matching).
- **`tag`** — viết tắt cho đúng một criterion, tương đương một phần tử của `tags`. Nhiều criterion thì phải dùng `tags`; `InjectOptions` nhận cả hai và gấp `tag` vào `tags`, nên `InjectionDescriptor` chỉ bao giờ mang một cách viết.

> **Hình dạng chính xác:** `src/core/types.ts` — `ResolveOptions`.

**Criterion được mint bởi `TagKey.of()`, và chỉ bởi nó — normative.** Một tag key khai báo bằng
`tag<Value>(name)`; `key.of(value)` trả về một `BindingTag` **interned**: cùng một value luôn cho
**cùng một object**. `BindingTag` được brand nên không thể dựng bằng tay.

```ts
const Region = tag<"eu" | "us">("region");
container.bind(Storage).to(S3).whenTagged(Region.of("eu"));
container.resolve(Storage, { tag: Region.of("eu") });
```

**Tag value comparison là `Object.is` — normative, kể cả trên fast-path.** Interning là _cách_
implement luật đó: vì mỗi value có đúng một criterion, so sánh criterion bằng **identity** cho kết quả
giống `Object.is` trên value. Hệ quả cho implementer: một index keyed theo **criterion** là exact và
không cần kiểm lại. Trước đây index keyed theo _value_ trả lời bằng **SameValueZero**, coi `-0` và `+0`
cùng khoá — trái `Object.is` ([section 5.11](#slot-matching), [section 8](#8-advanced-constraints)) — và fast-path
phải kiểm lại bằng matcher.
Intern cache phải tách `-0` khỏi `+0` để giữ luật này. `NaN` không bị ảnh hưởng: cả hai quy tắc coi
`NaN` bằng chính nó, nên nó gấp về một criterion.

**Key set của slot và của request là một bitmask — không normative, nhưng luật subset thì có.** Một
slot chỉ match khi request mang **mọi** key slot khai báo ([section 5.11](#slot-matching)). Implementation OR các key
thành một word và reject bằng `(requestMask & slotMask) !== slotMask` trước khi đọc criterion nào.
Bit wrap sau mỗi 32 key, nên hai key có thể chung bit: đó là **false positive** mà identity loại bỏ
sau đó, không bao giờ là false negative.

**Cho cả `tag` và `tags` cùng lúc (normative):** request mang **hợp** của hai nguồn — tương đương `tags: [tag, ...tags]`, và `InjectOptions` gấp đúng thành hình đó. Một request như vậy hỏi từ hai tag trở lên nên không dùng được single-tag index; nó đi đường selection đầy đủ.

### 3.6 `ResolutionContext`

`ctx` trong `toDynamic` / `toDynamicAsync` — không phải container đầy đủ, chỉ expose resolve trong ngữ cảnh hiện tại:

`ctx` là thứ một dynamic factory nhận được. Nó **không** phải container đầy đủ — chỉ mở ra đúng khả năng resolve trong ngữ cảnh hiện tại: `resolve`, `resolveAsync`, `resolveOptional`, `resolveOptionalAsync`, `resolveAll`, `resolveAllAsync`, mỗi phương thức nhận token cùng một hint tuỳ chọn. `resolveAll` throw `AsyncResolutionError` nếu bất kỳ binding khớp nào là async, và trả `[]` khi không có binding nào khớp.

Ngoài ra nó có `graph` mang `ConstraintContext` — ngữ cảnh dependency graph dùng trong predicate của `when()`. Resolve thông thường không cần tới.

> **Hình dạng chính xác:** `src/core/types.ts` — `ResolutionContext`.

### 3.7 `ConstraintContext`

`ConstraintContext` mô tả vị trí hiện tại trong một lần resolve, gồm năm phần:

- **`resolutionPath`** — mảng tên token trên đường resolve hiện tại, readonly.
- **`resolutionStack`** — các `ResolutionFrame` đầy đủ trên chuỗi construction. Khác `resolutionPath` vốn chỉ là nhãn chuỗi, stack mang đủ metadata để phát hiện captive dependency.
- **`parent`** — frame ngay phía trên, `undefined` ở root.
- **`ancestors`** — tất cả frame nằm trên `parent`.
- **`currentResolveOptions`** — hint truyền vào lần resolve hiện tại, `undefined` nếu không có.

Một **`ResolutionFrame`** gồm: `tokenName` (để hiển thị trong error message), `scope`, `bindingId`, `kind`, và **`slot`** của binding được match cho frame đó. Slot có hai phần: `name` (`undefined` nếu binding không khai báo `whenNamed()`) và `tags` (`[]` nếu không khai báo `whenTagged()`). Điểm quan trọng: slot phản ánh **constraint đăng ký lúc bind**, không phải hint truyền vào lúc resolve — advanced constraints ở [section 8](#8-advanced-constraints) đọc chính trường này.

**`BindingKind`** là một trong bảy giá trị: `class`, `dynamic`, `dynamic-async`, `resolved`, `resolved-async`, `constant`, `alias`.

> **Hình dạng chính xác:** `src/core/types.ts` — `ConstraintContext`, `ResolutionFrame`, `BindingKind`.

**`resolutionStack` — thứ tự và quan hệ với `parent`/`ancestors` (normative):**

`resolutionStack` là snapshot readonly của toàn bộ resolution path **phía trên** token hiện tại — không bao gồm token đang được resolve. Thứ tự: từ root (index 0) đến direct parent (index cuối). Các trường `parent` và `ancestors` là computed views trên cùng dữ liệu:

```ts
// Quan hệ (normative — implementer phải đảm bảo nhất quán):
ctx.parent === ctx.resolutionStack.at(-1); // frame gần nhất, undefined nếu root
ctx.ancestors === ctx.resolutionStack.slice(0, -1); // tất cả trừ frame gần nhất
```

Ví dụ: resolve chain `App → Database → Logger` (root `App`, direct parent `Database`, đang resolve `Logger`):

```
resolutionStack = [App_frame, Database_frame]  // index 0 = root
parent               = Database_frame               // resolutionStack.at(-1)
ancestors            = [App_frame]                  // resolutionStack.slice(0, -1)
```

Khi resolve `App` ở root (không có gì inject `App`):

```
resolutionStack = []
parent               = undefined
ancestors            = []
```

> **`resolutionPath` vs `resolutionStack`:** `resolutionPath` là mảng `tokenName` string, đủ để hiển thị trong error message (`"App → Database → Logger"`). `resolutionStack` chứa `ResolutionFrame` đầy đủ (scope, bindingId, slot) — dùng cho advanced constraints và validate. Implementer phải maintain hai cấu trúc song song trong resolver: string path (rẻ hơn) và frame stack (đầy đủ hơn).

### 3.8 `TokenValue`

Helper type để extract `Value` từ `Token<Value>` hoặc `Constructor<Value>`:

```ts
type TokenValue<Type> = Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
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
| `.toConstantValue(value)`              | `.toConstantValue(value)`         | Constant — config, primitive         |
| `.toDynamic(ctx => ...)`               | `.toDynamicValue(ctx => ...)`     | Factory sync với `ctx.resolve()`     |
| `.toDynamicAsync(ctx => Promise)`      | (dùng `toDynamicValue` async)     | I/O khi khởi tạo                     |
| `.toResolved(factory, deps)`           | `.toResolvedValue(factory, deps)` | Explicit deps sync, không cần `ctx`  |
| `.toResolvedAsync(asyncFactory, deps)` | —                                 | Explicit deps async, không cần `ctx` |
| `.toAlias(otherToken)`                 | `.toService(otherId)`             | Alias token này → token khác         |

> **`toDynamic` vs `toDynamicAsync`:** InversifyJS v8 dùng `toDynamicValue` cho cả sync lẫn async factory — compiler không enforce. Thư viện này tách hai method rõ ràng: `toDynamic` buộc factory trả `Value` (không `Promise`), `toDynamicAsync` buộc factory trả `Promise<Value>`. Compiler enforce `resolveAsync()` khi cần.

> **`toResolved` vs `toResolvedAsync`:** `toResolved` là shorthand của `toDynamic` khi deps đơn giản và factory sync. `toResolvedAsync` là shorthand của `toDynamicAsync` khi deps đơn giản nhưng factory cần async (ví dụ: khởi tạo cache từ config). Cả hai đều là syntactic sugar — không có capability khác biệt so với `toDynamic`/`toDynamicAsync`.

> **`toAlias` chain:** Alias có thể trỏ vào alias khác — container tự resolve chain đến binding cuối cùng. Cycle (`A → B → A`) bị detect và throw `CircularDependencyError`. `toAlias` trả về `AliasBindingBuilder` để hỗ trợ constraint và `.id()` — builder duy nhất không mang type parameter, vì alias không tự tạo giá trị nào.

<a id="scope"></a>

### 5.2 Scope

```ts
.singleton()  // ←→ .inSingletonScope()  — tạo 1 lần, dùng mãi
.transient()  // ←→ .inTransientScope()  — mỗi resolve = new (default nếu không khai báo)
.scoped()     // ←→ .inRequestScope()   — 1 lần mỗi child container
```

Scope **luôn** đứng sau `when*` trong chain ([xem 2.4](#chain-order)). Default khi không khai báo scope là `transient` — nhưng lifecycle hooks `on*()` **chỉ available sau khi gọi scope()** tường minh. Nếu không cần lifecycle hooks, có thể bỏ qua `scope()` và nhận default transient.

**Scope validation matrix — captive dependency:**

| Consumer ╲ Dependency | `singleton` | `scoped`     | `transient`  |
| --------------------- | ----------- | ------------ | ------------ |
| `singleton`           | ✅ OK       | ❌ Violation | ❌ Violation |
| `scoped`              | ✅ OK       | ✅ OK        | ✅ OK        |
| `transient`           | ✅ OK       | ✅ OK        | ✅ OK        |

`container.validate()` duyệt toàn bộ dependency graph và throw `ScopeViolationError` cho bất kỳ vi phạm nào. Xem [section 6.9](#validate) để biết giới hạn của `validate()`.

> **`scoped` trong parent container:** `scoped` binding chỉ singleton trong phạm vi child container gọi resolve đầu tiên. Resolve `scoped` trực tiếp từ parent container (không có child scope context) throw `MissingScopeContextError`.

> **Singleton cache ownership:** Singleton được cache tại container nơi binding được định nghĩa — không phải container gọi resolve. Khi `child.resolve(SomeToken)` leo lên parent và tìm thấy singleton binding ở parent, instance được cache ở **parent**. `child.dispose()` chỉ deactivate singleton được định nghĩa tại child.

### 5.3 `toConstantValue` — semantics

`toConstantValue(value)` tạo binding luôn trả về cùng một value. Treat as singleton — không có scope choice. Lifecycle:

- `onActivation` có thể được đăng ký và **sẽ được gọi** lần đầu tiên value được resolve. Kết quả sau activation được cache; activation không chạy lại ở lần resolve tiếp theo.
- Nếu `onActivation` trả `Promise`, resolve phải dùng `resolveAsync()`.
- `onDeactivation` có thể được đăng ký và sẽ được gọi khi binding bị unbind hoặc container dispose.
- Value gốc được coi là immutable — `onActivation` có thể return một Proxy wrap. Sau activation, giá trị được cache là kết quả từ activation (không phải value gốc).

<a id="constraints"></a>

### 5.4 Constraint — `when*`

`when*` đứng ngay sau `to*()`, trước scope. Mỗi binding có thể có một hoặc nhiều constraint kết hợp.

```ts
// Named binding
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding — criterion chỉ mint được từ một tag key, không dựng tay
const Fuel = tag<"petrol" | "electric">("fuel");
const Size = tag<"v8" | "v6">("size");

container.bind(Engine).to(PetrolEngine).whenTagged(Fuel.of("petrol"));
container.bind(Engine).to(ElectricEngine).whenTagged(Fuel.of("electric"));

// Nhiều tag trên cùng binding — chuyên biệt hoá của binding petrol ở trên. Hint
// {fuel:petrol} lấy PetrolEngine; hint {fuel:petrol, size:v8} lấy TurboV8 vì nó khai
// báo nhiều tag hơn, tức cụ thể hơn.
container.bind(Engine).to(TurboV8).whenTagged(Fuel.of("petrol")).whenTagged(Size.of("v8"));

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

> **`whenTagged` nhận criterion, không nhận cặp rời:** criterion chỉ mint được bằng `TagKey.of()`, nên key phải khai báo trước bằng `tag<Value>(name)` — đó là thứ khiến so sánh bằng identity đủ để thay `Object.is` ([section 3.5](#resolve-options)). Tên key vẫn là `string`, nên dùng namespace prefix để tránh collision: `tag("mylib:fuel")`, `tag("@scope/pkg:env")`.

> **`whenDefault()` tường minh vs không khai báo constraint:** Binding không có bất kỳ `when*` nào cũng match default slot. `whenDefault()` hữu ích khi muốn document rõ ràng ý định hoặc kết hợp với custom `when()`.

**`when()` predicate — quy tắc (normative):**

- Predicate được gọi mỗi lần resolve cần chọn candidate (không cached).
- Predicate **phải pure và deterministic** — không có side effects, không gọi I/O. Vi phạm quy tắc này là undefined behavior, có thể gây infinite loop hoặc incorrect caching.
- Predicate **không được** gọi `ctx.resolve*()` — sẽ gây circular resolution.
- **Performance note:** Với `transient` binding trên hot path (mỗi request đều resolve), `when()` predicate phức tạp bị gọi rất nhiều lần. Ưu tiên `whenNamed` / `whenTagged` (O(1) lookup) cho hot path; dùng `when()` custom predicate chỉ cho configuration-time binding.

**Resolve bằng hint:**

```ts
const Env = tag<"production" | "staging">("env");

// Named
container.resolve(Logger, { name: "file" });

// Một tag — `tag` là shorthand cho đúng một criterion
container.resolve(Engine, { tag: Fuel.of("electric") });

// Nhiều tag — request phải nêu mọi tag mà binding khai báo
container.resolve(Engine, { tags: [Fuel.of("petrol"), Size.of("v8")] });

// Kết hợp name + tag
container.resolve(Logger, { name: "audit", tag: Env.of("production") });
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
container.bind(AbstractAuditLogger).toAlias(Logger).whenNamed("audit");
// Binding này chỉ được chọn khi resolve AbstractAuditLogger với hint { name: "audit" }
// Khi chọn xong, hint { name: "audit" } được forward đến Logger resolution
const logger = container.resolve(AbstractAuditLogger, { name: "audit" });
// → Logger binding khớp hint { name: "audit" } (nếu có) hoặc default
```

> **Alias không có scope riêng:** Scope được quyết định bởi binding đích. Alias chỉ là pointer — không tự cache instance.

### 5.6 Builder type interfaces

Mỗi bước trong chain trả về một builder khác nhau, và chính tập phương thức của builder đó là thứ cưỡng chế thứ tự ở [section 2.4](#chain-order):

| Builder trả về từ   | Constraint | Scope | `onActivation` | `onDeactivation` | `id()` |
| ------------------- | :--------: | :---: | :------------: | :--------------: | :----: |
| `bind(token)`       |     —      |   —   |       —        |        —         |   —    |
| `to*()`             |     ✅     |  ✅   |       —        |        —         |   ✅   |
| `toConstantValue()` |     ✅     |   —   |       ✅       |        ✅        |   ✅   |
| `toAlias()`         |     ✅     |   —   |       —        |        —         |   ✅   |
| `singleton()`       |     —      |   —   |       ✅       |        ✅        |   ✅   |
| `transient()`       |     —      |   —   |       ✅       |        —         |   ✅   |
| `scoped()`          |     —      |   —   |       ✅       |        —         |   ✅   |

Builder từ `bind(token)` **chỉ** có nhóm `to*`, không gì khác. Bốn phương thức constraint (`when`, `whenNamed`, `whenTagged`, `whenDefault`) cộng `id()` là phần chung, tách thành một interface `SlotConstrainedBuilder` mà ba builder cụ thể cùng kế thừa — nó không xuất hiện trong chain, không lời gọi nào trả về nó. Builder từ `toConstantValue()` không có bước scope vì binding hằng luôn là singleton; gọi một lifecycle hook trên nó chuyển sang builder chỉ còn lifecycle và `id()`, tức trạng thái một chiều: gọi hook đồng nghĩa với khoá phần constraint lại. Builder từ `toAlias()` là builder duy nhất **không mang type parameter** — alias không tự tạo giá trị nào nên chẳng có kiểu gì để suy. `transient` và `scoped` không có `onDeactivation` vì hai scope đó không có deactivation ([section 3.4](#lifecycle-handlers)).

> **Hình dạng chính xác:** `src/core/binding.ts` — `BindToBuilder`, `SlotConstrainedBuilder`, `BindingBuilder`, `ConstantBindingBuilder`, `AliasBindingBuilder`, `SingletonBindingBuilder`, `TransientBindingBuilder`, `ScopedBindingBuilder`, `SingletonLifecycleBuilder`.

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
container.bind(Cache).toResolvedAsync(async (config) => Cache.connect(config.redisUrl), [Config] as const);
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

> **`.id()` và chain order:** `.id()` có thể gọi ở bất kỳ bước nào sau `to*()`. Builder vẫn có thể tiếp tục chain sau `.id()` — `.id()` không phải terminal. Id **ổn định trong suốt chain**: giá trị lấy sớm vẫn trỏ đúng binding sau khi chain được refine.

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
Construction (trong một lần `new`, thường bọc `runWithContainer` khi class có @inject accessor):
  1. Thân constructor
  2. Accessor initializers — property injection qua @inject accessor (`context.addInitializer`), cùng call frame với `new`, trước khi `new` return

Activation (sau khi instance đã được tạo):
  3. @postConstruct() — LifecycleManager (sync/async tùy resolve path)
  4. per-binding onActivation()
  5. container-level onActivation()

Deactivation (ngược):
  1. container-level onDeactivation()
  2. per-binding onDeactivation()
  3. @preDestroy() — tất cả method theo thứ tự khai báo
```

> **Construction và hooks:** `context.addInitializer` chạy ngay sau thân constructor, trước khi biểu thức `new` trả về. Sau đó resolver gọi `@postConstruct()` rồi `onActivation`. Tóm lại: constructor → accessor initializers (`@inject accessor`) → `@postConstruct()` → `onActivation`. `@postConstruct()` luôn chạy sau khi các field accessor đã được inject.

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

<a id="binding-examples"></a>

### 5.10 Ví dụ đầy đủ

```ts
// Class binding
container.bind(Logger).to(ConsoleLogger).singleton();

// Self binding
container.bind(ConsoleLogger).toSelf().singleton();

// Constant value
container.bind(Config).toConstantValue({
  port: 3000,
  env: "production",
  dbUrl: "postgres://localhost/app",
  redisUrl: "redis://localhost",
});

// Named bindings
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding
container.bind(Engine).to(PetrolEngine).whenTagged(Fuel.of("petrol"));
container.bind(Engine).to(ElectricEngine).whenTagged(Fuel.of("electric"));
container.bind(Engine).to(TurboV8).whenTagged(Fuel.of("petrol")).whenTagged(Size.of("v8"));

// Dynamic factory sync
container
  .bind(App)
  .toDynamic((ctx) => new App(ctx.resolve(Logger), ctx.resolve(Config)))
  .singleton();

// Async factory
container
  .bind(Database)
  .toDynamicAsync(async (ctx) => {
    const config = ctx.resolve(Config);
    const db = new PostgresDatabase(config.dbUrl);
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
container.bind(AbstractAuditLogger).toAlias(Logger).whenNamed("audit");
```

<a id="slot-matching"></a>

### 5.11 Slot và last-wins — định nghĩa chính xác

**Từ vựng (normative):**

**Binding slot** là khóa định danh duy nhất một slot trong registry, tính từ constraint của binding:

```
BindingSlot = {
  name: string | undefined,      // từ whenNamed() — undefined nếu không có
  tags: ReadonlySet<BindingTag>, // từ TẤT CẢ whenTagged() trên binding này
}
```

Hai binding slot **bằng nhau** khi: `name` bằng nhau (hoặc cả hai `undefined`) **và** `tags` bằng nhau theo identity của từng criterion (thứ tự không quan trọng). Vì criterion được intern ([section 3.5](#resolve-options)), identity ở đây cho đúng kết quả của `Object.is` trên `[key, value]`. Slot `default` là `{ name: undefined, tags: new Set() }`.

**Predicate-only `when()`:** Binding chỉ có `.when(predicate)` (không kèm `whenNamed`/`whenTagged`) **không tham gia slot last-wins** — nhiều binding cùng token có thể tồn tại song song với binding slot giống nhau. Nếu sau lọc runtime vẫn còn ≥ 2 candidates, `resolve`/`resolveAsync` throw `AmbiguousBindingError` (không phải `InternalError` — đây là lỗi của người dùng, không phải lỗi internal).

**Candidate:** Binding vượt qua lọc `ResolveOptions` (name/tags) và tất cả `when(ctx)` predicates.

**Lọc `ResolveOptions` → slot (normative).** `name` và `tags` là hai luật độc lập, và chúng **không cùng dạng**:

- **`name` so sánh bằng nhau, kể cả sự vắng mặt.** Slot có name chỉ match request yêu cầu đúng name đó; slot không name không match request có name. Đây **không** phải quan hệ subset.
- **`tags` là superset filter: mọi tag slot khai báo phải nằm trong tập tag của request.** Thêm tag vào request làm nó match **nhiều** hơn, không ít hơn.
- **Slot không tag không match request có tag** — một request có tag không bao giờ rơi về default slot.
- Tập tag của request là **hợp** của `tag` và `tags` ([section 3.5](#resolve-options)); `tags: []` tính là không có criterion.
- Tag value so sánh bằng `Object.is`; predicate đánh giá **sau** slot match.

| Request                         | Slot `{}` | Slot `{fuel:petrol}` | Slot `{fuel:petrol, size:v8}` |
| ------------------------------- | --------- | -------------------- | ----------------------------- |
| `{tags:[fuel:petrol]}`          | ✗         | ✓                    | ✗                             |
| `{tags:[fuel:petrol, size:v8]}` | ✗         | ✓                    | ✓                             |

**Không criterion — `resolve` và `resolveAll` khác nhau (normative):** khi `ResolveOptions` vắng hoặc không mang criterion nào, `resolve`/`resolveOptional` coi đó là yêu cầu **đúng default slot**, nên một binding chỉ có named/tagged slot **không** được chọn. `resolveAll` thì lấy **mọi** binding của token, kể cả named/tagged.

**Bảng tình huống:**

| #   | Tình huống                                                          | Kết quả slot          | `resolve` không hint                                                      | `resolveAll` / hint     |
| --- | ------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------- | ----------------------- |
| 1   | `bind(T).to*(A)`                                                    | Default               | A                                                                         | `[A]`                   |
| 2   | `bind(T).to*(A)` rồi `bind(T).to*(B)`                               | Default last-wins     | B                                                                         | `[B]`                   |
| 3   | `to*(A).whenNamed("a")` rồi `to*(B).whenNamed("a")`                 | Named "a" last-wins   | `NoMatchingBindingError` (không có default)                               | Hint `{name:"a"}` → B   |
| 4   | `to*(A).whenNamed("a")` và `to*(B).whenNamed("b")`                  | Named "a" + Named "b" | `NoMatchingBindingError`                                                  | `resolveAll` → `[A, B]` |
| 5   | `to*(A)` và `to*(B).whenNamed("x")`                                 | Default + Named "x"   | A                                                                         | `resolveAll` → `[A, B]` |
| 6   | `rebind(T).to*(C)`                                                  | Explicit reset        | C                                                                         | `[C]`                   |
| 7   | Tags `{fuel:petrol, size:v8}.to*(A)` rồi cùng tags `.to*(B)`        | Tag-set last-wins     | Hint `{tags:[...]}` → B                                                   | Hint → B                |
| 8   | Tags `{fuel:petrol}.to*(A)` và tags `{fuel:petrol, size:v8}.to*(B)` | Hai tag-set khác nhau | Hint `{tags:[fuel]}` → A; hint `{tags:[fuel, size]}` → **B** (cụ thể hơn) | `resolveAll` → `[A, B]` |

**Row 3 — `resolve` không hint:** Throw `NoMatchingBindingError` (không phải `TokenNotBoundError`) vì token có binding nhưng không có slot nào match hint trống. Message bao gồm danh sách các slot có sẵn: `"Available slots: [name:a, name:b]"`.

**Row 8 — hint càng chi tiết thì càng nhiều binding thoả, nên phải có luật cụ-thể-hơn.** Tag của binding là **điều kiện của nó**, không phải bộ lọc phải trùng khít. Hint `{fuel:petrol}` loại B vì B còn đòi `size`; hint `{fuel:petrol, size:v8}` thoả **cả** A lẫn B, vì điều kiện duy nhất của A cũng được nêu. Đây là mô hình điều phối (như routing, media query, overload resolution), và mọi mô hình điều phối đều cần một luật phá thế cân bằng.

**Luật cụ-thể-hơn cho `resolve` / `resolveOptional` (normative)** — xét theo thứ tự, dừng ở bước đầu tiên chọn được đúng một candidate:

1. **Predicate:** đúng một candidate mang `when()` predicate thì candidate đó thắng. Hai trở lên là nhập nhằng thật.
2. **Số lượng tag:** candidate khai báo **nhiều tag hơn mọi candidate khác** thì thắng — nó khớp nhiều phần hơn của điều được hỏi.
3. Không bước nào chọn được thì throw `AmbiguousBindingError`.

Nên row 8 giải quyết được cả hai chiều: `{fuel}` → A, `{fuel, size}` → B. Bằng số tag cân nhau thì vẫn nhập nhằng — `{fuel:petrol}.to*(A)` và `{size:v8}.to*(B)` với hint đủ cả hai tag thì không cái nào cụ thể hơn.

`resolveAll` **không** áp luật này: nó trả về mọi candidate khớp, specificity chỉ dùng khi phải chọn một.

> **`has(token)` và slot semantics:** `container.has(token)` trả `true` nếu token có **bất kỳ binding nào** (kể cả chỉ named/tagged slots, không có default). `container.resolve(token)` không hint có thể throw `NoMatchingBindingError` ngay cả khi `has(token)` là `true`. Xem [section 6.10](#introspection) để biết cách dùng đúng `has` + `hasOwn`.

### 5.12 `Binding` discriminated union — internal data model

`Binding<Value>` là union type đại diện cho một binding đã được commit vào registry. Implementer phải định nghĩa đây trong `binding.ts`. Field là `readonly` với người dùng thư viện. Nội bộ, một fluent chain **được phép refine tại chỗ** đúng những field mà không index nào của registry phụ thuộc (`scope`, `onActivation`, `onDeactivation`) trên chính object đã đăng ký; đổi `slot`/`predicate` thì phải re-index nên vẫn dựng object mới. Xem `ARCHITECTURE.md`.

**`BindingSlot` — dùng cho slot-aware last-wins và resolution matching:**

`BindingSlot` mang `name` (`undefined` = default slot, tức không có `whenNamed`) và `tags` (`[]` = không có `whenTagged`; thứ tự không ảnh hưởng equality).

Hai `BindingSlot` bằng nhau khi `name` equal (hoặc cả hai `undefined`) **và** `tags` bằng nhau theo identity của từng criterion (thứ tự không quan trọng) — tương đương `Object.is` trên `[key, value]` nhờ interning. Implementer nên cung cấp helper `bindingSlotEquals(left: BindingSlot, right: BindingSlot): boolean`.

**Fields chung cho tất cả binding (trừ ghi chú riêng):**

Mọi binding đã commit đều mang: `id`, `token`, `slot`, và một `predicate` tuỳ chọn đến từ `.when()`. Lưu ý `whenNamed`/`whenTagged` **không** đi vào predicate — chúng đi vào slot. Khi một binding khai báo cả slot lẫn predicate, cả hai đều phải qua: slot match trước với chi phí hằng số, predicate kiểm sau lúc chạy.

**7 binding kinds:**

Bảy kind, mỗi kind thêm trường riêng lên phần chung ở trên:

| `kind`           | Từ                        | Trường riêng                                                        |
| ---------------- | ------------------------- | ------------------------------------------------------------------- |
| `class`          | `.to(Class)`, `.toSelf()` | `target` (constructor), `scope`, `onActivation?`, `onDeactivation?` |
| `dynamic`        | `.toDynamic()`            | `factory` sync, `scope`, hai hook                                   |
| `dynamic-async`  | `.toDynamicAsync()`       | `factory` trả `Promise`, `scope`, hai hook                          |
| `resolved`       | `.toResolved()`           | `factory` sync, `deps` đã normalize, `scope`, hai hook              |
| `resolved-async` | `.toResolvedAsync()`      | `factory` trả `Promise`, `deps`, `scope`, hai hook                  |
| `constant`       | `.toConstantValue()`      | `value`; `scope` luôn là `"singleton"`, không có lựa chọn           |
| `alias`          | `.toAlias()`              | `target` token. Không `scope`, không lifecycle — chỉ là con trỏ     |

`onDeactivation` chỉ có nghĩa khi `scope` là `"singleton"`; điều đó được cưỡng chế bởi kiểu của builder chứ không phải runtime. Với `constant`, `onActivation` chạy lần đầu tiên value được resolve và kết quả của nó mới là thứ được cache.

> **Hình dạng chính xác:** `src/core/binding.ts` — `Binding` và bảy interface thành viên.

**Normalization khi commit (normative):**

- `toSelf()` → `ClassBinding` với `target === token` (token phải là `Constructor<Value>`).
- Deps array của `toResolved`/`toResolvedAsync`: mỗi element là `Token | Constructor | InjectionDescriptor`. Tại commit-time, plain `Token`/`Constructor` được normalize thành `InjectionDescriptor` với `{ token, optional: false, multi: false }`. `deps` trong `ResolvedBinding`/`ResolvedAsyncBinding` luôn là `readonly InjectionDescriptor[]` — không bao giờ là raw token.
- `BindingIdentifier` được generate **một lần cho mỗi fluent chain**, duy nhất trong toàn bộ container hierarchy (không phải chỉ trong một container). Recommend dùng `crypto.randomUUID()` hoặc monotonic counter. Refine sau đó (`.singleton()`, `.whenNamed()`, …) **không** cấp id mới — id lấy từ `.id()` ở bất kỳ bước nào của chain đều hợp lệ cho tới khi chain kết thúc.

**Truy cập scope từ `AliasBinding` — tại resolve-time:**

`AliasBinding` không có field `scope`. Khi cần scope (ví dụ để build `ResolutionFrame`), resolver phải follow alias chain đến binding cuối cùng và lấy scope từ đó. Nếu chain kết thúc ở `AliasBinding` khác, tiếp tục follow. Nếu cycle → `CircularDependencyError`.

---

## 6. Container API

<a id="container-create"></a>

### 6.1 Tạo container

```ts
import { Container } from "@codefast/di";

// Static factory — không dùng new Container()
const container = Container.create();

// Construction-time options — thứ container phải biết trước khi nó tồn tại
const container = Container.create({ metadataReader: customReader });

// Từ modules — load tất cả modules rồi trả về container
const container = Container.fromModules(AppModule, DatabaseModule);
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);
```

`fromModules`/`fromModulesAsync` nhận modules dạng variadic nên không có chỗ cho options. Cần cả hai thì dùng `Container.create(options)` rồi `load(...)`/`loadAsync(...)` — đúng những gì hai factory kia làm.

<a id="resolution"></a>

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
const petrolEngine = container.resolve(Engine, { tag: Fuel.of("petrol") });
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
const [a, b] = await Promise.all([container.resolveAsync(Database), container.resolveAsync(Database)]);
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

**`rebind` và async deactivation (normative):**

`rebind(token)` về bản chất là unbind-then-bind nguyên tử. Deactivation của singleton cũ tuân theo cùng quy tắc với `unbind`:

- Nếu binding cũ **không có** `onDeactivation` async (hoặc không có `onDeactivation` nào): `rebind()` sync là an toàn.
- Nếu binding cũ **có** `onDeactivation` async: `rebind()` sync throw `AsyncDeactivationError` — cùng behavior với `unbind()` sync.

Vì spec không có `rebindAsync()` (xem [section 15.4](#not-adopted-from-v8)), workaround bắt buộc là:

```ts
// Khi binding cũ có async onDeactivation:
await container.unbindAsync(Logger); // deactivate singleton cũ
container.bind(Logger).to(FileLogger).singleton(); // tạo binding mới
```

> **Lý do không có `rebindAsync()`:** `rebind` là test/reconfiguration utility — luôn xảy ra khi không có traffic. Nếu binding có async deactivation, tách thành hai bước explicit (`unbindAsync` + `bind`) là rõ ràng hơn về intent.

<a id="module-management"></a>

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
  logger.setCorrelationId?.(ctx.graph.currentResolveOptions?.name ?? "default");
  return logger;
});

container.onDeactivation(Database, async (db) => {
  await db.flushMetrics();
});
```

> **Child container không kế thừa container-level hooks:** Hook đăng ký trên container nào thì chỉ fire cho binding của container đó. Khi child resolve token từ parent (leo lên parent chain), parent's hooks fire vì binding thuộc parent.

> **Thứ tự:** accessor initializers (trong `new`) → `@postConstruct()` → per-binding `onActivation()` → container-level `onActivation()`. Deactivation theo thứ tự ngược: container-level `onDeactivation()` → per-binding `onDeactivation()` → `@preDestroy()`.

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

Container phơi ra một thuộc tính readonly `isDisposed`.

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

<a id="validate"></a>

### 6.9 `validate` — detect captive dependency

```ts
container.validate();
```

Duyệt dependency graph và throw `ScopeViolationError` cho vi phạm theo scope matrix ở [section 5.2](#scope).

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
| `toConstantValue(value)`         | ✅ Không có deps — luôn OK             |

**`validate()` và alias chain:** Khi trace alias (`toAlias(target)`), `validate()` follow chain đến binding cuối cùng. Nếu consumer `singleton` alias sang target `scoped`, đây là scope violation. `validate()` check transitively — không chỉ check direct dependency.

`toDynamic` và `toDynamicAsync` là **opaque** với `validate()` — không báo false positive, không báo false negative. Scope violation trong dynamic factory chỉ được detect tại runtime.

Gọi `validate()` sau khi load tất cả module, trước khi serve request đầu tiên.

<a id="introspection"></a>

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

`ContainerSnapshot` mang: `ownBindings` (mọi binding tại container này, không gồm parent), `cachedSingletonCount` (số singleton đang cache tại đây, cũng không gồm parent), `hasParent`, và `isDisposed`.

Mỗi `BindingSnapshot` mang: `tokenName`, `kind`, `scope`, `slot`, và `id`.

> **Hình dạng chính xác:** `src/introspection/inspector.ts` — `ContainerSnapshot`, `BindingSnapshot`.

**`ContainerGraphJson` interface:**

`ContainerGraphJson` gồm ba phần: `nodes`, `edges`, và `includesParent` (có gộp binding của parent hay không — phụ thuộc `GraphOptions`).

Mỗi **`GraphNode`** mang `id` (chính là `BindingIdentifier`, hoặc `"unbound:<tokenKey>"` cho node placeholder), `tokenName`, `tokenKey` (định danh của bản thân token — hai token trùng tên vẫn khác key; ổn định trong cùng process), `kind` (hoặc `"unbound"`), `scope` (hoặc `"unbound"`), và `fromParent`.

Mỗi **`GraphEdge`** đi từ consumer (`from`) tới dependency (`to`), kèm `optional` và `slotName` (named slot mà edge trỏ tới, nếu binding khai báo). Trường `label` **chỉ để hiển thị** — hãy đọc `optional`/`slotName` thay vì parse chuỗi. Các dạng label: `"[0]"`, `"[1]"`, … cho dep theo index; `"name:file"` cho named dep; `"tag:fuel=petrol"` cho tagged dep; `"alias"` cho alias edge; và hậu tố `" optional"` khi dep là optional.

`GraphOptions` hiện có một trường: `includeParent`, mặc định `false`.

> **Hình dạng chính xác:** `src/introspection/dependency-graph.ts` — `ContainerGraphJson`, `GraphNode`, `GraphEdge`, `GraphOptions`.

**Những gì graph biểu diễn — và không biểu diễn:**

- **Optional dep chưa bind vẫn hiện**, dưới dạng node placeholder `kind`/`scope` = `"unbound"` với edge `optional: true`. Nhờ vậy "optional nhưng vắng mặt" khác được với "không phải dependency".
- **Required dep chưa bind bị bỏ qua** — đó là việc của `validate()`, không phải của graph.
- **`injectAll` fan-out đủ mọi binding** của token, mỗi edge mang `slotName` tương ứng.
- **Edge target lọc theo đúng luật slot của resolution** ([§6.9](#validate)): request không nêu tên sẽ không nối tới named binding mà nó vốn không resolve được.
- **Predicate (`when...`) không được đánh giá** — predicate cần ngữ cảnh resolve thật, nên graph giữ lại mọi candidate có predicate.
- **Với `includeParent: true`**, binding của container hiện tại che (shadow) binding cùng token ở parent, đúng như thứ tự resolve leo lên; edge từ child nối thẳng tới binding parent thoả mãn nó.

### 6.11 Container interface

Gom lại, một container phơi ra tám nhóm:

| Nhóm                | Thành viên                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Trạng thái          | `isDisposed`                                                                                          |
| Binding             | `bind`, `unbind`, `unbindAsync`, `unbindAll`, `unbindAllAsync`, `rebind`                              |
| Module              | `load`, `loadAsync`, `unload`, `unloadAsync`, `loadAutoRegistered`                                    |
| Hook tầng container | `onActivation`, `onDeactivation`                                                                      |
| Resolution          | `resolve`, `resolveAsync`, `resolveOptional`, `resolveOptionalAsync`, `resolveAll`, `resolveAllAsync` |
| Child               | `createChild`                                                                                         |
| Disposal            | `dispose`, `[Symbol.asyncDispose]`, `[Symbol.dispose]` (luôn throw)                                   |
| Khởi tạo & kiểm     | `initializeAsync`, `validate`                                                                         |
| Introspection       | `has`, `hasOwn`, `lookupBindings`, `inspect`, `generateDependencyGraph`                               |

Ở tầng tĩnh có ba: `create(options?)`, `fromModules(...)`, `fromModulesAsync(...)`. `ContainerOptions` hiện chỉ có `metadataReader` — mặc định là decorator reader, child kế thừa.

> **Hình dạng chính xác:** `src/container/container.ts` — `Container`, `ContainerOptions`, `ContainerStatic`.

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
@injectable([inject(Logger, { name: "console" }), inject(Engine, { tag: Fuel.of("electric") })])
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

Cả ba nhận token cùng một `InjectOptions` tuỳ chọn, và trả về `InjectionDescriptor`: `inject` cho dependency bắt buộc, `optional` trả `undefined` khi không có binding, `injectAll` gom mọi binding match thành mảng.

`InjectOptions` có ba trường: `name`, `tag` (viết tắt một criterion, gấp vào `tags` khi dựng descriptor — xem [section 3.5](#resolve-options)), và `tags`.

`InjectionDescriptor` mang: `token`, `optional`, `multi` (true khi tạo bởi `injectAll`), `name?`, `tags?`. Kèm theo là type guard `isInjectionDescriptor(value)`.

> **Hình dạng chính xác:** `src/injection/descriptor.ts` — `injectAll`, `optional`, `isInjectionDescriptor`, `InjectionDescriptor`, `InjectOptions`; `src/decorators/inject.ts` — `inject`.

**`InjectableDependency` — union type cho một phần tử trong deps array:**

```ts
/**
 * Một element hợp lệ trong deps array của @injectable().
 * - Token<Value>       → plain inject: resolve token, throw nếu không có binding
 * - Constructor<Value> → plain inject: resolve class, throw nếu không có binding
 * - InjectionDescriptor → decorated inject: inject(), optional(), injectAll()
 *                          Dùng khi cần named/tagged/optional/multi inject
 */
type InjectableDependency<Value = unknown> = Token<Value> | Constructor<Value> | InjectionDescriptor<Value>;
```

Tại metadata-read time, resolver normalize toàn bộ `InjectableDependency[]` thành `InjectionDescriptor[]` trước khi resolve. Rule normalize (normative):

- `Token<Value>` → `{ token, optional: false, multi: false, name: undefined, tags: undefined }`
- `Constructor<Value>` → `{ token, optional: false, multi: false, name: undefined, tags: undefined }`
- `InjectionDescriptor<Value>` → giữ nguyên

`InjectableDependency` được export từ `@codefast/di` (xem [section 11.1](#public-api)).

**`InjectableOptions` — options cho `@injectable()`:**

`InjectableOptions` có hai trường: `autoRegister` (registry để class tự đăng ký; bỏ trống thì không tự đăng ký — xem [section 7.7](#auto-registration)) và `scope` (scope khi tự đăng ký, bị bỏ qua nếu không có `autoRegister`, mặc định `"transient"`).

`InjectableOptions` được export từ `@codefast/di`.

**Signature đầy đủ của `@injectable()`:**

`injectable(deps?, options?)` trả về một class decorator; `deps` là `readonly InjectableDependency[]`, `options` là `InjectableOptions`.

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

<a id="metadata-reader"></a>

### 7.4 MetadataReader — port interface

Container không đọc `Symbol.metadata` trực tiếp — đọc qua port này để có thể swap trong test:

Cổng có ba phương thức:

- **`getConstructorMetadata(target)`** — mô tả dependency của constructor: một danh sách `ParamMetadata`, mỗi mục gồm `index`, `token`, `optional`, `multi`, `name?`, `tags?`.
- **`getLifecycleMetadata(target)`** — hai danh sách tên method: `postConstruct` và `preDestroy`. Thứ tự gọi theo thứ tự xuất hiện trong class (top-down).
- **`getAccessorMetadata(target)`** — **tuỳ chọn** — danh sách field `@inject accessor`, mỗi mục gồm `key` và `descriptor`. Reader bỏ phương thức này thì không class nào được mở container context, nên mọi accessor injection throw `MissingContainerContextError` ([§7.5](#accessor-injection)).

> **Hình dạng chính xác:** `src/metadata/metadata-types.ts` — `MetadataReader`, `ConstructorMetadata`, `ParamMetadata`, `LifecycleMetadata`.

**Cài reader của riêng mình — normative:**

Resolver được **trao** reader lúc nó được khởi tạo, tức trong constructor của container. Vì vậy nguồn duy nhất mà resolution chắc chắn đọc được là `ContainerOptions.metadataReader` ([§6.1](#container-create)):

```ts
import { Container } from "@codefast/di";

const container = Container.create({ metadataReader: customReader });
```

Reader này outrank mọi binding `MetadataReaderToken`, và child kế thừa nó (child gọi lại `#getMetadataReader()` của parent khi tự dựng resolver).

**`MetadataReaderToken` — binding, và giới hạn của nó:**

```ts
import { MetadataReaderToken } from "@codefast/di";

const root = Container.create();
root.bind(MetadataReaderToken).toConstantValue(customReader);
const app = root.createChild(); // resolver của app dựng sau khi binding đã tồn tại → thấy reader
```

Bind token **lên chính container đang dùng** thì không đường nào thấy: constructor đã chạy trước khi có binding, nên resolver giữ reader mặc định và class không decorator throw `MissingMetadataError`.

**Normative — một container, một reader.** Reader được chốt khi resolver của container được dựng; `validate()`, `inspect()`, `generateDependencyGraph()`, `unbind*` đều trả lời bằng đúng reader đó. Introspection không thể bất đồng với resolution.

`MetadataReaderToken` có type `Token<MetadataReader>` và được export từ `@codefast/di`.

**`SymbolMetadataReader` — đọc metadata**

Implementation mặc định đọc trực tiếp từ `Symbol.metadata` — không có WeakMap mirror. Vì `Symbol.metadata` chưa được định nghĩa native trên mọi runtime (Node.js hiện tại trả `undefined`), codebase normalize một lần tại module load: `METADATA_SYMBOL = Symbol.metadata ?? Symbol.for("Symbol.metadata")`. Babel và esbuild dùng cùng pattern này khi transform decorators, đảm bảo symbol nhất quán. Khi runtime có native `Symbol.metadata`, `??` sẽ dùng native symbol. Danh sách field `@inject accessor` lấy bằng `getAccessorMetadata(target)`. `getConstructorMetadata(target)` chỉ mô tả dependency của constructor, không thay cho accessor fields.

```ts
getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
  const own = Object.getOwnPropertyDescriptor(target, METADATA_SYMBOL);
  if (own === undefined) return undefined;
  const meta = own.value;
  if (!meta || typeof meta !== "object" || !Object.hasOwn(meta, INJECTABLE_KEY)) {
    return undefined;
  }
  return meta[INJECTABLE_KEY] as ConstructorMetadata;
}
```

Nếu child kế thừa parent nhưng không có `@injectable()` → `getConstructorMetadata` trả `undefined` → container throw `MissingMetadataError`. Không silently leak metadata của parent class.

<a id="accessor-injection"></a>

### 7.5 Property injection qua `accessor` field decorator

TC39 Stage 3 hỗ trợ `accessor`. `@inject(token)` là **field decorator** trên **instance `accessor`**. **`static accessor` không được hỗ trợ:** initializer của static chạy khi định nghĩa class, ngoài phạm vi `runWithContainer` và `new`. Decorator **throw** khi `context.static === true`. Trên toolchain không invoke decorator cho field static, lỗi chỉ xuất hiện nếu decorator thực sự được gọi:

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

Nếu class được `new` thủ công (không qua container), accessor initializer không có container → throw `MissingContainerContextError`, mang tên class đó (`className`) và tên accessor (`accessorName`) tách biệt.

Khi code khác (router, ORM, test helper) giữ quyền `new`, bọc call site bằng `runWithContainer` — cả nó và `getActiveContainer` đều export từ `@codefast/di`:

```ts
import { runWithContainer } from "@codefast/di";

const instance = runWithContainer(container, () => new Dashboard());
```

Chỉ accessor injection được bridge. Lifecycle thuộc resolver, nên instance dựng bằng tay **không** chạy `@postConstruct` và container cũng không dispose nó.

**Construction (TC39) và activation (container):** Một lần resolve gồm (1) **construction** — thân constructor rồi `addInitializer` (inject accessor tại đây, trước khi `new` return; xem [decorators proposal](https://github.com/tc39/proposal-decorators)); (2) **activation** — `@postConstruct()` rồi `onActivation()`, do resolver/lifecycle gọi sau khi (1) đã hoàn tất.

**Cơ chế truyền container context — module-level active container (normative):**

TC39 `context.addInitializer` chạy synchronously ngay sau constructor body, trong cùng call frame với `new`. Container khai thác điều này qua pattern **module-level active container variable**:

`runWithContainer(container, fn)` đặt biến active thành container đã cho, chạy `fn`, rồi khôi phục giá trị cũ trong khối `finally` — nên nó đúng cả khi constructor throw, và các lần gọi lồng nhau (A dựng B dựng C) khôi phục đúng thứ tự. `getActiveContainer()` đọc container đang active, trả `undefined` khi không có context nào đang mở.

> **Hình dạng chính xác:** `src/ambient/active-container.ts`.

**Resolver dùng `runWithContainer` khi new class:**

```ts
// resolver.ts — khi instantiate ClassBinding hoặc class dùng @inject accessor
const instance = runWithContainer(this.container, () => new target(...constructorArgs));
```

**`inject()` accessor decorator dùng `getActiveContainer` trong initializer:**

Bản cài đặt của `inject()` làm ba việc trong vai accessor decorator: throw nếu `context.static` là `true`; ghi `{ key, descriptor }` vào `Symbol.metadata` qua `context.metadata` để `MetadataReader` đọc lại được; và cài một initializer qua `context.addInitializer`. Initializer đó gọi `getActiveContainer()` — không có container thì throw `MissingContainerContextError` mang tên class và tên accessor — có thì resolve token (bản `resolveOptional` nếu descriptor là optional) và ghi giá trị qua `context.access.set`. Nó không override `get`/`set`, chỉ thêm initializer.

> **Hình dạng chính xác:** `src/decorators/inject.ts`.

**Luồng với `runWithContainer`:**

```
resolver.resolve(Dashboard)
  → runWithContainer(container, () => new Dashboard(...args))
    → Dashboard constructor() chạy                        // _activeContainer đã được set
    → accessor initializers chạy (addInitializer callbacks)
      → getActiveContainer() trả về container             // đọc trong cùng call frame
      → context.access.set(this, container.resolve(...))  // inject giá trị
    → runWithContainer trả về instance                    // _activeContainer được restore
  → @postConstruct() chạy (sau runWithContainer)
```

> **Concurrency safety:** `_activeContainer` là module-level variable. Trong môi trường single-threaded (Node.js event loop), đây an toàn vì JS không có true parallelism. `runWithContainer` với `try/finally` đảm bảo nested construction (A inject B inject C) stack đúng. Nếu trong tương lai library cần hỗ trợ Worker threads, mỗi Worker có module scope riêng — không có shared state.

> **`INJECT_ACCESSOR_KEY`:** `unique symbol` trong `metadata-keys.ts`, không export. `SymbolMetadataReader` đọc qua `getAccessorMetadata(target)` và WeakMap mirror theo `context.metadata`. Resolver dùng `getAccessorMetadata` để phát hiện accessor injection và bọc `new` trong `runWithContainer` khi class cần active container trong initializer.

> **Constructor injection vẫn là cách ưu tiên** — immutable, dễ test, không cần container context. Property injection qua `accessor` hữu ích khi class kế thừa framework không kiểm soát constructor, hoặc cần break circular dependency.
>
> **Không hỗ trợ `@inject` trên plain field** (`@inject(Logger) logger!`). Property injection chỉ qua `accessor` (`@inject(Logger) accessor logger`, …). Stage 3 field decorator có `context.access`; giới hạn chỉ `accessor` là **lựa chọn API** (surface thu hẹp), không phải bất khả thi của proposal.

**`inject()` dual-role:**

`inject()` hoạt động như cả plain function (trong deps array) lẫn accessor decorator. Return type là intersection:

Kiểu trả về của `inject()` là **giao** của `InjectionDescriptor<Value>` và một `ClassAccessorDecorator`. Dùng trong deps array thì TypeScript match vế thứ nhất; dùng làm decorator thì match vế thứ hai. Cùng một function, một đường import.

Khi dùng trong deps array, TypeScript match `InjectionDescriptor<Value>`. Khi dùng làm decorator, TypeScript match `ClassAccessorDecorator<unknown, Value>`. Cả hai roles hoạt động với cùng một function — không cần import khác nhau.

> **Toolchain decorator:** Vitest dùng transform mặc định của nó (OXC). Các đoạn test cần Stage 3 decorators đi qua `@rolldown/plugin-babel` với `@babel/plugin-proposal-decorators` (`version: "2023-11"`). Transform quanh decorator metadata phải giữ `inject()` là callable object; dùng `isInjectionDescriptor(value)` trước khi xử lý deps array.

### 7.6 Method lifecycle decorators

`@postConstruct()` và `@preDestroy()` là method decorators trên **instance methods**; tên method được ghi vào `Symbol.metadata` và mirror WeakMap tương ứng. **Static methods** không được hỗ trợ — lifecycle manager chỉ gọi hooks trên instance.

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
> **Binding kind:** hook thuộc về **instance**, không thuộc về binding — nên `.to(Class)` và một factory (`toDynamic`/`toResolved`, cả hai biến thể async) trả về instance của cùng class đó đều chạy như nhau. Factory không khai báo class nào, nên class được đọc từ chính giá trị nó trả về; factory đổi class giữa các lần resolve thì lần nào cũng đọc lại. `toConstantValue` **không** chạy — instance ấy do caller dựng chứ không phải container. `toAlias` cũng không: binding nó trỏ tới đã chạy rồi.
>
> **Async contamination:** `@postConstruct()` async buộc `resolveAsync()` — async contamination lan truyền toàn bộ dependency path.

<a id="auto-registration"></a>

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

`AutoRegisterRegistry` có hai phương thức: `register(target, scope)` — được `@injectable({ autoRegister })` gọi tự động — và `entries()` trả về mọi mục đã đăng ký. `createAutoRegisterRegistry()` dựng một registry mới.

> **Hình dạng chính xác:** `src/decorators/injectable.ts`.

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

Advanced constraints export từ root `@codefast/di`, và cũng có subpath riêng `@codefast/di/resolution/select/constraints` trỏ vào cùng một module. Ví dụ trong section này import từ root — đường ngắn hơn và luôn đúng.

### 8.1 Token name resolution

Tất cả constraint function nhận `Token<unknown> | Constructor` và resolve thành chuỗi `tokenName` để so sánh với `ResolutionFrame.tokenName`. Quy tắc:

- `Token<Value>` → dùng `token.name` (chuỗi khai báo lúc gọi `token("Logger")`)
- `Constructor` → dùng `Constructor.name` (tên class JavaScript)

> **Unique name:** `ResolutionFrame.tokenName` là `string`, không phải branded type. Nếu hai token khác nhau có cùng `name` — ví dụ `token<A>("Config")` và `token<B>("Config")` — constraint không phân biệt được. Đặt tên token unique (namespace prefix, ví dụ `"@myapp/Config"`) để tránh false match.

### 8.2 Type signatures

Mười constraint, mỗi cái nhận tham số cấu hình và trả về một predicate trên `ConstraintContext`:

| Constraint                         | Match khi                                                            | Khi vắng parent / ancestor |
| ---------------------------------- | -------------------------------------------------------------------- | :------------------------: |
| `whenParentIs(token)`              | direct parent là token đó                                            |          `false`           |
| `whenNoParentIs(token)`            | direct parent **không** phải token đó                                |           `true`           |
| `whenParentNamed(name)`            | slot của binding parent mang đúng tên đó                             |          `false`           |
| `whenParentTagged(criterion)`      | slot của parent chứa criterion đó                                    |          `false`           |
| `whenParentTaggedAll(tags)`        | slot của parent chứa **tất cả** criterion đã cho                     |          `false`           |
| `whenAnyAncestorIs(token)`         | ít nhất một ancestor là token đó                                     |          `false`           |
| `whenNoAncestorIs(token)`          | **không** ancestor nào là token đó                                   |           `true`           |
| `whenAnyAncestorNamed(name)`       | có ancestor mang slot đúng tên đó                                    |          `false`           |
| `whenAnyAncestorTagged(criterion)` | có ancestor mang criterion đó                                        |          `false`           |
| `whenAnyAncestorTaggedAll(tags)`   | có **ít nhất một** ancestor mà slot chứa **tất cả** criterion đã cho |          `false`           |

Hai dạng phủ định trả `true` khi vắng mặt là chủ đích: "không có parent nào là X" đúng hiển nhiên khi chẳng có parent nào. Hai dạng `…TaggedAll` tương đương AND-compose nhiều criterion riêng lẻ nhưng chỉ tốn một lần gọi predicate và không allocate closure trung gian. So sánh criterion bằng identity — tương đương `Object.is` trên `[key, value]` nhờ interning, nhất quán với slot equality ở [section 5.11](#slot-matching).

> **Hình dạng chính xác:** `src/resolution/select/constraints.ts`.

### 8.3 Semantics

`ctx.parent` là `ResolutionFrame` của binding ngay trên trong stack (binding đang inject token hiện tại). `ctx.ancestors` là tất cả frame phía trên `ctx.parent`, theo thứ tự từ trực tiếp đến xa nhất — không bao gồm `ctx.parent`.

**Bảng implementation chuẩn (normative):**

| Function                           | Logic                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `whenParentIs(token)`              | `ctx.parent !== undefined && ctx.parent.tokenName === tokenNameOf(token)`       |
| `whenNoParentIs(token)`            | `ctx.parent === undefined \|\| ctx.parent.tokenName !== tokenNameOf(token)`     |
| `whenAnyAncestorIs(token)`         | `ctx.ancestors.some(f => f.tokenName === tokenNameOf(token))`                   |
| `whenNoAncestorIs(token)`          | `ctx.ancestors.every(f => f.tokenName !== tokenNameOf(token))`                  |
| `whenParentNamed(name)`            | `ctx.parent !== undefined && ctx.parent.slot.name === name`                     |
| `whenAnyAncestorNamed(name)`       | `ctx.ancestors.some(f => f.slot.name === name)`                                 |
| `whenParentTagged(criterion)`      | `ctx.parent !== undefined && ctx.parent.slot.tags.includes(criterion)`          |
| `whenAnyAncestorTagged(criterion)` | `ctx.ancestors.some(f => f.slot.tags.includes(criterion))`                      |
| `whenParentTaggedAll(tags)`        | `ctx.parent !== undefined && tags.every(t => ctx.parent.slot.tags.includes(t))` |
| `whenAnyAncestorTaggedAll(tags)`   | `ctx.ancestors.some(f => tags.every(t => f.slot.tags.includes(t)))`             |

> **Vì sao chỉ cần so identity:** criterion được intern nên mỗi `[key, value]` có đúng một object; so bằng identity vì thế cho đúng kết quả của `Object.is` trên value — xử lý đúng `NaN` và phân biệt `+0` với `-0`, nhất quán với slot equality trong [section 5.11](#slot-matching). Đây cũng là lý do bảng trên không còn vòng lặp so từng cặp.

> **Named variant đọc `slot.name`, không đọc `currentResolveOptions`:** `whenParentNamed("console")` hỏi "binding của parent có `whenNamed("console")` không?" — không hỏi "parent được resolve với hint `{ name: "console" }` không?". Hai câu hỏi khác nhau: một binding có thể match slot `"console"` mà không cần resolve hint khi nó là binding duy nhất được chọn, và ngược lại.

### 8.4 Ví dụ

**`whenParentIs` — Logger verbose chỉ khi parent là `DebugService`:**

```ts
import { whenParentIs } from "@codefast/di";

container.bind(Logger).to(ConsoleLogger);
container.bind(Logger).to(VerboseLogger).when(whenParentIs(DebugService));
```

Khi `DebugService` yêu cầu `Logger`, predicate match và `VerboseLogger` được chọn. Các service khác nhận `ConsoleLogger` (default slot).

> **Đảm bảo mutually exclusive:** Hai binding trên đều dùng predicate-only `when()`. Nếu cả hai predicate cùng `true` trong một lần resolve, resolver throw `AmbiguousBindingError`. Đảm bảo predicates loại trừ nhau — ví dụ: binding thứ nhất thêm `.when((ctx) => !whenParentIs(DebugService)(ctx))` để phủ.

**`whenAnyAncestorIs` — inject config riêng cho toàn subtree của `TestHarness`:**

```ts
import { whenAnyAncestorIs, whenNoAncestorIs } from "@codefast/di";

container.bind(Config).toConstantValue(prodConfig).when(whenNoAncestorIs(TestHarness));

container.bind(Config).toConstantValue(testConfig).when(whenAnyAncestorIs(TestHarness));
```

Bất kỳ service nào được resolve trong subtree bắt đầu từ `TestHarness` đều nhận `testConfig`. Các service ngoài subtree nhận `prodConfig`.

**`whenParentNamed` — Logger biết mình đang phục vụ slot nào của `Database`:**

```ts
import { whenParentNamed } from "@codefast/di";

container.bind(Database).to(PrimaryDatabase).whenNamed("primary").singleton();
container.bind(Database).to(ReplicaDatabase).whenNamed("replica").singleton();

container.bind(Logger).to(PrimaryLogger).when(whenParentNamed("primary"));

container.bind(Logger).to(ReplicaLogger).when(whenParentNamed("replica"));
```

Khi `PrimaryDatabase` được resolve (binding slot `"primary"`), nó inject `PrimaryLogger` vì `ctx.parent.slot.name === "primary"`.

**`whenAnyAncestorTagged` — chọn infrastructure khác nhau theo tag môi trường:**

```ts
import { tag, whenAnyAncestorTagged } from "@codefast/di";

const Env = tag<"test" | "prod">("env");

// Ancestor nào đó trong chain có tag env=test → dùng sandbox
container
  .bind(Mailer)
  .to(SandboxMailer)
  .when(whenAnyAncestorTagged(Env.of("test")));

// Không có ancestor nào có tag env=test → dùng SMTP thật
container
  .bind(Mailer)
  .to(SmtpMailer)
  .when((ctx) => !whenAnyAncestorTagged(Env.of("test"))(ctx));
```

**`whenParentTaggedAll` — inject khác nhau khi parent có nhiều tag đồng thời:**

```ts
import { tag, whenParentTaggedAll } from "@codefast/di";

const Env = tag<"test" | "prod">("env");
const Tier = tag<"basic" | "premium">("tier");

// PremiumPlugin chỉ được inject khi parent có CẢ HAI tag env=prod VÀ tier=premium
container
  .bind(Plugin)
  .to(PremiumPlugin)
  .when(whenParentTaggedAll([Env.of("prod"), Tier.of("premium")]));

// Default fallback cho các trường hợp còn lại
container.bind(Plugin).to(BasicPlugin);
```

Tương đương viết tay nhưng không tạo closure trung gian:

```ts
// Tránh — mỗi lần resolve gọi hai predicate riêng, mỗi predicate tạo một lần tìm kiếm
.when((ctx) => whenParentTagged(Env.of("prod"))(ctx) && whenParentTagged(Tier.of("premium"))(ctx))

// Dùng — một predicate call, một lần duyệt `parentTags`
.when(whenParentTaggedAll([Env.of("prod"), Tier.of("premium")]))
```

### 8.5 Composability

Các constraint function trả về `(ctx: ConstraintContext) => boolean` nên composable tự nhiên với toán tử JavaScript:

```ts
import { whenAnyAncestorIs, whenParentIs } from "@codefast/di";

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

Các quy tắc trong [section 5.4](#constraints) áp dụng đầy đủ cho advanced constraints — đây là predicate `when()` thông thường:

- Predicate được gọi mỗi lần resolve cần chọn candidate, không cached.
- Predicate phải pure và deterministic — không có side effects, không gọi I/O.
- Predicate không được gọi `ctx.resolve*()` — sẽ gây circular resolution.
- Đảm bảo predicates mutually exclusive khi nhiều binding cùng token dùng predicate-only `when()`. Nếu sau filter vẫn còn ≥ 2 candidates, resolver throw `AmbiguousBindingError`.

### 8.7 Performance note

`whenAnyAncestorIs`, `whenAnyAncestorTagged`, và `whenAnyAncestorTaggedAll` duyệt toàn bộ `ctx.ancestors` — O(depth) mỗi lần resolve. Với dependency graph nông (< 10 levels) điển hình, overhead không đáng kể. Tránh dùng các constraint này trên hot path với graph sâu và `transient` binding; ưu tiên `whenParentIs` / `whenParentTaggedAll` (O(1) parent lookup) khi chỉ cần kiểm tra direct parent.

`whenParentTaggedAll(tags)` duyệt `tags` × `parentTags` — O(m × n) với m = số tag trong điều kiện, n = số tag trên parent slot. Với m, n nhỏ (< 5), overhead không đáng kể; ưu tiên dùng thay vì AND-compose nhiều `whenParentTagged` để giảm số lần gọi predicate.

### 8.8 Subpath export

```ts
// @codefast/di/resolution/select/constraints — src/resolution/select/constraints.ts
export {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#/resolution/select/constraints";
```

Export từ cả root `@codefast/di` lẫn subpath `@codefast/di/resolution/select/constraints` — hai import path đều hợp lệ và trỏ vào cùng một module. Bản đồ `exports` sinh từ `dist/` nên subpath mang đúng đường dẫn nguồn; **không có alias `@codefast/di/constraints`**.

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
> **Deduplication:** Gọi `container.load(M)` nhiều lần hoặc `m.import(M)` từ nhiều module là no-op từ lần thứ hai. Dedup dựa trên **object identity**, không phải `name`. Unload reference-counting dùng cùng identity — xem [section 6.4](#module-management).

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

**`ModuleBuilder`** — chỉ tồn tại trong callback của `SyncModule.create()` — có đúng hai việc: `bind(token)` và `import(...modules)` nhận **chỉ** `SyncModule`. **`AsyncModuleBuilder`** cũng hai việc, nhưng `import` nhận cả `SyncModule` lẫn `AsyncModule`.

`SyncModule` và `AsyncModule` đều mang `name` và một **branded field** phân biệt hai loại ở tầng kiểu. Factory tĩnh: `SyncModule.create(name, setup)` với `setup` sync, `AsyncModule.create(name, setup)` với `setup` async. Ngoài ra có `Module.create` / `Module.createAsync` — chỉ forward sang hai factory trên, cho call site muốn import một tên duy nhất — và type guard `isSyncModule(module)` để phân biệt lúc chạy khi chỉ có union trong tay.

> **Hình dạng chính xác:** `src/core/module.ts` — `ModuleBuilder`, `AsyncModuleBuilder`, `SyncModule`, `AsyncModule`, `Module`, `isSyncModule`.

> **Tại sao branded field?** TypeScript dùng structural typing — nếu hai interface chỉ có `name: string`, `container.load(asyncModule)` compile được mà không báo lỗi. Branded field đảm bảo `load(asyncModule)` là TypeScript error tại compile time.
>
> **`ModuleBuilder` không có `unbind` / `rebind`:** Module là _additive_ — chỉ khai báo, không xóa binding của module khác. Override trong test dùng `container.bind()` hoặc `container.rebind()` sau khi load. Tránh hidden coupling giữa modules.

---

## 10. Error hierarchy

Tất cả error kế thừa `DiError` — một abstract class buộc mọi subclass khai báo một `code` string (machine-readable), bên cạnh message mang đủ context cho người đọc.

| Error                           | `code`                        | Throw khi                                                           | Trường ngữ cảnh                                  |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| `InternalError`                 | `INTERNAL_ERROR`              | Assertion nội bộ fail — **không** phải lỗi user                     | —                                                |
| `TokenNotBoundError`            | `TOKEN_NOT_BOUND`             | Token không có binding nào, kể cả sau khi leo hết parent chain      | `tokenName`                                      |
| `NoMatchingBindingError`        | `NO_MATCHING_BINDING`         | Token **có** binding nhưng không slot nào match hint                | `tokenName`, `hint`, `availableSlots`            |
| `AmbiguousBindingError`         | `AMBIGUOUS_BINDING`           | Còn ≥ 2 candidate và luật cụ-thể-hơn không phân định được           | `tokenName`, `candidateIds`                      |
| `CircularDependencyError`       | `CIRCULAR_DEPENDENCY`         | A → B → A, kể cả khi cycle nằm trên alias chain                     | `cycle`                                          |
| `AsyncResolutionError`          | `ASYNC_RESOLUTION`            | `resolve()` sync trên async binding, trực tiếp hoặc qua dep chain   | `tokenName`, `asyncSourceToken`                  |
| `AsyncActivationError`          | `ASYNC_ACTIVATION`            | `@postConstruct` hoặc `onActivation` trả `Promise` trên đường sync  | `tokenName`, `hookKind`, `methodName`            |
| `AsyncDeactivationError`        | `ASYNC_DEACTIVATION`          | `unbind()` sync trên binding có async `onDeactivation`              | `tokenName`                                      |
| `ScopeViolationError`           | `SCOPE_VIOLATION`             | Captive dependency — singleton phụ thuộc scoped hoặc transient      | `details`: token + scope hai bên, cùng `path`    |
| `MissingMetadataError`          | `MISSING_METADATA`            | Class cần container tự dựng nhưng thiếu `@injectable()`             | `targetName`                                     |
| `InvalidMetadataError`          | `INVALID_METADATA`            | `MetadataReader` trả về thứ container không dùng được               | `targetName`, `reason`                           |
| `AsyncModuleLoadError`          | `ASYNC_MODULE_LOAD`           | `load()` sync nhận `AsyncModule`                                    | `moduleName`                                     |
| `SyncDisposalNotSupportedError` | `SYNC_DISPOSAL_NOT_SUPPORTED` | `[Symbol.dispose]()` được gọi                                       | —                                                |
| `MissingScopeContextError`      | `MISSING_SCOPE_CONTEXT`       | Resolve binding `scoped` từ container không có child scope context  | `tokenName`                                      |
| `MissingContainerContextError`  | `MISSING_CONTAINER_CONTEXT`   | Class có `@inject accessor` bị `new` ngoài container context        | `className` (có thể `undefined`), `accessorName` |
| `RebindUnboundTokenError`       | `REBIND_UNBOUND_TOKEN`        | `rebind()` trên token chưa có binding own trong container này       | `tokenName`                                      |
| `DisposedContainerError`        | `DISPOSED_CONTAINER`          | Mọi thao tác trên container đã dispose                              | —                                                |
| `ChainNotRegisteredError`       | `CHAIN_NOT_REGISTERED`        | Refinement (`when*`, scope, `on*`, `id()`) gọi trước `to*()`        | `tokenName`                                      |
| `SelfBindingRequiresClassError` | `SELF_BINDING_REQUIRES_CLASS` | `toSelf()` trên token không phải class                              | `tokenName`                                      |
| `StaticMemberDecoratorError`    | `STATIC_MEMBER_DECORATOR`     | `@inject` / `@postConstruct` / `@preDestroy` đặt trên static member | `decoratorName`, `memberName`                    |
| `UnreachableLifecycleHookError` | `UNREACHABLE_LIFECYCLE_HOOK`  | `validate()` — hook container-level cho token không ai bind         | `tokenName`, `phase`                             |

> **Hình dạng chính xác:** `src/errors/errors.ts` — mọi class trên, cộng `ScopeViolationDetails`.

Mọi message đều nêu lối ra chứ không chỉ nêu triệu chứng. Hai ví dụ đại diện:

```
No binding for 'Logger' matching { name: 'file' }. Available slots: [default, name:console].

Token 'App' requires async resolution because 'Database' in its dependency
chain has an async factory. Use container.resolveAsync(App).
```

### Ranh giới giữa lỗi của library và lỗi của caller

`InternalError` nghĩa là **library hỏng** — một consumer bắt được nó là bắt được bug của thư viện. Vì vậy không lỗi nào do người dùng gây ra được phép mang kiểu này. Ba error trong bảng tồn tại chính vì luật đó: `AmbiguousBindingError` (predicate không loại trừ nhau), `StaticMemberDecoratorError`, và `ChainNotRegisteredError` — cả ba trước đây throw `InternalError`, và cả ba đều là caller dùng sai.

`ChainNotRegisteredError` và `SelfBindingRequiresClassError` gần như không tới được từ TypeScript: kiểu trả về của chain ([§2.4](#chain-order)) và kiểu của `bind()` đã chặn phần lớn. Chúng dành cho caller JavaScript hoặc caller đã cast qua kiểu, tồn tại để misuse **nổ rõ ràng** thay vì âm thầm không làm gì, và thuộc taxonomy `DiError` để một `catch (error) { if (error instanceof DiError) … }` không để chúng rơi ra ngoài.

`StaticMemberDecoratorError` có mặt vì cả ba decorator ấy đều tác động lên **một instance**: `@inject` resolve qua container đang active trong lúc instance được construct, còn `@postConstruct`/`@preDestroy` bao quanh lifecycle của một instance. Static member thuộc về class, mà container không construct class.

### `MissingMetadataError` khác `InvalidMetadataError`

Vắng metadata là class container chưa được kể; metadata sai là reader trả lời sai. Chỉ reader **do người dùng cấp** bị kiểm tra — reader decorator mặc định tự ghi metadata mà nó đọc lại, nên không có gì để kiểm, và container không cấp reader riêng thì không phải trả gì. Kiểm một lần mỗi cặp `(reader, class)` mỗi process, chỉ những field mà consumer dereference (`params`, và `token` của từng entry).

Câu trả lời **lifecycle** cũng vào `InvalidMetadataError` với `reason` khác: nếu reader kể một tên `postConstruct`/`preDestroy` mà instance không có method đó, hook bị bỏ qua là thất bại **caller không nhìn thấy được** — nên nó được báo (`"lifecycle method 'strat' is not a method on the instance"`) thay vì im lặng. Tên class lấy từ chính instance tại chỗ throw, nên happy path không mang thêm đối số nào.

### `AsyncActivationError` khác `AsyncResolutionError`

Cùng là luật ở [§3.4](#lifecycle-handlers) — hook trả `Promise` thì lần resolve phải là `resolveAsync()` — nhưng nguồn async không nằm ở factory của binding mà ở hook, thứ chỉ lộ ra **sau** khi instance đã được tạo. Container không thể biết trước lúc chọn binding. `hookKind` cho biết `postConstruct` hay `onActivation`; `methodName` chỉ đúng method khi một class có nhiều `@postConstruct()`.

---

## 11. File structure

```
packages/di/
├── ARCHITECTURE.md            Layering, hot-path invariants, và luật đổi code trong resolution/
│                              — đọc trước khi sửa bất cứ gì dưới src/resolution/
├── src/                       Thư mục = tầng. Import chỉ đi xuôi theo thứ tự dưới đây;
│   │                          `tests/unit/architecture.test.ts` cưỡng chế chiều đó.
│   │  ── tầng 0: core/, errors/, injection/ ────────────────────────────────
│   ├── core/
│   │   ├── constructor-type.ts Constructor<Value>, ConstructorInvocation (re-export qua types.ts)
│   │   ├── types.ts           DependencyKey, BindingScope, BindingIdentifier, BindingKind,
│   │   │                      ActivationHandler, DeactivationHandler, ResolveOptions,
│   │   │                      ResolutionFrame, ConstraintContext, ResolutionContext, TokenValue
│   │   ├── token.ts           Token<Value> branded type; token(), tokenName(), isToken()
│   │   ├── tag.ts             tag() — nhà máy tag key duy nhất; BindingTag interned,
│   │   │                      TagKeyMask và phép kiểm subset trên key
│   │   ├── binding.ts         Binding discriminated union + BindingSlot utilities;
│   │   │                      createBinding() — ĐIỂM DỰNG BINDING DUY NHẤT, thứ bảo đảm
│   │   │                      một hidden class cho mọi binding; generateBindingId(),
│   │   │                      refinableFields(); toàn bộ builder interface công khai
│   │   ├── binding-scope.ts   effectiveBindingScope() — internal; dùng BindingSnapshot.scope
│   │   ├── registry.ts        BindingRegistry — slot-aware last-wins, các index tra cứu nhanh,
│   │   │                      version counter cho memo; lưu binding BY REFERENCE (không copy lại)
│   │   └── module.ts          SyncModule / AsyncModule, MODULE_SETUP
│   ├── errors/
│   │   ├── errors.ts          Toàn bộ error class
│   │   └── diagnostics.ts     RESOLUTION_DIAGNOSTICS — kênh đọc số liệu runtime của resolver
│   ├── injection/
│   │   ├── descriptor.ts      inject-descriptor layer: optional(), injectAll(),
│   │   │                      isInjectionDescriptor(), normalizeToDescriptor(); gấp `tag`
│   │   │                      vào `tags` để phía sau chỉ thấy một cách viết
│   │   └── resolve-options.ts injectionSlotToResolveOptions(), bindingSlotToResolveOptions()
│   │
│   │  ── tầng 1: lifecycle/, ambient/ ──────────────────────────────────────
│   ├── lifecycle/
│   │   ├── scope-manager.ts   ScopeManager — cache singleton/scoped, serialize async
│   │   └── lifecycle-manager.ts LifecycleManager — chuỗi onActivation/onDeactivation
│   ├── ambient/
│   │   └── active-container.ts runWithContainer() / getActiveContainer() — biến active
│   │                          tầng module mà accessor injection đọc lúc `new`
│   │
│   │  ── tầng 2: resolution/ (perf-critical core) ──────────────────────────
│   ├── resolution/
│   │   ├── resolver.ts        DependencyResolver — sync + async pipeline. Một class vì
│   │   │                      `#` private không span file được và cả hai pipeline dùng
│   │   │                      chung state riêng tư ở mọi hop
│   │   ├── context.ts         DefaultResolutionContext (pooled), AsyncLevelContext,
│   │   │                      AsyncCascadeContext, ResolverCallbacks
│   │   ├── cache/
│   │   │   ├── binding-lookup-cache.ts  Memo tra cứu không-options theo chain, đã fold
│   │   │   │                  alias; stamp bằng tổng version của cả chain registry
│   │   │   ├── class-introspector.ts    Cache theo class: constructor metadata, phát hiện
│   │   │   │                  @postConstruct, accessor injection, và chính lời gọi `new`
│   │   │   └── activation-need.ts  Cache theo binding: có cần chạy activation pipeline không
│   │   ├── plan/
│   │   │   └── instantiation-plan.ts   Compiler cho compiled plan + escape ra runtime path
│   │   ├── path/
│   │   │   └── resolution-path.ts      Cycle guard trên mảng path (scan tuyến tính → Set
│   │   │                      khi sâu); OwnedBranchPath cho nhánh async
│   │   └── select/
│   │       ├── binding-select.ts   selectBinding(), selectAllBindings(), matchesSlot()
│   │       └── constraints.ts      Advanced constraint predicates (whenParentNamed, …)
│   │
│   │  ── tầng 3: decorators/, metadata/ ────────────────────────────────────
│   ├── decorators/
│   │   ├── injectable.ts      @injectable(), auto-register registry
│   │   ├── inject.ts          inject() và @inject accessor field decorator
│   │   └── lifecycle-decorators.ts  @postConstruct(), @preDestroy()
│   ├── metadata/
│   │   ├── metadata-types.ts  MetadataReader, ConstructorMetadata, ParamMetadata
│   │   ├── metadata-keys.ts   Symbol.metadata keys
│   │   ├── symbol-metadata-reader.ts   defaultMetadataReader
│   │   ├── verifying-metadata-reader.ts  Bọc reader do người dùng cấp, kiểm một lần
│   │   │                      mỗi cặp (reader, class) — nguồn InvalidMetadataError
│   │   └── metadata-reader-token.ts    MetadataReaderToken
│   │
│   │  ── tầng 4: container/, introspection/ ────────────────────────────────
│   ├── container/
│   │   ├── container.ts       DefaultContainer; collaborator dựng khi dùng lần đầu
│   │   └── binding-builders.ts BindingChain — MỘT object cho cả chain, đăng ký MỘT lần
│   │                          rồi refine tại chỗ và tự commit vào registry;
│   │                          BindingRegistration (chain đăng ký ở đâu, cho ai)
│   ├── introspection/
│   │   ├── inspector.ts       inspect(), lookupBindings()
│   │   ├── dependency-graph.ts buildDependencyGraph()
│   │   └── graph-adapters/    dot.ts, cytoscape.ts, mermaid.ts, reactflow.ts
│   └── index.ts               Public API exports (root entrypoint)
│
├── tests/                     Mirror đường dẫn src/ trong đúng một category
│   ├── unit/                  architecture, core/, container/, decorators/, lifecycle/,
│   │                          introspection/, resolution/{cache,plan,select}
│   ├── integration/           decorators end-to-end, validate-scope, support/ fixtures
│   └── types/                 expectTypeOf — inference, container API, resolve-options
│
├── package.json               #exports sinh từ dist/ bởi `codefast mirror`
├── tsconfig.json
└── tsconfig.build.json
```

**Thư mục là tầng, và import chỉ đi một chiều.** `{core, errors, injection}` → `{lifecycle, ambient}` → `resolution` → `{decorators, metadata}` → `{container, introspection}`. Import cùng tầng thì tự do; chỉ value import ngược lên tầng cao hơn mới là vi phạm, và `tests/unit/architecture.test.ts` chặn đúng điều đó. `index.ts` được miễn — barrel gom mọi tầng là việc của nó. Type-only import không tính, vì nó bay hơi lúc build nên không ràng buộc gì ở runtime.

**Ownership của `core/types.ts`:** Kiểu nền tảng (`BindingScope`, `BindingIdentifier`, `BindingKind`, `Constructor`, `ActivationHandler`, `DeactivationHandler`, `ResolveOptions`, `ResolutionContext`, `ConstraintContext`, `ResolutionFrame`, `TokenValue`) được khai báo ở đây — file có single responsibility, không phụ thuộc bất kỳ file nào khác trong package. `core/binding.ts`, `resolution/resolver.ts`, `lifecycle/scope-manager.ts`… đều import từ nó. Re-export từ `index.ts`.

**Phân tách `resolution/select/binding-select.ts` khỏi `core/registry.ts`:** registry là storage layer — lưu binding và xử lý slot-aware last-wins. `binding-select.ts` là runtime filtering layer — nhận token + `ResolveOptions` + `when()` predicates, trả candidates. `resolver.ts` consume kết quả của nó. Phân tách này làm từng layer dễ test độc lập, và giữ registry ở tầng 0 trong khi selection ngồi cùng tầng với resolver.

**`metadata/metadata-reader-token.ts` tách riêng:** `MetadataReaderToken` là bridge giữa decorator layer và container. Tách riêng để tránh circular import (`container/container.ts` → `metadata-reader-token.ts` → không phụ thuộc ngược lại).

<a id="public-api"></a>

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
  DependencyKey,
  DeactivationHandler,
  ResolutionFrame,
  ResolveOptions,
  ResolutionContext,
  TokenValue,
} from "#/core/types";

// Token
export { token, tokenName, isToken } from "#/core/token";
export type { Token } from "#/core/token";

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
} from "#/core/binding";

// Container
export { Container } from "#/container/container";
export type { Container as ContainerInterface, ContainerStatic } from "#/container/container";

export { injectionSlotToResolveOptions, bindingSlotToResolveOptions } from "#/injection/resolve-options";

// Introspection types
export type { BindingSnapshot, ContainerSnapshot } from "#/introspection/inspector";

// Graph types
export type { ContainerGraphJson, GraphEdge, GraphNode, GraphOptions } from "#/introspection/dependency-graph";

// Module
export { AsyncModule, isSyncModule, Module, SyncModule } from "#/core/module";
export type { AsyncModuleBuilder, ModuleBuilder } from "#/core/module";

// Constraints — contextual injection predicates for .when()
export {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#/resolution/select/constraints";

// Decorators
export { inject } from "#/decorators/inject";
export { injectAll, isInjectionDescriptor, optional } from "#/injection/descriptor";
export type { InjectionDescriptor, InjectOptions } from "#/injection/descriptor";
export { injectable } from "#/decorators/injectable";
export type { InjectableDependency, InjectableOptions } from "#/decorators/injectable";
export { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";

// Auto-register
export { createAutoRegisterRegistry } from "#/decorators/injectable";
export type { AutoRegisterRegistry } from "#/decorators/injectable";

// MetadataReader
export { MetadataReaderToken } from "#/metadata/metadata-reader-token";
export type { MetadataReader, MutableLifecycleMetadata } from "#/metadata/metadata-types";

// Errors
export {
  AmbiguousBindingError,
  AsyncActivationError,
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
  ChainNotRegisteredError,
  RebindUnboundTokenError,
  ScopeViolationError,
  StaticMemberDecoratorError,
  SyncDisposalNotSupportedError,
  TokenNotBoundError,
  UnreachableLifecycleHookError,
} from "#/errors/errors";
export type { ScopeViolationDetails } from "#/errors/errors";

// ── Subpath: mirror đầy đủ, không loại trừ gì ────────────────────────────────
//
// `codefast mirror` sinh một entry cho MỌI module dưới src/, nên mỗi file ở đây
// đều là một subpath song song với root. Cấu hình của package này chỉ có một
// dòng — `strip: "./introspection/"` — và trong toàn bộ codefast.config.js không
// có khoá `exclude` nào.
//
// @codefast/di/core/{token,types,binding,tag,registry,module,binding-scope,constructor-type}
// @codefast/di/errors/{errors,diagnostics}
// @codefast/di/injection/{descriptor,resolve-options}
// @codefast/di/lifecycle/{scope-manager,lifecycle-manager}
// @codefast/di/ambient/active-container
// @codefast/di/container/{container,binding-builders}
// @codefast/di/resolution/{resolver,context}
// @codefast/di/resolution/cache/{binding-lookup-cache,class-introspector,activation-need}
// @codefast/di/resolution/{plan/instantiation-plan,path/resolution-path}
// @codefast/di/resolution/select/{binding-select,constraints}
// @codefast/di/decorators/{inject,injectable,lifecycle-decorators}
// @codefast/di/metadata/{metadata-types,metadata-keys,symbol-metadata-reader,verifying-metadata-reader,metadata-reader-token}
//
// `strip` bỏ tiền tố introspection/, nên bốn module đó ở specifier phẳng:
// @codefast/di/{inspector,dependency-graph}, @codefast/di/graph-adapters/{dot,cytoscape,mermaid,reactflow}
//
// Engine internals hiện ra ngoài là có chủ đích: package này chỉ có một consumer
// là chính repo, nên thu hẹp bề mặt export không mua được gì, còn mở thì cho phép
// benchmark và test chạm thẳng vào lớp cần đo. Invariant của chúng nằm trong
// ARCHITECTURE.md, không nằm ở việc giấu module đi.
//
// buildDependencyGraph() từ dependency-graph.ts — đã wrap thành container.generateDependencyGraph()
```

### 11.2 `package.json`

ESM-only. `engines.node >= 26.0.0` — core dùng native `Map.prototype.getOrInsert` (chỉ có từ Node 26).

Mỗi public subpath là một conditional entry: `source` → `src` cho dev/test trong repo (gate bằng điều kiện `source`), `types`/`import` → `dist` cho consumer. Toàn bộ map `exports` được **sinh tự động bằng `codefast mirror`** từ `dist/` sau khi build — không viết tay (danh sách dưới là trích một phần để minh họa hình dạng entry).

```json
{
  "name": "@codefast/di",
  "type": "module",
  "scripts": {
    "build": "rm -rf dist && tsc -p tsconfig.build.json"
  },
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./resolution/select/constraints": {
      "source": "./src/resolution/select/constraints.ts",
      "types": "./dist/resolution/select/constraints.d.ts",
      "import": "./dist/resolution/select/constraints.js"
    },
    // `strip: "./introspection/"` trong codefast.config.js giữ specifier của nhóm
    // introspection phẳng, nên subpath không mang tiền tố thư mục nguồn.
    "./graph-adapters/dot": {
      "source": "./src/introspection/graph-adapters/dot.ts",
      "types": "./dist/introspection/graph-adapters/dot.d.ts",
      "import": "./dist/introspection/graph-adapters/dot.js"
    }
    // … các subpath còn lại theo cùng hình dạng (core/registry, resolution/resolver,
    // lifecycle/scope-manager, lifecycle/lifecycle-manager, resolution/select/binding-select,
    // inspector, decorators/*, injection/*, metadata/*, …)
  },
  "files": ["dist", "src", "CHANGELOG.md", "README.md", "LICENSE"],
  "engines": {
    "node": ">=26.0.0"
  }
}
```

> **`src` nằm trong `files`:** artifact publish kèm cả `src` vì `tsc` giữ nguyên các subpath `#/` verbatim trong `dist/*.js` — chúng chỉ phân giải được khi bản đồ `imports` (điều kiện `types`/`default` → `dist`) đi cùng, còn điều kiện `source` cho phép dev/test trong repo chạy thẳng TS nguồn không cần build trước.

<a id="tsconfig-build"></a>

### 11.3 `tsconfig.build.json`

Build bằng native `tsc` (TypeScript 7) theo mô hình Turborepo "Compiled Packages" — emit `.js` + `.d.ts` file-by-file vào `dist/`, không bundler. Không còn `tsdown`.

Các flag emit dùng chung nằm ở preset `@codefast/typescript-config/library-build.json` (`noEmit: false`, `declaration`, `declarationMap`, `sourceMap`, `types: ["node"]`). Build file dùng **array `extends`** để vừa kế thừa base của package (flags + `paths`) vừa nạp block emit, chỉ giữ lại `outDir`/`rootDir` local (đường dẫn relative — nếu đặt trong preset sẽ resolve về thư mục preset) cùng `include`/`exclude`:

```json
{
  "extends": ["./tsconfig.json", "@codefast/typescript-config/library-build.json"],
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo", "coverage", "src/**/*.test.ts", "tests"]
}
```

Thứ tự array quyết định override: `library-build.json` đứng sau nên `noEmit: false` và `types: ["node"]` thắng `tsconfig.json`. Package bin (`cli`) override thêm `declaration: false` + `declarationMap: false` vì không consumer nào import type của nó.

---

## 12. Roadmap

### Core container

- `types.ts` — tất cả kiểu nền tảng: `BindingScope`, `BindingIdentifier`, `BindingKind`, `Constructor`, `ActivationHandler`, `DeactivationHandler`, `ResolveOptions`, `ResolutionContext`, `ConstraintContext`, `ResolutionFrame`, `TokenValue`
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

Tất cả error subclasses với `readonly code` và context fields đầy đủ như [section 10](#10-error-hierarchy). Bao gồm `AmbiguousBindingError`, `AsyncDeactivationError`, `DisposedContainerError` mới.

### Introspection và diagnostics

- `inspect(): ContainerSnapshot` — typed snapshot với `isDisposed`
- `lookupBindings(token)` — `BindingSnapshot[]` (không bao giờ `undefined`)
- `generateDependencyGraph(options?): ContainerGraphJson` — `includeParent` option
- `toDotGraph()` từ `@codefast/di/graph-adapters/dot`

### Advanced constraints

Fully spec'd in [section 8](#8-advanced-constraints). Export từ root `@codefast/di` và subpath `@codefast/di/resolution/select/constraints`: `whenParentIs`, `whenNoParentIs`, `whenAnyAncestorIs`, `whenNoAncestorIs`, `whenParentNamed`, `whenAnyAncestorNamed`, `whenParentTagged`, `whenAnyAncestorTagged`, `whenParentTaggedAll`, `whenAnyAncestorTaggedAll`.

### Integration packages

- `@codefast/di-hono` — middleware + scoped container per request cho Hono
- `@codefast/di-fastify` — plugin + scoped container per request cho Fastify

---

## 13. Stack kỹ thuật

| Công cụ                 | Vai trò                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| TypeScript 7            | Decorator Stage 3, `Symbol.metadata` stable, strict; `tsc` build + type-check                                       |
| `tsc` (native TS 7)     | Emit ESM `.js` + `.d.ts` file-by-file vào `dist/` (Turborepo Compiled model, no bundler)                            |
| Vitest (OXC mặc định)   | Unit test và integration test                                                                                       |
| Babel decorators        | Chỉ ở test-time trong Vitest: `@rolldown/plugin-babel` + `@babel/plugin-proposal-decorators` (`version: "2023-11"`) |
| publint                 | Kiểm tra package exports correctness                                                                                |
| `@arethetypeswrong/cli` | Kiểm tra type resolution correctness                                                                                |
| pnpm                    | Package manager (workspace monorepo)                                                                                |

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

Thực tế các option emit (`declaration`, `outDir`, …) tách sang `tsconfig.build.json` ([§11.3](#tsconfig-build)); base `tsconfig.json` giữ `noEmit: true` cho type-check.

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

<a id="test-child-override"></a>

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

<a id="test-metadata-reader"></a>

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

**Không mock `Symbol.metadata` trực tiếp:** Dùng `MetadataReaderToken` thay thế (xem [14.4](#test-metadata-reader)).

**Không dùng `rebind()` để override từ parent:** Dùng `bind()` tại child container (xem [14.2](#test-child-override)).

---

## 15. Đối chiếu với InversifyJS v8

Section này đối chiếu toàn bộ public API của InversifyJS v8.0.0 (tháng 3/2026) với `@codefast/di`. Mỗi nhóm tính năng được xét theo ba chiều: **học từ v8**, **cải thiện hơn v8**, **không học từ v8**.

---

### 15.1 Bảng so sánh API theo nhóm

#### Setup và yêu cầu

| Khía cạnh          | InversifyJS v8                                                | `@codefast/di`                                     |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------- |
| Cài đặt            | `npm install inversify reflect-metadata`                      | `npm install @codefast/di`                         |
| reflect-metadata   | Bắt buộc — `import 'reflect-metadata'` ở entry point          | Không cần — zero dependency                        |
| tsconfig flags     | `experimentalDecorators: true`, `emitDecoratorMetadata: true` | Không cần flag đặc biệt                            |
| Decorator standard | Legacy TC39 Stage 1 (experimentalDecorators)                  | TC39 Stage 3 (`Symbol.metadata`, TypeScript 5.9+)  |
| Module format      | ESM-only                                                      | ESM-only                                           |
| Node.js tối thiểu  | Node ≥ 20.19.0                                                | Node ≥ 26.0.0 (native `Map.prototype.getOrInsert`) |

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
| `whenNamed` / `whenTagged` / `whenDefault` / `when(predicate)` | Giữ nguyên; tag key khai báo bằng `tag()`, criterion mint bằng `TagKey.of()`        |
| `isBound()` check hierarchy                                    | `has()` — giữ semantics với hint support                                            |
| `isCurrentBound()` check current only                          | `hasOwn()` — tên rõ hơn                                                             |
| `unbindAll()` / `unbindAllAsync()`                             | Giữ nguyên                                                                          |
| `@postConstruct()` / `@preDestroy()` method decorators         | Giữ, TC39 Stage 3, support nhiều method per class thay vì chỉ một                   |
| `getAll` filter semantics                                      | `resolveAll` — filter semantics, trả `[]` khi không match                           |
| `bind(id).unbind(bindingId)` — unbind một binding cụ thể       | Giữ qua `container.unbind(bindingId)`                                               |

---

### 15.3 Tổng hợp: cải thiện hơn v8

| InversifyJS v8                                                          | Thư viện này                                                                                        |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `reflect-metadata` + `experimentalDecorators` bắt buộc                  | Zero `reflect-metadata` — TC39 Stage 3, không flag legacy                                           |
| `ServiceIdentifier` = union type, không branded                         | `Token<Value>` branded — `resolve` luôn đúng type                                                   |
| `container.get<WrongType>('id')` compile được                           | Impossible — `Token<Value>` mang type tại compile time                                              |
| `inSingletonScope()` / `inTransientScope()` / `inRequestScope()`        | `singleton()` / `transient()` / `scoped()` — tên ngắn, không prefix `in`                            |
| `toDynamicValue` nhận cả sync lẫn async, compiler không enforce         | `toDynamic` vs `toDynamicAsync` — compiler enforce `resolveAsync()` khi cần                         |
| Không có `toResolvedValueAsync`                                         | `toResolvedAsync(factory, deps)` — symmetric với `toResolved`                                       |
| `when*` khả dụng sau scope                                              | `on*()` chỉ sau scope — chain order bất biến, loại bỏ ambiguity                                     |
| `onDeactivation` không có compile-time guard                            | Builder type narrowing — `onDeactivation` chỉ trên `SingletonBindingBuilder`                        |
| `toService()` trả về `void`                                             | `toAlias()` trả về `AliasBindingBuilder` — có `when*`, `.id()`, hint forward                        |
| `@inject` trên parameter cần `experimentalDecorators`                   | `@injectable([deps])` + `inject()` — TC39 Stage 3 thuần                                             |
| `@inject` trên plain property                                           | `@inject accessor field` — dùng TC39 `accessor` keyword                                             |
| `getAll()` chỉ có sync                                                  | `resolveAll()` + `resolveAllAsync()`                                                                |
| `container.get()` + `{ optional: true }` — ẩn trong options             | `resolveOptional()` + `resolveOptionalAsync()` — tên method tường minh                              |
| `tag` là single tag object — không hỗ trợ multi-tag                     | `tags` là `ReadonlyArray<BindingTag>` interned — multi-tag, so bằng identity                        |
| `Symbol.metadata` prototype chain không được xử lý                      | `SymbolMetadataReader` dùng `Object.hasOwn` guard — không leak parent metadata                      |
| `ContainerModule` / `AsyncContainerModule` không phân biệt ở type level | `SyncModule` / `AsyncModule` branded — `load(asyncModule)` là TypeScript error                      |
| `@postConstruct` chỉ một method per class                               | Support mảng — nhiều `@postConstruct()` / `@preDestroy()` per class                                 |
| Không có `validate()`                                                   | `container.validate()` — detect captive dependency tĩnh, transitive alias                           |
| Không có `initializeAsync()`                                            | Idempotent warm-up, cross-container trigger documented                                              |
| Không có typed error hierarchy                                          | `DiError` abstract + `code` string + context fields trên mọi subclass                               |
| Module có thể `unbind` / `rebind` binding của module khác               | `ModuleBuilder` additive-only — tránh hidden coupling giữa modules                                  |
| Module deduplication không được spec                                    | Object identity deduplication + reference-counting rõ ràng                                          |
| `rebind` không throw khi token chưa bound                               | `RebindUnboundTokenError` — contract tường minh                                                     |
| Predicate ambiguity throw `InternalError`                               | `AmbiguousBindingError` với `candidateIds` — lỗi của user, không phải internal                      |
| Concurrent async singleton resolution không được spec                   | Serialized via in-flight Promise map — factory chỉ chạy 1 lần                                       |
| Container sau dispose: undefined behavior                               | `DisposedContainerError` + `isDisposed` getter                                                      |
| Async unbind sync: silent fail                                          | `AsyncDeactivationError` — explicit                                                                 |
| `lookupBindings` không có                                               | `lookupBindings()` trả `BindingSnapshot[]` — không bao giờ `undefined`                              |
| `toService()` + hint semantics không được spec                          | `toAlias()` hint forwarding documented                                                              |
| Không có Testing guide                                                  | [Section 14](#14-testing-guide) với patterns cho isolated container, child override, MetadataReader |
| `autoRegister` qua global option hoặc per-get                           | `createAutoRegisterRegistry()` — explicit registry, không global state                              |
| `[Symbol.asyncDispose]()` không được spec                               | `dispose()` + `[Symbol.asyncDispose]()` — `await using` support                                     |
| `[Symbol.dispose]()` không được spec                                    | `[Symbol.dispose](): never` — throw `SyncDisposalNotSupportedError` rõ ràng                         |
| Không có `lookupBindings()`, `inspect()`, `generateDependencyGraph()`   | Introspection API đầy đủ — typed snapshot, JSON graph, DOT export                                   |

---

<a id="not-adopted-from-v8"></a>

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
| `when*` ancestor/parent constraints trên main API surface           | Có ở root, cộng subpath riêng cho ai muốn import hẹp                       |
| `inRequestScope()` per-resolve-tree semantics                       | `scoped()` per-child-container — ranh giới lifecycle rõ ràng hơn           |
| `toResolvedValue` với per-dep name/tag injection options            | `toResolved` chỉ plain token array — khi cần name/tag, dùng `toDynamic`    |

---

_Phiên bản tài liệu: 8.1 — April 2026_
_Lấy cảm hứng từ InversifyJS v8.0.0 (March 2026) — nghiên cứu từ docs.inversify.io_
