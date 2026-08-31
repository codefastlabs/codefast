import { TestBed } from "@codefast/di-testing";
import type { TestBedOptions } from "@codefast/di-testing";
import { describe, expect, it, vi } from "vitest";

import {
  ActivityLogMetricsExporter,
  ActivityLogToken,
  ClockToken,
  CompositeTaskValidator,
  IdGeneratorToken,
  InMemoryTaskRepository,
  MaxTitleLengthValidator,
  MetricsExporterToken,
  NonEmptyTitleValidator,
  RequestContextToken,
  TaskRepositoryToken,
  TaskService,
  TaskValidationToken,
  TaskValidatorToken,
  UniqueTitleValidator,
} from "#/features/di/server/domain";
import type { Task } from "#/features/di/server/domain";

// Vitest-backed spies so `toHaveBeenCalledWith` matchers work on every auto-mock.
const withVitestSpies: TestBedOptions = { mockFactory: () => vi.fn() };

describe("TaskService", () => {
  // Must stay a factory: `.impl` seeds are built eagerly at `.mock()` time, so a shared builder
  // would leak spy call logs between tests. Overrides are last-write-wins, so a test may re-mock
  // a token the helper already stubbed — replacing that stub wholesale, not merging with it.
  const bedFor = (tasks: Array<Task> = []) =>
    TestBed.solitary(TaskService, withVitestSpies)
      .mock(TaskRepositoryToken)
      .impl((fn) => ({ list: fn().mockReturnValue(tasks) }))
      .mock(TaskValidationToken)
      .impl((fn) => ({ collect: fn().mockReturnValue([]) }));

  it("adds a task when validation passes", () => {
    const { unit, unitRef } = bedFor()
      .mock(IdGeneratorToken)
      .impl((fn) => ({ next: fn().mockReturnValue("id-1") }))
      .compile();

    const errors = unit.add("Ship the release");

    expect(errors).toEqual([]);
    expect(unitRef.get(TaskRepositoryToken).add).toHaveBeenCalledWith("Ship the release", "id-1");
    // The optional MetricsExporter is auto-mocked, so the happy path records a metric.
    expect(unitRef.get(MetricsExporterToken).record).toHaveBeenCalledWith("task.added");
    // Success stays out of the activity log — only the repository logs the add.
    expect(unitRef.get(ActivityLogToken).record).not.toHaveBeenCalled();
  });

  it("still adds when the optional MetricsExporter is absent", () => {
    const { unit, unitRef } = bedFor()
      .mock(MetricsExporterToken)
      .using(undefined as never)
      .compile();

    expect(unit.add("Ship the release")).toEqual([]);
    expect(unitRef.get(TaskRepositoryToken).add).toHaveBeenCalled();
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

  it("counts every validation error in the rejection log", () => {
    const { unit, unitRef } = bedFor()
      .mock(TaskValidationToken)
      .impl((fn) => ({
        collect: fn().mockReturnValue(["Title cannot be empty.", "A task with this title already exists."]),
      }))
      .compile();

    expect(unit.add("dup")).toHaveLength(2);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('rejected "dup" · 2 validation error(s)');
  });

  it("hands validation the existing titles from the repository", () => {
    const { unit, unitRef } = bedFor([{ id: "t1", title: "Existing", done: false, createdAt: "" }]).compile();

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

describe("task validators", () => {
  // The real predicates need no DI at all — plain construction is the right altitude here.
  it("rejects a whitespace-only title", () => {
    expect(new NonEmptyTitleValidator().validate("   ")).toBe("Title cannot be empty.");
    expect(new NonEmptyTitleValidator().validate("ok")).toBeUndefined();
  });

  it("rejects a title only past the 80-character boundary", () => {
    expect(new MaxTitleLengthValidator().validate("a".repeat(80))).toBeUndefined();
    expect(new MaxTitleLengthValidator().validate("a".repeat(81))).toBe("Title must be 80 characters or fewer.");
  });

  it("rejects duplicates case- and whitespace-insensitively", () => {
    const validator = new UniqueTitleValidator();

    expect(validator.validate("ship it ", ["Ship It"])).toBe("A task with this title already exists.");
    expect(validator.validate("ship it", ["Something else"])).toBeUndefined();
  });

  it("aggregates messages across the real validators in order", () => {
    const composite = new CompositeTaskValidator([new NonEmptyTitleValidator(), new UniqueTitleValidator()]);

    expect(composite.collect("  ", ["Existing"])).toEqual(["Title cannot be empty."]);
    expect(composite.collect("existing", ["Existing"])).toEqual(["A task with this title already exists."]);
    expect(composite.collect("fresh", ["Existing"])).toEqual([]);
  });
});

describe("CompositeTaskValidator", () => {
  it("collects the messages its validators return", () => {
    const { unit, unitRef } = TestBed.solitary(CompositeTaskValidator, withVitestSpies)
      .mock(TaskValidatorToken)
      .impl((fn) => ({ validate: fn().mockReturnValue("Title cannot be empty.") }))
      .compile();

    expect(unit.collect("", [])).toEqual(["Title cannot be empty."]);
    expect(unitRef.get(TaskValidatorToken).validate).toHaveBeenCalledWith("", []);
  });

  it("returns no messages when every validator passes", () => {
    // The auto-mocked validator's validate() returns undefined, which reads as "no objection".
    const { unit } = TestBed.solitary(CompositeTaskValidator, withVitestSpies).compile();

    expect(unit.collect("Fine title", [])).toEqual([]);
  });
});

describe("InMemoryTaskRepository", () => {
  const FROZEN_NOW = "2026-08-31T09:00:00.000Z";

  const compileRepository = () =>
    TestBed.solitary(InMemoryTaskRepository, withVitestSpies)
      .mock(ClockToken)
      .using({ now: () => FROZEN_NOW })
      .compile();

  it("stamps new tasks with the injected clock", () => {
    const { unit, unitRef } = compileRepository();

    unit.add("Write tests", "task-1");

    expect(unit.list()).toEqual([{ id: "task-1", title: "Write tests", done: false, createdAt: FROZEN_NOW }]);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('added "Write tests"');
  });

  it("toggles and logs completion state in both directions", () => {
    const { unit, unitRef } = compileRepository();
    unit.add("Write tests", "task-1");

    unit.toggle("task-1");
    expect(unit.list().at(0)?.done).toBe(true);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('completed "Write tests"');

    unit.toggle("task-1");
    expect(unit.list().at(0)?.done).toBe(false);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('reopened "Write tests"');
  });

  it("removes and logs the removed title", () => {
    const { unit, unitRef } = compileRepository();
    unit.add("Write tests", "task-1");

    unit.remove("task-1");

    expect(unit.list()).toEqual([]);
    expect(unitRef.get(ActivityLogToken).record).toHaveBeenCalledWith('removed "Write tests"');
  });

  it("ignores toggle and remove for unknown ids", () => {
    const { unit, unitRef } = compileRepository();

    unit.toggle("missing");
    unit.remove("missing");

    expect(unit.list()).toEqual([]);
    expect(unitRef.get(ActivityLogToken).record).not.toHaveBeenCalled();
  });
});

describe("ActivityLogMetricsExporter", () => {
  it("prefixes events into the activity log (built-in spy backend)", () => {
    // No mockFactory: this bed demonstrates the zero-dependency default spy and its .mock.calls log.
    const { unit, unitRef } = TestBed.solitary(ActivityLogMetricsExporter).compile();

    unit.record("task.added");

    expect(unitRef.get(ActivityLogToken).record.mock.calls.at(0)).toEqual(["metric · task.added"]);
  });
});
