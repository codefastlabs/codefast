# Kế hoạch tái tổ chức `src/` — `@codefast/di`

Mục tiêu: đưa cây thư mục về đúng bốn trục mà `ARCHITECTURE.md` đã lý luận theo — **hướng phụ thuộc**,
**nhiệt độ (hot/cold)**, **lane**, và **kênh khai báo dependency** — mà không đổi một dòng logic nào ở
Phase 1–3, để bất kỳ dịch chuyển hiệu năng nào cũng quy được trách nhiệm.

---

## 1. Hiện trạng đã đo

| Số liệu                               | Giá trị                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| File `src/**/*.ts`                    | 37 file / 7.109 dòng                                                                                  |
| File lớn nhất                         | `resolution/resolver.ts` 1.400, `container/container.ts` 799                                          |
| File test                             | 40 file / 6.537 dòng                                                                                  |
| Dòng `import … from "#/…"`            | 367 (src + tests + examples)                                                                          |
| `exports` sinh bởi mirror             | 39 specifier                                                                                          |
| Consumer deep-specifier ngoài package | **4** — chỉ `@codefast/di/graph-adapters/{cytoscape,dot,mermaid,reactflow}` (examples/tanstack-start) |

**Bốn quan sát quyết định thiết kế:**

1. **Rename specifier gần như miễn phí trong repo.** Mọi consumer khác (`benchmarks/di-inversify`,
   `examples/tanstack-start`, `packages/benchmark-harness`, 19 thư mục `examples/`) đều import root
   `@codefast/di`. Bốn deep-specifier duy nhất nằm dưới prefix `introspection/` — vốn đã được
   `strip: "./introspection/"` giữ phẳng, và `introspection/` **không di chuyển** trong kế hoạch này.

2. **`strip` chỉ nhận một chuỗi** (`packages/cli/src/mirror/domain/exports.ts:122`). Không thể giữ
   nguyên tên cho nhiều prefix. Nên mọi module bị move sẽ đổi specifier công khai → cần changeset
   `minor` (theo CLAUDE.md: breaking change là `minor`, tuyệt đối không `major`).

3. **Có một đảo ngược layer thật đang tồn tại.** `core` model đang import từ layer decorator:

   ```
   src/binding.ts:1              import type { InjectableDependency, InjectionDescriptor, … } from "#/decorators/inject"
   src/metadata/metadata-types.ts:1  import type { InjectionDescriptor } from "#/decorators/inject"
   ```

   Nó "hợp lệ" chỉ vì `tests/unit/architecture.test.ts` bỏ qua import type-only. `InjectionDescriptor`
   là khái niệm **model**, không phải khái niệm decorator — đây chính là lý do `injection/` tồn tại.

4. **`resolution/environment.ts` (386 dòng) đang gánh ba việc rời nhau**: ambient container
   (biến module-global `activeContainer`, **không** phải `AsyncLocalStorage`), `ResolutionContext`
   implementation, và `ResolverCallbacks`. Ambient là thứ duy nhất decorator cần — tách nó ra làm
   `resolution/` sạch một tầng.

**Cổng kiểm soát duy nhất, phải sửa đồng bộ:** `tests/unit/architecture.test.ts` hard-code bản đồ
`LAYERS`, kỳ vọng `exports` phản chiếu cây `src/`, và kiểm tra mọi link `](src/….ts)` trong
`ARCHITECTURE.md` còn tồn tại. Kế hoạch này sai ở đâu, file đó đỏ ở đó.

---

## 2. Cây đích

```
src/
├── index.ts                    # barrel duy nhất — nội dung export KHÔNG đổi
├── core/                       # model, layer 0: token, types, binding, registry, module
├── errors/                     # cold by construction — hot path chỉ chạm ở throw site
├── injection/                  # kênh khai báo dep: descriptor + resolve-options
├── lifecycle/                  # LifecycleManager, ScopeManager
├── ambient/                    # active container (ứng viên AsyncLocalStorage sau này)
├── resolution/
│   ├── resolver.ts             # engine
│   ├── context.ts              # ResolutionContext + ResolverCallbacks
│   ├── cache/                  # lookup-cache, activation-need, class-introspector
│   ├── path/                   # cycle bookkeeping
│   ├── plan/                   # instantiation-plan compiler + escapes
│   └── select/                 # binding-select, constraints
├── container/                  # public surface — KHÔNG đổi
├── decorators/                 # KHÔNG đổi
├── metadata/                   # KHÔNG đổi
└── introspection/              # KHÔNG đổi (giữ specifier phẳng qua `strip`)
```

