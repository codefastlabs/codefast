import { TestBed } from "@codefast/di-testing";
import { describe, expect, it, vi } from "vitest";

import {
  ActivityLogMetricsExporter,
  ActivityLogToken,
  ClockToken,
  CompositeTaskValidator,
  IdGeneratorToken,
  InMemoryTaskRepository,
  MetricsExporterToken,
  RequestContextToken,
  TaskRepositoryToken,
  TaskService,
  TaskValidationToken,
  TaskValidatorToken,
} from "#/features/di/server/domain";

// ── TaskService — six dependencies, all auto-mocked ──────────────────────────────────────────────────────────────────

describe("TaskService", () => {
  const bedFor = () =>
    TestBed.solitary(TaskService, { mockFactory: () => vi.fn() })
      .mock(TaskRepositoryToken)
      .impl((fn) => ({ list: fn().mockReturnValue([]) }))
      .mock(IdGeneratorToken)
      .impl((fn) => ({ next: fn().mockReturnValue("id-1") }));

  it("adds a task when validation passes", () => {
    const { unit, unitRef } = bedFor()
      .mock(TaskValidationToken)
      .impl((fn) => ({ collect: fn().mockReturnValue([]) }))
      .compile();

    const errors = unit.add("Ship the release");

    expect(errors).toEqual([]);
    expect(unitRef.get(TaskRepositoryToken).add).toHaveBeenCalledWith("Ship the release", "id-1");
    // The optional MetricsExporter is auto-mocked, so the happy path records a metric.
    expect(unitRef.get(MetricsExporterToken).record).toHaveBeenCalledWith("task.added");
  });

  it("returns validation errors without touching the repository", () => {
    const { unit, unitRef } = bedFor()
      .mock(TaskValidationToken)
      .impl((fn) => ({ collect: fn().mockReturnValue(["Title cannot be empty."]) }))
      .compile();

    const errors = unit.add("");

    expect(errors).toEqual(["Title cannot be empty."]);
    expect(unitRef.get(TaskRepositoryToken).add).not.toHaveBeenCalled();
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('rejected "" · 1 validation error(s)');
  });

  it("hands validation the existing titles from the repository", () => {
    const { unit, unitRef } = bedFor()
      .mock(TaskRepositoryToken)
      .impl((fn) => ({
        list: fn().mockReturnValue([{ id: "t1", title: "Existing", done: false, createdAt: "" }]),
      }))
      .mock(TaskValidationToken)
      .impl((fn) => ({ collect: fn().mockReturnValue([]) }))
      .compile();

    unit.add("New task");

    expect(unitRef.get(TaskValidationToken).collect).toHaveBeenCalledWith("New task", ["Existing"]);
  });

  it("delegates toggle and remove to the repository", () => {
    const { unit, unitRef } = bedFor().compile();

    unit.toggle("t1");
    unit.remove("t2");

    expect(unitRef.get(TaskRepositoryToken).toggle).toHaveBeenCalledWith("t1");
    expect(unitRef.get(TaskRepositoryToken).remove).toHaveBeenCalledWith("t2");
  });

  it("records teardown on dispose when the request asks for it", async () => {
    const bed = bedFor()
      .mock(RequestContextToken)
      .using({ requestId: "req-1", receivedAt: "", recordTeardown: true })
      .compile();
    const log = bed.unitRef.get(ActivityLogToken);

    await bed.dispose();

    expect(log.record).toHaveBeenCalledWith("request req-1 torn down · per-request service disposed");
  });

  it("stays silent on dispose for read-only requests", async () => {
    const bed = bedFor()
      .mock(RequestContextToken)
      .using({ requestId: "req-2", receivedAt: "", recordTeardown: false })
      .compile();
    const log = bed.unitRef.get(ActivityLogToken);

    await bed.dispose();

    expect(log.record).not.toHaveBeenCalled();
  });
});

// ── CompositeTaskValidator — an injectAll dependency ─────────────────────────────────────────────────────────────────

describe("CompositeTaskValidator", () => {
  it("collects the messages its validators return", () => {
    const { unit, unitRef } = TestBed.solitary(CompositeTaskValidator, { mockFactory: () => vi.fn() })
      .mock(TaskValidatorToken)
      .impl((fn) => ({ validate: fn().mockReturnValue("Title cannot be empty.") }))
      .compile();

    expect(unit.collect("", [])).toEqual(["Title cannot be empty."]);
    expect(unitRef.get(TaskValidatorToken).validate).toHaveBeenCalledWith("", []);
  });

  it("returns no messages when every validator passes", () => {
    // The auto-mocked validator's validate() returns undefined, which reads as "no objection".
    const { unit } = TestBed.solitary(CompositeTaskValidator, { mockFactory: () => vi.fn() }).compile();

    expect(unit.collect("Fine title", [])).toEqual([]);
  });
});

// ── InMemoryTaskRepository — a mocked clock pins createdAt ───────────────────────────────────────────────────────────

describe("InMemoryTaskRepository", () => {
  const FROZEN_NOW = "2026-08-31T09:00:00.000Z";

  const compileRepository = () =>
    TestBed.solitary(InMemoryTaskRepository, { mockFactory: () => vi.fn() })
      .mock(ClockToken)
      .impl((fn) => ({ now: fn().mockReturnValue(FROZEN_NOW) }))
      .compile();

  it("stamps new tasks with the injected clock", () => {
    const { unit, unitRef } = compileRepository();

    unit.add("Write tests", "task-1");

    expect(unit.list()).toEqual([{ id: "task-1", title: "Write tests", done: false, createdAt: FROZEN_NOW }]);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('added "Write tests"');
  });

  it("toggles and logs completion state", () => {
    const { unit, unitRef } = compileRepository();
    unit.add("Write tests", "task-1");

    unit.toggle("task-1");

    expect(unit.list().at(0)?.done).toBe(true);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('completed "Write tests"');
  });

  it("removes and logs the removed title", () => {
    const { unit, unitRef } = compileRepository();
    unit.add("Write tests", "task-1");

    unit.remove("task-1");

    expect(unit.list()).toEqual([]);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('removed "Write tests"');
  });
});

// ── ActivityLogMetricsExporter — the zero-dependency default spy ─────────────────────────────────────────────────────

describe("ActivityLogMetricsExporter", () => {
  it("prefixes events into the activity log (built-in spy backend)", () => {
    const { unit, unitRef } = TestBed.solitary(ActivityLogMetricsExporter).compile();

    unit.record("task.added");

    expect(unitRef.get(ActivityLogToken).record.mock.calls.at(0)).toEqual(["metric · task.added"]);
  });
});
