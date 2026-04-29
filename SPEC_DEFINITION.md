# [Library Name] — Design Specification

> **Status**: DRAFT <!-- DRAFT | IN REVIEW | APPROVED -->
> **Revision**: YYYY-MM-DD
> **Spec Version**: 0.1.0
> **Author**: [Full Name]
> **Owner**: [Team or Product Owner]
> **Reviewers**: [Name 1, Name 2]

---

## 1. Overview (MUST)

- **Package ID**: `@org/package-name`
- **Summary**: One paragraph describing what the library does and the problem it solves.
- **Target Users**: [e.g., frontend developers, data engineers, AI agents]
- **Success Metrics**: [e.g., <5 KB bundle, <10 ms p99 latency, ≥90% unit test coverage]

---

## 2. Glossary (SHOULD)

Define domain terms to avoid ambiguity.

| Term   | Definition               |
| ------ | ------------------------ |
| [Term] | [Plain-language meaning] |

---

## 3. Design Principles (SHOULD)

List 3–5 core philosophies that guide trade-offs.

- [e.g., Type-safe by default]
- [e.g., Zero runtime dependencies]
- [e.g., Framework-agnostic]
- [e.g., Fail loudly, recover explicitly]

---

## 4. Non-Goals (MUST)

Explicitly list what is out of scope to prevent scope creep.

- [Will NOT support X]
- [Will NOT handle Y]
- [Consumers must bring their own Z]

---

## 5. Internal Architecture (SHOULD)

> Place this before API Surface so reviewers understand the structure before the contract.

High-level modules only; avoid implementation detail.

- **Module A** — responsibility
- **Module B** — responsibility

```
[ASCII dependency graph or link to diagram]
e.g.
EntryPoint → Validator → Core → Serializer
                            ↘ ErrorFactory
```

---

## 6. Configuration & Environment (SHOULD)

Document env vars, config files, and feature flags the library reads at runtime.

| Key             | Type                           | Default     | Required | Description            |
| --------------- | ------------------------------ | ----------- | -------- | ---------------------- |
| `LIB_LOG_LEVEL` | `"debug" \| "info" \| "error"` | `"info"`    | No       | Controls log verbosity |
| `[KEY]`         | `[type]`                       | `[default]` | [Yes/No] | [description]          |

> If the library has no configuration, write "None — the library is configuration-free."

---

## 7. API Surface (MUST)

Document every public export. Use language-idiomatic signatures.

### 7.1 `[exportName]`

- **Signature**:
  ```ts
  // TypeScript example
  function doSomething(input: string, options?: Options): Promise<Result>;
  ```
  ```python
  # Python example if applicable
  def do_something(input: str, options: Options | None = None) -> Result: ...
  ```
- **Description**: What it does in plain language.
- **Parameters**:
  - `input` (`string`) — purpose, constraints
  - `options` (`Options`, optional, default=`{}`) — purpose
- **Returns**: (`Promise<Result>`) — what each field means:
  ```ts
  // Example response shape
  {
    id: string; // unique run ID
    data: unknown; // parsed payload
    durationMs: number;
  }
  ```
- **Throws**:
  - `E_INVALID_INPUT` — when and why
- **Test ID**: [Link to test case or ID]

> Repeat block for each function, class, type, constant.

---

## 8. Usage Examples (MUST)

Provide realistic code for common and advanced use.

### 8.1 Basic Usage

```ts
import { doSomething } from "@org/package-name";

const result = await doSomething("hello");
console.log(result.id); // "run_abc123"
```

### 8.2 Advanced Scenario

```ts
// Show edge case, composition, or performance-critical path
```

### 8.3 Anti-patterns (SHOULD)

Document what NOT to do and why.

```ts
// ❌ Don't call doSomething() in a tight loop — it opens a connection each time
// ✅ Instead, reuse the client instance
```

---

## 9. Behavior Specification (MUST)

Describe runtime behavior, state transitions, and side effects.

- **Lifecycle**: [init → active → dispose]
- **Concurrency**: [thread-safe? re-entrant? singleton?]
- **Side Effects**: [network calls? file writes? mutates caller state?]
- **Edge Cases**:
  - [Input = null] → [behavior, e.g., throws `E_INVALID_INPUT`]
  - [Input = empty string] → [behavior]
  - [Network timeout] → [behavior]

---

## 10. Error Handling (SHOULD)

Define error taxonomy separate from behavior.