**`resolution/lanes/` chưa xuất hiện.** Bốn lane vẫn nằm trong một class vì `#private` không xuyên
file được. Thư mục đó chỉ ra đời ở Phase 6 nếu Phase 6 đo được là hoà — không tạo thư mục rỗng.

### Bản đồ layer mới (thay vào `architecture.test.ts`)

```ts
const LAYERS: Record<string, number> = {
  "": 0,
  core: 0,
  errors: 0,
  injection: 0,
  lifecycle: 1,
  ambient: 1,
  resolution: 2,
  decorators: 3,
  metadata: 3,
  container: 4,
  introspection: 4,
};
```

Bản đồ này khớp với đồ thị import hiện tại: mọi cạnh đi lên hôm nay (`resolution → metadata`,
`resolution → container`) đều là `import type` và vẫn được miễn như cũ.

---

## 3. Bản đồ move từng file

### Phase 1 — thuần `git mv`, không sửa logic

| Từ                                       | Đến                                            |
| ---------------------------------------- | ---------------------------------------------- |
| `src/token.ts`                           | `src/core/token.ts`                            |
| `src/types.ts`                           | `src/core/types.ts`                            |
| `src/constructor-type.ts`                | `src/core/constructor-type.ts`                 |
| `src/binding.ts`                         | `src/core/binding.ts`                          |
| `src/registry.ts`                        | `src/core/registry.ts`                         |
| `src/module.ts`                          | `src/core/module.ts`                           |
| `src/resolution/binding-scope.ts`        | `src/core/binding-scope.ts`                    |
| `src/errors.ts`                          | `src/errors/errors.ts`                         |
| `src/resolution/diagnostics.ts`          | `src/errors/diagnostics.ts`                    |
| `src/resolution/lifecycle.ts`            | `src/lifecycle/lifecycle-manager.ts`           |
| `src/resolution/scope.ts`                | `src/lifecycle/scope-manager.ts`               |
| `src/resolution/binding-lookup-cache.ts` | `src/resolution/cache/binding-lookup-cache.ts` |
| `src/resolution/activation-need.ts`      | `src/resolution/cache/activation-need.ts`      |
| `src/resolution/class-introspector.ts`   | `src/resolution/cache/class-introspector.ts`   |
| `src/resolution/resolution-path.ts`      | `src/resolution/path/resolution-path.ts`       |
| `src/resolution/instantiation-plan.ts`   | `src/resolution/plan/instantiation-plan.ts`    |
| `src/resolution/binding-select.ts`       | `src/resolution/select/binding-select.ts`      |
| `src/resolution/constraints.ts`          | `src/resolution/select/constraints.ts`         |

`binding-scope.ts` (15 dòng) là hàm thuần đọc `binding.scope` — nó là từ vựng của model, không phải
của engine; đó là lý do nó về `core/`.

### Phase 2 — hai lần tách (có sửa code, mỗi cái một commit)

| Việc                                                                                                                                                    | Kết quả                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Tách phần **type + normalizer** khỏi `decorators/inject.ts` (`InjectionDescriptor`, `InjectableDependency`, `InjectOptions`, `ResolvedDependencyValue`) | `src/injection/descriptor.ts` — xoá đảo ngược layer ở mục 1.3. Decorator `@inject` ở lại `decorators/inject.ts` và import ngược xuống. |
| `src/resolution/resolve-options.ts` → `src/injection/resolve-options.ts`                                                                                | `DependencySlot` + `ResolveOptions` về cùng nhà với descriptor — đúng bất biến "Both dependency sources are one shape".                |
| Tách `runWithContainer` / `getActiveContainer` khỏi `resolution/environment.ts`                                                                         | `src/ambient/active-container.ts`                                                                                                      |
| Phần còn lại của `environment.ts`                                                                                                                       | `src/resolution/context.ts`                                                                                                            |

### Tests đi kèm

Theo TESTING.md, test mirror đường dẫn `src/`. Move tương ứng, ví dụ:
`tests/unit/binding.test.ts` → `tests/unit/core/binding.test.ts`;
`tests/unit/resolution/{binding-lookup-cache,class-introspector}.test.ts` → `tests/unit/resolution/cache/…`;
`tests/unit/resolution/{instantiation-plan,instantiation-plan-escapes}.test.ts` → `tests/unit/resolution/plan/…`;
`tests/unit/resolution/{constraints,tagged-selection,tag-specificity,tag-shorthand-parity}.test.ts` → `tests/unit/resolution/select/…`;
`tests/unit/resolution/{lifecycle,scope}.test.ts` → `tests/unit/lifecycle/…`.

