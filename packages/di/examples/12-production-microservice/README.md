# Example 12: Production Microservice Deep Dive

This document provides a detailed walkthrough of `12-production-microservice.ts`, which demonstrates a complete, production-grade microservice bootstrap and shutdown lifecycle using `@codefast/di`.

## Overview

The example simulates a **Job Processing Service** that exposes an HTTP API to enqueue and monitor background jobs (e.g., sending emails, generating reports).

It solves the "Tangled Bootstrap" problem where infrastructure dependencies (DB, Redis, Workers) must be initialized in a specific order and shut down in the exact reverse order to avoid data loss or hanging processes.

## 1. Architecture & Dependency Graph

The system is organized into several **Modules**, each responsible for a specific domain or infrastructure component.

```mermaid
graph TD
    subgraph "App Module (Composition Root)"
        AM[AppModule]
    end

    subgraph "Infrastructure Layer"
        Config[ConfigModule]
        DB[DatabaseModule]
        Redis[RedisModule]
        Worker[WorkerModule]
        Metrics[MetricsModule]
    end

    subgraph "Domain Layer"
        Repo[JobRepository]
        Svc[JobService]
    end

    subgraph "Interface Layer"
        Health[HealthModule]
        HTTP[HttpModule]
    end

    %% Dependencies
    AM --> Config
    AM --> DB
    AM --> Redis
    AM --> Worker
    AM --> Metrics
    AM --> Health
    AM --> HTTP

    HTTP --> Health
    HTTP --> Svc
    Health --> DB
    Health --> Redis
    Health --> Worker

    Svc --> Repo
    Svc --> DB
    Svc --> Metrics
    Repo --> Redis
    Repo --> Worker
```

## 2. The Bootstrap Sequence

When `Container.fromModulesAsync(AppModule)` is called followed by `container.initializeAsync()`, the DI container performs the following:

1.  **Graph Analysis**: It identifies that `ConfigModule` is the root dependency for almost everything.
2.  **Parallel Initialization**: It starts independent async branches (Database connection and Redis connection) in parallel to minimize startup time.
3.  **Activation Hooks**: Services that need to "start" (like the `JobWorker` and `HttpServer`) use the `onActivation` hook.

```mermaid
sequenceDiagram
    participant App as Main Application
    participant Container
    participant DB as DatabasePool
    participant Redis as RedisClient
    participant Worker as JobWorker
    participant HTTP as HttpServer

    App->>Container: Container.fromModulesAsync(AppModule)
    App->>Container: container.initializeAsync()

    Note over Container, DB: Infrastructure Init (Parallel)
    Container->>DB: Factory: connect()
    Container->>Redis: Factory: connect()

    Note over Container, Worker: Service Activation (Hooks)
    Container->>Worker: onActivation: start()
    Worker-->>Container: ✅ Worker is polling

    Note over Container, HTTP: Interface Activation
    Container->>HTTP: onActivation: start()
    HTTP-->>Container: ✅ Server listening on :3000

    Container-->>App: ✅ Ready
```

## 3. Request Flow Example: `POST /jobs`

This diagram shows how various injected components collaborate to handle a single business transaction.

```mermaid
sequenceDiagram
    participant User
    participant HTTP as HttpServer
    participant Svc as JobService
    participant Repo as JobRepository
    participant DB as Postgres
    participant Redis as Redis
    participant Q as InMemoryQueue

    User->>HTTP: POST /jobs { type: "send_email" }
    HTTP->>Svc: enqueueEmailJob(...)
    Svc->>Repo: create(...)
    Repo->>Q: enqueue(...)
    Repo->>Redis: set(job_id, status)
    Svc->>DB: query("INSERT INTO job_audit")
    Svc->>Svc: updateMetrics()
    Svc-->>HTTP: Return JobInfo
    HTTP-->>User: 202 Accepted (JobId)
```

## 4. Graceful Shutdown (Reverse Disposal)

The example uses the `await using` syntax (Explicit Resource Management). When the `bootstrap` function finishes, the container is disposed of automatically.

> [!IMPORTANT]
> The container disposes of bindings in the **exact reverse order** of their creation. This ensures that the HTTP server stops accepting requests before the database connection it depends on is closed.

```mermaid
sequenceDiagram
    participant App
    participant Container
    participant HTTP as HttpServer
    participant Worker as JobWorker
    participant Redis as RedisClient
    participant DB as DatabasePool

    App->>Container: container.dispose()

    Note over Container, HTTP: 1. Stop External Interfaces
    Container->>HTTP: onDeactivation: stop()
    HTTP-->>Container: (Server stopped)

    Note over Container, Worker: 2. Drain Background Work
    Container->>Worker: onDeactivation: stop()
    Worker->>Worker: Process remaining jobs...
    Worker-->>Container: (Worker stopped)

    Note over Container, DB: 3. Close Infrastructure
    Container->>Redis: onDeactivation: quit()
    Container->>DB: onDeactivation: close()

    Container-->>App: ✅ Clean exit
```

## Key DI Patterns Used

| Feature                   | Usage in Example 12                                                                |
| :------------------------ | :--------------------------------------------------------------------------------- |
| **Async Modules**         | `Module.createAsync` handles dynamic imports and async binding definitions.        |
| **Async Factories**       | `toDynamicAsync` connects to DB/Redis using `await`.                               |
| **Lifecycle Hooks**       | `onActivation` starts the worker; `onDeactivation` ensures graceful cleanup.       |
| **Token-based Injection** | Decouples the service logic from specific implementations (e.g., `JobQueueToken`). |
| **Scope Validation**      | `container.validate()` ensures no Singletons capture Scoped dependencies.          |