| Error Code        | HTTP Analogue | When Thrown                | Recovery Strategy     |
| ----------------- | ------------- | -------------------------- | --------------------- |
| `E_INVALID_INPUT` | 400           | Input fails validation     | Fix input, no retry   |
| `E_NOT_FOUND`     | 404           | Resource doesn't exist     | Check existence first |
| `E_TIMEOUT`       | 504           | Operation exceeds deadline | Retry with back-off   |
| `[CODE]`          | [xxx]         | [condition]                | [strategy]            |

All errors extend a base `LibError` class that exposes `code`, `message`, and `cause`.

---

## 11. Constraints & Non-Functional Requirements (MUST)

- **Runtimes**: Node.js ≥ 18, Deno ≥ 1.40, Browser ES2022
- **Peer Dependencies**: [list or "none"]
- **Bundle Size Target**: ≤ [X] KB gzipped (measured via `bundlephobia` or similar)
- **Performance**: p95 < [X] ms for [operation] under [load condition]
- **Security**:
  - Input sanitization: [describe approach]
  - Secrets: [never logged, not included in Error messages]
  - Threat model: [link or "N/A — no network calls, no secrets handled"]
- **Privacy**: [no telemetry / data retention policy / PII handling]
- **Accessibility**: [if UI-related, WCAG level; otherwise "N/A"]
- **Observability**: [structured logs? metrics hooks? OpenTelemetry support?]

---

## 12. Testing Strategy (SHOULD)

> This section defines _how to verify_ the spec, not just reference test IDs.

| Layer       | Tool                     | What to Cover                           | Coverage Target     |
| ----------- | ------------------------ | --------------------------------------- | ------------------- |
| Unit        | [Jest / Vitest / pytest] | Pure functions, validators, error paths | ≥ 90%               |
| Integration | [tool]                   | End-to-end API calls, lifecycle         | Happy + 2 sad paths |
| Performance | [k6 / autocannon]        | p95 latency under [X] rps               | Per section 11      |
| Type        | `tsc --noEmit`           | Public API shape contracts              | All exports         |

Mocking strategy: [e.g., "network layer is injectable — tests inject a fake adapter"].

---

## 13. Migration & Compatibility (MAY)

- **Breaking Changes from vX**: [list, or "first version — no migration needed"]
- **Migration Path**: step-by-step for consumers
- **Deprecation Policy**: [e.g., deprecation notice in minor, removal in next major]

---

## 14. Decisions & Open Questions (SHOULD)

Log key design decisions (lightweight ADR).

| Date       | Decision         | Rationale | Alternatives Considered | Status   |
| ---------- | ---------------- | --------- | ----------------------- | -------- |
| YYYY-MM-DD | Chose X over Y   | [why]     | Y, Z                    | Accepted |
| YYYY-MM-DD | [Open question?] |           |                         | Open     |

---

## 15. Revision History (SHOULD)

| Version | Date       | Author | Summary of Changes |
| ------- | ---------- | ------ | ------------------ |
| 0.1.0   | YYYY-MM-DD | [Name] | Initial draft      |

---

## Review Checklist

Before changing status from DRAFT → IN REVIEW, confirm:

- [ ] All `[brackets]` are filled in
- [ ] Every public export in section 7 has a test ID
- [ ] Non-goals (section 4) reviewed with stakeholders
- [ ] Error codes (section 10) are unique and registered
- [ ] Security and privacy fields in section 11 are completed
- [ ] At least one anti-pattern documented in section 8.3

---

## Conventions

| Convention              | Rule                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| **File name**           | `<library-name>-spec.md` or `spec.md`                                   |
| **Format**              | Markdown with fenced code blocks                                        |
| **Language**            | English for spec text; API names and error codes always in English      |
| **Versioning**          | Increment Spec Version on any normative change                          |
| **Review status**       | Update Status field; never edit an APPROVED spec without a new revision |
| **Sections marked MAY** | Delete if not applicable; do not leave empty                            |

## Relationship to Other Documents

| Document       | Purpose                                  | Timing         |
| -------------- | ---------------------------------------- | -------------- |
| This spec      | Defines what to build and how it behaves | Before coding  |
| `README.md`    | Explains how to use the finished library | After release  |
| `CHANGELOG.md` | Records what changed between versions    | Ongoing        |
| Test files     | Verifies implementation matches spec     | During & after |
| `SECURITY.md`  | Vulnerability disclosure and contact     | Before release |

---

<!-- Fill in all [brackets]. Delete sections marked MAY if not applicable. -->