`tests/unit/architecture.test.ts` ở nguyên chỗ cũ — nó nói về cả package, không mirror module nào.

---

## 4. Codemod cho 367 dòng import

Chạy một lần trên `src/`, `tests/`, `examples/` (thứ tự quan trọng: đường dẫn dài trước, để
`#/resolution/binding-scope` không bị luật `#/binding` nuốt trước).

```bash
cd packages/di
MAP='
#/resolution/binding-lookup-cache|#/resolution/cache/binding-lookup-cache
#/resolution/activation-need|#/resolution/cache/activation-need
#/resolution/class-introspector|#/resolution/cache/class-introspector
#/resolution/instantiation-plan|#/resolution/plan/instantiation-plan
#/resolution/resolution-path|#/resolution/path/resolution-path
#/resolution/binding-select|#/resolution/select/binding-select
#/resolution/constraints|#/resolution/select/constraints
#/resolution/binding-scope|#/core/binding-scope
#/resolution/diagnostics|#/errors/diagnostics
#/resolution/lifecycle|#/lifecycle/lifecycle-manager
#/resolution/scope|#/lifecycle/scope-manager
#/resolution/resolve-options|#/injection/resolve-options
#/resolution/environment|#/resolution/context
#/constructor-type|#/core/constructor-type
#/registry|#/core/registry
#/binding|#/core/binding
#/module|#/core/module
#/token|#/core/token
#/types|#/core/types
#/errors|#/errors/errors
'
FILES=$(git ls-files 'src/**/*.ts' 'tests/**/*.ts' 'examples/**/*.ts')
echo "$MAP" | grep . | while IFS='|' read -r from to; do
  perl -pi -e "s{\"\Q$from\E\"}{\"$to\"}g" $FILES
done
```

Sau đó **bắt buộc**: `pnpm format && pnpm lint:fix` ở repo root (repo không có PostToolUse hook).

---

## 5. Trình tự thi hành

### Phase 0 — chốt baseline (không được bỏ)

`ARCHITECTURE.md` ghi nhận `resolve()` nằm ngay ngưỡng inline của V8, và bộ nhớ dự án ghi rằng một
reshape không liên quan từng làm lệch các row khác **±10–15%**. Nếu không có baseline trước khi move
thì không có gì để đối chiếu.

```bash
pnpm --filter @codefast/di build
cp -R packages/di/dist /tmp/di-baseline-dist
```

Chạy `pnpm --filter @codefast/benchmark-di-inversify bench:isolate`, lưu lại các row mà
`ARCHITECTURE.md` viện dẫn: `constant-resolve`, `transient-class-1-dep`, `named-constant-get`,
`tagged-binding-resolve`, `slot-tag-resolve-all`, `fan-out-tree-depth-3-breadth-4`,
`child-depth-2-resolve`, `to-alias-redirect`, `dynamic-async-chain-8`, `resolve-async-single-hop`,
`realistic-graph-cold-resolve`, `production-http-handler`, `container-level-activation-hook`.

### Phase 1 — move thuần (1 commit)

1. `git mv` theo bảng ở §3, tạo thư mục mới.
2. Chạy codemod §4.
3. Move test tương ứng.
4. Sửa `LAYERS` trong `tests/unit/architecture.test.ts` theo §2.
5. `pnpm --filter @codefast/di build && pnpm run codefast mirror` → `package.json#exports` sinh lại.
6. `codefast.config.js` giữ nguyên `strip: "./introspection/"`. **Không** thêm alias — chưa có
   consumer nào cần, và memory dự án nói giữ full mirror, đừng thu hẹp bề mặt export.
7. Gate: `pnpm build:packages && pnpm check-types && pnpm --filter @codefast/di test && pnpm check`.

### Phase 2 — hai lần tách (2 commit)

Theo §3. Mỗi commit chạy lại gate ở bước 7. Sau khi `injection/descriptor.ts` tồn tại, bỏ luôn
ngoại lệ ngầm ở mục 1.3 — `core/binding.ts` không còn import bất cứ gì từ `decorators/`.

### Phase 3 — tài liệu (1 commit)

- `ARCHITECTURE.md`: sơ đồ layer ở đầu file; 9 link `](src/….ts)` (`architecture.test.ts` kiểm tra);
  bảng collaborator ở mục "The engine".
- `README.md`, `SPEC.md`, `CONTRIBUTING.md`: 4 tham chiếu đường dẫn (`src/constraints.ts` ×2 —
  vốn đã sai từ trước, nay sửa thành `src/resolution/select/constraints.ts`;
  `src/graph-adapters/dot.ts` → `src/introspection/graph-adapters/dot.ts`).

### Phase 4 — cổng benchmark

Paired A/B theo `benchmarks/di-inversify/BENCH_GUIDE.md`: dựng dist mới, so với
`/tmp/di-baseline-dist`, một subprocess mỗi bên mỗi scenario qua `BENCH_ONLY=<id>`, ≥3 lượt đổi
thứ tự, lấy median tỉ số.

**Tiêu chí đạt:** mọi row trong danh sách Phase 0 nằm trong ±5%. Row nào lệch hơn → bisect theo
commit của Phase 1/2 (đây chính là lý do move và split tách commit).

### Phase 5 — changeset + release

`minor` cho `@codefast/di` (specifier công khai đổi tên). **Không bao giờ `major`** — mọi
`@codefast/*` cùng một `fixed` group, một `major` kéo cả nhóm lên 1.0.0 vĩnh viễn.
Kiểm tra pre-mode trước khi version:

```bash
test -f .changeset/pre.json && echo "pre mode: $(python3 -c 'import json;print(json.load(open(".changeset/pre.json"))["tag"])')" || echo "normal mode"
```

---

## 6. Ngoài phạm vi — và lý do

**Phase 6 (tuỳ chọn, phải đo trước khi tin): `#private` → `internals`.** Đổi field `#x` của
`DependencyResolver` thành field thường trên một kiểu `ResolverInternals` (thứ tự field cố định như
`createBinding()`), rồi tách sync / async-cascade / async-branch thành free function nhận `self` —
lúc đó `resolution/lanes/` mới có nghĩa. Đây là **giả thuyết**: budget inline của V8 cộng dồn và
đếm call site hiện diện, nên thêm hop giữa module có thể phản tác dụng. Chỉ làm sau khi Phase 4
xanh, và tự nó cần một paired A/B riêng.

**Phase 7: dời `benchmarks/di-inversify` vào `packages/di/bench/` — khuyến nghị KHÔNG làm.**
Bản phác thảo ban đầu có `bench/` trong package. Rà soát cho thấy nó là một workspace package riêng
(`@codefast/benchmark-di-inversify`, 5 tsconfig cho 5 thư viện đối chiếu, `bench-results/`,
`BENCH_GUIDE.md`, `RESULTS.md`) và là **dụng cụ đo** dùng để nghiệm thu chính đợt reorg này. Dời nó
cùng lúc thì mất luôn khả năng A/B xuyên qua thay đổi. Nếu vẫn muốn colocate, làm ở một PR độc lập
sau khi Phase 4 đã đóng.

**Không đụng tới:** nội dung export của `src/index.ts`, `container/`, `decorators/`, `metadata/`,
`introspection/`, và mọi logic bên trong `resolver.ts`.

---

## 7. Rủi ro

| Rủi ro                                                                    | Xử lý                                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Codemod ăn nhầm prefix (`#/binding` nuốt `#/binding-scope`)               | Bảng map xếp dài-trước; khớp cả dấu `"` hai đầu; `pnpm check-types` bắt phần còn sót |
| `dist/` + `.tsbuildinfo` cũ làm mirror sinh sai                           | `pnpm --filter @codefast/di clean` trước khi build lại rồi mới `mirror`              |
| `tests/types/public-surface.test.ts` đỏ                                   | Barrel không đổi nội dung; nếu đỏ nghĩa là codemod sửa nhầm `index.ts`               |
| Perf lệch mà không biết do move hay do split                              | Phase 1 và Phase 2 tách commit; bisect được                                          |
| Ai đó "sửa" fixture ở `packages/cli/tests/unit/mirror/exports.test.ts:80` | Đó là fixture unit test của CLI, không phải config thật — không đụng                 |
| Consumer ngoài repo dùng deep specifier đã đổi tên                        | Changeset `minor` + ghi rõ bảng rename trong phần mô tả changeset                    |
